import type { Articulo } from '@prisma/client';
import type { ArticuloInput } from '@erp-afuego/shared';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/error.middleware.js';
import { registrarCambio } from '../auditoria/auditoria.service.js';

function serialize(articulo: Articulo) {
  return {
    id: articulo.id,
    code: articulo.code,
    name: articulo.name,
    category: articulo.category,
    unit: articulo.unit,
    lastPurchasePrice: Number(articulo.lastPurchasePrice),
    active: articulo.active,
    createdAt: articulo.createdAt.toISOString(),
    updatedAt: articulo.updatedAt.toISOString(),
  };
}

export async function listArticulos() {
  const articulos = await prisma.articulo.findMany({
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });
  return articulos.map(serialize);
}

export async function createArticulo(input: ArticuloInput, userId: string) {
  await assertCodeAvailable(input.code);
  const articulo = await prisma.articulo.create({ data: input });
  await registrarCambio({
    modelo: 'Articulo',
    registroId: articulo.id,
    registroNombre: `${articulo.name} (${articulo.code})`,
    accion: 'CREATE',
    detalle: input,
    userId,
  });
  return serialize(articulo);
}

export async function updateArticulo(id: string, input: ArticuloInput, userId: string) {
  await findArticuloOrThrow(id);
  await assertCodeAvailable(input.code, id);
  const articulo = await prisma.articulo.update({ where: { id }, data: input });
  await registrarCambio({
    modelo: 'Articulo',
    registroId: articulo.id,
    registroNombre: `${articulo.name} (${articulo.code})`,
    accion: 'UPDATE',
    detalle: input,
    userId,
  });
  return serialize(articulo);
}

export async function setArticuloActive(id: string, active: boolean, userId: string) {
  await findArticuloOrThrow(id);
  const articulo = await prisma.articulo.update({ where: { id }, data: { active } });
  await registrarCambio({
    modelo: 'Articulo',
    registroId: articulo.id,
    registroNombre: `${articulo.name} (${articulo.code})`,
    accion: active ? 'ACTIVATE' : 'DEACTIVATE',
    userId,
  });
  return serialize(articulo);
}

// Borrado real (no solo desactivar) — pedido por el negocio para poder
// corregir artículos creados por error. Solo se permite si el artículo
// nunca se usó en ningún hecho histórico (compra, consumo de evento,
// inventario inicial o final físico); si ya tiene alguno, borrarlo
// rompería la trazabilidad de esos registros — se pide desactivarlo en
// su lugar (ver README, "cada compra/consumo debe quedar vinculado a su
// origen").
export async function deleteArticulo(id: string, userId: string) {
  const articulo = await findArticuloOrThrow(id);

  const [compras, consumos, inventarioInicial, inventarioFinalFisico] = await Promise.all([
    prisma.compra.count({ where: { articuloId: id } }),
    prisma.eventoConsumo.count({ where: { articuloId: id } }),
    prisma.inventarioInicial.count({ where: { articuloId: id } }),
    prisma.inventarioFinalFisico.count({ where: { articuloId: id } }),
  ]);

  if (compras > 0 || consumos > 0 || inventarioInicial > 0 || inventarioFinalFisico > 0) {
    throw new HttpError(
      409,
      'No se puede eliminar: este artículo ya tiene compras, consumos o inventarios registrados. Desactívalo en su lugar.',
    );
  }

  await prisma.articulo.delete({ where: { id } });
  await registrarCambio({
    modelo: 'Articulo',
    registroId: articulo.id,
    registroNombre: `${articulo.name} (${articulo.code})`,
    accion: 'DELETE',
    userId,
  });
}

async function assertCodeAvailable(code: string, excludeId?: string) {
  const existing = await prisma.articulo.findFirst({
    where: excludeId ? { code, NOT: { id: excludeId } } : { code },
  });
  if (existing) {
    throw new HttpError(409, `Ya existe un artículo con el código "${code}"`);
  }
}

async function findArticuloOrThrow(id: string) {
  const articulo = await prisma.articulo.findUnique({ where: { id } });
  if (!articulo) {
    throw new HttpError(404, 'Artículo no encontrado');
  }
  return articulo;
}
