# Especificaciones del ERP A Fuego (spec-driven)

Este directorio es **el plano del sistema**. Describe qué hace cada módulo,
con qué reglas y cómo sabemos que está bien. El código tiene que obedecer
este plano, no al revés.

## Cómo se relaciona con los otros documentos

| Documento | Qué es | Estado |
|---|---|---|
| `docs/spec_erp_afuego.md` | Especificación **original** (el "prompt maestro" del lanzamiento) | Histórica. No se edita; cuando algo cambió, manda la ficha de aquí. |
| `docs/plan_fases.md` | Plan de construcción por fases (0 a 13) | Histórico. |
| **`docs/specs/*.md`** | **Especificación vigente**, por módulo | **Fuente de verdad desde 2026-11-18.** |
| `README.md` (raíz) | Instrucciones de arranque/despliegue y bitácora detallada de decisiones por fase | Se conserva como bitácora; no es la fuente de verdad. |
| `CLAUDE.md` | Reglas permanentes para trabajar con Claude Code | Vigente. |

Si una ficha de aquí contradice al README o a la especificación original,
**gana la ficha** (siempre que esté marcada como verificada contra el código).

## Índice de fichas

| # | Ficha | Cubre |
|---|---|---|
| 01 | [Maestros](01-maestros.md) | Artículos, Opciones de Menú y recetas, Clientes, Proveedores, Parámetros Fiscales |
| 02 | [Compras](02-compras.md) | Registro de compras, eliminación, facturas |
| 03 | [Ventas y costos por evento](03-ventas-eventos.md) | Eventos, varias opciones de menú, consumos, regla de costo unitario, adjuntos, eliminación |
| 04 | [Inventario, CMV y resultados](04-inventario-cmv-resultados.md) | Inventario, conteos #1/#2 y plazo de cierre, Juego de Inventarios, Dashboard, Gastos Administrativos, Estado de Resultados |
| 05 | [Nómina](05-nomina.md) | Turnos, recargos, topes de horas, hora de entrada autorizada, almuerzo, incapacidades, deducciones |
| 06 | [CRM, Cotizaciones y Agenda](06-crm-cotizaciones-agenda.md) | Flujo comercial completo y trazabilidad del vendedor |
| 07 | [Cartera](07-cartera.md) | Cuentas por cobrar y por pagar, abonos |
| 08 | [Transversal](08-transversal.md) | Roles y permisos, auditoría, notificaciones, usuarios, búsqueda, celular, exportación |
| — | [Registro de cambios](registro-cambios.md) | Qué se cambió y cuándo desde el lanzamiento |
| — | [Diferencias por confirmar](diferencias-por-confirmar.md) | Cosas donde la documentación vieja y el código no coinciden |
| — | [Plantilla](plantilla.md) | Formato para toda ficha o cambio nuevo |

## Cómo trabajamos a partir de ahora

1. **Pides un cambio** en palabras de negocio.
2. **Se actualiza primero la ficha** (qué debe pasar y cómo sabremos que está bien). Tú la revisas.
3. **Después se cambia el código** y se corre la prueba que vigila esa regla.
4. **Se anota** en el [registro de cambios](registro-cambios.md).

Excepción: correcciones evidentes de un error (algo que no guarda, un
texto mal escrito) se arreglan directo y se anotan después.

## Qué significa cada marca en las fichas

- **Verificado** — la regla se contrastó con el código el 2026-11-18. Alcance honesto: se revisaron las constantes, los permisos por ruta, los servicios y las pruebas existentes. **No** se ejecutó cada criterio de aceptación en el sistema en funcionamiento; las casillas `[ ]` de las fichas son la lista para hacerlo.
- **Por confirmar** — la regla viene de la bitácora (README) pero el código o tú deben confirmarla.
- **Pendiente** — idea o carencia conocida que aún no se construye.

## Reglas permanentes (vienen de `CLAUDE.md`)

1. Orden de dependencia entre módulos: no se adelanta un módulo que dependa de datos que aún no existen.
2. **Dato derivado = solo lectura.** Lo que viene de otro módulo se calcula y nunca se digita en el destino.
3. **Trazabilidad:** cada compra, consumo y ajuste queda ligado a su origen (evento, compra, período).
4. Todo en **pesos colombianos (COP)**; donde se pide "valor y %", se muestran los dos.
5. Los porcentajes legales de nómina son **parámetros configurables**, nunca valores fijos en el código.
6. Toda fórmula financiera tiene pruebas automáticas.
