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

  // No se puede repetir un número de factura para el mismo proveedor —
  // evita registrar la misma factura dos veces por error. No aplica entre
  // proveedores distintos (cada uno numera sus facturas de forma
  // independiente). Los varios ítems de ESTA factura (input.items) sí
  // comparten el mismo número entre sí — eso es correcto, es una sola
  // factura con varias líneas.
  const facturaExistente = await prisma.compra.findFirst({
    where: { proveedorId: input.proveedorId, facturaNumero: input.facturaNumero },
  });
  if (facturaExistente) {
    throw new HttpError(
      409,
      `Ya existe una compra registrada con la factura "${input.facturaNumero}" para este proveedor.`,
    );
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

// Borrado real de una compra — pedido por el negocio para poder corregir
// compras de prueba/mal digitadas (solo Administrador, ver
// compra.routes.ts). Recalcula el "último precio de compra" del
// artículo tomando la compra más reciente que quede (o $0 si no queda
// ninguna) y, si era a crédito y era la última compra de esa factura,
// limpia la Cuenta por Pagar asociada — mismo criterio que ya se usó
// manualmente por SQL para corregir las compras de un proveedor.
export async function deleteCompra(id: string) {
  const compra = await prisma.compra.findUnique({ where: { id } });
  if (!compra) {
    throw new HttpError(404, 'Compra no encontrada');
  }

  if (compra.condicionPago === 'CREDITO') {
    const otrasCompras = await prisma.compra.count({
      where: {
        proveedorId: compra.proveedorId,
        facturaNumero: compra.facturaNumero,
        id: { not: id },
      },
    });
    if (otrasCompras === 0) {
      const cxp = await prisma.cuentaPorPagar.findUnique({
        where: {
          proveedorId_facturaNumero: {
            proveedorId: compra.proveedorId,
            facturaNumero: compra.facturaNumero,
          },
        },
      });
      if (cxp) {
        const abonos = await prisma.abono.count({ where: { cuentaPorPagarId: cxp.id } });
        if (abonos > 0) {
          throw new HttpError(
            409,
            'No se puede eliminar: la factura de este proveedor ya tiene abonos/pagos registrados en Cartera.',
          );
        }
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.compra.delete({ where: { id } });

    const ultimaRestante = await tx.compra.findFirst({
      where: { articuloId: compra.articuloId },
      orderBy: [{ fecha: 'desc' }, { createdAt: 'desc' }],
    });
    await tx.articulo.update({
      where: { id: compra.articuloId },
      data: { lastPurchasePrice: ultimaRestante ? ultimaRestante.unitPrice : 0 },
    });

    if (compra.condicionPago === 'CREDITO') {
      const quedanCompras = await tx.compra.count({
        where: { proveedorId: compra.proveedorId, facturaNumero: compra.facturaNumero },
      });
      if (quedanCompras === 0) {
        await tx.cuentaPorPagar.deleteMany({
          where: { proveedorId: compra.proveedorId, facturaNumero: compra.facturaNumero },
        });
      }
    }
  });
}
