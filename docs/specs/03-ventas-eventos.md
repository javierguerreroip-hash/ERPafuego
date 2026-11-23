# 03 · Ventas y costos por evento

**Estado:** vigente · **Verificado contra el código:** 2026-11-18 (reglas de costo y opciones de menú verificadas en pruebas y servicio)

## Para qué sirve
Cada venta es un **evento**. Aquí se registra qué se vendió y a quién, y se
cargan los **costos reales** de ese evento para saber su utilidad.
Alimenta Inventario, Dashboard, CMV, Estado de Resultados, Agenda y Cartera.

## Reglas

### La venta
- Datos: fecha, cliente, **opciones de menú**, número de personas, **valor antes de impuestos (se digita a mano, es el total de la venta)**, tasa de impuesto, vendedor.
- **Valor después de impuestos** se calcula con la tasa elegida.
- **Varias opciones de menú por venta (2026-10-27):** una venta puede llevar varias opciones (ej. Chuzo de Res + Paella), cada una con su propio número de personas.
  - Con una sola opción, sus personas son las del evento. Con varias, cada una pide las suyas; **no se obliga a que sumen el total** (un invitado puede comer dos opciones).
  - La **primera es la principal** (`Evento.opcionMenuId`). Agenda, Cartera y Ventas muestran los nombres unidos con " + ".
  - El valor antes de impuestos **no se suma** de los precios de lista.
  - **Ranking de opciones vendidas:** cada opción de un evento cuenta 1 unidad y suma las personas de **su** línea. El "total de personas atendidas" sigue siendo la suma de personas de los eventos, sin duplicar.
  - Ganar un negocio desde el CRM crea **una sola** opción; para agregar más se edita la venta aquí.
- **Editar** una venta (2026-09-29) recalcula el valor después de impuestos. Las ventas anteriores al 2026-09-22 sin vendedor obligan a elegir uno para guardar.
- **Eliminar** una venta (2026-09-10): solo con la contraseña de autorización y **si no tiene abonos en Cartera**. Borra su Agenda y sus consumos; si vino del CRM, ese negocio vuelve a "Cotizado" para poder corregirlo y volver a ganarlo.
- **Filtro de período:** el resumen, el ranking **y la tabla** respetan el mismo período (corregido 2026-10-08; antes la tabla mostraba otros meses).

### Entrega 3 (2026-11-23, construida, pendiente de verificar): Ventas recibe, no crea
- **Ya no existe "Nuevo evento"**: la API rechaza crear una venta directa. Toda venta nace al marcar "Ganado" un negocio del CRM.
- Una venta que **viene de un negocio** ya no se edita en Ventas: el botón dice "Editar en el CRM" y la API rechaza el cambio (409). Sus datos comerciales (cliente, fecha, valor, opciones de menú, personas, impuesto y vendedor) se editan en el CRM, en "Editar cambios del cliente", que actualiza negocio, venta y agenda a la vez.
- Las ventas **históricas sin negocio** siguen pudiéndose editar aquí.
- En Ventas se siguen cargando **consumos y costos**, adjuntos y se ve la utilidad de cada evento.

### Los consumos (costos del evento)
- Se cargan artículo por artículo con cantidad y **costo unitario**. El formulario muestra la **unidad de medida** del artículo (2026-10-12).
- **Costo total y utilidad operacional ($ y %) no se guardan**: se calculan siempre a partir de los consumos.
- No se pueden cargar artículos de **categorías de monitoreo**.

### Regla única de costo unitario
Una sola regla sirve a los consumos de evento, al conteo físico, al inventario inicial sin costo y al costo de los menús (`elegirCostoUnitario`, `apps/api/src/lib/costo-unitario.ts`):

1. **Promedio** entre el último precio de compra (> $0) y el costo del inventario más reciente **que tenga costo** (se ignoran los de $0; primero inicial, luego conteos físicos). Si solo existe uno de los dos, se usa ese **tal cual** (no se promedia contra un $0 que no es un precio real).
2. Si no hay ninguno, el **último costo con el que ya se cargó un consumo** de ese artículo.
3. **$0 solo si no existe ningún dato.**

Los registros ya guardados con $0 **no se corrigen solos**: se quita y se vuelve a agregar el consumo, o se vuelve a guardar el inventario sin costo.

### Adjuntos de la venta (2026-10-05)
- Sección "Detalle de lo vendido": imágenes, PDF u otros archivos, **máx. 3 MB cada uno**, varios por venta, con Ver / Descargar / Eliminar. La misma sección aparece al editar el registro en la **Agenda** para que Logística vea lo vendido sin entrar a Ventas.
- Se guardan en la base de datos y se borran con la venta.

### Vendedor y trazabilidad
- El vendedor viaja: Cotización → Negocio (CRM) → Venta → Agenda. **La venta manda:** si tiene vendedor, en la Agenda es solo lectura (el servidor lo impone) y, si se cambia en Ventas, la Agenda lo sigue. Detalle en [06](06-crm-cotizaciones-agenda.md).

## Quién puede hacer qué
| Rol | Ver (incluye adjuntos) | Crear / editar / consumos / adjuntar | Eliminar venta |
|---|---|---|---|
| Administrador, Operación, Ventas | Sí | Sí | Sí, con contraseña y sin abonos |
| Consulta | Sí | No | No |

## Criterios de aceptación
- [ ] Una venta con dos opciones muestra "A + B" en Ventas, Agenda y Cartera.
- [ ] El ranking cuenta cada opción como 1 y no duplica el total de personas atendidas.
- [ ] Filtrar por noviembre muestra en la tabla solo ventas de noviembre.
- [ ] Un artículo sin compras y con inventario inicial a $X se consume a $X (no a $X/2 ni $0).
- [ ] Un artículo con inventario inicial a $0 y una compra a $P se consume a $P.
- [ ] Un adjunto de más de 3 MB es rechazado.
- [ ] Al editar una venta con vendedor, el cambio aparece en su registro de Agenda.
- [ ] Eliminar una venta con abonos es rechazado; al eliminar una venta del CRM, su negocio vuelve a "Cotizado".

## Pruebas que lo vigilan
`apps/api/src/modules/eventos/evento.calculations.test.ts` (costo total, utilidad, promedio y `elegirCostoUnitario`).

## Pendiente
- Sugerir el valor de la venta a partir de las opciones elegidas (no pedido).
