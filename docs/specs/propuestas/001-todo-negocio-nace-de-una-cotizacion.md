# Propuesta 001 · Todo negocio nace de una cotización

**Fecha:** 2026-11-23 (versión 2, con la decisión del dueño) · **Módulos:** Cotizaciones, CRM, Ventas, Agenda, Dashboard
**Estado:** APROBADA el 2026-11-23 (todas las preguntas respondidas). **Entrega 1: construida, pendiente de verificar.** Entregas 2, 3 y 4: pendientes.
*(Reemplaza la versión 1 con tres opciones; la decisión del dueño fue construir esta arquitectura.)*

## Decisión del dueño (2026-11-23)
> Que todos los negocios inicien desde la cotización hecha en el sistema, con una opción de menú, fecha y vendedor, con trazabilidad por todos los módulos, sin volver a preguntar los mismos datos. El negocio queda automáticamente en el CRM como "Cotizado" y desde ahí cambia de estado. Si pasa a Ganado, viaja a Ventas con la fecha en que se ejecuta el evento (no la fecha en que se ganó) y a la Agenda con toda la información, para que solo falten la hora y la dirección. No debe poderse crear negocios nuevos desde Ventas.

## Para qué sirve
Que cada peso vendido tenga **un solo origen** y un solo camino. Así Ventas del Dashboard, Total ganado del CRM y Agenda **no pueden contradecirse**, porque no hay dos formas de crear lo mismo ni dos copias para editar.

Problema que resuelve (noviembre 2026): Dashboard $42.387.793 vs CRM $40.595.793 (diferencia $1.792.000). Ver [diferencias por confirmar](../diferencias-por-confirmar.md).

## El camino único

```
COTIZACIÓN ──(se guarda)──▶ NEGOCIO en CRM "Cotizado"
 (menú, fecha del evento,        │   (se ve toda la cotización)
  vendedor, cliente, valor)      │
                                 ├──▶ Perdido  (queda como histórico)
                                 │
                                 └──▶ GANADO ──(sin preguntar nada)──▶ VENTA (fecha = fecha del evento)
                                                                  └──▶ AGENDA (solo falta hora y dirección)
```

## Reglas propuestas

### 1. Cotización: la puerta de entrada
- Para guardar una cotización se exige: **cliente, fecha del evento, vendedor, número de personas y al menos una opción de menú** en los ítems. (Hoy ya se exigen cliente, fecha, vendedor y personas; lo nuevo es exigir la opción de menú.)
- Cada ítem de menú guarda **qué opción de menú es** (su identificador), no solo el nombre. Así, si se cambia el nombre de una opción, la cotización sigue enlazada. La logística sigue siendo texto libre.
- La **fecha de la cotización es la fecha del evento** (así se usa hoy).
- Al guardar, el negocio nace en el CRM como **Cotizado**, con el vendedor, el valor antes de impuestos (subtotal de ítems + logística) y la fecha del evento.

### 2. CRM: el centro de control
- **Ya no existe "Nuevo negocio"** en el CRM (solo se llega por cotización).
- Cada negocio muestra **toda la información de su cotización** (ítems, logística, descripción, condiciones, totales, PDF), en solo lectura.
- Desde ahí se cambia de estado: Cotizado → Ganado / Perdido (con las reglas de hoy).
- **Marcar Ganado ya no pregunta nada:** toma de la cotización las opciones de menú, el número de personas, el impuesto y el vendedor. (Excepción: una cotización antigua sin opción de menú enlazada pide **una sola vez** la opción, como hoy.)

### 3. Ventas: recibe, no crea
- **Ya no existe "Nuevo evento"** en Ventas ni se puede crear una venta por la API fuera del flujo de ganar.
- La venta nace con **fecha = fecha del evento** (ya es así hoy; se mantiene) y **valor, cliente, opciones, personas, impuesto y vendedor heredados**.
- En Ventas se siguen cargando **consumos y costos del evento**, adjuntos y se ve la utilidad de cada evento (decisión 2 del dueño: seguir registrándolos para analizar la rentabilidad evento por evento).
- Los **datos comerciales** (cliente, fecha, valor, opciones, personas, impuesto, vendedor) **no se editan en Ventas**: se editan desde el CRM con "Editar negocio ganado", que ya actualiza negocio + venta + agenda en una sola operación. Esto elimina de raíz la causa de que los números se separen.
- Eliminar una venta sigue devolviendo su negocio a "Cotizado" (única vía de corrección).

### 4. Agenda: casi llena
- Al ganar se crea con **todo lo que ya se sabe**: cliente, fecha, opciones, personas, valor, vendedor, **persona de contacto y teléfono tomados del cliente**.
- Lo que el operador debe completar: **hora del servicio y dirección**. El **anticipo** y las **observaciones** siguen disponibles pero no obligatorios (el anticipo alimenta Cartera).

### 5. Cifras que deben cuadrar siempre
- **Total ganado del CRM (un mes) = Ventas totales del Dashboard (ese mes)**, porque toda venta viene de un negocio ganado y se edita en un solo lugar.

### 6. Datos que ya existen (ventas creadas directo, sin negocio)
- Se hará una **corrección única**: por cada venta sin negocio se crea su negocio en etapa Ganado, ligado a ella, con el mismo vendedor, cliente, fecha y valor. Sin cotización asociada (se marcan "sin cotización — histórico"). Las ventas sin vendedor requerirán que se indique uno.
- Antes de ejecutarla se mostrará la **lista exacta** de ventas afectadas, para que la apruebes. No se borra nada.

## Entrega por etapas (cada una se puede probar y publicar sola)
1. **Cotización con opción de menú enlazada** + panel de cotización dentro del CRM. *(no quita nada)*
2. **Ganar sin preguntas** + Agenda precargada con contacto/teléfono. *(no quita nada)*
3. **Cerrar las puertas:** quitar "Nuevo evento" y "Nuevo negocio", restringir edición comercial en Ventas, ampliar "Editar negocio ganado" (opciones, impuesto).
4. **Corrección de datos históricos** y verificación de que las cifras cuadran.

## Criterios de aceptación
- [ ] No se puede guardar una cotización sin al menos una opción de menú.
- [ ] Guardar una cotización crea un negocio "Cotizado" con su vendedor, valor y fecha del evento.
- [ ] En el CRM se ve la cotización completa de cada negocio.
- [ ] Marcar Ganado crea la venta y la agenda **sin hacer ninguna pregunta** y con fecha igual a la fecha del evento (no a la fecha de hoy).
- [ ] La agenda creada trae contacto, teléfono, personas, opciones y vendedor; solo faltan hora y dirección.
- [ ] No existe botón "Nuevo evento" y la API rechaza crear una venta directa.
- [ ] No existe botón "Nuevo negocio" y la API rechaza crearlo.
- [ ] Editar el valor o la fecha de un negocio ganado desde el CRM cambia venta y agenda; Ventas no permite editarlos.
- [ ] Para cualquier mes, Total ganado (CRM) = Ventas totales (Dashboard).
- [ ] Eliminar una venta devuelve su negocio a "Cotizado".
- [ ] Los negocios y ventas históricos siguen visibles y sus totales no cambian de valor tras la corrección.

## Riesgos y cómo se cubren
- **Quitar capacidades:** Operación ya no podrá registrar una venta "rápida" sin cotizar. Es lo que pediste; si un caso real lo necesita, se hace una cotización (que es el registro comercial).
- **Cotizaciones antiguas con ítems de texto libre:** no tienen la opción enlazada; se resuelve con la excepción de "una sola pregunta" al ganar.
- **Datos históricos:** la corrección es solo de **agregar** negocios; se aprueba lista por lista. No toca consumos, costos ni cartera.

## Respuestas del dueño (2026-11-23)
1. **Varias opciones de menú:** la cotización acepta **todas las opciones de menú que sean necesarias, con la cantidad de personas o unidades editable, como hoy.** Cada ítem de menú pasa como una opción de la venta, con la cantidad de su ítem (editable después en el CRM).
2. **CRM sin "Nuevo negocio":** de acuerdo.
3. **Edición comercial de una venta ganada solo desde el CRM:** de acuerdo.
4. **Agenda:** hora y dirección obligatorias; anticipo y observaciones opcionales: de acuerdo.
5. **Ventas históricas sin negocio:** de acuerdo en crear su negocio Ganado histórico, con lista aprobada. *Verificado con la consulta de noviembre: hoy no hay ninguna venta sin negocio en ese mes; se repetirá la consulta para todos los meses antes de la entrega 4.*

## Prueba que la vigilaría
Pruebas unitarias del mapeo cotización → venta/agenda y de la regla "fecha de la venta = fecha del evento", y recorrido manual de los criterios.

## Decisión del dueño
- [x] **Aprobada con las recomendaciones, 2026-11-23.**
