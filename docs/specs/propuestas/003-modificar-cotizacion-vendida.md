# Propuesta 003 · Modificar una cotización ya vendida, con trazabilidad completa

**Fecha:** 2026-11-23 · **Módulos:** Cotizaciones, CRM, Ventas, Agenda, Cartera, Dashboard · **Estado:** PROPUESTA — esperando tus decisiones (sección final). No se ha tocado código.

## El problema
Después de vender, el cliente cambia de opinión: agrega un postre, quita el transporte, suma 10 invitados. Hoy:

- La **cotización** (lo que el cliente firmó) se puede editar, pero **no actualiza** el negocio, la venta ni la agenda.
- El **CRM** ("Editar cambios del cliente") sí actualiza negocio, venta y agenda, pero **no toca la cotización**.
- La **logística** (personal, transporte, plato, cubiertos…) solo existe dentro de la cotización: la venta solo conoce el total.
- No queda registro de **qué había antes**, **qué cambió**, **por qué** ni **quién**.

Resultado: el documento, el CRM y la venta pueden decir cosas distintas, y no se puede reconstruir la historia.

## La idea en una frase
**La cotización es la fuente única de lo vendido, y cada modificación después de vender crea una versión nueva** (v1, v2, v3…) que, al guardarse, **actualiza sola** el negocio, la venta y la agenda, dejando guardado el antes, el después, el motivo y quién lo hizo.

## Flujo propuesto

```
Cotización v1 (la que se aprobó al ganar)
        │  el cliente pide cambios
        ▼
"Modificar cotización vendida"  →  se escribe el MOTIVO
        │  se agregan/quitan opciones de menú y logística, se ajustan cantidades y valores
        ▼
Se guarda Cotización v2   ──(una sola operación)──▶  Negocio (valor)
                                                 ──▶  Venta (valor, opciones de menú, personas, impuesto)
                                                 ──▶  Agenda (se mantiene; muestra la logística vendida)
                                                 ──▶  Cartera / Dashboard / Estado de Resultados (se recalculan solos)
```

## Ejemplo con números
**v1 (aprobada):** Paella 40 × $50.000 = $2.000.000 · Personal de servicio 3 × $130.000 = $390.000 · Transporte $120.000 → **Total $2.510.000**.

**El cliente pide:** agregar Quesadilla (40 × $14.000 = $560.000) y quitar el Transporte.

**v2:** $2.510.000 + $560.000 − $120.000 = **$2.950.000** (diferencia **+$440.000**).

| Módulo | Qué muestra tras guardar la v2 |
|---|---|
| **Cotizaciones** | Versión vigente v2, con historial: v1 $2.510.000 → v2 $2.950.000, "+ Quesadilla, − Transporte", motivo, quién y cuándo. Se puede descargar el PDF de cualquier versión. |
| **CRM** | Valor del negocio $2.950.000 y la etiqueta "Cotización v2 (original $2.510.000)". "Ver cotización" abre la vigente y el historial. |
| **Ventas** | Valor $2.950.000, opciones de menú Paella + Quesadilla, etiqueta "v2". Los **consumos y costos reales ya cargados no se tocan** (son lo que de verdad se gastó). |
| **Agenda** | Opciones y valor actualizados; muestra en solo lectura la **logística vendida** de la versión vigente, para que operación sepa qué se prometió. |
| **Cartera** | El saldo por cobrar se recalcula solo (valor nuevo − anticipo − abonos). Si el nuevo valor queda por debajo de lo ya pagado, avisa del sobrepago. |
| **Dashboard / Estado de Resultados** | Toman el valor nuevo automáticamente (leen la venta en vivo). |

## Reglas propuestas

### 1. Cómo se modifica
- Botón **"Modificar cotización vendida"** en Cotizaciones (y acceso directo desde la tarjeta del CRM). Se puede **agregar y quitar opciones de menú y líneas de logística, y cambiar cantidades, valores unitarios, invitados, impuesto y fecha**.
- Es **obligatorio escribir el motivo** del cambio.
- **Cliente y vendedor siguen bloqueados** (trazabilidad comercial).
- Antes de guardar se muestra un **resumen del cambio** (líneas agregadas, quitadas, modificadas y el total antes → después) para confirmar.

### 2. Qué es cada versión
- **v1 = la cotización tal como estaba al marcar "Ganado".** Desde ahí, cada modificación crea la v2, v3…
- Cada versión guarda una **copia completa** del documento (ítems, logística, descripción, condiciones, totales), el **motivo**, **quién** y **cuándo**. Nunca se borra ni se edita una versión anterior.
- **Antes de vender** (negocio "Cotizado") la cotización se sigue editando libremente, sin versiones: es una propuesta en negociación.
- Para las cotizaciones que **ya están vendidas hoy**, la v1 será la que exista en el momento de su primera modificación (queda marcada "reconstruida").

### 3. Qué se actualiza solo al guardar una versión (en una sola operación, o nada)
- **Negocio:** valor antes de impuestos.
- **Venta:** valor antes y después de impuestos, opciones de menú (cada ítem de menú = una opción con su cantidad), personas, impuesto y fecha.
- **Agenda:** fecha y opciones; muestra la logística vendida.
- **No se tocan:** consumos y costos cargados, abonos, anticipo, adjuntos.

### 4. De dónde viene el valor de la venta
- Para ventas que nacen de una cotización, el **valor antes de impuestos = el total de la versión vigente** (ítems + logística), con los valores unitarios negociados escritos en la cotización. Ya no se digita un total aparte: **el valor y el detalle no pueden contradecirse**.
- Los descuentos se escriben como una línea **"Descuento"** con valor negativo (hoy el sistema no permite valores negativos; habría que habilitarlo para esa línea).

### 5. Qué queda en el CRM
- Para negocios que nacen de una cotización, **"Editar cambios del cliente" se reduce a datos operativos: hora y dirección**, y un enlace a **"Modificar cotización vendida"** para todo lo comercial. (Esto reemplaza parte de lo construido en la entrega 3: el CRM dejaría de editar opciones, valor, impuesto y vendedor para esos negocios.)
- Los negocios históricos sin cotización conservan el formulario actual.

### 6. Controles
- **Quién puede:** Administrador, Operación y Ventas.
- **Eventos con fecha pasada** o con **abonos que superen el nuevo valor**: solo el **Administrador** y con advertencia, porque cambian resultados de períodos ya vistos.
- Todo queda también en el **historial de Auditoría** general.

## Criterios de aceptación
- [ ] "Modificar cotización vendida" exige el motivo; sin motivo no guarda.
- [ ] Agregar una opción de menú y quitar una línea de logística crea la v2 y cambia el valor del negocio, de la venta y de la agenda en una sola operación; si algo falla, no cambia nada.
- [ ] El historial muestra v1 y v2 con el detalle del cambio (agregado/quitado/modificado), total antes → después, motivo, usuario y fecha.
- [ ] Se puede descargar el PDF de la v1 y de la v2; el PDF de la vigente dice "Versión 2".
- [ ] El CRM muestra "Cotización v2 (original $X)"; Ventas muestra la versión y el valor vigente.
- [ ] Los consumos y costos de la venta no cambian al modificar la cotización.
- [ ] Cartera recalcula el saldo; si el valor nuevo queda por debajo de lo pagado, avisa.
- [ ] Un usuario de Operación no puede modificar una cotización de un evento con fecha pasada.
- [ ] Para el mismo mes, Total ganado (CRM) = Ventas totales (Dashboard) después de modificar.
- [ ] Cliente y vendedor siguen sin poderse cambiar.

## Entrega por etapas
1. **Versiones e historial** (guardar y ver versiones, motivo, PDF por versión), sin propagar todavía.
2. **Propagación** a negocio, venta y agenda en una sola operación, con controles y avisos de Cartera.
3. **Visibilidad** en CRM, Ventas y Agenda (etiqueta de versión, valor original vs. vigente, logística vendida) y reducción del formulario del CRM.

## Riesgos
- **Cambia una decisión reciente** (valor digitado a mano en el CRM). Se justifica: sin eso, el detalle de la cotización y el valor de la venta pueden separarse.
- **Ventas antiguas con valor distinto al de su cotización:** su v1 reconstruida mostrará una diferencia; conviene revisarlas en la entrega de datos históricos (entrega 4 de la propuesta 001).
- Los **descuentos negativos** exigen un pequeño cambio de validación.

## Decisiones que necesito del dueño
1. ¿El **valor de la venta sale del total de la cotización** (ítems + logística, con los precios negociados) y deja de digitarse aparte? *(Recomiendo que sí.)*
2. ¿Los **descuentos** se escriben como una línea "Descuento" con valor negativo? *(Recomiendo que sí.)*
3. ¿El **CRM se reduce a hora y dirección** para negocios con cotización, y lo comercial se modifica solo desde la cotización? *(Recomiendo que sí.)*
4. ¿El **motivo es obligatorio**? *(Recomiendo que sí.)*
5. ¿Quién puede modificar? **Administrador, Operación y Ventas**, salvo eventos con fecha pasada, que son solo del Administrador. *(Recomiendo así.)*
6. ¿La **Agenda muestra la logística vendida** en solo lectura? *(Recomiendo que sí.)*

## Decisión del dueño
- [ ] Apruebo con las recomendaciones  ·  [ ] Apruebo con cambios: ______________________
