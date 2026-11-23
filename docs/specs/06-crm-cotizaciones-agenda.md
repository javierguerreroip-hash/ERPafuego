# 06 · CRM, Cotizaciones y Agenda

**Estado:** vigente · **Verificado contra el código:** 2026-11-18

## Para qué sirve
Es el recorrido comercial completo: **se cotiza → se gana o se pierde → se
vende → se programa el evento**. El dato más importante que viaja por todo el
recorrido es el **vendedor**: se elige una vez y no se pierde.

```
Cotización ──crea──▶ Negocio (CRM, "Cotizado") ──ganar──▶ Venta (Evento) ──▶ Agenda
        vendedor ─────────────────────────────────────────────────────────────▶
```

## 1. Cotizaciones

### Reglas
- Genera el documento comercial en **PDF** con el diseño de A Fuego (papel kraft, ilustración, tabla de ítems de menú + logística, subtotal/impuesto/total, condiciones comerciales y firma). Se descarga desde el formulario (vista previa) y desde el listado.
- **Cliente:** se elige entre los ya creados en Clientes (2026-09-21).
- **Opción de menú obligatoria (2026-11-23, propuesta 001 · entrega 1):** la cotización exige **al menos una opción de menú** enlazada y acepta todas las que se necesiten, cada una con su **cantidad (personas o unidades) editable**. Cada ítem guarda el identificador de su opción de menú (no solo el nombre). Al editar una cotización antigua, sus ítems se enlazan solos por nombre; si un menú ya no existe, hay que volver a elegirlo. *Estado: construida, pendiente de verificar.*
- **Vendedor:** se elige entre los vendedores del sistema (mismos del CRM). Es quien firma el PDF y el vendedor del negocio.
- **Ítems de menú:** se eligen de **Opciones de Menú**; al elegir, el valor unitario se llena con el precio (editable por si se negocia). La **logística** (cocinero, transporte, meseros, plato, cubiertos…) es texto libre. `items` y `logistica` se guardan como líneas libres de la cotización, no como catálogo.
- **Total = subtotal de ítems + subtotal de logística + impuesto** (tasa configurable).
- **Descripción (2026-10-10):** bloque "DESCRIPCIÓN" del PDF. Se llena sola con la descripción de las opciones de menú elegidas (con varias, cada una precedida por su nombre). Es editable; una vez escrita a mano deja de sobrescribirse (botón "Restaurar desde Opciones de Menú"). Máximo **10.000 caracteres**. En cotizaciones antiguas sin descripción, el PDF usa los nombres de los ítems.
- **Ilustración:** una por cotización, entre 8 (costillas, hamburguesa, paella, canapés, sándwich, desayuno, mexicano, plato fuerte asado). Son imágenes **cuadradas, en trazo negro sobre fondo transparente**, en `apps/web/public/cotizacion-icons/`. Para agregar una nueva se necesita el archivo en ese formato y registrarla en la lista compartida.
- **Logo:** ocupa todo el espacio disponible del encabezado conservando su proporción y sin tapar otra información.
- **Condiciones comerciales** (editables; texto por defecto): 50 % de anticipo y 50 % el día del evento; menaje biodegradable; consignar a la cuenta de ahorros **Bancolombia No. 43600001941**, a nombre de **Afuego Eventos S.A.S. – NIT 901530094-4** (cambio 2026-10-29, que también actualizó las cotizaciones ya guardadas que traían el texto anterior sin modificar).
- **Editar (2026-10-10):**
  - Mientras el negocio del CRM siga **Cotizado** (o no exista): se edita todo y el negocio se sincroniza en la misma transacción (cliente, nombre del evento = asunto, fecha, valor antes de impuestos = subtotal, vendedor).
  - Si el negocio ya fue **Ganado o Perdido**: solo se edita el **documento** (fecha, lugar, ítems, descripción, condiciones, ilustración). **No** se tocan negocio, venta ni agenda, y el **cliente y el vendedor quedan bloqueados** (el servidor lo exige). Los cambios a una venta ganada se hacen desde el CRM ("editar negocio ganado").

### Criterios de aceptación
- [ ] Elegir "Paella Valenciana" llena el valor con su precio y la descripción con la de Opciones de Menú.
- [ ] Editar una cotización cuyo negocio sigue "Cotizado" cambia también el negocio en el CRM.
- [ ] Editar una cotización cuyo negocio ya está "Ganado" y cambiar el vendedor es rechazado con mensaje claro.
- [ ] Si el guardado falla, el mensaje de error aparece resaltado en rojo y a la vista (2026-11-17).
- [ ] Las 8 ilustraciones aparecen en el selector y se ven completas (no recortadas) en el PDF.
- [ ] El PDF muestra el logo grande sin tapar el número ni la fecha.
- [ ] Una descripción de 5.000 caracteres se guarda; una de más de 10.000 es rechazada con mensaje claro.

### Pruebas
`apps/api/src/modules/cotizaciones/cotizacion.calculations.test.ts` (totales, verificado contra el ejemplo de la plantilla de referencia).

## 2. CRM de Ventas

### Reglas
- Tablero tipo Kanban con 3 etapas: **Cotizado / Ganado / Perdido**.
- **Cliente:** solo se pueden elegir clientes ya creados (2026-09-21). Vendedor: de la lista de vendedores.
- **Solo se edita mientras está "Cotizado".** "Perdido" queda congelado como histórico.
- **Marcar Ganado** pide dos datos que el CRM no captura: **opción de menú** y **número de personas**. Con eso crea, en **una sola transacción**: la Venta (cliente/fecha/valor precargados) y el registro de **Agenda** (vendedor precargado). Si algo falla a medias, no queda nada.
- **Editar un negocio ganado:** actualiza a la vez el negocio, la venta (recalculando el valor después de impuestos con la tarifa ya asignada) y la agenda, en una transacción.
- **Eliminar un negocio** solo si **no** está ganado. Para corregir uno ganado por error: primero se elimina la venta en Ventas (eso lo regresa a "Cotizado") y luego se puede eliminar.
- **Resumen y columnas** respetan el **mismo filtro de período** y se filtran por la **fecha del evento** (corregido 2026-10-29: antes las columnas mostraban negocios de otros meses).
- **Ver cotización (2026-11-23, propuesta 001 · entrega 1):** cada tarjeta del CRM con cotización tiene "Ver cotización", que muestra todo su detalle (ítems, logística, totales, descripción, condiciones) en solo lectura y permite descargar el PDF. Los negocios históricos sin cotización dicen "Sin cotización (histórico)". *Estado: construida, pendiente de verificar.*
- **Eficiencia comercial** = valor ganado ÷ valor total cotizado.
- Un negocio cuyo evento cae en otro mes **no aparece** al filtrar el mes actual.

### Criterios de aceptación
- [ ] Filtrar noviembre no muestra una cotización con fecha de evento en diciembre.
- [ ] Ganar un negocio crea la venta y la agenda con el mismo vendedor del negocio.
- [ ] Una falla al crear la agenda no deja una venta creada sin su negocio ganado.
- [ ] Eliminar un negocio ganado es rechazado con instrucciones.

## 3. Agenda de Eventos

### Reglas
- Vista de **Lista** y de **Calendario** (mensual/semanal) del mismo conjunto de datos. Filtros: fecha, vendedor, estado del anticipo (sin anticipo / saldo pendiente / anticipo pagado).
- Es una **extensión 1 a 1 de la Venta, no una copia:** fecha, cliente, opción(es) de menú, personas y valor antes de impuestos se **leen en vivo** de la venta. Solo se guardan los datos logísticos propios: persona de contacto, teléfono, dirección, hora de servicio, anticipo, observaciones y vendedor.
- **Saldo pendiente = valor antes de impuestos − anticipo** (calculado).
- Se puede crear a mano para una venta que no vino del CRM (selector de "eventos disponibles"; los que ya tienen agenda no aparecen). Al elegirla se **precarga el vendedor de la venta**.
- **Vendedor, trazabilidad completa (2026-10-05):** la **venta manda**. Si la venta tiene vendedor, en la Agenda es **solo lectura** (el servidor lo impone aunque llegue otro valor), y si se cambia el vendedor desde Ventas, la Agenda lo sigue. Solo las ventas antiguas sin vendedor permiten elegirlo a mano.
- **Adjuntos de la venta** visibles y gestionables desde la edición de la Agenda para que Logística vea lo vendido.
- **Notificaciones (2026-09-23):** crear, editar o eliminar un registro genera una notificación dentro de la app para el equipo (sin correo). Campana con contador de no leídas (se consulta cada 30 s), y al abrir el panel se marcan todas como leídas para ese usuario.

### Criterios de aceptación
- [ ] Crear una agenda para una venta con vendedor lo deja precargado y bloqueado.
- [ ] Cambiar la fecha de la venta cambia la fecha en la Agenda sin tocar nada más.
- [ ] Un evento con anticipo igual al valor aparece "anticipo pagado".
- [ ] Crear/editar/eliminar un registro suma una notificación no leída al resto del equipo.

### Prueba
`apps/api/src/modules/agenda/agenda.calculations.test.ts`.

## Quién puede hacer qué
| Rol | Cotizaciones, CRM, Agenda |
|---|---|
| Administrador, Operación, Ventas | Ver y editar |
| Consulta, Cocina/Nómina | No lo ven |

**Vendedor sin cambiar de rol (2026-10-10):** un usuario puede marcarse **"Puede ser seleccionado como vendedor"** en Usuarios → Editar. Aparece en las listas de vendedores de Cotizaciones, CRM, Ventas y Agenda con su nombre y conserva el acceso de su rol (el caso de quien usa un usuario de Operación pero también vende). Los usuarios con rol Ventas o Administrador son vendedores automáticamente.

## Pendiente
- Agregar el campo de opción de menú en la edición de un negocio ganado desde el CRM (hoy se cambia en Ventas).
