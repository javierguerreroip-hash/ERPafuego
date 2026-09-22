import { AsyncLocalStorage } from 'node:async_hooks';

interface RequestContext {
  userId: string;
}

// Permite que el interceptor de auditoría de Prisma (lib/prisma.ts) sepa
// "quién" está haciendo la operación sin tener que pasar el userId a
// mano por cada función de cada servicio — se guarda una sola vez, en
// requireAuth, apenas se valida el token, y cualquier llamada a Prisma
// que ocurra durante el resto de esa petición (incluida dentro de una
// transacción) puede leerlo.
const storage = new AsyncLocalStorage<RequestContext>();

export function runWithRequestContext<T>(context: RequestContext, fn: () => T): T {
  return storage.run(context, fn);
}

export function getCurrentUserId(): string | null {
  return storage.getStore()?.userId ?? null;
}
