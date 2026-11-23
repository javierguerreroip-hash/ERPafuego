# Propuesta 002 · El CMV del Dashboard sale del Juego de Inventarios

**Fecha:** 2026-11-23 · **Módulos:** Dashboard, Juego de Inventarios, Ventas · **Estado:** APROBADA el 2026-11-23. Pendiente de construir.

## Decisión del dueño (2026-11-23)
> El CMV del Dashboard debe salir del Juego de Inventarios. Se siguen registrando gastos y consumos de cada evento para analizar la rentabilidad y el resultado de cada evento por separado.

## Para qué sirve
Que haya **un solo CMV** en todo el sistema: el contable (inicial + compras − conteo físico #2). Y que los consumos por evento sigan sirviendo para lo que sí sirven: la **rentabilidad de cada evento**.

## Hallazgo que condiciona la regla (verificado en el código 2026-11-23)
El Juego de Inventarios calcula el CMV de un período con el **inventario inicial del primer día** y el **conteo físico #2 del último día**. Si el período **aún no tiene conteo #2** (como el mes en curso, o un rango a mitad de mes), el sistema toma el final como **$0** y el CMV queda **inflado** (sería casi todo el inventario + las compras del mes). Pasarlo tal cual al Dashboard mostraría una cifra engañosa en el mes actual.

## Reglas propuestas
1. **Tarjeta "CMV (materia prima)" del Dashboard** = CMV del Juego de Inventarios del mismo período, en $ y % sobre la venta.
2. **Si el período no tiene conteo #2 del último día**, la tarjeta dice **"Pendiente de cierre de inventario"** en vez de mostrar una cifra falsa, y muestra debajo como referencia: *"Consumos de materia prima cargados en eventos: $X"*.
3. **Costos totales y Utilidad operativa del Dashboard** siguen calculándose con los **consumos por evento** (todas las categorías), porque son la herramienta para analizar cada evento. Se rotulan *"según consumos de eventos"* para no confundirlos con el resultado contable.
4. **Estado de Resultados** no cambia: sigue usando CMV real del Juego de Inventarios (es el resultado oficial del negocio).
5. En **Ventas**, la utilidad de cada evento sigue siendo ventas − consumos del evento (sin cambios).

## Criterios de aceptación
- [ ] Para un mes con conteo #2 al cierre, el CMV del Dashboard es igual al del Juego de Inventarios y al del Estado de Resultados.
- [ ] Para el mes en curso sin conteo #2, la tarjeta muestra "Pendiente de cierre" y el valor de referencia de consumos de eventos.
- [ ] Costos totales y Utilidad operativa del Dashboard no cambian de valor respecto a hoy.
- [ ] La utilidad de cada evento en Ventas no cambia.

## Respuesta del dueño (2026-11-23)
1. Costos totales y Utilidad operativa del Dashboard siguen con los consumos de eventos, rotulados: **de acuerdo**.

## Prueba que la vigilaría
Prueba unitaria de la regla "con/sin conteo #2" y comparación manual de un mes cerrado contra el Juego de Inventarios.

## Decisión del dueño
- [x] **Aprobada con la recomendación, 2026-11-23.**
