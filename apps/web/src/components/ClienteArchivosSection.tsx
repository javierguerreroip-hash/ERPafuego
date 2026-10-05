import { CLIENTE_ARCHIVO_MAX_SIZE_BYTES } from '@erp-afuego/shared';
import { ArchivosSection } from './ArchivosSection';

// Adjuntos del cliente (cédula, RUT, contrato...). Solo tiene sentido para
// un cliente ya guardado, por eso ClientesPage la muestra solo en "Editar".
export function ClienteArchivosSection({ clienteId }: { clienteId: string }) {
  return (
    <ArchivosSection
      basePath={`/clientes/${clienteId}`}
      maxSizeBytes={CLIENTE_ARCHIVO_MAX_SIZE_BYTES}
    />
  );
}
