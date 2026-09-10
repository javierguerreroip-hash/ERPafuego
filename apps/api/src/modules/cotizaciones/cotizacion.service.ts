import type { Cotizacion, TaxRate, User } from '@prisma/client';
import type { CotizacionInput, CotizacionLineaInput } from '@erp-afuego/shared';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/error.middleware.js';
import { calcularTotalesCotizacion } from './cotizacion.calculations.js';

type CotizacionWithRelations = Cotizacion & {
  taxRate: TaxRate | null;
  registeredBy: Pick<User, 'name'>;
};

function serialize(cotizacion: CotizacionWithRelations) {
  const items = cotizacion.items as unknown as CotizacionLineaInput[];
  const logistica = cotizacion.logistica as unknown as CotizacionLineaInput[];
  const impuestoPorcentaje = cotizacion.taxRate ? Number(cotizacion.taxRate.rate) : 0;

  return {
    id: cotizacion.id,
    fecha: cotizacion.fecha.toISOString(),
    asunto: cotizacion.asunto,
    lugar: cotizacion.lugar,
    numeroPersonas: cotizacion.numeroPersonas,
    clienteNombre: cotizacion.clienteNombre,
    clienteIdentificacion: cotizacion.clienteIdentificacion,
    telefono: cotizacion.telefono,
    items,
    logistica,
    taxRateId: cotizacion.taxRateId,
    taxRateNombre: cotizacion.taxRate?.name ?? null,
    condicionesComerciales: cotizacion.condicionesComerciales,
    vendedorNombre: cotizacion.vendedorNombre,
    icono: cotizacion.icono as CotizacionInput['icono'],
    negocioId: cotizacion.negocioId,
    totales: calcularTotalesCotizacion(items, logistica, impuestoPorcentaje),
    registeredByName: cotizacion.registeredBy.name,
    createdAt: cotizacion.createdAt.toISOString(),
    updatedAt: cotizacion.updatedAt.toISOString(),
  };
}

export async function listCotizaciones() {
  const cotizaciones = await prisma.cotizacion.findMany({
    include: { taxRate: true, registeredBy: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return cotizaciones.map(serialize);
}

export async function getCotizacion(id: string) {
  const cotizacion = await prisma.cotizacion.findUnique({
    where: { id },
    include: { taxRate: true, registeredBy: { select: { name: true } } },
  });
  if (!cotizacion) {
    throw new HttpError(404, 'Cotización no encontrada');
  }
  return serialize(cotizacion);
}

// Crea la cotización y, en la misma transacción, un Negocio en etapa
// COTIZADO vinculado a ella — así toda cotización queda visible de
// inmediato en el CRM (integración pedida por el negocio, 2026-09-10). El
// vendedorId del Negocio es quien está registrando la cotización en el
// sistema (igual que en el resto del CRM); vendedorNombre en la
// cotización es solo el nombre que firma el documento, independiente de
// eso.
export async function createCotizacion(input: CotizacionInput, registeredById: string) {
  if (input.taxRateId) {
    const taxRate = await prisma.taxRate.findUnique({ where: { id: input.taxRateId } });
    if (!taxRate) {
      throw new HttpError(404, 'Tarifa de impuesto no encontrada');
    }
  }

  const totales = calcularTotalesCotizacion(
    input.items,
    input.logistica,
    0, // el % real se aplica al serializar; aquí solo se necesita el subtotal antes de impuestos
  );

  const cotizacion = await prisma.$transaction(async (tx) => {
    const negocio = await tx.negocio.create({
      data: {
        clienteNombre: input.clienteNombre,
        clienteIdentificacion: input.clienteIdentificacion,
        telefono: input.telefono,
        nombreEvento: input.asunto,
        fechaEvento: new Date(input.fecha),
        valorAntesImpuestos: totales.subtotal,
        vendedorId: registeredById,
      },
    });

    return tx.cotizacion.create({
      data: {
        fecha: new Date(input.fecha),
        asunto: input.asunto,
        lugar: input.lugar,
        numeroPersonas: input.numeroPersonas,
        clienteNombre: input.clienteNombre,
        clienteIdentificacion: input.clienteIdentificacion,
        telefono: input.telefono,
        items: input.items,
        logistica: input.logistica,
        taxRateId: input.taxRateId ?? null,
        condicionesComerciales: input.condicionesComerciales,
        vendedorNombre: input.vendedorNombre,
        icono: input.icono ?? null,
        negocioId: negocio.id,
        registeredById,
      },
      include: { taxRate: true, registeredBy: { select: { name: true } } },
    });
  });

  return serialize(cotizacion);
}
