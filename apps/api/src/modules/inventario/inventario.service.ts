import {
  DIAS_PLAZO_CIERRE_INVENTARIO,
  type InventarioFinalFisicoInput,
  type InventarioInicialInput,
  type UserRole,
} from '@erp-afuego/shared';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/error.middleware.js';
import { calcularCostoUnitarioPromedio } from '../eventos/evento.calculations.js';
import {
  calcularDesviacionInventario,
  calcularInventarioFinal,
  elegirConteoVigente,
  fechaInicialDelMesSiguiente,
  plazoCierreMes,
} from './inventario.calculations.js';

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// "Hoy" en hora de Colombia (UTC-5, sin horario de verano), expresado para
// leerse con getters UTC — para el plazo de cierre de mes.
function hoyColombia(): Date {
  return new Date(Date.now() - 5 * 3600 * 1000);
}

function fechaCorta(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
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
  const finalesFisicosPorArticulo = new Map<string, typeof finalesFisicos>();
  for (const f of finalesFisicos) {
    const lista = finalesFisicosPorArticulo.get(f.articuloId) ?? [];
    lista.push(f);
    finalesFisicosPorArticulo.set(f.articuloId, lista);
  }

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

    const conteos = finalesFisicosPorArticulo.get(articulo.id) ?? [];
    const conteo1 = conteos.find((c) => c.conteo === 1);
    const conteo2 = conteos.find((c) => c.conteo === 2);
    // Vigente: el conteo 2 (definitivo) si existe; si no, el 1 (provisional).
    const finalFisico = elegirConteoVigente(conteos);
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
      conteoFisicoVigente: finalFisico ? (finalFisico.conteo === 2 ? (2 as const) : (1 as const)) : null,
      conteo1Quantity: conteo1 ? Number(conteo1.quantity) : null,
      conteo1Value: conteo1 ? Number(conteo1.value) : null,
      conteo2Quantity: conteo2 ? Number(conteo2.quantity) : null,
      conteo2Value: conteo2 ? Number(conteo2.value) : null,
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

  const plazo = plazoCierreMes(endDateAtMidnight, hoyColombia(), DIAS_PLAZO_CIERRE_INVENTARIO);

  return {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    plazoCierre: plazo ? { hasta: fechaCorta(plazo.hasta), vencido: plazo.vencido } : null,
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
  role: UserRole,
) {
  const articulo = await prisma.articulo.findUnique({ where: { id: input.articuloId } });
  if (!articulo) {
    throw new HttpError(404, 'Artículo no encontrado');
  }

  // Plazo de cierre (post-lanzamiento, 2026-10-05): el cierre de un mes
  // (conteo 1 y 2) se puede cargar o corregir hasta 7 días después de su
  // último día; pasado ese plazo, solo Administrador.
  const fecha = new Date(`${input.fecha}T00:00:00.000Z`);
  const plazo = plazoCierreMes(fecha, hoyColombia(), DIAS_PLAZO_CIERRE_INVENTARIO);
  if (plazo?.vencido && role !== 'ADMINISTRADOR') {
    throw new HttpError(
      403,
      `El plazo para cargar o corregir este cierre venció el ${fechaCorta(plazo.hasta)} (${DIAS_PLAZO_CIERRE_INVENTARIO} días después de terminar el mes). Solicita a un Administrador que lo haga.`,
    );
  }

  // Costo por defecto = misma fórmula que el costo de un consumo de
  // evento (ajustado 2026-09-24): si nunca hubo compras, usa el costo
  // del inventario inicial más reciente en vez de asumir $0 — evita que
  // un conteo físico con la MISMA cantidad que el teórico muestre una
  // "desviación" en pesos que en realidad no existe (bug detectado con
  // "Aceite de Oliva": 2 litros físicos a $0 vs. 2 litros teóricos a
  // $97.980, solo porque el artículo nunca se había comprado).
  let unitCost = input.unitCost;
  if (unitCost === undefined) {
    const ultimoInventario = await prisma.inventarioInicial.findFirst({
      where: { articuloId: input.articuloId },
      orderBy: { fecha: 'desc' },
    });
    unitCost = calcularCostoUnitarioPromedio(
      Number(articulo.lastPurchasePrice),
      ultimoInventario ? Number(ultimoInventario.unitCost) : null,
    );
  }
  const value = round2(input.quantity * unitCost);

  // Encadenamiento de períodos (post-lanzamiento, 2026-10-05): si el conteo
  // es de FIN DE MES, ese mismo conteo (cantidad, costo unitario y valor)
  // pasa a ser el inventario inicial del mes siguiente, y se sobrescribe
  // cada vez que el físico se edita. Ambos upserts van en una transacción
  // para que nunca quede el cierre de un mes sin reflejarse en el
  // siguiente. El upsert del inicial lo audita el interceptor general.
  // Solo el CONTEO 2 (definitivo, ya reconteado y ajustado) se traslada; el
  // conteo 1 es únicamente para detectar diferencias contra el teórico.
  const fechaInicialSiguiente =
    input.conteo === 2 ? fechaInicialDelMesSiguiente(fecha) : null;

  const registro = await prisma.$transaction(async (tx) => {
    const finalFisico = await tx.inventarioFinalFisico.upsert({
      where: {
        articuloId_fecha_conteo: { articuloId: input.articuloId, fecha, conteo: input.conteo },
      },
      update: { quantity: input.quantity, unit: articulo.unit, unitCost, value, registeredById },
      create: {
        articuloId: input.articuloId,
        fecha,
        conteo: input.conteo,
        quantity: input.quantity,
        unit: articulo.unit,
        unitCost,
        value,
        registeredById,
      },
    });

    if (fechaInicialSiguiente) {
      await tx.inventarioInicial.upsert({
        where: {
          articuloId_fecha: { articuloId: input.articuloId, fecha: fechaInicialSiguiente },
        },
        update: { quantity: input.quantity, unit: articulo.unit, unitCost, value, registeredById },
        create: {
          articuloId: input.articuloId,
          fecha: fechaInicialSiguiente,
          quantity: input.quantity,
          unit: articulo.unit,
          unitCost,
          value,
          registeredById,
        },
      });
    }
    return finalFisico;
  });

  return {
    id: registro.id,
    articuloId: registro.articuloId,
    fecha: registro.fecha.toISOString(),
    quantity: Number(registro.quantity),
    unit: registro.unit,
    unitCost: Number(registro.unitCost),
    value: Number(registro.value),
    conteo: registro.conteo,
    inicialSiguienteMes: fechaInicialSiguiente ? fechaInicialSiguiente.toISOString() : null,
  };
}
