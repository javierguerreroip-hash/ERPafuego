import type { OpcionMenu } from '@prisma/client';
import type {
  OpcionMenuInput,
  RecetaImportInput,
  RecetaImportResultDTO,
  RecetaPlantillaDTO,
} from '@erp-afuego/shared';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/error.middleware.js';
import { registrarCambio } from '../auditoria/auditoria.service.js';
import {
  calcularCostoPorcentaje,
  calcularCostoUnitarioPromedio,
} from '../eventos/evento.calculations.js';
import { calcularCostoMenu, sugerirIngredientes } from './opcion-menu.calculations.js';

interface CostoMenu {
  costo: number;
  ingredientesCount: number;
}

function serialize(opcion: OpcionMenu, costoMenu?: CostoMenu) {
  const price = Number(opcion.price);
  const costo = costoMenu?.costo ?? 0;
  return {
    id: opcion.id,
    name: opcion.name,
    category: opcion.category,
    description: opcion.description,
    priceType: opcion.priceType,
    price,
    active: opcion.active,
    costo,
    costoPorcentaje: calcularCostoPorcentaje(costo, price),
    ingredientesCount: costoMenu?.ingredientesCount ?? 0,
    createdAt: opcion.createdAt.toISOString(),
    updatedAt: opcion.updatedAt.toISOString(),
  };
}

// Costo unitario de cada artículo con el MISMO patrón que usa un consumo de
// evento (evento.service.ts → addConsumo): promedio entre el último precio
// de compra y el costo del inventario inicial más reciente.
async function costosUnitariosPorArticulo(
  articulos: { id: string; lastPurchasePrice: { toString(): string } }[],
) {
  const ids = articulos.map((a) => a.id);
  const inventarios = ids.length
    ? await prisma.inventarioInicial.findMany({
        where: { articuloId: { in: ids } },
        orderBy: { fecha: 'desc' },
        select: { articuloId: true, unitCost: true },
      })
    : [];
  const ultimoInventario = new Map<string, number>();
  for (const inv of inventarios) {
    if (!ultimoInventario.has(inv.articuloId)) {
      ultimoInventario.set(inv.articuloId, Number(inv.unitCost));
    }
  }
  return new Map(
    articulos.map((a) => [
      a.id,
      calcularCostoUnitarioPromedio(Number(a.lastPurchasePrice), ultimoInventario.get(a.id) ?? null),
    ]),
  );
}

async function costosPorMenu(menuIds: string[]) {
  const resultado = new Map<string, CostoMenu>();
  if (menuIds.length === 0) return resultado;

  const recetas = await prisma.recetaIngrediente.findMany({
    where: { opcionMenuId: { in: menuIds } },
    include: { articulo: true },
  });
  if (recetas.length === 0) return resultado;

  const articulosUnicos = [...new Map(recetas.map((r) => [r.articuloId, r.articulo])).values()];
  const costosUnitarios = await costosUnitariosPorArticulo(articulosUnicos);

  const porMenu = new Map<string, { cantidad: number; costoUnitario: number }[]>();
  for (const r of recetas) {
    const lista = porMenu.get(r.opcionMenuId) ?? [];
    lista.push({
      cantidad: Number(r.cantidad),
      costoUnitario: costosUnitarios.get(r.articuloId) ?? 0,
    });
    porMenu.set(r.opcionMenuId, lista);
  }
  for (const [menuId, ingredientes] of porMenu) {
    resultado.set(menuId, {
      costo: calcularCostoMenu(ingredientes),
      ingredientesCount: ingredientes.length,
    });
  }
  return resultado;
}

export async function listOpcionesMenu() {
  const opciones = await prisma.opcionMenu.findMany({
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });
  const costos = await costosPorMenu(opciones.map((o) => o.id));
  return opciones.map((o) => serialize(o, costos.get(o.id)));
}

export async function createOpcionMenu(input: OpcionMenuInput, userId: string) {
  await assertNameAvailable(input.name);
  const opcion = await prisma.opcionMenu.create({ data: input });
  await registrarCambio({
    modelo: 'OpcionMenu',
    registroId: opcion.id,
    registroNombre: opcion.name,
    accion: 'CREATE',
    detalle: input,
    userId,
  });
  return serialize(opcion);
}

export async function updateOpcionMenu(id: string, input: OpcionMenuInput, userId: string) {
  await findOpcionOrThrow(id);
  await assertNameAvailable(input.name, id);
  const opcion = await prisma.opcionMenu.update({ where: { id }, data: input });
  await registrarCambio({
    modelo: 'OpcionMenu',
    registroId: opcion.id,
    registroNombre: opcion.name,
    accion: 'UPDATE',
    detalle: input,
    userId,
  });
  const costos = await costosPorMenu([id]);
  return serialize(opcion, costos.get(id));
}

export async function setOpcionMenuActive(id: string, active: boolean, userId: string) {
  await findOpcionOrThrow(id);
  const opcion = await prisma.opcionMenu.update({ where: { id }, data: { active } });
  await registrarCambio({
    modelo: 'OpcionMenu',
    registroId: opcion.id,
    registroNombre: opcion.name,
    accion: active ? 'ACTIVATE' : 'DEACTIVATE',
    userId,
  });
  const costos = await costosPorMenu([id]);
  return serialize(opcion, costos.get(id));
}

// Datos para armar la plantilla de Excel de recetas: los menús activos
// (con su receta ya guardada y los artículos que su descripción menciona)
// y los artículos de Materia Prima con su unidad y costo unitario.
export async function getPlantillaReceta(): Promise<RecetaPlantillaDTO> {
  const [menus, articulos, recetas] = await Promise.all([
    prisma.opcionMenu.findMany({
      where: { active: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    }),
    prisma.articulo.findMany({ where: { category: 'MATERIA_PRIMA' }, orderBy: { name: 'asc' } }),
    prisma.recetaIngrediente.findMany(),
  ]);

  const costosUnitarios = await costosUnitariosPorArticulo(articulos);
  const articulosActivos = articulos.filter((a) => a.active);

  const recetaPorMenu = new Map<string, { articuloId: string; cantidad: number }[]>();
  for (const r of recetas) {
    const lista = recetaPorMenu.get(r.opcionMenuId) ?? [];
    lista.push({ articuloId: r.articuloId, cantidad: Number(r.cantidad) });
    recetaPorMenu.set(r.opcionMenuId, lista);
  }

  // Un artículo inactivo solo aparece si alguna receta ya lo usa.
  const idsEnReceta = new Set(recetas.map((r) => r.articuloId));
  const articulosPlantilla = articulos.filter((a) => a.active || idsEnReceta.has(a.id));

  return {
    menus: menus.map((m) => {
      const ingredientes = recetaPorMenu.get(m.id) ?? [];
      const yaEnReceta = new Set(ingredientes.map((i) => i.articuloId));
      return {
        id: m.id,
        name: m.name,
        category: m.category,
        description: m.description,
        priceType: m.priceType,
        price: Number(m.price),
        active: m.active,
        ingredientes,
        sugeridos: sugerirIngredientes(m.description, articulosActivos).filter(
          (id) => !yaEnReceta.has(id),
        ),
      };
    }),
    articulos: articulosPlantilla.map((a) => ({
      id: a.id,
      code: a.code,
      name: a.name,
      unit: a.unit,
      costoUnitario: costosUnitarios.get(a.id) ?? 0,
    })),
  };
}

// Carga masiva de recetas: por cada menú presente en el archivo, su receta
// completa se reemplaza por las filas recibidas (los menús que no vienen
// no se tocan). Se hace en solo 2 consultas dentro de una transacción
// (deleteMany + createMany) para no chocar con el timeout de Prisma, y se
// deja un registro de auditoría por menú.
export async function importarRecetas(
  input: RecetaImportInput,
  userId: string,
): Promise<RecetaImportResultDTO> {
  const vistos = new Set<string>();
  for (const item of input.items) {
    const clave = `${item.opcionMenuId}|${item.articuloId}`;
    if (vistos.has(clave)) {
      throw new HttpError(400, 'Hay un mismo ingrediente repetido dentro de un mismo menú');
    }
    vistos.add(clave);
  }

  const menuIds = [...new Set(input.items.map((i) => i.opcionMenuId))];
  const articuloIds = [...new Set(input.items.map((i) => i.articuloId))];

  const [menus, articulos] = await Promise.all([
    prisma.opcionMenu.findMany({ where: { id: { in: menuIds } } }),
    prisma.articulo.findMany({ where: { id: { in: articuloIds } } }),
  ]);
  if (menus.length !== menuIds.length) {
    throw new HttpError(404, 'Hay opciones de menú en el archivo que no existen');
  }
  if (articulos.length !== articuloIds.length) {
    throw new HttpError(404, 'Hay artículos en el archivo que no existen');
  }
  const noMateriaPrima = articulos.filter((a) => a.category !== 'MATERIA_PRIMA');
  if (noMateriaPrima.length > 0) {
    throw new HttpError(
      400,
      `Solo se aceptan artículos de Materia Prima. No válidos: ${noMateriaPrima.map((a) => a.name).join(', ')}`,
    );
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.recetaIngrediente.deleteMany({ where: { opcionMenuId: { in: menuIds } } });
      await tx.recetaIngrediente.createMany({
        data: input.items.map((i) => ({
          opcionMenuId: i.opcionMenuId,
          articuloId: i.articuloId,
          cantidad: i.cantidad,
        })),
      });
    },
    { timeout: 20000 },
  );

  const nombrePorArticulo = new Map(articulos.map((a) => [a.id, a.name]));
  await Promise.all(
    menus.map((menu) =>
      registrarCambio({
        modelo: 'OpcionMenu',
        registroId: menu.id,
        registroNombre: menu.name,
        accion: 'UPDATE',
        detalle: {
          receta: input.items
            .filter((i) => i.opcionMenuId === menu.id)
            .map((i) => ({
              articulo: nombrePorArticulo.get(i.articuloId) ?? i.articuloId,
              cantidad: i.cantidad,
            })),
        },
        userId,
      }),
    ),
  );

  return { menusActualizados: menus.length, ingredientes: input.items.length };
}

async function assertNameAvailable(name: string, excludeId?: string) {
  const existing = await prisma.opcionMenu.findFirst({
    where: excludeId ? { name, NOT: { id: excludeId } } : { name },
  });
  if (existing) {
    throw new HttpError(409, `Ya existe una opción de menú con el nombre "${name}"`);
  }
}

async function findOpcionOrThrow(id: string) {
  const opcion = await prisma.opcionMenu.findUnique({ where: { id } });
  if (!opcion) {
    throw new HttpError(404, 'Opción de menú no encontrada');
  }
  return opcion;
}
