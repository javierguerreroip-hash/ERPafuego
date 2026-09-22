import type { TaxRate } from '@prisma/client';
import type { TaxRateInput } from '@erp-afuego/shared';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/error.middleware.js';
import { registrarCambio } from '../auditoria/auditoria.service.js';

function serialize(taxRate: TaxRate) {
  return {
    id: taxRate.id,
    name: taxRate.name,
    rate: Number(taxRate.rate),
    active: taxRate.active,
    createdAt: taxRate.createdAt.toISOString(),
    updatedAt: taxRate.updatedAt.toISOString(),
  };
}

export async function listTaxRates() {
  const taxRates = await prisma.taxRate.findMany({ orderBy: { rate: 'asc' } });
  return taxRates.map(serialize);
}

export async function createTaxRate(input: TaxRateInput, userId: string) {
  await assertNameAvailable(input.name);
  const taxRate = await prisma.taxRate.create({ data: input });
  await registrarCambio({
    modelo: 'TaxRate',
    registroId: taxRate.id,
    registroNombre: taxRate.name,
    accion: 'CREATE',
    detalle: input,
    userId,
  });
  return serialize(taxRate);
}

export async function updateTaxRate(id: string, input: TaxRateInput, userId: string) {
  await findTaxRateOrThrow(id);
  await assertNameAvailable(input.name, id);
  const taxRate = await prisma.taxRate.update({ where: { id }, data: input });
  await registrarCambio({
    modelo: 'TaxRate',
    registroId: taxRate.id,
    registroNombre: taxRate.name,
    accion: 'UPDATE',
    detalle: input,
    userId,
  });
  return serialize(taxRate);
}

export async function setTaxRateActive(id: string, active: boolean, userId: string) {
  await findTaxRateOrThrow(id);
  const taxRate = await prisma.taxRate.update({ where: { id }, data: { active } });
  await registrarCambio({
    modelo: 'TaxRate',
    registroId: taxRate.id,
    registroNombre: taxRate.name,
    accion: active ? 'ACTIVATE' : 'DEACTIVATE',
    userId,
  });
  return serialize(taxRate);
}

async function assertNameAvailable(name: string, excludeId?: string) {
  const existing = await prisma.taxRate.findFirst({
    where: excludeId ? { name, NOT: { id: excludeId } } : { name },
  });
  if (existing) {
    throw new HttpError(409, `Ya existe una tarifa con el nombre "${name}"`);
  }
}

async function findTaxRateOrThrow(id: string) {
  const taxRate = await prisma.taxRate.findUnique({ where: { id } });
  if (!taxRate) {
    throw new HttpError(404, 'Tarifa de impuesto no encontrada');
  }
  return taxRate;
}
