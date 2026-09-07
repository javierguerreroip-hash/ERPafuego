# Plan de fases — ERP A Fuego Catering (para Claude Code)

Cómo usar este plan: copia el bloque de **una fase** en Claude Code como
mensaje, deja que la construya, revísala, y solo entonces pasa a la
siguiente. No le pegues todo el plan de una vez.

---

## FASE 0 — Setup del proyecto

**Prompt para Claude Code:**
> Lee `CLAUDE.md` y `docs/spec_erp_afuego.md` completos. Inicializa el
> monorepo con el stack definido en `CLAUDE.md` (backend, frontend,
> paquete compartido). Configura PostgreSQL, el ORM, linter, formateo,
> variables de entorno de ejemplo (`.env.example`), y un script para
> levantar todo en local con un solo comando. No implementes módulos
> todavía — solo el esqueleto del proyecto, la conexión a base de datos
> funcionando y una página de login básica con roles.

**Criterio de aceptación:** el proyecto corre local, la base de datos
conecta, existe login con roles (aunque sea simple), y la estructura de
carpetas coincide con `CLAUDE.md`.

---

## FASE 1 — Maestros: artículos/servicios y terceros

**Prompt para Claude Code:**
> Implementa el Módulo 1 según `docs/spec_erp_afuego.md`. Crea el
> modelo de datos para: artículos/servicios (con las 6 categorías),
> clientes y proveedores. Construye las pantallas CRUD correspondientes.
> Carga como datos semilla (seed) el catálogo completo del Anexo A del
> documento (todas las opciones de la Carta 2026, con su categoría,
> descripción y precio). Deja el campo "último precio de compra" listo
> para actualizarse desde el Módulo 2, pero como no existe todavía,
> déjalo en null o 0.

**Criterio de aceptación:** puedo crear/editar/desactivar artículos por
categoría, clientes y proveedores desde la interfaz; el catálogo de la
Carta 2026 aparece precargado.

---

## FASE 2 — Registro de compras

**Prompt para Claude Code:**
> Implementa el Módulo 2. Registro de compras ítem por ítem, vinculado
> a artículos y proveedores del Módulo 1. Cada compra debe registrarse
> asociada a una factura del proveedor: número de factura, condición de
> pago (contado/crédito) y, si es a crédito, fecha de vencimiento del
> pago — estos campos serán consumidos más adelante por el módulo de
> Cartera (Cuentas por Pagar), así que déjalos bien estructurados desde
> ya. Al guardar una compra, actualiza automáticamente el "último
> precio de compra" del artículo y guarda el histórico de precios (no
> lo sobrescribas, agrégalo a una tabla de historial). Muestra ese
> histórico en la ficha del artículo.

**Criterio de aceptación:** registro una compra y veo el precio
actualizado en el Módulo 1, con el histórico completo disponible.

---

## FASE 3 — Ventas y costos por evento

**Prompt para Claude Code:**
> Implementa el Módulo 3 según la especificación (campos, doble clic
> para cargar consumos, y las fórmulas de costo total y utilidad
> operacional en $ y %). Los consumos cargados por evento deben quedar
> disponibles para que los consuman los módulos de Inventario y Estado
> de Resultados más adelante (déjalo desacoplado, con eventos o
> consultas reutilizables). Incluye pruebas unitarias de las fórmulas.

**Criterio de aceptación:** creo un evento, le cargo consumos con doble
clic, y veo el costo y la utilidad calculados correctamente en $ y %.

---

## FASE 4 — Inventario en tiempo real

**Prompt para Claude Code:**
> Implementa el Módulo 4: inventario inicial (manual), compras
> (automático desde Módulo 2), costos y consumos (automático desde
> Módulo 3), e inventario final calculado. Filtro por rango de fechas,
> vista por artículo y consolidada.

**Criterio de aceptación:** al filtrar un período veo las 4 variables
correctas y el inventario final cuadra con la fórmula.

---

## FASE 5 — Dashboard principal

**Prompt para Claude Code:**
> Construye la pantalla principal con los KPIs y gráficos descritos en
> la especificación (ventas totales, costos totales, utilidad
> operativa, CMV de materia prima, mano de obra tercerizada, transporte,
> servicios artísticos — todos en $ y %), filtrable por período,
> alimentado por los módulos 3 y 1.

**Criterio de aceptación:** el dashboard refleja en tiempo real los
datos cargados en los módulos anteriores.

---

## FASE 6 — Gastos administrativos

**Prompt para Claude Code:**
> Implementa el módulo de gastos administrativos con los rubros fijos
> listados en la especificación, registro mensual, y disponibilidad de
> esos datos para el Estado de Resultados.

**Criterio de aceptación:** registro los gastos de un mes y quedan
disponibles para consumo del módulo de Estado de Resultados.

---

## FASE 7 — Juego de inventarios (CMV teórico vs. real)

**Prompt para Claude Code:**
> Implementa este módulo exactamente como está descrito: CMV teórico
> (100% de datos de sistema) vs. CMV real (con inventario final físico
> ingresado manualmente en este módulo), mostrando valor, % y la
> desviación entre ambos.

**Criterio de aceptación:** puedo ingresar el inventario final físico y
ver la desviación calculada correctamente contra el teórico.

---

## FASE 8 — Estado de resultados

**Prompt para Claude Code:**
> Implementa el estado de resultados con los 5 pilares (ingreso total,
> CMV real, gastos de venta, gastos administrativos, utilidad neta),
> consumiendo automáticamente los módulos anteriores, con vista en $ y
> %.

**Criterio de aceptación:** el estado de resultados de un período
cuadra con los datos ya cargados en los módulos previos, sin digitación
manual adicional.

---

## FASE 9 — Nómina (cocina)

**Prompt para Claude Code:**
> Implementa el módulo de nómina con usuario independiente para el
> empleado de cocina, registro de entrada/salida, y liquidación
> quincenal según la especificación. Deja TODOS los porcentajes legales
> (recargo nocturno, dominical, festivo, horas extra) como parámetros
> configurables desde una pantalla de configuración, no como valores
> fijos en el código. Antes de dar los porcentajes por buenos,
> pregúntame para confirmarlos con mi contador.

**Criterio de aceptación:** el empleado registra su turno, y al cierre
de quincena veo el desglose de horas y el valor final a pagar, con
recargos configurables.

---

## FASE 10 — CRM de ventas

**Prompt para Claude Code:**
> Implementa el CRM con las etapas Cotizado/Ganado/Perdido. Al marcar
> un negocio como "Ganado", debe poder generar automáticamente el
> registro correspondiente en el Módulo 3, sin doble digitación.

**Criterio de aceptación:** puedo mover un negocio por las etapas, y al
ganarlo se crea el evento en Ventas y Costos con los datos ya
diligenciados.

---

## FASE 11 — Agenda de eventos

**Prompt para Claude Code:**
> Implementa el módulo de Agenda de Eventos según la especificación:
> fecha del evento, persona de contacto, teléfono de contacto, número
> de personas, menú elegido (del Módulo 1), dirección, hora de
> servicio, valor antes de impuestos, anticipo (con cálculo automático
> del saldo pendiente = valor antes de impuestos − anticipo), vendedor
> y observaciones adicionales. Construye vista de calendario (mensual/
> semanal) y vista de lista, filtrables por fecha, vendedor y estado
> (anticipo pagado / saldo pendiente / sin anticipo). Cuando un negocio
> del CRM (Fase 10) pase a "Ganado", crea automáticamente el registro
> tanto en el Módulo 3 (Ventas y Costos) como en esta Agenda,
> precargando los campos compartidos (cliente, fecha, valor antes de
> impuestos, vendedor) para que el operador solo complete los campos
> logísticos. Mantén sincronizados los campos compartidos con el
> Módulo 3 para evitar información contradictoria.

**Criterio de aceptación:** al ganar un negocio en el CRM, aparece
automáticamente en la Agenda con los datos comerciales precargados; al
completar contacto, dirección, hora y anticipo, veo el saldo pendiente
calculado correctamente y puedo filtrar la agenda por fecha, vendedor y
estado de pago.

---

## FASE 12 — Cartera (Cuentas por Cobrar y Cuentas por Pagar)

**Prompt para Claude Code:**
> Implementa el módulo de Cartera según la especificación. Cuentas por
> Cobrar: un registro automático por cada evento facturado en el
> Módulo 3, enlazado con el anticipo de la Agenda de Eventos si existe,
> con saldo pendiente = valor total facturado − anticipo − abonos.
> Cuentas por Pagar: un registro automático por cada factura de compra
> del Módulo 2, con saldo pendiente = valor de la factura − abonos.
> En ambas, permite registrar abonos/pagos parciales, y recalcula el
> estado automáticamente (Pendiente / Pagada / Vencida — nunca lo
> dejes como campo editable manualmente). Construye dos tableros
> independientes (CxC y CxP) filtrables por cliente/proveedor, estado
> y fecha, con totalizadores de cartera total y cartera vencida. Los
> campos que vienen de Ventas o Compras deben quedar en solo lectura;
> solo se editan los abonos.

**Criterio de aceptación:** al facturar un evento aparece
automáticamente su Cuenta por Cobrar con el saldo correcto (descontando
el anticipo); al registrar una compra a crédito aparece automáticamente
su Cuenta por Pagar; al registrar abonos el saldo baja y el estado pasa
a "Pagada" cuando llega a $0; los registros vencidos se marcan solos
según la fecha de vencimiento.

---

## FASE 13 — Pulido general

**Prompt para Claude Code:**
> Revisa toda la aplicación: consistencia visual, roles de usuario,
> exportación a Excel/PDF en los módulos financieros, manejo de
> errores, y auditoría de cambios (quién y cuándo). Sugiéreme qué falta
> antes de considerar esto listo para producción.
