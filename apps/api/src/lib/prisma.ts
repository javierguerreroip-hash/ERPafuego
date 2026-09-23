import { PrismaClient } from '@prisma/client';
import { getCurrentUserId } from './request-context.js';

const basePrisma = new PrismaClient();

// Interceptor de auditoría (post-lanzamiento, 2026-09-23) — registra
// automáticamente quién crea/edita/elimina un registro en el resto de
// modelos del sistema (Compra, Evento, Negocio, Cotización, Agenda,
// Cartera, Inventario, Turnos, Incapacidades, Gastos, Archivos de
// Cliente...). AuditLog queda afuera (evita el bucle de auditar su
// propia escritura). Los 8 modelos de catálogos/parámetros
// (Articulo, Cliente, Proveedor, OpcionMenu, TaxRate, ParametroNomina,
// DiaFestivo, User) también quedan afuera de ESTE interceptor porque ya
// se auditan a mano desde su propio servicio (`registrarCambio()`,
// Etapa 1) — excluirlos aquí evita que cada cambio en esos 8 quede
// duplicado (una entrada del interceptor + una del llamado manual).
//
// Limitación conocida y aceptada: el log se escribe con `basePrisma`
// (fuera de la transacción de negocio, cuando la operación ocurre
// dentro de un prisma.$transaction) — un extension de Prisma no expone
// el cliente `tx` ambiente desde `$allOperations`, así que no hay forma
// de que esta escritura participe en la misma transacción sin rehacer
// cada `$transaction` del código para pasarlo explícitamente. Si esa
// transacción de negocio falla después de que esta operación puntual ya
// corrió, puede quedar una entrada de auditoría "huérfana" para un
// cambio que en la práctica no se completó. Para el volumen y el tipo
// de negocio de este sistema es un riesgo aceptado (el mismo tipo de
// inconsistencia que ya existía sin auditoría, solo que ahora además
// queda una fila de más en el historial) — no bloquea ni corrompe datos
// reales, y un fallo al guardar el log nunca tumba la operación real.
const EXCLUDED_MODELS = new Set([
  'AuditLog',
  'Articulo',
  'Cliente',
  'Proveedor',
  'OpcionMenu',
  'TaxRate',
  'ParametroNomina',
  'DiaFestivo',
  'User',
]);

const AUDITED_OPERATIONS = new Set(['create', 'update', 'upsert', 'delete']);

// Campos que nunca deben quedar en texto plano dentro del detalle
// guardado (contraseñas, archivos binarios).
const REDACTED_KEYS = new Set(['password', 'passwordHash', 'contenido']);

function sanitizeDetalle(value: unknown): unknown {
  if (Buffer.isBuffer(value)) {
    return `[archivo binario, ${value.length} bytes]`;
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeDetalle);
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = REDACTED_KEYS.has(key) ? '[omitido]' : sanitizeDetalle(val);
    }
    return out;
  }
  return value;
}

function accionDe(operation: string): 'CREATE' | 'UPDATE' | 'DELETE' {
  if (operation === 'delete') return 'DELETE';
  if (operation === 'create') return 'CREATE';
  return 'UPDATE';
}

// El resultado crudo de Prisma no trae nombres de relaciones (eso lo
// arma cada `serialize()` con sus propios `include`) — se intenta con
// los campos descriptivos más comunes entre los modelos de este
// esquema, y si ninguno aplica, se cae a un id corto.
//
// Un puñado de modelos (InventarioInicial, InventarioFinalFisico,
// EventoConsumo, Turno, Incapacidad) no tienen NINGÚN campo propio
// legible — solo guardan el id de a qué pertenecen (artículo, empleado).
// Sin esto, "registroNombre" quedaba como "InventarioInicial a1b2c3d4" y
// el buscador de Auditoría nunca podía encontrarlos por el nombre real
// (ej. buscar "Brotes" no encontraba su Inventario Inicial) — descubierto
// el 2026-09-24 al intentar rastrear un costo unitario. Se resuelve con
// una consulta puntual extra a la tabla relacionada.
const FK_NAME_LOOKUP: Record<string, { fk: string; via: 'articulo' | 'user' }> = {
  InventarioInicial: { fk: 'articuloId', via: 'articulo' },
  InventarioFinalFisico: { fk: 'articuloId', via: 'articulo' },
  EventoConsumo: { fk: 'articuloId', via: 'articulo' },
  Turno: { fk: 'userId', via: 'user' },
  Incapacidad: { fk: 'userId', via: 'user' },
};

async function nombreLegible(
  model: string,
  result: Record<string, unknown> | null | undefined,
): Promise<string> {
  const candidatos = [
    'name',
    'nombreArchivo',
    'clienteNombre',
    'nombreEvento',
    'asunto',
    'facturaNumero',
    'personaContacto',
    'registroNombre',
    'email',
  ];
  for (const campo of candidatos) {
    const valor = result?.[campo];
    if (typeof valor === 'string' && valor.trim()) return valor;
  }

  const lookup = FK_NAME_LOOKUP[model];
  const fkValor = lookup ? result?.[lookup.fk] : undefined;
  if (lookup && typeof fkValor === 'string') {
    try {
      const relacionado =
        lookup.via === 'articulo'
          ? await basePrisma.articulo.findUnique({ where: { id: fkValor }, select: { name: true } })
          : await basePrisma.user.findUnique({ where: { id: fkValor }, select: { name: true } });
      if (relacionado?.name) return relacionado.name;
    } catch {
      // Si esta resolución falla, se cae al id corto de abajo — no vale
      // la pena arriesgar el log de auditoría por esto.
    }
  }

  const id = typeof result?.id === 'string' ? result.id.slice(0, 8) : '';
  return `${model} ${id}`.trim();
}

function extraerPayload(operation: string, args: Record<string, unknown>): unknown {
  if (operation === 'upsert') return args.update ?? args.create;
  return args.data;
}

export const prisma = basePrisma.$extends({
  name: 'audit-log',
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const result = await query(args);

        if (!EXCLUDED_MODELS.has(model) && AUDITED_OPERATIONS.has(operation)) {
          const userId = getCurrentUserId();
          if (userId) {
            const record = result as Record<string, unknown> | null;
            const registroId = typeof record?.id === 'string' ? record.id : 'desconocido';
            const registroNombre = await nombreLegible(model, record);
            const detalle =
              operation === 'delete'
                ? undefined
                : sanitizeDetalle(extraerPayload(operation, args as Record<string, unknown>));

            basePrisma.auditLog
              .create({
                data: {
                  modelo: model,
                  registroId,
                  registroNombre,
                  accion: accionDe(operation),
                  detalle: detalle as never,
                  userId,
                },
              })
              .catch((err) => console.error('Error registrando auditoría:', err));
          }
        }

        return result;
      },
    },
  },
});
