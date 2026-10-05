import { calcularCostoTotal, calcularSubtotalConsumo } from '../eventos/evento.calculations.js';

// Costo de una opción de menú por UNA unidad de venta (una persona o una
// unidad, según su priceType) = Σ cantidad × costo unitario de cada
// ingrediente de su receta. Es exactamente el mismo patrón del costo de un
// consumo de evento (subtotal redondeado por línea, luego suma), para que
// el costo del menú y el costo real cargado al evento sean comparables.
export function calcularCostoMenu(
  ingredientes: { cantidad: number; costoUnitario: number }[],
): number {
  return calcularCostoTotal(
    ingredientes.map((i) => ({ subtotal: calcularSubtotalConsumo(i.cantidad, i.costoUnitario) })),
  );
}

const PALABRAS_VACIAS = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'y', 'con', 'en', 'al', 'a']);

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Quita la "s" final para que "lechugas" y "lechuga" cuenten como la misma
// palabra — suficiente para una sugerencia que el usuario revisa.
function raiz(palabra: string): string {
  return palabra.length > 3 && palabra.endsWith('s') ? palabra.slice(0, -1) : palabra;
}

// Sugiere qué artículos aparecen mencionados en la descripción de un menú:
// un artículo se sugiere cuando TODAS las palabras significativas de su
// nombre están en la descripción (sin importar tildes, mayúsculas ni
// plural). Es solo un punto de partida para la plantilla de Excel — la
// persona que la diligencia decide qué ingredientes y cantidades quedan.
export function sugerirIngredientes(
  descripcion: string,
  articulos: { id: string; name: string }[],
): string[] {
  const palabrasDescripcion = new Set(
    normalizar(descripcion)
      .split(' ')
      .filter(Boolean)
      .map(raiz),
  );
  if (palabrasDescripcion.size === 0) return [];

  const sugeridos: string[] = [];
  for (const articulo of articulos) {
    const palabras = normalizar(articulo.name)
      .split(' ')
      .filter((p) => p && !PALABRAS_VACIAS.has(p))
      .map(raiz);
    if (palabras.length === 0) continue;
    if (palabras.every((p) => palabrasDescripcion.has(p))) {
      sugeridos.push(articulo.id);
    }
  }
  return sugeridos;
}
