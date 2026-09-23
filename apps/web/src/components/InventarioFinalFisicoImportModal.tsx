import { useState, type ChangeEvent } from 'react';
import * as XLSX from 'xlsx';
import { exportToExcel } from '../lib/export';
import { Modal } from './Modal';

// Carga masiva del conteo físico de cierre de período (post-lanzamiento,
// 2026-09-24) — distinto de BulkImportModal (que crea registros nuevos de
// un catálogo): aquí cada fila debe hacer match con un artículo de
// Materia Prima YA existente (por código) y solo trae una cantidad
// contada; el costo unitario siempre se calcula automático (último
// precio de compra), igual que la carga uno por uno cuando se deja ese
// campo vacío.
interface ArticuloParaConteo {
  articuloId: string;
  articuloCodigo: string;
  articuloNombre: string;
}

interface RowResult {
  index: number;
  articuloId?: string;
  displayName: string;
  quantity?: number;
  error?: string;
  status: 'ready' | 'success' | 'error';
}

export function InventarioFinalFisicoImportModal({
  articulos,
  fecha,
  onSaveRow,
  onClose,
  onDone,
}: {
  articulos: ArticuloParaConteo[];
  fecha: string;
  onSaveRow: (articuloId: string, quantity: number) => Promise<unknown>;
  onClose: () => void;
  onDone: () => void;
}) {
  const [rows, setRows] = useState<RowResult[]>([]);
  const [importing, setImporting] = useState(false);
  const [importedAny, setImportedAny] = useState(false);

  function downloadTemplate() {
    exportToExcel(
      'plantilla_conteo_fisico_materia_prima',
      'Conteo físico',
      [
        { key: 'codigo', label: 'Código' },
        { key: 'nombre', label: 'Artículo' },
        { key: 'cantidad', label: 'Cantidad contada' },
      ],
      articulos.map((a) => ({ codigo: a.articuloCodigo, nombre: a.articuloNombre, cantidad: '' })),
    );
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const binaryStr = loadEvent.target?.result;
      if (!binaryStr) return;
      const workbook = XLSX.read(binaryStr, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
        defval: '',
        raw: false,
      });

      const parsed: RowResult[] = [];
      rawRows.forEach((rawRow, index) => {
        const codigo = String(rawRow['Código'] ?? '').trim();
        const cantidadTexto = String(rawRow['Cantidad contada'] ?? '').trim();
        // Fila sin cantidad diligenciada todavía — se omite en vez de
        // contarla como error, porque no siempre se cuenta todo el
        // catálogo en una sola sesión.
        if (!cantidadTexto) return;

        const articulo = articulos.find(
          (a) => a.articuloCodigo.toLowerCase() === codigo.toLowerCase(),
        );
        const displayName = articulo?.articuloNombre ?? (codigo || `Fila ${index + 2}`);
        const quantity = Number(cantidadTexto);

        if (!articulo) {
          parsed.push({
            index,
            displayName,
            error: `No se encontró un artículo de materia prima con el código "${codigo}"`,
            status: 'error',
          });
          return;
        }
        if (!Number.isFinite(quantity) || quantity < 0) {
          parsed.push({
            index,
            displayName,
            error: 'La cantidad contada no es un número válido',
            status: 'error',
          });
          return;
        }
        parsed.push({ index, articuloId: articulo.articuloId, displayName, quantity, status: 'ready' });
      });
      setRows(parsed);
      setImportedAny(false);
    };
    reader.readAsBinaryString(file);
  }

  const readyCount = rows.filter((r) => r.status === 'ready').length;

  async function handleImport() {
    setImporting(true);
    const updated = [...rows];
    for (let i = 0; i < updated.length; i++) {
      if (updated[i].status !== 'ready') continue;
      try {
        await onSaveRow(updated[i].articuloId as string, updated[i].quantity as number);
        updated[i] = { ...updated[i], status: 'success' };
        setImportedAny(true);
      } catch (err) {
        updated[i] = {
          ...updated[i],
          status: 'error',
          error: err instanceof Error ? err.message : 'Error al guardar',
        };
      }
      setRows([...updated]);
    }
    setImporting(false);
  }

  return (
    <Modal
      title="Cargar conteo físico desde Excel"
      onClose={() => (importedAny ? onDone() : onClose())}
    >
      <div className="space-y-3">
        <p className="text-sm text-neutral-600">
          Descarga la plantilla con todos los artículos de materia prima, diligencia la columna
          "Cantidad contada" con el conteo físico de cierre (
          {new Date(`${fecha}T00:00:00`).toLocaleDateString('es-CO')}) y vuelve a cargarla aquí. El
          costo unitario se calcula automático con el último precio de compra.
        </p>
        <button
          type="button"
          onClick={downloadTemplate}
          className="text-sm text-orange-600 hover:underline"
        >
          Descargar plantilla (.xlsx)
        </button>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFile}
          className="block w-full text-sm text-neutral-600"
        />

        {rows.length > 0 && (
          <>
            <div className="max-h-64 overflow-y-auto rounded-md border">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-500">
                  <tr>
                    <th className="px-2 py-1">Fila</th>
                    <th className="px-2 py-1">Artículo</th>
                    <th className="px-2 py-1">Cantidad</th>
                    <th className="px-2 py-1">Estado</th>
                    <th className="px-2 py-1">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.index} className="border-t">
                      <td className="px-2 py-1">{row.index + 2}</td>
                      <td className="px-2 py-1">{row.displayName}</td>
                      <td className="px-2 py-1">{row.quantity ?? ''}</td>
                      <td className="px-2 py-1">
                        {row.status === 'success' ? (
                          <span className="text-green-600">Importado</span>
                        ) : row.status === 'error' ? (
                          <span className="text-red-600">Error</span>
                        ) : (
                          <span className="text-neutral-400">Listo</span>
                        )}
                      </td>
                      <td className="px-2 py-1 text-neutral-500">{row.error ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-neutral-500">
              {readyCount} de {rows.length} fila(s) listas para importar.
            </p>
          </>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={() => (importedAny ? onDone() : onClose())}
            className="rounded-md px-4 py-2 text-sm text-neutral-600"
          >
            {importedAny ? 'Listo' : 'Cancelar'}
          </button>
          <button
            onClick={handleImport}
            disabled={importing || readyCount === 0}
            className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
          >
            {importing ? 'Importando…' : `Importar ${readyCount} fila(s)`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
