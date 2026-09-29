import type { AbonoInput } from '@erp-afuego/shared';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/error.middleware.js';

// Editar un abono (post-lanzamiento, 2026-09-29) — pedido para poder
// corregir un valor o una fecha mal digitados, sin tener que borrar y
// volver a crear nada (no existe borrado de abonos). El modelo Abono es
// el mismo para CxC y CxP (columna "tipo"), así que un solo endpoint
// alcanza para los dos — solo Administrador puede editarlo (ver
// cartera.routes.ts), a diferencia de registrar un abono nuevo, que
// sigue abierto a Administrador/Operación/Ventas.
export async function updateAbono(abonoId: string, input: AbonoInput) {
  const abono = await prisma.abono.findUnique({ where: { id: abonoId } });
  if (!abono) {
    throw new HttpError(404, 'Abono no encontrado');
  }

  await prisma.abono.update({
    where: { id: abonoId },
    data: { valor: input.valor, fecha: new Date(input.fecha) },
  });
}
