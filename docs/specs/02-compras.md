# 02 · Compras

**Estado:** vigente · **Verificado contra el código:** 2026-11-18

## Para qué sirve
Registrar lo que se compra a proveedores. Alimenta tres cosas: el **último
precio de compra** de cada artículo, la fila "Compras" del Inventario/CMV y
las **Cuentas por Pagar** (si la compra fue a crédito).

## Reglas
- Se registra por **factura**: proveedor, fecha, número de factura, condición de pago (contado/crédito) y, si es crédito, fecha de vencimiento. Cada factura lleva **varios ítems** (artículo, cantidad, precio unitario). Cada ítem queda como un registro de compra independiente, **todos guardados juntos o ninguno**.
- Al guardar, el **último precio de compra** del artículo se actualiza solo.
- En el formulario, cada ítem tiene primero un selector de **Categoría** que filtra los artículos (solo ayuda visual; la categoría real es la del artículo). Los selectores y el texto de ayuda muestran la **unidad de medida** del artículo (2026-10-12).
- **No se repite el número de factura para el mismo proveedor** (2026-09-21). Distintos proveedores sí pueden repetir número.
- Las compras **no se editan**. Para corregir, solo el **Administrador** puede **eliminar**, con la contraseña de autorización. Al eliminar: se recalcula el último precio de compra del artículo (la compra más reciente que quede, o $0), y si era la última línea de una factura a crédito se borra su cuenta por pagar. Se **bloquea** si esa factura ya tiene abonos registrados.
- Filtro de período (por defecto, el mes actual) y tarjeta "Total de compras" que suma lo que se ve en pantalla (respeta período y buscador).
- Las compras de categorías de monitoreo (Insumos de Aseo, Utensilios) se registran normal; solo se excluyen de costeo e inventario.

## Quién puede hacer qué
| Rol | Ver | Registrar | Eliminar |
|---|---|---|---|
| Administrador | Sí | Sí | Sí (con contraseña) |
| Operación, Ventas | Sí | Sí | No |
| Consulta | Sí | No | No |

## Criterios de aceptación
- [ ] Registrar una factura de 12 ítems (con artículos repetidos) termina bien y no da "Error interno".
- [ ] Registrar la misma factura dos veces para el mismo proveedor es rechazado.
- [ ] Tras registrar, el último precio de compra del artículo cambia en Artículos.
- [ ] Al elegir un artículo se ve su unidad de medida.
- [ ] Eliminar una compra de una factura con abonos es rechazado con mensaje claro.
- [ ] Un usuario Operación no ve el botón Eliminar.

## Decisiones y su porqué
- **Límite de tiempo de la transacción = 20 s** (2026-09-28). Una factura real de 12 ítems tardaba ~6 s y superaba el límite por defecto (5 s). Se resolvió validando todos los artículos con una sola consulta antes de abrir la transacción.
- El número de factura no es único en la base de datos porque una factura real trae varias filas con el mismo número; la validación corre antes de crear el lote.

## Prueba que la vigila
Manual (flujo de factura de varios ítems). Las fórmulas de promedio de costo están en `evento.calculations.test.ts`.
