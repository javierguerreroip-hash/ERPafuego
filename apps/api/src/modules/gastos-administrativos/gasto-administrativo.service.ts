import type { GastoAdministrativo } from '@prisma/client';
import type { GastoAdministrativoInput } from '@erp-afuego/shared';
import { GASTO_ADMINISTRATIVO_RUBROS } from '@erp-afuego/shared';
import { prisma } from '../../lib/prisma.js';
import { calcularTotalGastosAdministrativos } from './gasto-administrativo.calculations.js';

type GastoWithUser = GastoAdministrativo & { registeredBy: { name: string } };

function serialize(gasto: GastoWithUser) {
  const rubros = Object.fromEntries(
    GASTO_ADMINISTRATIVO_RUBROS.map((rubro) => [rubro, Number(gasto[rubro])]),
  ) as Record<(typeof GASTO_ADMINISTRATIVO_RUBROS)[number], number>;

  return {
    id: gasto.id,
    year: gasto.year,
    month: gasto.month,
    ...rubros,
    total: calcularTotalGastosAdministrativos(rubros),
    registeredByName: gasto.registeredBy.name,
    createdAt: gasto.createdAt.toISOString(),
    updatedAt: gasto.updatedAt.toISOString(),
  };
}

export async function listGastos() {
  const gastos = await prisma.gastoAdministrativo.findMany({
    include: { registeredBy: true },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  });
  return gastos.map(serialize);
}

export async function getGasto(year: number, month: number) {
  const gasto = await prisma.gastoAdministrativo.findUnique({
    where: { year_month: { year, month } },
    include: { registeredBy: true },
  });
  return gasto ? serialize(gasto) : null;
}

export async function upsertGasto(input: GastoAdministrativoInput, registeredById: string) {
  const { year, month, ...rubros } = input;
  const gasto = await prisma.gastoAdministrativo.upsert({
    where: { year_month: { year, month } },
    update: { ...rubros, registeredById },
    create: { year, month, ...rubros, registeredById },
    include: { registeredBy: true },
  });
  return serialize(gasto);
}
