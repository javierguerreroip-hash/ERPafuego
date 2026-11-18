# 07 · Cartera: cuentas por cobrar y por pagar

**Estado:** vigente · **Verificado contra el código:** 2026-11-18

## Para qué sirve
Saber **quién nos debe** (CxC) y **a quién le debemos** (CxP), con cuánto,
desde cuándo y qué está vencido.

## Reglas
- **CxC (por cobrar): una fila por cada venta.** Valor facturado = valor **después** de impuestos de la venta. Anticipo = el de la Agenda (si existe). **Vencimiento = fecha del evento.** No existe un paso de "facturación" separado.
  **Saldo = valor facturado − anticipo − abonos.**
- **CxP (por pagar): una fila por cada factura** (proveedor + número de factura, agrupando las líneas de compra). Se genera **solo para compras a crédito**. **Saldo = valor de la factura − abonos.**
- **Estado siempre calculado, nunca editable:**
  - **Pagada:** el saldo llegó a 0 (o menos, por sobrepago).
  - **Vencida:** queda saldo y ya pasó la fecha de vencimiento.
  - **Pendiente:** cualquier otro caso.
- **Abonos:** se guardan en un registro propio (fecha, valor y quién lo registró). **Nunca se sobrescribe un "saldo"**: se recalcula sumando abonos.
- **Editar un abono (2026-09-29):** valor o fecha. Funciona igual para CxC y CxP. **Solo el Administrador.** No existe borrar abonos (no se ha pedido).
- Tableros independientes con totales (total y vencido), filtros por cliente/proveedor, estado y rango de fechas, y buscador.
- Exportación a Excel y PDF.
- Una venta con **abonos** no se puede eliminar; una factura con abonos no permite eliminar su compra.

## Quién puede hacer qué
| Rol | Ver | Registrar abono | Editar abono |
|---|---|---|---|
| Administrador | Sí | Sí | **Sí (único)** |
| Operación, Ventas | Sí | Sí | No |
| Consulta | Sí | No | No |

(Esto es lo que hace el código hoy. La documentación vieja decía "solo Administrador"; ver [diferencias por confirmar](diferencias-por-confirmar.md#quién-ve-qué).)

## Criterios de aceptación
- [ ] Una venta de $1.000.000 con anticipo de $300.000 y un abono de $200.000 tiene saldo $500.000 y estado Pendiente.
- [ ] Con la fecha del evento ya pasada y saldo > 0, el estado es Vencida.
- [ ] Una compra de contado no genera cuenta por pagar.
- [ ] Un abono que deja el saldo en 0 pone la fila en Pagada.
- [ ] Un usuario Operación no ve el botón "Editar" en un abono.

## Pruebas que lo vigilan
`apps/api/src/modules/cartera/cartera.calculations.test.ts` (`calcularSaldoPendiente`, `calcularEstadoCartera`).
