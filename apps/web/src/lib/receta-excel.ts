import * as XLSX from 'xlsx';
import {
  OPCION_MENU_CATEGORIA_LABELS,
  PRICE_TYPE_LABELS,
  type RecetaImportInput,
  type RecetaPlantillaArticuloDTO,
  type RecetaPlantillaDTO,
} from '@erp-afuego/shared';

// Plantilla de Excel de recetas por opción de menú (post-lanzamiento,
// 2026-10-05). Hoja "Receta": una fila por ingrediente de cada menú, con
// la unidad y el costo unitario traídos del catálogo de artículos (mismo
// costo que usa un consumo de evento) mediante fórmulas — la persona solo
// diligencia la columna "Cantidad por porción" (por UNA persona o unidad,
// en la unidad del artículo) y, en las filas en blanco, el código de un
// artículo adicional.

const FILAS_EN_BLANCO_POR_MENU = 3;

const HEADER_MENU = 'Opción de menú';
const HEADER_CODIGO = 'Código artículo';
const HEADER_CANTIDAD = 'Cantidad por porción';

type Cell = { t: 's' | 'n'; v: string | number; f?: string; z?: string } | null;

function s(v: string, f?: string): Cell {
  return f ? { t: 's', v, f } : { t: 's', v };
}

function n(v: number, f?: string, z?: string): Cell {
  const cell: NonNullable<Cell> = { t: 'n', v };
  if (f) cell.f = f;
  if (z) cell.z = z;
  return cell;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function normalizar(texto: string): string {
  return texto.trim().toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

export function descargarPlantillaRecetas(data: RecetaPlantillaDTO) {
  const articulosPorId = new Map(data.articulos.map((a) => [a.id, a]));

  const recetaRows: Cell[][] = [
    [
      s(HEADER_MENU),
      s(HEADER_CODIGO),
      s('Artículo'),
      s('Unidad'),
      s('Costo unitario'),
      s(HEADER_CANTIDAD),
      s('Costo ingrediente'),
      s('Descripción del menú (referencia)'),
    ],
  ];
  const costoPorMenu = new Map<string, number>();

  function pushFila(menuName: string, articulo: RecetaPlantillaArticuloDTO | undefined, cantidad: number | null, descripcion: string) {
    const excelRow = recetaRows.length + 1;
    const costoIngrediente =
      articulo && cantidad ? round2(cantidad * articulo.costoUnitario) : 0;
    costoPorMenu.set(menuName, round2((costoPorMenu.get(menuName) ?? 0) + costoIngrediente));
    recetaRows.push([
      s(menuName),
      articulo ? s(articulo.code) : null,
      s(
        articulo?.name ?? '',
        `IF(B${excelRow}="","",IFERROR(VLOOKUP(B${excelRow},Articulos!$A:$D,2,FALSE),"¿Código no existe?"))`,
      ),
      s(
        articulo?.unit ?? '',
        `IF(B${excelRow}="","",IFERROR(VLOOKUP(B${excelRow},Articulos!$A:$D,3,FALSE),""))`,
      ),
      n(
        articulo?.costoUnitario ?? 0,
        `IF(B${excelRow}="","",IFERROR(VLOOKUP(B${excelRow},Articulos!$A:$D,4,FALSE),""))`,
        '#,##0.00',
      ),
      cantidad ? n(cantidad) : null,
      n(costoIngrediente, `IF(OR(F${excelRow}="",E${excelRow}=""),0,ROUND(F${excelRow}*E${excelRow},2))`, '#,##0.00'),
      descripcion ? s(descripcion) : null,
    ]);
  }

  for (const menu of data.menus) {
    let primera = true;
    const descripcionUnaVez = () => {
      const d = primera ? menu.description : '';
      primera = false;
      return d;
    };
    for (const ing of menu.ingredientes) {
      pushFila(menu.name, articulosPorId.get(ing.articuloId), ing.cantidad, descripcionUnaVez());
    }
    for (const id of menu.sugeridos) {
      pushFila(menu.name, articulosPorId.get(id), null, descripcionUnaVez());
    }
    for (let i = 0; i < FILAS_EN_BLANCO_POR_MENU; i++) {
      pushFila(menu.name, undefined, null, descripcionUnaVez());
    }
  }

  const articulosRows: Cell[][] = [[s('Código'), s('Artículo'), s('Unidad'), s('Costo unitario')]];
  for (const a of data.articulos) {
    articulosRows.push([s(a.code), s(a.name), s(a.unit), n(a.costoUnitario, undefined, '#,##0.00')]);
  }

  const menusRows: Cell[][] = [
    [
      s('Opción de menú'),
      s('Categoría'),
      s('Tipo de precio'),
      s('Precio de venta'),
      s('Costo por porción'),
      s('% costo sobre precio'),
      s('Ingredientes con cantidad'),
    ],
  ];
  data.menus.forEach((menu, i) => {
    const r = i + 2;
    const costo = costoPorMenu.get(menu.name) ?? 0;
    menusRows.push([
      s(menu.name),
      s(OPCION_MENU_CATEGORIA_LABELS[menu.category]),
      s(PRICE_TYPE_LABELS[menu.priceType]),
      n(menu.price, undefined, '#,##0'),
      n(costo, `SUMIF(Receta!$A:$A,A${r},Receta!$G:$G)`, '#,##0.00'),
      n(menu.price > 0 ? costo / menu.price : 0, `IF(D${r}>0,E${r}/D${r},0)`, '0.0%'),
      n(
        menu.ingredientes.length,
        `COUNTIFS(Receta!$A:$A,A${r},Receta!$F:$F,">0")`,
      ),
    ]);
  });

  const instrucciones: Cell[][] = [
    [s('Plantilla de recetas por opción de menú')],
    [s('')],
    [s('1. En la hoja "Receta" diligencia SOLO la columna "Cantidad por porción".')],
    [s('2. La cantidad es la de UNA persona (o una unidad, según el tipo de precio del menú), en la unidad que aparece en la columna "Unidad". Ej.: si la unidad es Kg y se usan 160 g, escribe 0,16.')],
    [s('3. Las filas con la cantidad vacía se ignoran. Las filas ya llenas vienen de la receta guardada; las demás son sugerencias tomadas de la descripción del menú — borra la cantidad o déjala vacía si no aplica.')],
    [s('4. Para agregar un ingrediente que no aparece, usa una fila en blanco del menú: escribe el código del artículo (ver hoja "Articulos") y la cantidad. La unidad y el costo se llenan solos.')],
    [s('5. El costo unitario es el mismo que usa un consumo de evento: promedio entre el último precio de compra y el inventario inicial más reciente. Solo se aceptan artículos de Materia Prima.')],
    [s('6. La hoja "Menus" muestra el costo por porción y el % sobre el precio de venta, calculados con fórmulas.')],
    [s('7. Al subir el archivo en Opciones de Menú, la receta de cada menú que tenga al menos una cantidad REEMPLAZA a la anterior. Los menús sin cantidades no se modifican.')],
  ];

  const workbook = XLSX.utils.book_new();
  const wsInstr = XLSX.utils.aoa_to_sheet(instrucciones);
  wsInstr['!cols'] = [{ wch: 130 }];
  const wsReceta = XLSX.utils.aoa_to_sheet(recetaRows);
  wsReceta['!cols'] = [{ wch: 44 }, { wch: 14 }, { wch: 32 }, { wch: 10 }, { wch: 14 }, { wch: 20 }, { wch: 18 }, { wch: 70 }];
  const wsArticulos = XLSX.utils.aoa_to_sheet(articulosRows);
  wsArticulos['!cols'] = [{ wch: 14 }, { wch: 40 }, { wch: 12 }, { wch: 16 }];
  const wsMenus = XLSX.utils.aoa_to_sheet(menusRows);
  wsMenus['!cols'] = [{ wch: 44 }, { wch: 20 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 20 }, { wch: 24 }];

  XLSX.utils.book_append_sheet(workbook, wsInstr, 'Instrucciones');
  XLSX.utils.book_append_sheet(workbook, wsReceta, 'Receta');
  XLSX.utils.book_append_sheet(workbook, wsArticulos, 'Articulos');
  XLSX.utils.book_append_sheet(workbook, wsMenus, 'Menus');
  XLSX.writeFile(workbook, 'plantilla_recetas_menu.xlsx');
}

export interface RecetaParseResult {
  items: RecetaImportInput['items'];
  menusConCantidades: number;
  errores: string[];
}

// Lee la hoja "Receta" del archivo subido y la valida contra el catálogo
// actual (menús por nombre, artículos por código). Las filas con la
// cantidad vacía se ignoran.
export function parsearArchivoRecetas(
  workbook: XLSX.WorkBook,
  data: RecetaPlantillaDTO,
): RecetaParseResult {
  const errores: string[] = [];
  const sheet = workbook.Sheets['Receta'] ?? workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  if (rows.length === 0 || !(HEADER_MENU in rows[0]) || !(HEADER_CODIGO in rows[0]) || !(HEADER_CANTIDAD in rows[0])) {
    return {
      items: [],
      menusConCantidades: 0,
      errores: ['El archivo no parece la plantilla de recetas (falta la hoja "Receta" o sus columnas).'],
    };
  }

  const menusPorNombre = new Map(data.menus.map((m) => [normalizar(m.name), m]));
  const articulosPorCodigo = new Map(data.articulos.map((a) => [a.code.trim().toUpperCase(), a]));

  const items: RecetaImportInput['items'] = [];
  const vistos = new Set<string>();

  rows.forEach((row, index) => {
    const excelRow = index + 2;
    const cantidadRaw = row[HEADER_CANTIDAD];
    if (cantidadRaw === '' || cantidadRaw === null || cantidadRaw === undefined) return;

    const cantidad =
      typeof cantidadRaw === 'number' ? cantidadRaw : Number(String(cantidadRaw).trim().replace(',', '.'));
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      errores.push(`Fila ${excelRow}: la cantidad "${String(cantidadRaw)}" no es válida (debe ser mayor a 0).`);
      return;
    }

    const menuNombre = String(row[HEADER_MENU] ?? '').trim();
    const menu = menusPorNombre.get(normalizar(menuNombre));
    if (!menu) {
      errores.push(`Fila ${excelRow}: la opción de menú "${menuNombre}" no existe o está inactiva.`);
      return;
    }

    const codigo = String(row[HEADER_CODIGO] ?? '').trim();
    if (!codigo) {
      errores.push(`Fila ${excelRow}: tiene cantidad pero no tiene código de artículo.`);
      return;
    }
    const articulo = articulosPorCodigo.get(codigo.toUpperCase());
    if (!articulo) {
      errores.push(`Fila ${excelRow}: el código "${codigo}" no corresponde a ningún artículo de Materia Prima.`);
      return;
    }

    const clave = `${menu.id}|${articulo.id}`;
    if (vistos.has(clave)) {
      errores.push(`Fila ${excelRow}: "${articulo.name}" está repetido en "${menu.name}".`);
      return;
    }
    vistos.add(clave);
    items.push({ opcionMenuId: menu.id, articuloId: articulo.id, cantidad });
  });

  return {
    items,
    menusConCantidades: new Set(items.map((i) => i.opcionMenuId)).size,
    errores,
  };
}
