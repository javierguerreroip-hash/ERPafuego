// Opciones de menú de un evento (post-lanzamiento, 2026-10-27). La opción
// "principal" (Evento.opcionMenuId) va siempre primero; el resto, en el orden
// en que se guardaron. Es lo único que Agenda, Cartera y las tablas de Ventas
// necesitan para mostrar el nombre de la venta.
interface EventoConOpciones {
  opcionMenuId: string;
  opcionMenu: { name: string };
  opciones: { opcionMenuId: string; numeroPersonas: number; opcionMenu: { name: string } }[];
}

export function opcionesOrdenadas(evento: EventoConOpciones) {
  if (evento.opciones.length === 0) return [];
  const principal = evento.opciones.filter((o) => o.opcionMenuId === evento.opcionMenuId);
  const resto = evento.opciones.filter((o) => o.opcionMenuId !== evento.opcionMenuId);
  return [...principal, ...resto];
}

// "Chuzo de Res + Paella Mixta" — o el nombre de la opción principal si el
// evento aún no tiene líneas.
export function nombreOpcionesEvento(evento: EventoConOpciones): string {
  const ordenadas = opcionesOrdenadas(evento);
  if (ordenadas.length === 0) return evento.opcionMenu.name;
  return ordenadas.map((o) => o.opcionMenu.name).join(' + ');
}
