import { useState, type ChangeEvent } from 'react';
import * as XLSX from 'xlsx';
import type { RecetaImportResultDTO, RecetaPlantillaDTO } from '@erp-afuego/shared';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { parsearArchivoRecetas, type RecetaParseResult } from '../lib/receta-excel';
import { Modal } from './Modal';

// Carga masiva de recetas desde la plantilla de Excel. El archivo se lee y
// valida en el navegador contra el catálogo actual (menús por nombre,
// artículos por código); solo si todo es válido se habilita "Importar".
// La receta de cada menú que traiga cantidades reemplaza a la anterior.
export function RecetasImportModal({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: () => void;
}) {
  const { token } = useAuth();
  const [parsed, setParsed] = useState<RecetaParseResult | null>(null);
  const [fileName, setFileName] = useState('');
  const [reading, setReading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecetaImportResultDTO | null>(null);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError(null);
    setParsed(null);
    setResult(null);
    setFileName(file.name);
    setReading(true);
    try {
      const [buffer, data] = await Promise.all([
        file.arrayBuffer(),
        apiFetch<RecetaPlantillaDTO>('/opciones-menu/recetas/plantilla', { token }),
      ]);
      const workbook = XLSX.read(buffer, { type: 'array' });
      setParsed(parsearArchivoRecetas(workbook, data));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo leer el archivo');
    } finally {
      setReading(false);
    }
  }

  async function handleImport() {
    if (!parsed || parsed.items.length === 0) return;
    setImporting(true);
    setError(null);
    try {
      const res = await apiFetch<RecetaImportResultDTO>('/opciones-menu/recetas/importar', {
        method: 'POST',
        body: { items: parsed.items },
        token,
      });
      setResult(res);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al importar las recetas');
    } finally {
      setImporting(false);
    }
  }

  const hayErrores = (parsed?.errores.length ?? 0) > 0;

  return (
    <Modal title="Subir recetas desde Excel" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-neutral-600">
          Sube la plantilla de recetas ya diligenciada. La receta de cada menú que tenga cantidades
          reemplaza a la anterior; los menús sin cantidades no se modifican.
        </p>

        {!result && (
          <label className="inline-block cursor-pointer rounded-md border px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
            {reading ? 'Leyendo…' : fileName ? `Cambiar archivo (${fileName})` : 'Elegir archivo .xlsx'}
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              disabled={reading || importing}
              onChange={handleFile}
            />
          </label>
        )}

        {parsed && !result && (
          <div className="rounded-md bg-neutral-50 p-3 text-sm">
            <p>
              <span className="font-medium">{parsed.items.length}</span> ingredientes en{' '}
              <span className="font-medium">{parsed.menusConCantidades}</span> menús listos para
              importar.
            </p>
            {hayErrores && (
              <div className="mt-2">
                <p className="font-medium text-red-600">
                  Corrige estos {parsed.errores.length} errores en el Excel y vuelve a subirlo:
                </p>
                <ul className="mt-1 max-h-48 list-disc space-y-0.5 overflow-y-auto pl-5 text-red-600">
                  {parsed.errores.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
            {!hayErrores && parsed.items.length === 0 && (
              <p className="mt-2 text-amber-700">
                El archivo no tiene cantidades diligenciadas en la columna "Cantidad por porción".
              </p>
            )}
          </div>
        )}

        {result && (
          <p className="rounded-md bg-green-50 p-3 text-sm text-green-700">
            Listo: se actualizaron {result.menusActualizados} menús con {result.ingredientes}{' '}
            ingredientes. El costo de cada menú ya aparece en la tabla.
          </p>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded-md px-4 py-2 text-sm text-neutral-600">
            {result ? 'Cerrar' : 'Cancelar'}
          </button>
          {!result && (
            <button
              onClick={handleImport}
              disabled={importing || !parsed || hayErrores || parsed.items.length === 0}
              className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
            >
              {importing ? 'Importando…' : 'Importar'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
