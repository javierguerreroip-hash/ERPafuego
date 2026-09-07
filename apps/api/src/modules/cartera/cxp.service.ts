import type { Abono, Compra, User } from '@prisma/client';
import type { AbonoInput } from '@erp-afuego/shared';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/error.middleware.js';
import { calcularEstadoCartera, calcularSaldoPendiente } from './cartera.calculations.js';

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function serializeAbono(abono: Abono & { registeredBy: Pick<User, 'name'> }) {
  return {
    id: abono.id,
    valor: Number(abono.valor),
    fecha: abono.fecha.toISOString(),
    registeredByName: abono.registeredBy.name,
    createdAt: abono.createdAt.toISOString(),
  };
}

export async function listCxP(filters: {
  proveedorId?: string;
  estado?: string;
  start?: Date;
  end?: Date;
}) {
  const cuentas = await prisma.cuentaPorPagar.findMany({
    where: { proveedorId: filters.proveedorId },
    include: {
      proveedor: true,
      abonos: { include: { registeredBy: true }, orderBy: { fecha: 'desc' } },
    },
  });
  if (cuentas.length === 0) return [];

  const compras = await prisma.compra.findMany({
    where: {
      OR: cuentas.map((c) => ({ proveedorId: c.proveedorId, facturaNumero: c.facturaNumero })),
    },
  });

  const comprasPorCuenta = new Map<string, Compra[]>();
  for (const compra of compras) {
    const key = `${compra.proveedorId}::${compra.facturaNumero}`;
    const lista = comprasPorCuenta.get(key) ?? [];
    lista.push(compra);
    comprasPorCuenta.set(key, lista);
  }

  const hoy = new Date();
  const resultados = [];
  for (const cuenta of cuentas) {
    const comprasCuenta = comprasPorCuenta.get(`${cuenta.proveedorId}::${cuenta.facturaNumero}`) ?? [];
    if (comprasCuenta.length === 0) continue;

    const fechaCompra = comprasCuenta[0].fecha;
    if (filters.start && filters.end && (fechaCompra < filters.start || fechaCompra > filters.end)) {
      continue;
    }

    const valorFactura = round2(comprasCuenta.reduce((sum, c) => sum + Number(c.totalValue), 0));
    const totalAbonos = round2(cuenta.abonos.reduce((sum, a) => sum + Number(a.valor), 0));
    const saldoPendiente = calcularSaldoPendiente(valorFactura, totalAbonos);
    const fechaVencimiento = comprasCuenta[0].fechaVencimiento;
    const estado = fechaVencimiento
      ? calcularEstadoCartera(saldoPendiente, fechaVencimiento, hoy)
      : saldoPendiente <= 0
        ? 'PAGADA'
        : 'PENDIENTE';

    resultados.push({
      id: cuenta.id,
      proveedorId: cuenta.proveedorId,
      proveedorNombre: cuenta.proveedor.name,
      facturaNumero: cuenta.facturaNumero,
      fechaCompra: fechaCompra.toISOString(),
      valorFactura,
      condicionPago: comprasCuenta[0].condicionPago,
      fechaVencimiento: fechaVencimiento ? fechaVencimiento.toISOString() : null,
      saldoPendiente,
      estado: estado as 'PENDIENTE' | 'PAGADA' | 'VENCIDA',
      abonos: cuenta.abonos.map(serializeAbono),
    });
  }

  return filters.estado ? resultados.filter((r) => r.estado === filters.estado) : resultados;
}

export async function addAbonoCxP(cuentaId: string, input: AbonoInput, registeredById: string) {
  const cuenta = await prisma.cuentaPorPagar.findUnique({ where: { id: cuentaId } });
  if (!cuenta) {
    throw new HttpError(404, 'Cuenta por pagar no encontrada');
  }
  await prisma.abono.create({
    data: {
      tipo: 'CXP',
      cuentaPorPagarId: cuentaId,
      valor: input.valor,
      fecha: new Date(input.fecha),
      registeredById,
    },
  });
}
