import type { Cliente, Cotizacion, TaxRate, User } from '@prisma/client';
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
    clienteId: cotizacion.clienteId,
    clienteNombre: cotizacion.clienteNombre,
    clienteIdentificacion: cotizacion.clienteIdentificacion,
    telefono: cotizacion.telefono,
    items,
    logistica,
    taxRateId: cotizacion.taxRateId,
    taxRateNombre: cotizacion.taxRate?.name ?? null,
    condicionesComerciales: cotizacion.condicionesComerciales,
    vendedorId: cotizacion.vendedorId,
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

// El cliente y el vendedor de una cotización solo pueden ser los ya
// creados en Clientes y Usuarios — no se escriben libremente (misma
// decisión aplicada al CRM, 2026-09-21).
async function findClienteOrThrow(clienteId: string): Promise<Cliente> {
  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente || !cliente.active) {
    throw new HttpError(
      404,
      'Cliente no encontrado o inactivo. Créalo primero en el módulo de Clientes.',
    );
  }
  return cliente;
}

async function findVendedorOrThrow(vendedorId: string): Promise<User> {
  const vendedor = await prisma.user.findUnique({ where: { id: vendedorId } });
  if (!vendedor || !vendedor.active) {
    throw new HttpError(404, 'Vendedor no encontrado o inactivo');
  }
  return vendedor;
}

// Crea la cotización y, en la misma transacción, un Negocio en etapa
// COTIZADO vinculado a ella — así toda cotización queda visible de
// inmediato en el CRM (integración pedida por el negocio, 2026-09-10).
// Desde 2026-09-21 el vendedorId del Negocio es el mismo vendedor
// seleccionado para firmar la cotización (antes era siempre quien la
// registraba en el sistema) — así la trazabilidad del CRM muestra al
// vendedor real, no a quien digitó la cotización.
export async function createCotizacion(input: CotizacionInput, registeredById: string) {
  if (input.taxRateId) {
    const taxRate = await prisma.taxRate.findUnique({ where: { id: input.taxRateId } });
    if (!taxRate) {
      throw new HttpError(404, 'Tarifa de impuesto no encontrada');
    }
  }

  const cliente = await findClienteOrThrow(input.clienteId);
  const vendedor = await findVendedorOrThrow(input.vendedorId);

  const totales = calcularTotalesCotizacion(
    input.items,
    input.logistica,
    0, // el % real se aplica al serializar; aquí solo se necesita el subtotal antes de impuestos
  );

  const cotizacion = await prisma.$transaction(async (tx) => {
    const negocio = await tx.negocio.create({
      data: {
        clienteId: cliente.id,
        clienteNombre: cliente.name,
        clienteIdentificacion: cliente.identificacion,
        telefono: cliente.telefono,
        nombreEvento: input.asunto,
        fechaEvento: new Date(input.fecha),
        valorAntesImpuestos: totales.subtotal,
        vendedorId: vendedor.id,
      },
    });

    return tx.cotizacion.create({
      data: {
        fecha: new Date(input.fecha),
        asunto: input.asunto,
        lugar: input.lugar,
        numeroPersonas: input.numeroPersonas,
        clienteId: cliente.id,
        clienteNombre: cliente.name,
        clienteIdentificacion: cliente.identificacion,
        telefono: cliente.telefono,
        items: input.items,
        logistica: input.logistica,
        taxRateId: input.taxRateId ?? null,
        condicionesComerciales: input.condicionesComerciales,
        vendedorId: vendedor.id,
        vendedorNombre: vendedor.name,
        icono: input.icono ?? null,
        negocioId: negocio.id,
        registeredById,
      },
      include: { taxRate: true, registeredBy: { select: { name: true } } },
    });
  });

  return serialize(cotizacion);
}
