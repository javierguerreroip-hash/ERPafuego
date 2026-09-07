import type { Prisma } from '@prisma/client';
import type { CompraBatchInput } from '@erp-afuego/shared';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/error.middleware.js';

const includeRelations = {
  articulo: true,
  proveedor: true,
  registeredBy: true,
} satisfies Prisma.CompraInclude;

type CompraWithRelations = Prisma.CompraGetPayload<{ include: typeof includeRelations }>;

function serialize(compra: CompraWithRelations) {
  return {
    id: compra.id,
    articuloId: compra.articuloId,
    articuloNombre: compra.articulo.name,
    articuloCodigo: compra.articulo.code,
    proveedorId: compra.proveedorId,
    proveedorNombre: compra.proveedor.name,
    fecha: compra.fecha.toISOString(),
    quantity: Number(compra.quantity),
    unit: compra.unit,
    unitPrice: Number(compra.unitPrice),
    totalValue: Number(compra.totalValue),
    facturaNumero: compra.facturaNumero,
    condicionPago: compra.condicionPago,
    fechaVencimiento: compra.fechaVencimiento ? compra.fechaVencimiento.toISOString() : null,
    registeredByName: compra.registeredBy.name,
    createdAt: compra.createdAt.toISOString(),
  };
}

export async function listCompras(filters: { articuloId?: string; proveedorId?: string }) {
  const compras = await prisma.compra.findMany({
    where: {
      articuloId: filters.articuloId,
      proveedorId: filters.proveedorId,
    },
    include: includeRelations,
    orderBy: [{ fecha: 'desc' }, { createdAt: 'desc' }],
  });
  return compras.map(serialize);
}

export async function createCompraBatch(input: CompraBatchInput, registeredById: string) {
  const proveedor = await prisma.proveedor.findUnique({ where: { id: input.proveedorId } });
  if (!proveedor) {
    throw new HttpError(404, 'Proveedor no encontrado');
  }

  const fecha = new Date(input.fecha);
  const fechaVencimiento =
    input.condicionPago === 'CREDITO' && input.fechaVencimiento
      ? new Date(input.fechaVencimiento)
      : null;

  const created = await prisma.$transaction(async (tx) => {
    const compras = [];
    for (const item of input.items) {
      const articulo = await tx.articulo.findUnique({ where: { id: item.articuloId } });
      if (!articulo) {
        throw new HttpError(404, `Artículo no encontrado: ${item.articuloId}`);
      }

      const totalValue = Math.round(item.quantity * item.unitPrice * 100) / 100;

      const compra = await tx.compra.create({
        data: {
          articuloId: item.articuloId,
          proveedorId: input.proveedorId,
          fecha,
          quantity: item.quantity,
          unit: articulo.unit,
          unitPrice: item.unitPrice,
          totalValue,
          facturaNumero: input.facturaNumero,
          condicionPago: input.condicionPago,
          fechaVencimiento,
          registeredById,
        },
        include: includeRelations,
      });

      await tx.articulo.update({
        where: { id: item.articuloId },
        data: { lastPurchasePrice: item.unitPrice },
      });

      compras.push(compra);
    }

    // Cartera (Fase 12): una compra a crédito genera automáticamente su
    // Cuenta por Pagar (agrupada por proveedor + número de factura, no
    // por línea) — upsert porque varias compras pueden compartir la
    // misma factura.
    if (input.condicionPago === 'CREDITO') {
      await tx.cuentaPorPagar.upsert({
        where: {
          proveedorId_facturaNumero: {
            proveedorId: input.proveedorId,
            facturaNumero: input.facturaNumero,
          },
        },
        update: {},
        create: { proveedorId: input.proveedorId, facturaNumero: input.facturaNumero },
      });
    }

    return compras;
  });

  return created.map(serialize);
}
