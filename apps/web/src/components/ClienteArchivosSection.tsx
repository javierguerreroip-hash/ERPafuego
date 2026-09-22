import { useEffect, useState } from 'react';
import {
  CLIENTE_ARCHIVO_MAX_SIZE_BYTES,
  type ClienteArchivoContenidoDTO,
  type ClienteArchivoDTO,
} from '@erp-afuego/shared';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';

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

// Adjuntos del cliente (post-lanzamiento, 2026-09-22): cédula, RUT,
// contrato, etc. Solo tiene sentido para un cliente ya guardado (necesita
// un clienteId real), por eso ClientesPage solo la muestra en "Editar",
// no en "Nuevo cliente". El archivo se lee en el navegador y se envía
// como base64 dentro del mismo JSON de la petición — el backend lo
// guarda directo en la base de datos, sin servicio de almacenamiento
// aparte (ver decisión en el README).
export function ClienteArchivosSection({ clienteId }: { clienteId: string }) {
  const { token } = useAuth();
  const [archivos, setArchivos] = useState<ClienteArchivoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setArchivos(
        await apiFetch<ClienteArchivoDTO[]>(`/clientes/${clienteId}/archivos`, { token }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los archivos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  async function handleUpload(file: File) {
    setError(null);
    if (file.size > CLIENTE_ARCHIVO_MAX_SIZE_BYTES) {
      setError('El archivo no puede superar 3 MB');
      return;
    }
    setUploading(true);
    try {
      const contenidoBase64 = await fileToBase64(file);
      await apiFetch(`/clientes/${clienteId}/archivos`, {
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

  async function handleDownload(archivo: ClienteArchivoDTO) {
    setDownloadingId(archivo.id);
    try {
      const data = await apiFetch<ClienteArchivoContenidoDTO>(
        `/clientes/${clienteId}/archivos/${archivo.id}`,
        { token },
      );
      const byteChars = atob(data.contenidoBase64);
      const bytes = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
      const blob = new Blob([bytes], { type: data.mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.nombreArchivo;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al descargar el archivo');
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDelete(archivo: ClienteArchivoDTO) {
    try {
      await apiFetch(`/clientes/${clienteId}/archivos/${archivo.id}`, {
        method: 'DELETE',
        token,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el archivo');
    }
  }

  return (
    <div className="rounded-md border border-neutral-200 p-3">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-sm font-medium text-neutral-700">Archivos adjuntos</p>
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
      </div>
      <p className="mb-2 text-xs text-neutral-400">Máximo 3 MB por archivo.</p>

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
                <button
                  onClick={() => handleDownload(a)}
                  disabled={downloadingId === a.id}
                  className="text-orange-600 hover:underline disabled:opacity-60"
                >
                  {downloadingId === a.id ? 'Descargando…' : 'Descargar'}
                </button>
                <button onClick={() => handleDelete(a)} className="text-red-600 hover:underline">
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
