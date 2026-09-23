import type { InventarioFinalFisicoInput, InventarioInicialInput } from '@erp-afuego/shared';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/error.middleware.js';
import { calcularDesviacionInventario, calcularInventarioFinal } from './inventario.calculations.js';

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// startDate/endDate ya vienen normalizadas a límites de día completo
// (00:00:00 y 23:59:59.999) por el controlador.
//
// Actualización post-lanzamiento (2026-09-24): este reporte quedó
// restringido a artículos de categoría MATERIA_PRIMA — las demás
// categorías (mano de obra, transporte, artístico, alquiler de menaje)
// son servicios/alquileres sin inventario físico real, y las de
// monitoreo (Insumos de Aseo, Utensilios) nunca lo tuvieron. Además del
// inventario final "teórico" (de sistema) ya existente, ahora también
// trae el "físico" (conteo manual de cierre) y la desviación entre los
// dos — el registro del conteo físico se trasladó aquí desde Juego de
// Inventarios, que ahora solo lo consume de solo lectura para el CMV.
export async function getInventarioReporte(startDate: Date, endDate: Date) {
  const articulos = await prisma.articulo.findMany({
    where: { active: true, category: 'MATERIA_PRIMA' },
    orderBy: { name: 'asc' },
  });
  const articuloIds = articulos.map((a) => a.id);

  const iniciales = await prisma.inventarioInicial.findMany({
    where: { fecha: startDate, articuloId: { in: articuloIds } },
  });
  const inicialesMap = new Map(iniciales.map((i) => [i.articuloId, i]));

  const compras = await prisma.compra.findMany({
    where: { fecha: { gte: startDate, lte: endDate }, articuloId: { in: articuloIds } },
    select: { articuloId: true, quantity: true, totalValue: true },
  });
  const comprasMap = new Map<string, { quantity: number; value: number }>();
  for (const c of compras) {
    const prev = comprasMap.get(c.articuloId) ?? { quantity: 0, value: 0 };
    comprasMap.set(c.articuloId, {
      quantity: prev.quantity + Number(c.quantity),
      value: prev.value + Number(c.totalValue),
    });
  }

  const consumos = await prisma.eventoConsumo.findMany({
    where: { articuloId: { in: articuloIds }, evento: { fecha: { gte: startDate, lte: endDate } } },
    select: { articuloId: true, quantity: true, subtotal: true },
  });
  const consumosMap = new Map<string, { quantity: number; value: number }>();
  for (const c of consumos) {
    const prev = consumosMap.get(c.articuloId) ?? { quantity: 0, value: 0 };
    consumosMap.set(c.articuloId, {
      quantity: prev.quantity + Number(c.quantity),
      value: prev.value + Number(c.subtotal),
    });
  }

  // El registro de inventario final físico se guarda con fecha a
  // medianoche UTC (mismo criterio que InventarioInicial), pero endDate
  // aquí es fin de día (23:59:59.999Z) para que las consultas por rango
  // (compras/consumos) incluyan todo el último día — se normaliza aparte
  // para que la igualdad exacta contra lo guardado sí haga match.
  const endDateAtMidnight = new Date(
    Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()),
  );
  const finalesFisicos = await prisma.inventarioFinalFisico.findMany({
    where: { fecha: endDateAtMidnight, articuloId: { in: articuloIds } },
  });
  const finalesFisicosMap = new Map(finalesFisicos.map((f) => [f.articuloId, f]));

  const detalle = articulos.map((articulo) => {
    const inicial = inicialesMap.get(articulo.id);
    const inicialQuantity = inicial ? Number(inicial.quantity) : 0;
    const inicialValue = inicial ? Number(inicial.value) : 0;
    const compra = comprasMap.get(articulo.id) ?? { quantity: 0, value: 0 };
    const consumo = consumosMap.get(articulo.id) ?? { quantity: 0, value: 0 };

    const inventarioFinalTeoricoQuantity = calcularInventarioFinal(
      inicialQuantity,
      compra.quantity,
      consumo.quantity,
    );
    const inventarioFinalTeoricoValue = calcularInventarioFinal(inicialValue, compra.value, consumo.value);

    const finalFisico = finalesFisicosMap.get(articulo.id);
    const inventarioFinalFisicoQuantity = finalFisico ? Number(finalFisico.quantity) : 0;
    const inventarioFinalFisicoValue = finalFisico ? Number(finalFisico.value) : 0;

    return {
      articuloId: articulo.id,
      articuloNombre: articulo.name,
      articuloCodigo: articulo.code,
      category: articulo.category,
      unit: articulo.unit,
      inventarioInicialQuantity: inicialQuantity,
      inventarioInicialValue: inicialValue,
      inventarioInicialRegistrado: Boolean(inicial),
      comprasQuantity: round2(compra.quantity),
      comprasValue: round2(compra.value),
      consumoQuantity: round2(consumo.quantity),
      consumoValue: round2(consumo.value),
      inventarioFinalTeoricoQuantity,
      inventarioFinalTeoricoValue,
      inventarioFinalFisicoQuantity,
      inventarioFinalFisicoValue,
      inventarioFinalFisicoRegistrado: Boolean(finalFisico),
      desviacionQuantity: calcularDesviacionInventario(
        inventarioFinalFisicoQuantity,
        inventarioFinalTeoricoQuantity,
      ),
      desviacionValue: calcularDesviacionInventario(inventarioFinalFisicoValue, inventarioFinalTeoricoValue),
    };
  });

  const consolidado = {
    inventarioInicialValue: round2(detalle.reduce((sum, d) => sum + d.inventarioInicialValue, 0)),
    comprasValue: round2(detalle.reduce((sum, d) => sum + d.comprasValue, 0)),
    consumoValue: round2(detalle.reduce((sum, d) => sum + d.consumoValue, 0)),
    inventarioFinalTeoricoValue: round2(
      detalle.reduce((sum, d) => sum + d.inventarioFinalTeoricoValue, 0),
    ),
    inventarioFinalFisicoValue: round2(
      detalle.reduce((sum, d) => sum + d.inventarioFinalFisicoValue, 0),
    ),
    desviacionValue: round2(detalle.reduce((sum, d) => sum + d.desviacionValue, 0)),
  };

  return {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    detalle,
    consolidado,
  };
}

export async function setInventarioInicial(input: InventarioInicialInput, registeredById: string) {
  const articulo = await prisma.articulo.findUnique({ where: { id: input.articuloId } });
  if (!articulo) {
    throw new HttpError(404, 'Artículo no encontrado');
  }

  const unitCost = input.unitCost ?? Number(articulo.lastPurchasePrice);
  const value = round2(input.quantity * unitCost);
  // UTC explícito (ver comentario en inventario.controller.ts): debe
  // coincidir exactamente con cómo el reporte busca por fecha de inicio.
  const fecha = new Date(`${input.fecha}T00:00:00.000Z`);

  const inicial = await prisma.inventarioInicial.upsert({
    where: { articuloId_fecha: { articuloId: input.articuloId, fecha } },
    update: { quantity: input.quantity, unit: articulo.unit, unitCost, value, registeredById },
    create: {
      articuloId: input.articuloId,
      fecha,
      quantity: input.quantity,
      unit: articulo.unit,
      unitCost,
      value,
      registeredById,
    },
  });

  return {
    id: inicial.id,
    articuloId: inicial.articuloId,
    fecha: inicial.fecha.toISOString(),
    quantity: Number(inicial.quantity),
    unit: inicial.unit,
    unitCost: Number(inicial.unitCost),
    value: Number(inicial.value),
  };
}

// Conteo físico de cierre de período (post-lanzamiento, 2026-09-24:
// trasladado aquí desde Juego de Inventarios — ver comentario arriba).
export async function setInventarioFinalFisico(
  input: InventarioFinalFisicoInput,
  registeredById: string,
) {
  const articulo = await prisma.articulo.findUnique({ where: { id: input.articuloId } });
  if (!articulo) {
    throw new HttpError(404, 'Artículo no encontrado');
  }

  const unitCost = input.unitCost ?? Number(articulo.lastPurchasePrice);
  const value = round2(input.quantity * unitCost);
  const fecha = new Date(`${input.fecha}T00:00:00.000Z`);

  const registro = await prisma.inventarioFinalFisico.upsert({
    where: { articuloId_fecha: { articuloId: input.articuloId, fecha } },
    update: { quantity: input.quantity, unit: articulo.unit, unitCost, value, registeredById },
    create: {
      articuloId: input.articuloId,
      fecha,
      quantity: input.quantity,
      unit: articulo.unit,
      unitCost,
      value,
      registeredById,
    },
  });

  return {
    id: registro.id,
    articuloId: registro.articuloId,
    fecha: registro.fecha.toISOString(),
    quantity: Number(registro.quantity),
    unit: registro.unit,
    unitCost: Number(registro.unitCost),
    value: Number(registro.value),
  };
}
