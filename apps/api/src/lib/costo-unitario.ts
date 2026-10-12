import { prisma } from './prisma.js';
import { elegirCostoUnitario } from '../modules/eventos/evento.calculations.js';

// Costo unitario de cada artículo, con la misma regla en todo el sistema
// (consumos de evento, conteo físico, inventario inicial sin costo y costo
// de los menús): ver `elegirCostoUnitario`. Hace solo 3 consultas para
// todos los artículos pedidos, sin importar cuántos sean.
export async function costosUnitariosPorArticulo(
  articulos: { id: string; lastPurchasePrice: { toString(): string } }[],
): Promise<Map<string, number>> {
  const ids = articulos.map((a) => a.id);
  if (ids.length === 0) return new Map();

  const [iniciales, finales, consumos] = await Promise.all([
    prisma.inventarioInicial.findMany({
      where: { articuloId: { in: ids } },
      orderBy: { fecha: 'desc' },
      select: { articuloId: true, unitCost: true },
    }),
    prisma.inventarioFinalFisico.findMany({
      where: { articuloId: { in: ids } },
      orderBy: [{ fecha: 'desc' }, { conteo: 'desc' }],
      select: { articuloId: true, unitCost: true },
    }),
    prisma.eventoConsumo.findMany({
      where: { articuloId: { in: ids }, unitCost: { gt: 0 } },
      orderBy: { createdAt: 'desc' },
      select: { articuloId: true, unitCost: true },
    }),
  ]);

  const agrupar = (filas: { articuloId: string; unitCost: { toString(): string } }[]) => {
    const mapa = new Map<string, number[]>();
    for (const f of filas) {
      const lista = mapa.get(f.articuloId) ?? [];
      lista.push(Number(f.unitCost));
      mapa.set(f.articuloId, lista);
    }
    return mapa;
  };
  const inicialesPorArticulo = agrupar(iniciales);
  const finalesPorArticulo = agrupar(finales);
  const consumosPorArticulo = agrupar(consumos);

  return new Map(
    articulos.map((a) => [
      a.id,
      elegirCostoUnitario({
        lastPurchasePrice: Number(a.lastPurchasePrice),
        // Primero los inventarios iniciales (más recientes primero) y luego
        // los conteos físicos de cierre.
        costosInventario: [
          ...(inicialesPorArticulo.get(a.id) ?? []),
          ...(finalesPorArticulo.get(a.id) ?? []),
        ],
        costosConsumo: consumosPorArticulo.get(a.id) ?? [],
      }),
    ]),
  );
}

export async function costoUnitarioDeArticulo(articulo: {
  id: string;
  lastPurchasePrice: { toString(): string };
}): Promise<number> {
  const costos = await costosUnitariosPorArticulo([articulo]);
  return costos.get(articulo.id) ?? 0;
}
