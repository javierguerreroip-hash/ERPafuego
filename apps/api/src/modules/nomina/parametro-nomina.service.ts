import type { ParametroNomina } from '@prisma/client';
import type { ParametroNominaInput } from '@erp-afuego/shared';
import { prisma } from '../../lib/prisma.js';

const SINGLETON_ID = 'singleton';

function serialize(p: ParametroNomina) {
  const smlv = Number(p.smlv);
  const divisorHoras = Number(p.divisorHoras);
  return {
    smlv,
    divisorHoras,
    auxilioTransporte: Number(p.auxilioTransporte),
    recargoNocturno: Number(p.recargoNocturno),
    recargoExtraDiurna: Number(p.recargoExtraDiurna),
    recargoExtraNocturna: Number(p.recargoExtraNocturna),
    recargoDominicalFestiva: Number(p.recargoDominicalFestiva),
    recargoNocturnoDomFestivo: Number(p.recargoNocturnoDomFestivo),
    recargoExtraDiurnaDomFestiva: Number(p.recargoExtraDiurnaDomFestiva),
    recargoExtraNocturnaDomFestiva: Number(p.recargoExtraNocturnaDomFestiva),
    porcentajeIncapacidad: Number(p.porcentajeIncapacidad),
    porcentajeEPS: Number(p.porcentajeEPS),
    porcentajeAFP: Number(p.porcentajeAFP),
    valorHoraOrdinaria: Math.round((smlv / divisorHoras + Number.EPSILON) * 100) / 100,
    updatedAt: p.updatedAt.toISOString(),
  };
}

// Valores por defecto si nunca se han configurado (no debería pasar tras
// el seed, pero evita que el módulo quede inutilizable sin ellos).
const DEFAULTS = {
  smlv: 1750905,
  divisorHoras: 210,
  auxilioTransporte: 249095,
  recargoNocturno: 0.35,
  recargoExtraDiurna: 0.25,
  recargoExtraNocturna: 0.75,
  recargoDominicalFestiva: 0.9,
  recargoNocturnoDomFestivo: 1.25,
  recargoExtraDiurnaDomFestiva: 1.15,
  recargoExtraNocturnaDomFestiva: 1.65,
  porcentajeIncapacidad: 0.6667,
  porcentajeEPS: 0.04,
  porcentajeAFP: 0.04,
};

export async function getParametros() {
  const p = await prisma.parametroNomina.upsert({
    where: { id: SINGLETON_ID },
    update: {},
    create: { id: SINGLETON_ID, ...DEFAULTS },
  });
  return serialize(p);
}

export async function getParametrosRaw() {
  return prisma.parametroNomina.upsert({
    where: { id: SINGLETON_ID },
    update: {},
    create: { id: SINGLETON_ID, ...DEFAULTS },
  });
}

export async function updateParametros(input: ParametroNominaInput) {
  const p = await prisma.parametroNomina.upsert({
    where: { id: SINGLETON_ID },
    update: input,
    create: { id: SINGLETON_ID, ...input },
  });
  return serialize(p);
}
