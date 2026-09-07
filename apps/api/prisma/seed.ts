import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { CARTA_2026 } from './carta-2026.seed-data.js';

const prisma = new PrismaClient();

// Usuarios de prueba para poder iniciar sesión localmente con cada rol
// definido por la especificación (docs/spec_erp_afuego.md).
// IMPORTANTE: solo para desarrollo local — reemplazar/eliminar antes de producción.
const DEMO_USERS = [
  {
    name: 'Administrador Demo',
    email: 'admin@afuego.local',
    password: 'Admin123!',
    role: 'ADMINISTRADOR' as const,
  },
  {
    name: 'Operación Demo',
    email: 'operacion@afuego.local',
    password: 'Operacion123!',
    role: 'OPERACION' as const,
  },
  {
    name: 'Cocina Demo',
    email: 'cocina@afuego.local',
    password: 'Cocina123!',
    role: 'COCINA_NOMINA' as const,
  },
  {
    name: 'Ventas Demo',
    email: 'ventas@afuego.local',
    password: 'Ventas123!',
    role: 'VENTAS' as const,
  },
];

async function main() {
  for (const demoUser of DEMO_USERS) {
    const passwordHash = await bcrypt.hash(demoUser.password, 10);
    await prisma.user.upsert({
      where: { email: demoUser.email },
      update: {},
      create: {
        name: demoUser.name,
        email: demoUser.email,
        passwordHash,
        role: demoUser.role,
      },
    });
  }
  console.log(`Seed completado: ${DEMO_USERS.length} usuarios de prueba listos.`);

  for (const item of CARTA_2026) {
    await prisma.opcionMenu.upsert({
      where: { name: item.name },
      update: {},
      create: {
        name: item.name,
        category: item.category,
        priceType: item.priceType,
        price: item.price,
        description: item.description,
      },
    });
  }
  console.log(`Seed completado: catálogo Carta 2026 (${CARTA_2026.length} opciones de menú) listo.`);

  // Tasas de impuesto con las que A Fuego factura ventas y le facturan
  // proveedores (confirmado con el negocio) — parámetros configurables,
  // editables desde /tax-rates, no fijos en el código.
  const TAX_RATES = [
    { name: 'IVA 19%', rate: 0.19 },
    { name: 'IVA 5%', rate: 0.05 },
    { name: 'Impuesto al Consumo 8%', rate: 0.08 },
  ];
  for (const taxRate of TAX_RATES) {
    await prisma.taxRate.upsert({
      where: { name: taxRate.name },
      update: {},
      create: taxRate,
    });
  }
  console.log(`Seed completado: ${TAX_RATES.length} tasas de impuesto listas.`);

  // Parámetros de nómina confirmados con el usuario (SMLV 2026, divisor de
  // 210h/mes por la jornada de 42h semanales, y los 7 recargos/horas extra
  // vigentes según el Código Sustantivo del Trabajo). Editables desde
  // /nomina/parametros — nunca fijos en el código.
  await prisma.parametroNomina.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
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
    },
  });
  console.log('Seed completado: parámetros de nómina listos.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
