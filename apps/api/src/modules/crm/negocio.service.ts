import type { Negocio, Prisma, User } from '@prisma/client';
import type { GanarNegocioInput, NegocioInput } from '@erp-afuego/shared';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/error.middleware.js';
import { calcularValorDespuesImpuestos } from '../eventos/evento.calculations.js';

type NegocioWithVendedor = Negocio & { vendedor: Pick<User, 'name'> };

function serialize(negocio: NegocioWithVendedor) {
  return {
    id: negocio.id,
    clienteNombre: negocio.clienteNombre,
    clienteIdentificacion: negocio.clienteIdentificacion,
    telefono: negocio.telefono,
    nombreEvento: negocio.nombreEvento,
    fechaEvento: negocio.fechaEvento.toISOString(),
    valorAntesImpuestos: Number(negocio.valorAntesImpuestos),
    etapa: negocio.etapa,
    eventoId: negocio.eventoId,
    vendedorNombre: negocio.vendedor.name,
    createdAt: negocio.createdAt.toISOString(),
    updatedAt: negocio.updatedAt.toISOString(),
  };
}

export async function listNegocios() {
  const negocios = await prisma.negocio.findMany({
    include: { vendedor: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return negocios.map(serialize);
}

export async function createNegocio(input: NegocioInput, vendedorId: string) {
  const negocio = await prisma.negocio.create({
    data: {
      clienteNombre: input.clienteNombre,
      clienteIdentificacion: input.clienteIdentificacion,
      telefono: input.telefono,
      nombreEvento: input.nombreEvento,
      fechaEvento: new Date(input.fechaEvento),
      valorAntesImpuestos: input.valorAntesImpuestos,
      vendedorId,
    },
    include: { vendedor: { select: { name: true } } },
  });
  return serialize(negocio);
}

async function findNegocioCotizadoOrThrow(id: string) {
  const negocio = await prisma.negocio.findUnique({ where: { id } });
  if (!negocio) {
    throw new HttpError(404, 'Negocio no encontrado');
  }
  if (negocio.etapa !== 'COTIZADO') {
    throw new HttpError(409, 'Solo se pueden editar negocios en etapa "Cotizado"');
  }
  return negocio;
}

export async function updateNegocio(id: string, input: NegocioInput) {
  await findNegocioCotizadoOrThrow(id);
  const negocio = await prisma.negocio.update({
    where: { id },
    data: {
      clienteNombre: input.clienteNombre,
      clienteIdentificacion: input.clienteIdentificacion,
      telefono: input.telefono,
      nombreEvento: input.nombreEvento,
      fechaEvento: new Date(input.fechaEvento),
      valorAntesImpuestos: input.valorAntesImpuestos,
    },
    include: { vendedor: { select: { name: true } } },
  });
  return serialize(negocio);
}

export async function perderNegocio(id: string) {
  await findNegocioCotizadoOrThrow(id);
  const negocio = await prisma.negocio.update({
    where: { id },
    data: { etapa: 'PERDIDO' },
    include: { vendedor: { select: { name: true } } },
  });
  return serialize(negocio);
}

// Busca un Cliente existente por identificación (si se dio) o por nombre
// exacto; si no existe ninguno, lo crea — evita doble digitación y evita
// duplicar clientes ya registrados en el Módulo 1. Recibe `tx` porque
// corre dentro de la transacción de ganarNegocio.
async function resolverOCrearCliente(
  tx: Prisma.TransactionClient,
  input: { clienteNombre: string; clienteIdentificacion: string; telefono: string },
) {
  if (input.clienteIdentificacion) {
    const porIdentificacion = await tx.cliente.findFirst({
      where: { identificacion: input.clienteIdentificacion },
    });
    if (porIdentificacion) return porIdentificacion;
  }

  const porNombre = await tx.cliente.findFirst({
    where: { name: { equals: input.clienteNombre, mode: 'insensitive' } },
  });
  if (porNombre) return porNombre;

  return tx.cliente.create({
    data: {
      name: input.clienteNombre,
      identificacion: input.clienteIdentificacion,
      telefono: input.telefono,
    },
  });
}

// Al ganar: resuelve/crea el Cliente, crea el Evento del Módulo 3 con los
// campos que sí trae el CRM + los 2 que faltan (opción de menú, número de
// personas — ver decisión documentada en el README), crea el registro en
// la Agenda de Eventos (Fase 11, precargando el vendedor del negocio) y
// vincula el negocio al evento resultante — todo en una sola transacción,
// para no dejar un negocio "ganado" sin su evento/agenda (o registros
// huérfanos) si algo falla a mitad de camino.
export async function ganarNegocio(id: string, input: GanarNegocioInput, registeredById: string) {
  const negocio = await findNegocioCotizadoOrThrow(id);

  const actualizado = await prisma.$transaction(async (tx) => {
    const cliente = await resolverOCrearCliente(tx, {
      clienteNombre: negocio.clienteNombre,
      clienteIdentificacion: negocio.clienteIdentificacion,
      telefono: negocio.telefono,
    });

    const opcionMenu = await tx.opcionMenu.findUnique({ where: { id: input.opcionMenuId } });
    if (!opcionMenu) {
      throw new HttpError(404, 'Opción de menú no encontrada');
    }

    const valorAntesImpuestos = Number(negocio.valorAntesImpuestos);
    let valorDespuesImpuestos = valorAntesImpuestos;
    if (input.taxRateId) {
      const taxRate = await tx.taxRate.findUnique({ where: { id: input.taxRateId } });
      if (!taxRate) {
        throw new HttpError(404, 'Tarifa de impuesto no encontrada');
      }
      valorDespuesImpuestos = calcularValorDespuesImpuestos(valorAntesImpuestos, Number(taxRate.rate));
    }

    const evento = await tx.evento.create({
      data: {
        fecha: negocio.fechaEvento,
        clienteId: cliente.id,
        opcionMenuId: input.opcionMenuId,
        numeroPersonas: input.numeroPersonas,
        valorAntesImpuestos,
        taxRateId: input.taxRateId ?? null,
        valorDespuesImpuestos,
        registeredById,
      },
    });

    await tx.agendaEvento.create({
      data: {
        eventoId: evento.id,
        vendedorId: negocio.vendedorId,
      },
    });

    return tx.negocio.update({
      where: { id },
      data: { etapa: 'GANADO', eventoId: evento.id },
      include: { vendedor: { select: { name: true } } },
    });
  });

  return serialize(actualizado);
}
