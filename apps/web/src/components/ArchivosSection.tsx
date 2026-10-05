import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface ArchivoItem {
  id: string;
  nombreArchivo: string;
  mimeType: string;
  size: number;
  uploadedByName: string;
  createdAt: string;
}

interface ArchivoContenido extends ArchivoItem {
  contenidoBase64: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = () => reject(reader.error ?? new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

function esVisibleEnNavegador(mimeType: string): boolean {
  return mimeType.startsWith('image/') || mimeType === 'application/pdf';
}

// Sección de archivos adjuntos reutilizable (Cliente, Venta...). `basePath`
// es la ruta del recurso dueño, ej. "/eventos/<id>" — la sección usa
// `${basePath}/archivos`. El archivo se lee en el navegador y viaja como
// base64 dentro del JSON; el backend lo guarda en la base de datos.
export function ArchivosSection({
  basePath,
  maxSizeBytes,
  readOnly = false,
  title = 'Archivos adjuntos',
}: {
  basePath: string;
  maxSizeBytes: number;
  readOnly?: boolean;
  title?: string;
}) {
  const { token } = useAuth();
  const [archivos, setArchivos] = useState<ArchivoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setArchivos(await apiFetch<ArchivoItem[]>(`${basePath}/archivos`, { token }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los archivos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basePath]);

  async function handleUpload(file: File) {
    setError(null);
    if (file.size > maxSizeBytes) {
      setError(`El archivo no puede superar ${Math.round(maxSizeBytes / (1024 * 1024))} MB`);
      return;
    }
    setUploading(true);
    try {
      const contenidoBase64 = await fileToBase64(file);
      await apiFetch(`${basePath}/archivos`, {
        method: 'POST',
        body: {
          nombreArchivo: file.name,
          mimeType: file.type || 'application/octet-stream',
          contenidoBase64,
        },
        token,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  }

  async function fetchBlob(archivo: ArchivoItem): Promise<{ blob: Blob; nombre: string }> {
    const data = await apiFetch<ArchivoContenido>(`${basePath}/archivos/${archivo.id}`, { token });
    const byteChars = atob(data.contenidoBase64);
    const bytes = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
    return { blob: new Blob([bytes], { type: data.mimeType }), nombre: data.nombreArchivo };
  }

  async function handleDownload(archivo: ArchivoItem) {
    setBusyId(archivo.id);
    try {
      const { blob, nombre } = await fetchBlob(archivo);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = nombre;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al descargar el archivo');
    } finally {
      setBusyId(null);
    }
  }

  // La pestaña se abre ANTES de pedir el archivo (dentro del clic) para que
  // el navegador no la bloquee como ventana emergente.
  async function handleView(archivo: ArchivoItem) {
    const ventana = window.open('', '_blank');
    setBusyId(archivo.id);
    try {
      const { blob } = await fetchBlob(archivo);
      const url = URL.createObjectURL(blob);
      if (ventana) {
        ventana.location.href = url;
      } else {
        window.open(url, '_blank');
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      ventana?.close();
      setError(err instanceof Error ? err.message : 'Error al abrir el archivo');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(archivo: ArchivoItem) {
    try {
      await apiFetch(`${basePath}/archivos/${archivo.id}`, { method: 'DELETE', token });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el archivo');
    }
  }

  return (
    <div className="rounded-md border border-neutral-200 p-3">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-sm font-medium text-neutral-700">{title}</p>
        {!readOnly && (
          <label className="cursor-pointer text-sm text-orange-600 hover:underline">
            {uploading ? 'Subiendo…' : '+ Subir archivo'}
            <input
              type="file"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) handleUpload(file);
              }}
            />
          </label>
        )}
      </div>
      {!readOnly && (
        <p className="mb-2 text-xs text-neutral-400">
          Imágenes, PDF u otros archivos. Máximo {Math.round(maxSizeBytes / (1024 * 1024))} MB por
          archivo.
        </p>
      )}

      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-400">Cargando…</p>
      ) : archivos.length === 0 ? (
        <p className="text-sm text-neutral-400">Sin archivos adjuntos todavía.</p>
      ) : (
        <ul className="space-y-1">
          {archivos.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between rounded px-2 py-1 text-sm hover:bg-neutral-50"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-neutral-800">{a.nombreArchivo}</p>
                <p className="text-xs text-neutral-400">
                  {formatBytes(a.size)} · {a.uploadedByName} ·{' '}
                  {new Date(a.createdAt).toLocaleDateString('es-CO')}
                </p>
              </div>
              <div className="flex shrink-0 gap-3 pl-2">
                {esVisibleEnNavegador(a.mimeType) && (
                  <button
                    onClick={() => handleView(a)}
                    disabled={busyId === a.id}
                    className="text-orange-600 hover:underline disabled:opacity-60"
                  >
                    Ver
                  </button>
                )}
                <button
                  onClick={() => handleDownload(a)}
                  disabled={busyId === a.id}
                  className="text-orange-600 hover:underline disabled:opacity-60"
                >
                  {busyId === a.id ? 'Cargando…' : 'Descargar'}
                </button>
                {!readOnly && (
                  <button onClick={() => handleDelete(a)} className="text-red-600 hover:underline">
                    Eliminar
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
