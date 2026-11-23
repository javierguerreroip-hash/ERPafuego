# Hoja de ruta: organizar el sistema por especificaciones

**Última actualización:** 2026-11-23

La idea: que el sistema se entienda y se cambie desde el "plano" (`docs/specs/`)
y no desde la memoria de nadie. Se avanza por etapas; cada una termina con algo
que puedes revisar.

## Etapa A · Plano al día — HECHA (2026-11-18)
Fichas 01–08, plantilla, registro de cambios, diferencias por confirmar y regla
de trabajo en `CLAUDE.md`.

## Etapa B · Decisiones pendientes del dueño — EN CURSO
Son decisiones de negocio; sin ellas el plano deja cosas "por confirmar".

| # | Tema | Dónde | Qué hay que decidir |
|---|---|---|---|
| B1 | Quién ve Estado de Resultados, Cartera y nómina | [diferencias](diferencias-por-confirmar.md#quién-ve-qué) | **RESUELTA 2026-11-23:** se deja como está |
| B2 | Dos "CMV" (Dashboard vs Juego de Inventarios) | [propuesta 002](propuestas/002-cmv-dashboard-desde-juego-inventarios.md) | **Decidida:** el Dashboard usa el CMV del Juego. Falta 1 pregunta (costos y utilidad del Dashboard) |
| B3 | Ventas vs CRM no cuadran | [propuesta 001](propuestas/001-todo-negocio-nace-de-una-cotizacion.md) | **Decidida:** todo negocio nace de una cotización. Faltan 5 confirmaciones |
| B4 | Error al guardar cotización | — | Ya desplegado; falta probar y reportar el resultado |

## Etapa C · Criterios de aceptación → pruebas automáticas — SIGUIENTE
Convertir las casillas `[ ]` de las fichas en pruebas que corren solas, para que
un cambio futuro no rompa una regla sin avisar. Por orden de riesgo (primero lo
que toca dinero):

1. **C1 · Inventario y CMV:** conteo #1/#2, plazo de 7 días, inicial del mes siguiente, CMV con conteo #2.
2. **C2 · Costo unitario y costos de evento:** regla única de costo, consumos, utilidad.
3. **C3 · Nómina:** casos de la ficha 05 (entrada autorizada, tope semanal, almuerzo, incapacidad, deducciones). Ya hay una base sólida.
4. **C4 · Cartera y Estado de Resultados:** saldos, estados y utilidad neta.
5. **C5 · Permisos por rol:** que cada ruta rechace a los roles no autorizados (la matriz de la ficha 08).
6. **C6 · Flujo comercial:** cotizar → ganar → vender → agenda con el mismo vendedor.

Cada bloque se entrega con el resultado de las pruebas y, si una prueba descubre
que el sistema **no** cumple la ficha, se te muestra antes de corregir.

## Etapa D · Ciclo normal de cambios — DESDE YA
Cada petición nueva: ficha (o propuesta) → tu aprobación → código + prueba →
registro de cambios. Las propuestas viven en `docs/specs/propuestas/`.

## Etapa E · Limpieza de documentos viejos — AL FINAL
- Quitar del README de la raíz lo desactualizado ("Pendiente antes de producción", decisiones revertidas) y dejarlo solo con arranque/despliegue.
- Marcar `docs/spec_erp_afuego.md` como histórico en su primera línea.
- Mover el detalle de decisiones por fase del README a las fichas.

## Qué NO hace este esfuerzo
- No cambia cómo se ve ni cómo funciona el ERP por sí solo: los cambios de comportamiento se aprueban uno a uno.
- No toca tus datos.
