import { useState, type ChangeEvent } from 'react';
import * as XLSX from 'xlsx';
import { Modal } from './Modal';

// Tipo estructural mínimo (en vez de importar ZodType desde "zod", que no
// es una dependencia directa de apps/web) — solo necesitamos safeParse,
// que es lo que exponen los schemas de @erp-afuego/shared.
interface SchemaLike<T> {
  safeParse: (
    data: unknown,
  ) => { success: true; data: T } | { success: false; error: { issues: { message?: string }[] } };
}

// Carga masiva genérica desde Excel para los catálogos del Módulo 1
// (artículos, clientes, proveedores). Cada fila se valida con el mismo
// schema Zod que usa el formulario individual, y se envía una por una al
// mismo endpoint POST que usa "Nuevo artículo/cliente/proveedor" — así no
// hay lógica de validación duplicada entre la carga manual y la masiva.
export interface ImportColumn {
  header: string;
  field: string;
  parse?: (raw: string) => unknown;
}

interface RowResult {
  index: number;
  data?: Record<string, unknown>;
  displayName: string;
  error?: string;
  status: 'ready' | 'success' | 'error';
}

interface Props<T> {
  title: string;
  columns: ImportColumn[];
  schema: SchemaLike<T>;
  onCreateOne: (data: T) => Promise<unknown>;
  onClose: () => void;
  onDone: () => void;
}

export function BulkImportModal<T>({
  title,
  columns,
  schema,
  onCreateOne,
  onClose,
  onDone,
}: Props<T>) {
  const [rows, setRows] = useState<RowResult[]>([]);
  const [importing, setImporting] = useState(false);
  const [importedAny, setImportedAny] = useState(false);

  function downloadTemplate() {
    const worksheet = XLSX.utils.aoa_to_sheet([columns.map((c) => c.header)]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla');
    XLSX.writeFile(workbook, 'plantilla_carga_masiva.xlsx');
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

      const parsed: RowResult[] = rawRows.map((rawRow, index) => {
        const candidate: Record<string, unknown> = {};
        for (const col of columns) {
          const cellText = String(rawRow[col.header] ?? '').trim();
          candidate[col.field] = col.parse ? col.parse(cellText) : cellText;
        }
        const displayName =
          typeof candidate.name === 'string' && candidate.name ? candidate.name : `Fila ${index + 2}`;
        const result = schema.safeParse(candidate);
        if (result.success) {
          return { index, data: candidate, displayName, status: 'ready' };
        }
        return {
          index,
          displayName,
          error: result.error.issues[0]?.message ?? 'Datos inválidos',
          status: 'error',
        };
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
        await onCreateOne(updated[i].data as T);
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
    <Modal title={title} onClose={() => (importedAny ? onDone() : onClose())}>
      <div className="space-y-3">
        <p className="text-sm text-neutral-600">
          Sube un archivo Excel (.xlsx) cuya primera fila tenga exactamente estas columnas:{' '}
          <span className="font-medium">{columns.map((c) => c.header).join(', ')}</span>.
        </p>
        <button
          type="button"
          onClick={downloadTemplate}
          className="text-sm text-orange-600 hover:underline"
        >
          Descargar plantilla vacía (.xlsx)
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
                    <th className="px-2 py-1">Nombre</th>
                    <th className="px-2 py-1">Estado</th>
                    <th className="px-2 py-1">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.index} className="border-t">
                      <td className="px-2 py-1">{row.index + 2}</td>
                      <td className="px-2 py-1">{row.displayName}</td>
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
