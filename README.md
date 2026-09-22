# ERP A Fuego Catering

Monorepo del ERP — **las 14 fases de `docs/plan_fases.md` están
completas**: Fase 0 (esqueleto del proyecto, login con roles), Fase 1
(Módulo 1 — Maestros), Fase 2 (Módulo 2 — Registro de compras), Fase 3
(Módulo 3 — Ventas y costos por evento), Fase 4 (Módulo 4 — Inventario en
tiempo real), Fase 5 (Dashboard general), Fase 6 (Gastos
Administrativos), Fase 7 (Juego de Inventarios — CMV), Fase 8 (Estado de
Resultados), Fase 9 (Nómina de Cocina), Fase 10 (CRM de Ventas), Fase 11
(Agenda de Eventos), Fase 12 (Cartera — CxC y CxP) y **Fase 13** (Pulido
general).

## Marca

- **Logo**: entregado por el usuario en PDF (`logo afuego catering (1).pdf`,
  no versionado en el repo) y en JPG (`LOGO AFUEGO IMAGEN.jpg` en el
  escritorio del usuario, tampoco versionado). Se generaron 4 archivos
  PNG en `apps/web/public/` con fondo transparente a partir de ese
  original (recorte automático + umbral de alpha por luminancia, sin
  herramientas de edición — esta máquina no tiene ImageMagick/Python/
  Ghostscript instalados, todo se hizo con `System.Drawing` vía
  PowerShell):
  - `logo-black.png` / `logo-white.png` — el wordmark completo ("A FUEGO
    CATERING"), para fondos claros/oscuros respectivamente.
  - `mark-black.png` / `mark-white.png` — solo el símbolo de la llama en
    la "A", recortado aparte, para usos compactos futuros (ej. una
    versión colapsada del sidebar).
  - `favicon.png` — la marca blanca sobre un cuadrado carbón oscuro.
- **Paleta**: **naranja** (`orange-600`, el que ya se venía usando en
  toda la app) como color de acento en botones, estados activos y
  enlaces — **decisión del usuario: se conserva**. Se agregó **negro/
  carbón** (`stone-900`, un negro cálido, no un `#000000` puro) para el
  sidebar y el fondo de la pantalla de login, con **blanco** para el
  contenido de las 25+ pantallas de datos (las tablas necesitan fondo
  claro para leerse bien). El logo blanco vive en el sidebar oscuro; el
  logo negro, en la tarjeta blanca de login.

- **Artículos y Servicios** (`/articulos`): catálogo de costo/compra en 5
  categorías (materia prima, mano de obra tercerizada, servicio de
  transporte, servicios artísticos, alquiler de menaje y equipos). El
  "último precio de compra" y el histórico ("Ver histórico" en cada fila)
  ahora se alimentan automáticamente desde el Módulo 2 — es de solo
  lectura aquí.
- **Opciones de Menú** (`/opciones-menu`): catálogo de venta — todas las
  opciones de la Carta 2026 (Anexo A) vienen precargadas por semilla,
  agrupadas en Momentos/Fuertes, Parrilla, Paellas, Bocados/Snacks,
  Refrigerios, Infantil y Adicionales.
- **Clientes** (`/clientes`) y **Proveedores** (`/proveedores`).

Las cuatro pantallas permiten crear, editar y activar/desactivar (nunca
eliminar, para no romper trazabilidad futura con compras/eventos).
Acceso restringido a los roles Administrador y Operación.

## Módulo 2 — Registro de compras (Fase 2)

- **Compras** (`/compras`): registro de compras "ítem por ítem". El
  formulario captura una factura (proveedor, fecha, número de factura,
  condición de pago, fecha de vencimiento si es a crédito) y permite
  agregar varios ítems (artículo, cantidad, precio unitario) que
  comparten esos datos de factura — cada ítem crea un registro de Compra
  independiente, en una sola transacción.
- Al guardar, el "último precio de compra" del artículo se actualiza
  automáticamente y queda visible de inmediato en el Módulo 1.
- El histórico de precios por artículo (botón "Ver histórico" en
  Artículos) se consulta directamente sobre los registros de Compra
  filtrados por artículo — no se duplica en otra tabla.
- Las compras no se editan ni se eliminan (son un hecho histórico); los
  campos de factura/condición de pago/vencimiento quedan listos para
  alimentar las Cuentas por Pagar de Cartera (Fase 12).

## Módulo 3 — Ventas y costos por evento (Fase 3)

- **Ventas y Costos por Evento** (`/eventos`): tabla de eventos (fecha,
  cliente, opción de menú, personas, valor antes/después de impuestos,
  costo total, utilidad operacional). **Doble clic** sobre un evento abre
  el detalle para cargar consumos artículo por artículo (costo unitario
  tomado automáticamente del último precio de compra), editar cantidades
  o quitar líneas.
- El costo total y la utilidad operacional (en $ y %) **no se guardan**:
  se calculan siempre a partir de los consumos cargados, para que nunca
  queden desactualizados.
- **Parámetros Fiscales** (`/tax-rates`): tasas de impuesto configurables
  (IVA 19%, IVA 5%, Impuesto al Consumo 8%, precargadas por semilla) —
  editables solo por Administrador, seleccionables por Operación al crear
  un evento.
- Las fórmulas financieras (`apps/api/src/modules/eventos/evento.calculations.ts`)
  tienen pruebas unitarias — corre `npm run test -w apps/api` (o
  `npm run test` desde la raíz).

## Módulo 4 — Inventario en tiempo real (Fase 4)

- **Inventario** (`/inventario`): filtro de período (día, semana, mes o
  rango personalizado) con las 4 variables por artículo y consolidadas:
  Inventario inicial (manual), Compras (automático desde Módulo 2), Costos
  y consumos (automático desde Módulo 3), e Inventario final (calculado:
  inicial + compras − consumo).
- "Inventario inicial" se declara por artículo con un botón "Registrar
  inicial"/"Editar inicial" en la fila — es un conteo físico manual atado
  a la fecha exacta de inicio del período que se está viendo.
- El detalle por artículo se muestra en **cantidad** (kg, unidades…); el
  consolidado general se muestra en **valor $** (no tiene sentido sumar
  kilos con unidades entre artículos distintos).
- La fórmula (`inicial + compras − consumo`) tiene pruebas unitarias en
  `apps/api/src/modules/inventario/inventario.calculations.ts`.

## Dashboard General — pantalla principal (Fase 5)

- Ahora es la pantalla de inicio (`/`), con filtro de período (día,
  semana, mes, personalizado) compartido con el Módulo 4.
- Tarjetas KPI (valor $ y % sobre la venta): ventas totales, costos
  totales, utilidad operativa, CMV (solo materia prima), mano de obra
  tercerizada, servicios de transporte, servicios artísticos.
- Gráfico de dona: composición de costos por categoría.
- Gráfico de líneas: tendencia de ventas y utilidad por día en el período.
- Todo se alimenta de los eventos del Módulo 3 (ventas = valor antes de
  impuestos; costos = consumos, agrupados por categoría de artículo del
  Módulo 1) — no hay datos propios, todo es solo lectura/derivado.

## Gastos Administrativos (Fase 6)

- **Gastos Administrativos** (`/gastos-administrativos`, Administrador/
  Operación/Ventas): registro mensual de los 11 rubros fijos (arriendo,
  nómina administrativa, servicios públicos, honorarios de contador y
  socios, control de plagas, seguros, internet, adicionales, cuota de
  obligación financiera, **Publicidad** y **Lavandería** — estos dos
  últimos agregados 2026-09-10 a pedido del negocio, ver "Decisiones de
  la Fase 6"). Selector de mes (un registro por año+mes) con histórico de
  meses ya cargados a un clic.
- El total del mes no se guarda: se suma en el servicio
  (`calcularTotalGastosAdministrativos`, con pruebas unitarias) para que
  el futuro Estado de Resultados siempre lo consuma actualizado.

## Juego de Inventarios — CMV teórico vs. real (Fase 7)

- **Juego de Inventarios** (`/juego-inventarios`): compara, para el
  período elegido, el CMV teórico (100% de sistema: inventario inicial +
  compras − inventario final calculado del Módulo 4) contra el CMV real
  (inventario inicial + compras − inventario final **físico**, contado en
  bodega y registrado manualmente en este módulo, por artículo). Muestra
  valor $, % sobre la venta para cada uno, y la desviación (valor y %)
  entre ambos — para identificar mermas o descuadres.
- Detalle por artículo de materia prima (con botón "Registrar"/"Editar"
  para el conteo físico de cierre) además del consolidado, para poder ver
  en qué artículo específico está la desviación.
- Fórmulas (`calcularCMV`, `calcularDesviacionCMV`) con pruebas unitarias
  en `apps/api/src/modules/juego-inventarios/juego-inventarios.calculations.ts`
  — "CMV teórico/real" y "desviación" están explícitamente en la lista de
  fórmulas que `CLAUDE.md` pide probar.

## Estado de Resultados (Fase 8)

- **Estado de Resultados** (`/estado-resultados`, solo Administrador):
  los 5 pilares por período, en $ y % sobre la venta — Ingreso total
  (Módulo 3), CMV real (Juego de Inventarios), Gastos de venta (consumos
  de eventos que no son materia prima), Gastos administrativos (Módulo 6)
  y Utilidad neta = Ingreso total − CMV − Gastos de venta − Gastos
  administrativos.
- **100% derivado, sin datos propios**: no hay tabla nueva — el servicio
  reutiliza directamente el reporte del Juego de Inventarios (CMV real) y
  la fórmula de total de Gastos Administrativos ya construidos.
- `calcularUtilidadNeta` tiene pruebas unitarias
  (`apps/api/src/modules/estado-resultados/estado-resultados.calculations.ts`)
  — "utilidad neta" está explícitamente en la lista de fórmulas que
  `CLAUDE.md` pide probar.

## Nómina de Cocina (Fase 9)

- **Mi Turno** (`/mi-turno`, rol Cocina/Nómina): el empleado marca su
  propia entrada/salida por turno, ve su historial y su liquidación del
  período (por defecto, quincena actual).
- **Liquidación de Nómina** (`/nomina/liquidacion`, Administrador):
  selector de empleado + período, desglose de horas por los 8 conceptos
  del Código Sustantivo del Trabajo (diurna, nocturna, extra diurna,
  extra nocturna, dominical/festiva diurna y nocturna, extra dominical/
  festiva diurna y nocturna) en horas y $, auxilio de transporte
  prorrateado por días trabajados, y total a pagar. Permite crear/editar/
  borrar turnos de cualquier empleado (para corregir olvidos de marcar
  salida, por ejemplo).
- **Parámetros de Nómina** (`/nomina/parametros`, Administrador): SMLV,
  divisor de horas mensuales, auxilio de transporte y los 7 recargos —
  todos editables, nunca fijos en el código — más el calendario de días
  festivos (tampoco fijo: Colombia no tiene un estándar embebible de
  forma confiable, cambia cada año).
- **Valores confirmados con el usuario** (capturas de pantalla, ver
  decisiones abajo): SMLV 2026 = $1.750.905, divisor = 210h/mes, auxilio
  de transporte = $249.095/mes, y los 7 recargos vigentes.
- Todo el motor de clasificación de horas (`apps/api/src/modules/nomina/nomina.calculations.ts`)
  son funciones puras con pruebas unitarias extensas — "liquidación de
  nómina" está explícitamente en la lista de fórmulas que `CLAUDE.md`
  pide probar, y es la fórmula más compleja de todo el sistema.

## CRM de Ventas (Fase 10)

- **CRM** (`/crm`, roles Administrador y Ventas): tablero tipo Kanban con
  las 3 etapas (Cotizado / Ganado / Perdido). Un negocio se crea/edita
  libremente mientras está "Cotizado"; al marcarlo "Perdido" queda
  congelado como registro histórico.
- **"Marcar Ganado"** pide 2 datos que el CRM no captura (opción de menú,
  número de personas — ver decisión abajo) y, con eso, crea
  automáticamente: (1) el Cliente en el Módulo 1 (lo busca primero por
  identificación/nombre para no duplicar; si no existe, lo crea) y (2) el
  Evento en el Módulo 3, ya con cliente/fecha/valor precargados desde el
  CRM — sin doble digitación de esos campos. Todo corre en una sola
  transacción de base de datos, para no dejar un negocio "ganado" sin su
  evento (o un evento huérfano) si algo falla a mitad de camino.
- Ventas ahora tiene su primera pantalla real: se le dio acceso de
  **solo lectura** a Opciones de Menú y Parámetros Fiscales (necesarios
  para el diálogo de "Ganar"), y "/" tras el login lo manda directo a
  `/crm` en vez de un Dashboard al que no tiene acceso.

## Agenda de Eventos (Fase 11)

- **Agenda** (`/agenda`, Administrador y Operación): vista de Lista y
  vista de Calendario (mensual/semanal, según el tipo de período elegido)
  del mismo conjunto de datos — filtrables por fecha, vendedor y estado
  del anticipo (sin anticipo / saldo pendiente / anticipo pagado, cada
  uno con su color).
- **Extensión 1-a-1 del Evento**, no una copia: fecha, cliente, opción de
  menú, número de personas y valor antes de impuestos se leen en vivo del
  Evento vinculado — nunca se duplican ni se pueden desincronizar. Solo
  se guardan los campos logísticos propios (persona de contacto,
  teléfono, dirección, hora de servicio, anticipo, observaciones,
  vendedor).
- **Saldo pendiente = valor antes de impuestos − anticipo**, calculado
  (no guardado) con pruebas unitarias en
  `apps/api/src/modules/agenda/agenda.calculations.ts`.
- **Al ganar un negocio en el CRM** (Fase 10), además del Evento ahora
  también se crea automáticamente el registro de Agenda (vendedor
  precargado desde el negocio), dentro de la misma transacción — el
  operador solo completa contacto/dirección/hora/anticipo.
- También se puede crear manualmente para un Evento existente que no
  vino del CRM (selector de "eventos disponibles" — los que aún no
  tienen registro de agenda).

## Cotizaciones (post-lanzamiento, 2026-09-10)

- **Cotizaciones** (`/cotizaciones`): genera el documento comercial con el
  mismo diseño de la plantilla de referencia entregada por el negocio
  (papel kraft, ilustración esquemática, tabla de ítems de menú +
  logística, SUBTOTAL/IMPUESTO/TOTAL, condiciones comerciales y firma del
  vendedor) y lo exporta directo a PDF (`apps/web/src/lib/cotizacion-pdf.ts`,
  vía jsPDF) — sin necesidad de vista previa en pantalla, se descarga con
  un clic tanto desde el formulario (vista previa antes de guardar) como
  desde el listado (cotizaciones ya guardadas).
- **Integración con el CRM**: al guardar una cotización se crea
  automáticamente, en la misma transacción, un Negocio en etapa
  "Cotizado" (`cotizacion.service.ts`) — así toda cotización aparece de
  inmediato en el tablero del CRM sin doble digitación. El flujo
  Cotizado → Ganado sigue siendo el mismo de la Fase 10 (con su
  integración a Agenda de la Fase 11, ver arriba).
- **`items`/`logistica` se guardan como JSON**, no como tablas
  relacionales: son líneas libres propias de cada cotización (el cliente
  puede pedir algo que todavía no existe en el catálogo de Artículo/
  OpcionMenu), no un catálogo que otro módulo necesite consultar.
- **Ilustraciones**: 4 imágenes esquemáticas entregadas por el negocio
  (hamburguesa, paella, canapés, sándwich — costillas pendiente),
  procesadas para quitarles el fondo kraft y dejarlas en trazo negro
  sobre transparente (`apps/web/public/cotizacion-icons/`), seleccionables
  por cotización.
- **Total = subtotal de ítems + subtotal de logística, más impuesto
  configurable** (reutiliza `TaxRate`, Fase 3) — fórmula aislada con
  pruebas unitarias en
  `apps/api/src/modules/cotizaciones/cotizacion.calculations.ts`,
  verificada contra el ejemplo exacto de la plantilla de referencia.
- **Actualización post-lanzamiento (2026-09-21):** tres cambios pedidos
  juntos por el negocio.
  1. **Cliente restringido al Módulo 1**, igual que se hizo en el CRM: ya
     no se escribe libremente, se selecciona `clienteId` entre los
     clientes ya creados. `Cotizacion.clienteId` es FK a `Cliente`
     (nullable, para no romper cotizaciones ya existentes);
     `clienteNombre`/`clienteIdentificacion`/`telefono` se conservan como
     copia tomada del Cliente, para no tocar el PDF ni el resto del
     módulo.
  2. **`vendedorNombre` deja de ser una lista fija de 3 nombres y pasa a
     ser el mismo `vendedorId` (FK a `User`) que usa el CRM** — los
     mismos vendedores (Carolina Duque, Sergio Restrepo, Oscar Guerrero,
     Javier Guerrero, o quien más se cree con rol Ventas/Administrador)
     sirven para firmar el PDF y para la trazabilidad. El `vendedorId`
     del Negocio creado automáticamente ahora es ese mismo vendedor — ya
     no siempre "quien registró la cotización en el sistema" como antes,
     así el CRM y la Agenda (que hereda el vendedor del Negocio al
     ganar) muestran al vendedor real de cada evento.
  3. **Los ítems del menú (no la logística) se seleccionan de un
     desplegable de `OpcionMenu`** en vez de escribir la descripción a
     mano — al elegir la opción se autocompleta el valor unitario con su
     precio configurado (sigue siendo editable, por si se negocia un
     precio especial). La logística (cocinero, transporte, meseros…)
     sigue siendo texto libre porque no es un ítem del catálogo de menú.
     No fue necesario ningún cambio de esquema para esto: `items` sigue
     guardándose como el mismo JSON de siempre, la restricción es solo
     de interfaz.

## Eliminar ventas y artículos (post-lanzamiento, 2026-09-10)

- **Ventas y Costos por Evento** (`/eventos`) y **Artículos y Servicios**
  (`/articulos`) ahora tienen un botón "Eliminar" (borrado real, no solo
  desactivar) — pedido por el negocio para poder corregir errores de
  digitación, protegido con una **contraseña de autorización**
  (`DELETE_AUTH_PASSWORD`, variable de entorno — nunca fija en el código
  fuente) que se pide en un modal de confirmación antes de borrar.
- **Artículo**: solo se puede eliminar si nunca se usó en ninguna compra,
  consumo de evento o inventario (inicial/final físico) — si ya tiene
  historial, el borrado se rechaza (409) y se pide desactivarlo en su
  lugar, para no romper la trazabilidad de esos registros (regla no
  negociable de `CLAUDE.md`).
- **Evento**: se rechaza si ya tiene abonos/pagos registrados en Cartera
  (borrar eso corrompería el histórico de pagos reales). Si se puede
  eliminar: se borra su Agenda y sus consumos (existen solo para
  describir ese evento), y si vino de un negocio ganado en el CRM, ese
  negocio vuelve a etapa "Cotizado" en vez de quedar apuntando a un
  evento inexistente — así se puede corregir y volver a ganar.

## Almuerzo e Incapacidades en Nómina (post-lanzamiento, 2026-09-15)

- **Descuento de almuerzo (0.5h por turno):** pedido por el negocio — el
  almuerzo lo asume el empleado y no cuenta como tiempo de trabajo. Se
  descuenta de las horas ORDINARIAS de cada turno (nunca de horas
  extra, que ya son un derecho económico causado), primero de la diurna
  ordinaria (el caso normal, almuerzo al mediodía), luego de la
  nocturna, luego de la dominical/festiva diurna y nocturna si un turno
  no tiene suficiente diurna/nocturna ordinaria para cubrir la media
  hora completa. Implementado en `clasificarTurno`
  (`apps/api/src/modules/nomina/nomina.calculations.ts`), con pruebas
  unitarias actualizadas para reflejar el descuento en cada escenario.
  El campo `horasTrabajadas` que se ve en la lista de turnos sigue
  mostrando el tiempo bruto reloj-a-reloj (para poder auditar contra lo
  que el empleado realmente marcó); el descuento solo afecta el
  desglose de la liquidación.
- **Incapacidades (66.67% del salario diario):** nuevo modelo
  `Incapacidad` — un registro por día de incapacidad, por empleado, en
  la Liquidación de Nómina. Se liquidan al `porcentajeIncapacidad`
  configurado en Parámetros de Nómina (66.67% por defecto, confirmado
  con el usuario — Ley 100/CST), calculado sobre el salario diario
  (SMLV/30, mismo criterio que el auxilio de transporte) — no se
  cuentan como turno trabajado ni afectan el auxilio de transporte
  (que solo se prorratea por días efectivamente trabajados).
  `calcularValorIncapacidad` con pruebas unitarias. Mismo criterio de
  acceso que los turnos: Cocina/Nómina solo ve las propias (de solo
  lectura); los roles administrativos las registran/eliminan.

## Deducciones EPS y AFP en Nómina (post-lanzamiento, 2026-09-15)

- **4% EPS + 4% AFP sobre el total devengado** (horas + incapacidad, SIN
  el auxilio de transporte, que nunca es base de cotización) —
  porcentajes confirmados con el usuario comparando línea por línea
  contra la nómina manual en Excel que manejaba el negocio antes de
  este sistema (verificado exacto para 2 empleados de la quincena
  1-15 sept. 2026). Configurables en Parámetros de Nómina, nunca fijos
  en el código. `calcularDeducciones` con pruebas unitarias que
  reproducen esos mismos dos casos de referencia.
- El total a pagar ahora es: `(devengado por horas + incapacidad) −
  (EPS + AFP) + auxilio de transporte`.

## Cartera — Cuentas por Cobrar y por Pagar (Fase 12, último módulo del plan)

- **Cartera** (`/cartera`, solo Administrador): dos tableros
  independientes (CxC / CxP) con totalizadores (total y vencido de cada
  uno), filtrables por cliente/proveedor, estado (Pendiente/Pagada/
  Vencida) y rango de fechas.
- **CxC — una fila por cada `Evento`** (no hay un paso de "facturación"
  separado en el sistema; ver decisión abajo): valor facturado (después
  de impuestos, del Módulo 3), anticipo (de la Agenda, si existe),
  vencimiento = fecha del evento. Saldo = valor facturado − anticipo −
  abonos.
- **CxP — una fila por cada factura** (proveedor + número de factura,
  agrupando las líneas de `Compra` que la componen — el mismo
  agrupamiento que ya había anticipado en la Fase 2), generada
  automáticamente solo para compras a crédito. Saldo = valor de la
  factura − abonos.
- **Estado siempre calculado, nunca editable**: Pagada si el saldo llega
  a 0 (o menos, por sobrepago), Vencida si queda saldo y ya pasó la fecha
  de vencimiento, Pendiente en cualquier otro caso.
- **Abonos** en un ledger propio (`Abono`, con fecha y quién lo
  registró) — nunca se sobrescribe un campo "saldo": el saldo siempre se
  recalcula sumando los abonos.
- Fórmulas (`calcularSaldoPendiente`, `calcularEstadoCartera`) con
  pruebas unitarias en `apps/api/src/modules/cartera/cartera.calculations.ts`.

## Pulido general (Fase 13)

Revisión transversal de toda la aplicación — no un módulo nuevo, sino
correcciones y una auditoría de qué falta para producción.

**Construido en esta fase:**

- **Exportación a Excel y PDF** en los 6 módulos financieros (Dashboard,
  Estado de Resultados, Gastos Administrativos, Juego de Inventarios,
  Cartera, Liquidación de Nómina) — requisito transversal de la
  especificación que ninguna fase anterior había implementado todavía.
  Utilidad compartida en `apps/web/src/lib/export.ts`
  (`xlsx` + `jspdf`/`jspdf-autotable`) y un botón reutilizable
  (`ExportButtons`) — lo que se exporta es idéntico a lo que se ve en
  pantalla (mismos valores formateados), no números crudos.
- **Sesión expirada ya no deja al operador varado**: antes, si el JWT
  expiraba mientras la app ya estaba abierta, cada pantalla mostraba un
  error 401 suelto sin ninguna salida clara. Ahora `apiFetch` dispara un
  evento que `AuthContext` escucha para cerrar sesión automáticamente y
  mandar de vuelta al login.
- **Error boundary global** (`ErrorBoundary.tsx`): un error de render no
  controlado en cualquier pantalla ya no deja una página en blanco — se
  muestra un mensaje con opción de recargar.
- **404 consistente en la API**: las rutas no encontradas ahora responden
  JSON como el resto de errores, en vez de la página HTML por defecto de
  Express.
- **Auditoría de consistencia de roles**: se comparó cada `requireRole`
  del backend contra el menú lateral del frontend — sin discrepancias
  (los únicos roles con acceso de API pero sin enlace de menú son
  lecturas de apoyo para diálogos de otros módulos: Ventas puede leer
  Opciones de Menú/Parámetros Fiscales para el diálogo de "Ganar" del
  CRM, sin tener una pantalla propia de esos módulos — es intencional).

**Pendiente antes de producción — hallazgos de esta auditoría que
requieren una decisión tuya, no se corrigieron unilateralmente:**

1. ~~**Auditoría de ediciones incompleta.**~~ **Resuelto (2026-09-23).**
   Se agregó un historial de auditoría (`AuditLog`, módulo
   `/auditoria`, panel exclusivo de Administrador en el menú) que cubre
   exactamente el hueco descrito: `Articulo`, `Cliente`, `Proveedor`,
   `OpcionMenu`, `TaxRate`, `ParametroNomina`, `DiaFestivo` y `Usuario`
   ahora registran quién creó, editó, activó/desactivó o eliminó cada
   registro, no solo cuándo. Se implementó como llamadas explícitas a
   `registrarCambio()` desde cada servicio afectado — se evaluó un
   interceptor automático a nivel de Prisma (`$extends`) que capturara
   todos los modelos sin tocar cada servicio uno por uno, pero se
   descartó: además de duplicar lo que ya cubren `registeredById`/
   `uploadedById` en los modelos transaccionales, un audit log escrito
   fuera de la transacción de negocio (necesario para que el
   interceptor funcionara igual dentro y fuera de `$transaction`)
   podría quedar inconsistente si esa transacción fallara a mitad de
   camino — las llamadas explícitas, aunque piden tocar más archivos,
   se pueden verificar leyendo el código y siempre corren en el mismo
   punto exacto donde ya se sabe que la operación tuvo éxito. Un
   registro de auditoría que a su vez fallara nunca tumba la operación
   real (se registra en la consola del servidor y sigue).
2. **Verificación real pendiente.** Como se ha mencionado en cada fase:
   Node.js/PostgreSQL nunca se instalaron con éxito en esta máquina, así
   que ninguna de las 13 fases se ha probado corriendo de verdad —
   `npm install && npm run dev`, login, y cada flujo (crear un artículo,
   registrar una compra, ganar un negocio del CRM, etc.) siguen sin
   confirmarse en un navegador real. Esto es lo más importante antes de
   considerar el sistema listo para producción.
3. **Motor de prestaciones sociales de nómina** (cesantías, prima,
   vacaciones, seguridad social, parafiscales) — explícitamente fuera de
   alcance por decisión tuya en la Fase 9; la liquidación actual es solo
   el devengado quincenal por horas.
4. **Calendario de festivos vacío por defecto** — hay que poblarlo
   manualmente en `/nomina/parametros` antes de que la liquidación de
   nómina clasifique correctamente las horas festivas.
5. **Sin pruebas de integración/end-to-end**, solo unitarias de las
   fórmulas financieras (que es lo que pide `CLAUDE.md` explícitamente).
   No hay pruebas automatizadas de los flujos completos (crear evento →
   cargar consumos → ver en Dashboard, por ejemplo).
6. **Revisar antes de producción real**: `JWT_SECRET` de ejemplo en
   `.env.example`, contraseñas de los usuarios semilla (son solo para
   desarrollo local, hay que reemplazarlas/eliminarlas), y confirmar que
   los 7 recargos de nómina y las 3 tasas de impuesto sigan vigentes en
   el momento de poner esto en producción (la ley colombiana los
   actualiza periódicamente).
7. **No existe una pantalla para crear/gestionar usuarios.** Los únicos
   usuarios que existen son los 4 de la semilla (`prisma/seed.ts`), con
   contraseñas de ejemplo públicas en este mismo repo. Antes de operar
   de verdad hay que editar ese archivo con los datos y contraseñas
   reales del equipo (o pedir un módulo de gestión de usuarios aparte)
   — no hay ningún lugar en la interfaz donde el Administrador pueda
   crear un usuario nuevo todavía.

## Despliegue (GitHub + Netlify + Supabase)

Arquitectura: el frontend (Vite/React) se publica como sitio estático en
Netlify; el backend (Express) se envuelve como una Netlify Function
(`netlify/functions/api.ts`, usando `serverless-http` — no se reescribió
ninguna ruta, es la misma API); la base de datos vive en Supabase
(Postgres). `netlify.toml` redirige `/api/*` del sitio a la función, así
que frontend y backend quedan en el mismo dominio (sin problemas de
CORS).

**No se pudo probar este camino de punta a punta** (esta máquina de
desarrollo no tiene Node.js instalado ni conectores de GitHub/Netlify/
Supabase disponibles) — el código y la configuración están listos y
son coherentes con la documentación oficial de cada plataforma, pero es
posible que el primer despliegue necesite un ajuste menor (ver nota
sobre `binaryTargets` de Prisma abajo).

### 1. Supabase — crear el proyecto y obtener las cadenas de conexión

1. En tu cuenta de Supabase, crea un **proyecto nuevo** dedicado a este
   ERP (no reutilices el proyecto de otro artefacto — este sistema tiene
   su propio esquema de 20 tablas).
2. Ve a **Project Settings → Database**. Vas a necesitar dos cadenas de
   conexión distintas:
   - **Connection pooling** (puerto `6543`, modo "Transaction") → esta es
     tu `DATABASE_URL`.
   - **Direct connection** (puerto `5432`) → esta es tu `DIRECT_URL`.
   - Agrega `?pgbouncer=true` al final de la `DATABASE_URL` si Supabase
     no lo incluye ya.
3. Guarda ambas cadenas (con la contraseña real de tu proyecto) — las
   necesitas en el paso 3.

### 2. GitHub — subir el código

```bash
git init
git add .
git commit -m "ERP A Fuego Catering — versión inicial"
```

Crea un repositorio nuevo en GitHub (vacío, sin README/licencia) y
conéctalo:

```bash
git remote add origin https://github.com/TU-USUARIO/erp-afuego.git
git branch -M main
git push -u origin main
```

### 3. Netlify — conectar el repo y configurar

1. En Netlify: **Add new site → Import an existing project → GitHub** →
   elige el repositorio `erp-afuego`.
2. Netlify debería detectar `netlify.toml` automáticamente (build
   command, carpeta a publicar y carpeta de funciones ya están
   configurados ahí — no hace falta tocarlos en la UI).
3. Antes de desplegar, ve a **Site configuration → Environment
   variables** y agrega:

   | Variable | Valor |
   | --- | --- |
   | `DATABASE_URL` | la cadena "pooled" (puerto 6543) de Supabase |
   | `DIRECT_URL` | la cadena directa (puerto 5432) de Supabase |
   | `JWT_SECRET` | un valor largo y aleatorio (no el de `.env.example`) |
   | `JWT_EXPIRES_IN` | `8h` |
   | `CORS_ORIGIN` | la URL que Netlify te va a asignar (ej. `https://tu-sitio.netlify.app`) — la puedes ajustar después del primer deploy |
   | `VITE_API_URL` | `/api` (con la barra inicial, sin dominio — el frontend le habla a su propio dominio) |
   | `DELETE_AUTH_PASSWORD` | la contraseña de autorización para eliminar ventas/artículos (post-lanzamiento, 2026-09-10) |

4. Dispara el deploy (**Deploy site**). El build corre `prisma generate`
   automáticamente (ya está como `postinstall` del workspace), aplica
   las migraciones a Supabase (`prisma migrate deploy`, incluido en el
   build command), y compila el frontend.
5. Cuando termine, Netlify te da un link tipo
   `https://tu-sitio.netlify.app` — esa es tu app publicada.

> **Nota (2026-09-22):** cada migración nueva se aplica sola en el
> siguiente deploy — **no hace falta correr el SQL a mano en Supabase**.
> Confirmado revisando la tabla `_prisma_migrations` en producción: las
> migraciones de vendedor/cliente de esta semana quedaron con
> `finished_at` poblado, es decir que `prisma migrate deploy` sí las
> aplicó automáticamente en el build. Aun así, durante esta sesión se le
> pidió al usuario correrlas manualmente por precaución (dejando el SQL
> como respaldo, con `IF NOT EXISTS`) — eso fue trabajo de más, no un
> paso requerido. Alcanza con: push a `main` → Trigger deploy en
> Netlify. Solo si algo no aparece después de un deploy exitoso vale la
> pena revisar `_prisma_migrations` directamente para confirmar.

### 4. Cargar los usuarios iniciales (una sola vez)

El build **no** ejecuta el seed automáticamente (para no resetear
usuarios reales en cada deploy). Antes de usarlo de verdad:

1. Edita `apps/api/prisma/seed.ts` y reemplaza los 4 usuarios de
   ejemplo por los reales de tu equipo (nombres, correos, contraseñas
   fuertes).
2. Corre el seed una vez contra Supabase — la forma más simple es
   temporalmente agregar `&& npm -w apps/api run prisma:seed` al final
   del `command` en `netlify.toml`, hacer un deploy, y luego quitarlo
   otra vez (o, si ya tienes Node.js instalado en algún computador,
   correrlo localmente apuntando `DATABASE_URL`/`DIRECT_URL` a Supabase).

### Si el primer deploy falla con un error de Prisma ("engine not found" / "cannot find module")

Es un problema conocido de Prisma en entornos serverless: el motor
binario que se genera debe coincidir con el sistema operativo donde
corre la función (Netlify usa Lambda de AWS por debajo). Ya se
configuraron varios `binaryTargets` en `apps/api/prisma/schema.prisma`
a modo de cobertura, pero si aun así falla, revisa el log del deploy en
Netlify — el mensaje suele indicar exactamente qué `binaryTarget` falta,
y se agrega a esa misma lista.

## Stack

- Backend: Node.js + Express + TypeScript + Prisma ([apps/api](apps/api))
- Frontend: React + TypeScript + Vite + Tailwind CSS ([apps/web](apps/web))
- Paquete compartido: tipos y validaciones Zod ([packages/shared](packages/shared))
- Base de datos: PostgreSQL (vía Docker Compose)

## Requisitos previos

Esta máquina todavía no tiene instalado lo siguiente — instálalo antes de
continuar:

- [Node.js 20+](https://nodejs.org) (incluye npm)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (para
  levantar PostgreSQL con `docker compose`; si prefieres usar un
  PostgreSQL que ya tengas instalado localmente, puedes omitir Docker y
  ajustar `DATABASE_URL` manualmente en `apps/api/.env`)

## Arranque en local (un solo comando)

```bash
npm install
npm run dev
```

`npm run dev` hace todo lo demás automáticamente:

1. Crea los archivos `.env` a partir de los `.env.example` (si no existen).
2. Levanta el contenedor de PostgreSQL (`docker compose up -d db`).
3. Espera a que la base de datos acepte conexiones.
4. Aplica las migraciones de Prisma (`prisma migrate deploy`).
5. Carga los usuarios de prueba (seed, ver abajo).
6. Arranca la API (`http://localhost:4000`) y el frontend
   (`http://localhost:5173`) en paralelo.

Para detener la base de datos: `npm run db:down`.

## Usuarios de prueba (seed)

Solo para desarrollo local — reemplazar/eliminar antes de producción.

| Rol                 | Correo                 | Contraseña      |
| -------------------- | ----------------------- | ---------------- |
| Administrador/Gerencia | admin@afuego.local      | Admin123!        |
| Operación             | operacion@afuego.local  | Operacion123!    |
| Cocina/Nómina         | cocina@afuego.local     | Cocina123!       |
| Ventas                | ventas@afuego.local     | Ventas123!       |

## Estructura del monorepo

```
/apps/api        → backend (Express + TypeScript + Prisma)
/apps/web         → frontend (React + TypeScript + Vite + Tailwind)
/packages/shared  → tipos y esquemas Zod compartidos
/docs             → especificación funcional y plan de fases
/scripts          → scripts de arranque local (setup de .env, espera de BD)
```

## Comandos útiles

```bash
npm run lint         # ESLint en todo el monorepo
npm run format        # Prettier (escribe los cambios)
npm run typecheck     # Chequeo de tipos en shared, api y web
npm run build         # Build de producción de los 3 paquetes
npm -w apps/api run prisma:studio   # Explorador visual de la base de datos
```

## Decisiones tomadas en esta fase (no 100% explícitas en la especificación)

- **Gestor de paquetes:** npm con *workspaces* (monorepo nativo de npm),
  por ser el que viene incluido con Node.js sin instalación adicional.
- **Autenticación:** JWT firmado por el backend, guardado en
  `localStorage` en el frontend. El rol viaja dentro del token y se usa
  en middleware (`requireRole`) para proteger rutas por rol en fases
  futuras.
- **Modelo de datos de esta fase:** solo `User` (con enum `UserRole`:
  `ADMINISTRADOR`, `OPERACION`, `COCINA_NOMINA`, `VENTAS`). Los modelos
  de negocio (artículos, terceros, compras, eventos, etc.) se agregan a
  partir de la Fase 1.
- **Migraciones de Prisma:** se versiona una migración inicial
  (`prisma/migrations/20260103120000_init`) para que `npm run dev`
  funcione de punta a punta sin pasos manuales. A partir de la Fase 1,
  las migraciones nuevas se crean con `npm -w apps/api run prisma:migrate`.
- **Seed idempotente:** el seed usa `upsert` por correo/nombre, así que
  `npm run dev` puede correr repetidamente sin duplicar registros ni
  fallar por conflicto de unicidad.

### Decisiones de la Fase 1

- **Dos catálogos separados, no uno:** la especificación describe dos
  cosas distintas bajo "Módulo 1 — Maestros": (a) artículos/servicios de
  **costo/compra** en 6 categorías con "último precio de compra", y (b)
  las **opciones de venta** del Anexo A (Carta 2026) con "precio de venta
  por persona/unidad". Son conceptos de negocio distintos (costo vs.
  venta) con campos distintos, así que se modelaron como dos tablas:
  `Articulo` y `OpcionMenu`.
- **6 categorías de Articulo → 5:** la especificación original lista
  (c) "Servicio de transporte" y (f) "Transporte" como categorías
  separadas, pero el Dashboard y el Estado de Resultados solo manejan un
  único indicador de transporte — se unificaron en una sola categoría
  (`SERVICIO_TRANSPORTE`). Si en realidad son dos conceptos distintos,
  avísame para separarlos.
- **Proveedor.categoria reutiliza las categorías de Articulo** (materia
  prima, mano de obra, transporte, artístico, menaje) en vez de una lista
  libre, para no duplicar taxonomías.
- **Solo Administrador y Operación** tienen acceso al Módulo 1, siguiendo
  la descripción de roles del documento ("Ventas: solo CRM", "Cocina/
  Nómina: solo su módulo").
- **Sin borrado físico:** los catálogos solo se crean, editan y se
  activan/desactivan — nunca se eliminan, para no romper la trazabilidad
  que pedirán los módulos de compras y eventos.
- **Dos variantes de "Momento 90 MIL" no se inventaron:** la
  especificación las menciona ("x2 variantes adicionales según carta")
  sin describir su contenido — se pueden agregar desde la interfaz
  cuando se conozca la composición real.
- **Actualización post-lanzamiento (2026-09-22): adjuntos de Cliente
  (cédula, RUT, contrato…).** Se guardan directo en la base de datos
  (tabla `cliente_archivos`, columna `contenido` tipo `bytea`), no en un
  servicio de almacenamiento externo tipo Supabase Storage — decisión
  confirmada con el negocio para no sumar una pieza más de
  infraestructura que configurar (bucket, llave de servicio) dado el
  volumen esperado (documentos puntuales por cliente, no cientos de
  archivos pesados). El archivo viaja codificado en base64 dentro del
  mismo cuerpo JSON de la petición (no `multipart/form-data`) — evita
  cualquier problema de parseo binario a través de la función
  serverless de Netlify, reutilizando exactamente el mismo mecanismo
  (`express.json()`) que ya usa el resto de la API. Límite de 3MB por
  archivo (`CLIENTE_ARCHIVO_MAX_SIZE_BYTES`), pensado para no acercarse
  al límite de payload de las funciones de Netlify una vez el archivo
  crece ~33% al codificarse en base64. Solo se puede adjuntar a un
  cliente ya guardado (necesita un `clienteId` real), así que la
  sección de archivos no aparece en "Nuevo cliente", solo en "Editar".

### Decisiones de la Fase 2

- **Compra es una fila por ítem, no una tabla "Factura" aparte:** la
  especificación dice "cada compra debe registrarse asociada a una
  factura del proveedor, con: número de factura, condición de pago…" —
  se interpretó como campos denormalizados en cada fila de `Compra`
  (`facturaNumero`, `condicionPago`, `fechaVencimiento`), no como una
  tabla `Factura` separada. Esto es justo lo que necesitará más adelante
  el módulo de Cartera para agrupar CxP por factura (`facturaNumero` +
  `proveedorId`).
- **El "último precio de compra" se actualiza para cualquier categoría de
  Articulo, no solo materia prima:** la especificación dice literalmente
  "actualiza… el último precio de compra de cada artículo de materia
  prima", pero el modelo de `Articulo` (Fase 1) ya incluye las 5
  categorías con ese mismo campo, y el Módulo 2 dice que se compra
  "seleccionando el artículo ya creado en el Módulo 1" sin restringir la
  categoría. Restringir las compras solo a materia prima habría dejado
  sin forma de registrar compras de mano de obra, transporte, etc. —
  avísame si en realidad querías esa restricción.
- **Sin tabla de histórico separada:** "agrégalo a una tabla de
  historial" se cumple consultando los registros de `Compra` por
  `articuloId` (cada uno ya tiene fecha + precio + proveedor) en vez de
  duplicar esos mismos datos en una segunda tabla.
- **Las compras no se editan** una vez guardadas — son un hecho contable
  histórico; una compra mal digitada por lo demás se corrige con un
  nuevo registro, no sobrescribiendo el anterior. (Ver más abajo:
  aunque siguen sin poder editarse, desde el 2026-09-22 sí se pueden
  eliminar, restringido a Administrador.)
- **Auditoría:** cada compra guarda quién la registró
  (`registeredById` → `User`), siguiendo el requisito transversal de
  "historial/auditoría de cambios (quién y cuándo)".
- **Actualización post-lanzamiento (2026-09-21):** no se puede repetir un
  número de factura para el mismo proveedor (evita registrar la misma
  factura dos veces por error) — la validación es por
  `(proveedorId, facturaNumero)`, no global, porque distintos
  proveedores numeran sus facturas de forma independiente. No es una
  restricción a nivel de base de datos porque una factura real puede
  traer varios artículos (varias filas de `Compra` comparten a propósito
  el mismo número dentro de un mismo registro/lote) — la validación
  corre antes de crear el lote, contra compras ya existentes.
- **Actualización post-lanzamiento (2026-09-22):** se agregó "Eliminar"
  para poder corregir compras de prueba — a diferencia del resto del
  módulo (abierto a Administrador/Operación/Ventas), borrar una compra
  **solo lo puede hacer Administrador**, protegido además con la misma
  contraseña de autorización que ya se usa para eliminar ventas y
  artículos. Al eliminar, se recalcula el "último precio de compra" del
  artículo (toma la compra más reciente que quede, o $0 si no queda
  ninguna) y, si la compra era a crédito y era la última de su factura,
  se borra también la Cuenta por Pagar asociada — igual que ya se venía
  haciendo a mano por SQL para corregir compras de un proveedor
  completo. Se bloquea si esa factura ya tiene abonos/pagos registrados
  en Cartera (mismo criterio que bloquear el borrado de una venta con
  abonos).

### Decisiones de la Fase 3 (confirmadas contigo antes de construir)

- **"Valor antes de impuestos" siempre se digita manualmente** — no se
  autocalcula desde la opción de menú × personas (las cotizaciones reales
  se negocian). Confirmado.
- **Impuestos como parámetro configurable, no fijo:** agregaste que se
  factura con IVA 19%, IVA 5% e Impuesto al Consumo 8% — se modelaron
  como una tabla `TaxRate` editable (`/tax-rates`, solo Administrador),
  seleccionable por evento, igual que se hará con los % de nómina en la
  Fase 9. "Valor después de impuestos" = antes × (1 + tasa seleccionada).
- **Utilidad operacional se calcula sobre el valor antes de impuestos**
  (el impuesto cobrado no es ingreso real de la empresa). Confirmado.
- **`costoTotal` y `utilidadOperacional` no se guardan en la tabla
  `Evento`:** se calculan en el servicio a partir de los `EventoConsumo`
  cada vez que se consulta, para que nunca queden desactualizados si se
  agrega/edita/quita un consumo (regla de "datos derivados = solo
  lectura" de `CLAUDE.md`).
- **`unitCost` de cada consumo es automático** (tomado del último precio
  de compra del artículo en el momento de cargarlo) y no editable — la
  especificación dice literalmente "costo unitario tomado del último
  precio de compra". Si el artículo aún no tiene compras, el costo
  queda en $0 con una advertencia visual, en vez de bloquear la carga.
- **Los consumos sí se pueden editar/quitar** (a diferencia de las
  compras): mientras se arma el evento es un borrador de planeación, no
  un hecho contable cerrado.
- **Pruebas unitarias:** las fórmulas (costo total, % de costo, utilidad
  operacional, valor después de impuestos, subtotal de consumo) están
  aisladas en `evento.calculations.ts` y probadas con Vitest — primer
  framework de pruebas del proyecto, agregado en esta fase.
- **Actualización post-lanzamiento (2026-09-22):** se agregó
  `Evento.vendedorId` (FK a `User`, nullable) — el negocio pidió poder
  elegir vendedor también al crear una venta directamente en este
  módulo (antes solo existía en Negocio/Cotización/AgendaEvento). Al
  ganar un negocio desde el CRM, el Evento que se crea automáticamente
  hereda el vendedor del negocio en vez de quedar sin asignar.
- **Actualización post-lanzamiento (2026-09-22):** `unitCost` de un
  consumo dejó de ser solo "el último precio de compra" — ahora es el
  promedio entre el último precio de compra y el costo del inventario
  inicial más reciente ingresado para el artículo (ver
  `calcularCostoUnitarioPromedio` en `evento.calculations.ts`); sin
  inventario inicial registrado, se sigue usando solo el último precio
  de compra.

### Decisiones de la Fase 4

- **Inventario inicial en cantidad + valor $, no solo cantidad:** la
  especificación no dice en qué unidad va "inventario inicial", pero el
  futuro Módulo 8 (Juego de Inventarios) necesita "CMV = Inventario
  inicial + Compras − Inventario final" **en pesos**, y esa misma fórmula
  no se puede sumar en cantidad física entre artículos con unidades
  distintas (kg, litros, unidades). Por eso cada `InventarioInicial`
  guarda cantidad (para el detalle operativo por artículo) y un costo
  unitario × cantidad = valor (para el consolidado y para que el Módulo 8
  lo consuma directo). El costo unitario por defecto es el último precio
  de compra vigente del artículo, pero el operador puede sobrescribirlo.
- **"Inventario inicial" es un conteo atado a una fecha exacta** (inicio
  del período que se está viendo), no un saldo que se arrastra
  automáticamente de un período a otro — la especificación dice
  literalmente "ingreso manual por el operador al iniciar cada período".
  Si no se ha registrado para la fecha de inicio elegida, la fila lo
  marca como "Sin registrar" (se asume 0) en vez de adivinar un valor.
- **"Costos y consumos" del período se toma de `EventoConsumo` filtrado
  por la fecha del evento** (`evento.fecha`), no por la fecha en que se
  cargó el consumo en el sistema — un consumo cargado hoy para un evento
  de la semana pasada debe contar en el inventario de la semana pasada.
- **Solo artículos activos** aparecen en el reporte (los inactivos no
  deberían seguir consumiéndose/comprándose).
- **Pruebas unitarias** para la fórmula de inventario final en
  `inventario.calculations.ts` (Vitest), tal como pide `CLAUDE.md`
  explícitamente ("inventario final" está en la lista de fórmulas a
  probar).

### Decisiones de la Fase 5

- **Se resolvió una contradicción de la especificación:** el texto dice
  "Mano de obra tercerizada (mano de obra + artistas)" como un indicador,
  pero la nota justo debajo dice "transporte y servicios artísticos se
  muestran cada uno en su propio indicador, sin duplicar la categoría de
  mano de obra". Se tomó la nota como la instrucción vigente: 4
  indicadores de costo que NO se solapan (materia prima, mano de obra,
  transporte, artístico), calcados uno a uno de las categorías de
  `Articulo` ya definidas en la Fase 1. Avísame si en realidad querías
  fusionar mano de obra + artistas en un solo indicador.
- **El Dashboard reemplazó la pantalla de inicio placeholder** (`/`) —
  tal como dice la especificación, es la "pantalla principal".
- **Reutilicé las fórmulas ya probadas del Módulo 3**
  (`calcularCostoPorcentaje`, `calcularUtilidadOperacional` de
  `evento.calculations.ts`) en vez de duplicarlas para el dashboard — son
  la misma fórmula (valor / venta × 100), así que no se agregaron pruebas
  nuevas para ellas aquí.
- **"Ventas totales" = suma de `valorAntesImpuestos`** de los eventos del
  período, consistente con la decisión de la Fase 3 de calcular la
  utilidad sobre el valor antes de impuestos.
- **Extraje el selector de período** (`usePeriodFilter` +
  `PeriodPickerControls`) y la tarjeta KPI (`KpiCard`) a componentes
  compartidos, porque esta es la segunda pantalla (después de Inventario)
  que necesita exactamente el mismo patrón — evita duplicar la lógica de
  cálculo de rango de fechas.
- **Se agregó `recharts`** (mencionado como opción válida en `CLAUDE.md`)
  para el gráfico de dona (composición de costos) y el de líneas
  (tendencia de ventas/utilidad).

### Decisiones de la Fase 6

- **Un solo registro por (año, mes), con 9 columnas fijas** (no un
  catálogo abierto como `Articulo`): la especificación lista rubros
  exactos y puntuales ("Arriendo", "Nómina", "Servicios públicos"…), no
  una taxonomía que el usuario deba poder ampliar libremente.
- **Solo Administrador** tiene acceso — la especificación no lo dice
  explícitamente para este módulo, pero es información financiera de
  back-office que no encaja en "Operación: compras, inventario, eventos"
  ni en "Ventas: solo CRM".
- **`total` no se guarda:** se calcula sumando los 9 rubros
  (`calcularTotalGastosAdministrativos`, con pruebas unitarias) cada vez
  que se consulta, para que el futuro Estado de Resultados nunca lo lea
  desactualizado.
- **"Nómina" aquí es un solo valor manual** (nómina administrativa del
  mes) — no tiene relación con el futuro Módulo de Nómina de Cocina
  (Fase 9), que calculará la liquidación detallada de turnos; la
  especificación los distingue explícitamente ("Nómina (administrativa,
  distinta de la nómina de cocina del Módulo 9)").
- **Actualización post-lanzamiento (2026-09-10):** se agregaron dos
  rubros fijos más, **Publicidad** y **Lavandería**, a pedido directo del
  negocio (no estaban en la especificación original). Se sumaron a
  `GASTO_ADMINISTRATIVO_RUBROS` (el total y el Estado de Resultados los
  recogen automáticamente, sin tocar su fórmula) y se agregó la
  migración de base de datos correspondiente a cada uno.

### Decisiones de la Fase 7

- **CMV se restringe a artículos de categoría Materia Prima:** la
  especificación de este módulo no repite el alcance de "CMV", pero el
  Dashboard (Fase 5) ya lo define explícitamente así ("Costo de
  Mercancía Vendida (CMV): solo artículos de categoría 'Materia prima'"),
  y es la definición contable estándar (mano de obra/transporte/artístico
  son gastos operativos, no "mercancía"). Se aplicó la misma definición
  aquí por consistencia. Avísame si querías un alcance distinto.
- **`InventarioFinalFisico` es una tabla nueva, no reutiliza
  `InventarioInicial`:** mismo patrón (cantidad + valor $, único por
  artículo+fecha) pero es conceptualmente el CIERRE de un período, no el
  inicio — y la especificación es explícita en que es "independiente del
  inventario final 'de sistema'".
- **El conteo físico se registra por artículo, no como un solo total
  agregado:** aunque la especificación solo pide mostrar el CMV
  consolidado (valor, %, desviación), capturar el conteo por artículo
  permite detectar el objetivo real del módulo — "identificar mermas,
  pérdidas o descuadres" — en el artículo específico donde ocurren, no
  solo un número global.
- **La desviación se calculó como % relativo al CMV teórico**
  (`(real − teórico) / |teórico| × 100`), no como % sobre la venta —
  responde a "qué tanto se desvió el real de lo esperado", que es lo que
  pide la especificación ("Desviación entre el CMV real y el CMV
  teórico"). El valor y % sobre-la-venta de CMV teórico/real sí siguen
  esa convención por separado, tal como pide la especificación.
- **Reutilicé la fórmula del Módulo 4** (`calcularInventarioFinal`) para
  el CMV, porque son matemáticamente la misma fórmula (inicial + compras
  − final); solo la desviación es lógica genuinamente nueva y tiene sus
  propias pruebas.

### Decisiones de la Fase 8 (financiera — Módulo explícitamente marcado en `CLAUDE.md` para confirmar antes de asumir; ambas confirmadas por el usuario)

- **"Gastos de venta" = todo consumo de eventos que NO es materia
  prima** (mano de obra, transporte, artístico, alquiler de menaje). La
  especificación lista "mano de obra tercerizada, alquiler de menaje,
  servicios artísticos, servicios de transporte **y alquileres en
  general**" — ese último ítem repite "alquiler de menaje" (mismo patrón
  que el duplicado "Transporte"/"Servicio de transporte" del Módulo 1).
  **Confirmado con el usuario:** sí se agrupan como un mismo concepto, no
  hay una categoría de "alquileres" aparte.
- **"Gastos administrativos" = el total completo del Módulo 6 (9
  rubros), no un subconjunto distinto.** La especificación de este pilar
  menciona "liquidaciones" (un rubro que no existe en ningún otro lugar
  del sistema) y omite "control de plagas" (que sí es un rubro real ya
  registrado) — un listado inconsistente con el que ya construimos en la
  Fase 6. **Confirmado con el usuario:** se sigue con lo ya construido en
  el Módulo 6, sin agregar "liquidaciones" como rubro nuevo.
- **Gastos administrativos por mes calendario, sin prorrateo:** si el
  período consultado no coincide exactamente con un mes, se incluye el
  total completo de cada mes que se solape con el rango (no se divide
  por día) — la especificación no pide ese nivel de detalle y el Módulo
  6 solo registra a nivel mensual.
- **Sin tabla propia:** el Estado de Resultados no persiste nada — el
  servicio combina en vivo los reportes de Eventos, Juego de Inventarios
  y Gastos Administrativos, así que nunca puede quedar desactualizado
  respecto a esos módulos.

### Decisiones de la Fase 9 (financiera — Módulo explícitamente marcado en `CLAUDE.md` para confirmar antes de asumir; valores confirmados por el usuario con capturas de pantalla)

- **Valores legales confirmados:** SMLV 2026 = $1.750.905, divisor de
  horas = 210/mes (verificado matemáticamente: $1.750.905 ÷ 210 =
  $8.337,64, y ese valor × 1,25 / × 1,75 reproduce exactamente los
  $10.422 / $14.591 de hora extra diurna/nocturna que confirmó el
  usuario), auxilio de transporte = $249.095/mes, y los 7 recargos
  (nocturno 35%, extra diurna 25%, extra nocturna 75%, dominical/festiva
  90%, nocturno en dominical/festivo 125%, extra diurna dom/fest 115%,
  extra nocturna dom/fest 165%).
- **Alcance limitado al devengado quincenal** (horas × tarifas + auxilio
  de transporte prorrateado) — **confirmado con el usuario**: el motor
  completo de prestaciones sociales/parafiscales (cesantías, prima,
  vacaciones, salud, pensión, ARL, caja de compensación…) queda
  explícitamente fuera de esta fase. Esos se liquidan en momentos
  distintos al pago quincenal (anual/semestral) y no forman parte de
  "el valor final a pagar" de una liquidación quincenal de horas.
- **Jornada ordinaria = primeras 8 horas de CADA turno** (no un
  acumulado semanal) para determinar qué es "hora extra". La
  especificación no define el umbral exacto por turno — 8h/turno es la
  referencia estándar que usa la mayoría del software de nómina
  colombiano para turnos individuales. Avísame si tu operación maneja
  turnos con un umbral distinto.
- **Calendario de festivos administrable, no hardcodeado:** Colombia no
  tiene un único estándar embebible de forma confiable (la Ley Emiliani
  mueve varios festivos al lunes siguiente, y la lista cambia cada año),
  así que se modeló como una tabla editable (`/nomina/parametros`) que el
  Administrador debe poblar — **queda vacía por defecto**, no se
  precargaron festivos de ningún año.
- **Domingo y festivo se tratan como el mismo concepto para efectos de
  recargo** (no hay una tarifa distinta para "festiva" vs. "dominical"),
  porque los 7 recargos que confirmó el usuario no distinguen entre
  ambos — solo hablan de "dominical o festiva".
- **Un turno se atribuye completo al período donde inicia** (por
  `horaEntrada`) — un turno que cruza la medianoche de fin de quincena no
  se parte entre las dos quincenas.
- **Toda la clasificación horaria usa UTC-5 fijo** (Colombia no tiene
  horario de verano), calculado explícitamente en el backend y en el
  frontend (al convertir los campos `datetime-local` del formulario de
  corrección de turnos), para que el resultado no dependa de en qué zona
  horaria esté corriendo el servidor o el navegador del operador.
- **Nav lateral filtrado por rol:** ahora que Cocina/Nómina tiene su
  primera pantalla real ("Mi Turno"), se filtró el menú lateral según
  `user.role` (antes mostraba enlaces a módulos inaccesibles para
  Cocina/Nómina y Ventas). También se ajustó el destino de "/" tras el
  login para que Cocina/Nómina llegue directo a su módulo en vez de un
  Dashboard que le devolvería 403.

### Decisiones de la Fase 10 (Módulo explícitamente marcado en `CLAUDE.md` para confirmar antes de asumir)

- **El "cliente" del CRM es texto libre, no un FK a Cliente:** la
  especificación lista "Nombre o razón social", "Cédula/NIT (opcional)"
  y "Teléfono" como campos propios del negocio, no "seleccionar cliente
  del Módulo 1" — coherente con que el CRM gestiona *prospectos*, que
  pueden no ser todavía un Cliente registrado. Al ganar, se busca un
  Cliente existente (por identificación, si se dio, o por nombre exacto)
  y solo si no existe se crea uno nuevo — evita duplicar clientes ya
  registrados.
- **"Ganar" pide opción de menú y número de personas en ese momento, no
  se agregan como campos del negocio:** la especificación del CRM no los
  lista, pero mi `Evento` del Módulo 3 los exige como obligatorios (sin
  ellos no se puede calcular costo/utilidad del evento). En vez de
  relajar esa validación (dejaría eventos "a medias" flotando por el
  sistema) o inventar campos nuevos en el negocio, se piden como parte
  del propio acto de ganar — mismo patrón que ya describe la
  especificación para la futura Fase 11 (Agenda de Eventos): "precargar
  los campos que ya existen... para que el operador solo complete los
  campos [adicionales]". Avísame si preferías otro enfoque (por ejemplo,
  permitir un Evento "borrador" incompleto).
- **"Evento" (el campo de la especificación) se interpretó como una
  descripción corta del tipo de evento** (ej. "Boda", "Cumpleaños 50
  años"), no como un vínculo al Módulo 3 — ese vínculo (`eventoId`) solo
  existe después de ganar.
- **Solo se puede editar un negocio mientras está "Cotizado"**; "Perdido"
  y "Ganado" quedan congelados como registro histórico (mismo principio
  de trazabilidad que Compra/EventoConsumo en fases anteriores). No hay
  forma de revertir "Ganado" a "Cotizado" — deshacerlo implicaría
  también deshacer el Evento y el Cliente creados, que es un caso de
  corrección manual, no un flujo normal del embudo de ventas.
- **Acceso de solo lectura ampliado a Ventas** en Opciones de Menú y
  Parámetros Fiscales (antes solo Administrador/Operación), porque el
  diálogo de "Ganar" los necesita para elegir la opción de menú y la
  tasa de impuesto — sin poder crear/editar ninguno de los dos.
- **Actualización post-lanzamiento (2026-09-21):** se revirtió la
  decisión de "cliente = texto libre" de arriba — el negocio pidió que el
  CRM solo permita seleccionar clientes ya creados en el Módulo 1 (evita
  duplicados y errores de digitación como el que fusionó dos clientes
  distintos con identificación "n/a"). Se agregó `Negocio.clienteId`
  (FK a Cliente, nullable para no romper negocios ya existentes) —
  `clienteNombre`/`clienteIdentificacion`/`telefono` se conservan como
  copia tomada del Cliente al crear/editar, para no tener que tocar el
  resto del CRM, el PDF de cotización, etc. Al ganar un negocio con
  `clienteId`, ya no se busca/crea el Cliente por nombre — se usa
  directamente. La Cotización (ver más abajo) sigue capturando el
  cliente como texto libre y no pasa por esta validación: sigue siendo
  válido cotizar a alguien que todavía no es Cliente registrado; si esa
  cotización se gana, el Cliente se resuelve con el flujo anterior
  (busca por identificación/nombre o lo crea).

### Decisiones de la Fase 11

- **La Agenda es una extensión 1-a-1 del Evento, no una tabla con copias
  de sus datos.** La especificación pide explícitamente que "fecha,
  cliente/menú, valor antes de impuestos" queden "sincronizados" con el
  Módulo 3 "para no tener información contradictoria" — la forma más
  confiable de cumplir eso no es escribir lógica que copie cambios de un
  lado a otro (que siempre se puede romper u olvidar), sino no duplicar
  esos campos en absoluto: se leen en vivo del Evento vinculado por FK
  único. Por la misma razón se extendió esto a "número de personas",
  aunque la especificación no lo nombra explícitamente en la lista de
  "campos compartidos" — es un dato del Módulo 3 igual que los otros.
- **"Vendedor" sí es un campo propio de la Agenda** (no derivado de
  Evento, que no tiene ese concepto) — se precarga desde
  `Negocio.vendedorId` al ganar, pero queda editable después, y también
  se puede asignar manualmente en registros creados sin pasar por CRM.
- **Se puede crear un registro de Agenda manualmente para un Evento que
  no vino del CRM** — no todo evento nace de una cotización en el CRM;
  Operación puede haberlo registrado directo en el Módulo 3. El selector
  de "eventos disponibles" excluye los que ya tienen agenda (la relación
  es 1-a-1).
- **Vista de calendario sin librería externa:** se construyó una grilla
  simple (semanas completas cubriendo el rango del filtro de período ya
  existente) en vez de agregar una dependencia nueva — el mismo filtro
  de período (día/semana/quincena/mes/personalizado) alimenta tanto la
  vista de Lista como la de Calendario, solo cambia cómo se renderiza.
- **El filtro por "estado" del anticipo se aplica en memoria, no en la
  consulta SQL** — como el estado es derivado (no una columna), comparar
  `anticipo` contra `evento.valorAntesImpuestos` (dos tablas distintas)
  en una sola consulta sería más complejo que filtrar la lista ya
  calculada; el volumen de datos de un negocio de este tamaño hace que
  esto no tenga impacto real de rendimiento.

### Decisiones de la Fase 12 (último módulo del plan de fases)

- **"Evento facturado" = todo `Evento`, sin un paso de facturación
  aparte.** La especificación dice "un registro de CxC por cada evento
  **facturado** en el Módulo 3", pero el sistema no tiene ningún
  concepto de "facturar" un evento como algo distinto de crearlo — el
  Módulo 3 no tiene un estado "borrador vs. facturado". Inventar ese
  estado nuevo solo para este módulo habría sido un cambio de alcance no
  pedido; se tomó "facturado" como equivalente a "existe en el Módulo
  3". Avísame si en tu operación sí hay una distinción real entre
  "evento registrado" y "evento facturado" que debería modelarse.
- **Vencimiento de CxC = fecha del evento, no un campo separado.** La
  especificación pide "fecha de vencimiento de pago" para CxC pero
  también dice que en Cartera "solo se editan/agregan los abonos y su
  fecha de pago" (es decir, ni siquiera el vencimiento es editable aquí)
  — no hay ningún otro lugar del sistema donde se capture una fecha de
  vencimiento para un evento, así que se usó la fecha del propio evento
  (tiene sentido para catering: el saldo se espera cobrado el día del
  servicio). Avísame si preferías una regla distinta (ej. "N días
  después del evento").
- **CxP se genera únicamente para compras a crédito**, agrupando por
  factura (proveedor + número de factura) tal como ya lo dejé preparado
  en la Fase 2. Una compra de contado ya está saldada al momento de
  registrarse — generar una CxP para ella y marcarla "Pagada" de
  inmediato no aporta nada de información nueva.
- **Ni `CuentaPorPagar` ni el CxC guardan valor de factura ni fecha de
  vencimiento propios** — se leen en vivo de las líneas de `Compra`
  (para CxP) o del `Evento`/`AgendaEvento` (para CxC). Mismo principio
  de "no duplicar, extender" que ya usé en Agenda (Fase 11): la
  especificación exige que estos campos no queden contradictorios entre
  módulos, y la única forma de garantizar eso estructuralmente es no
  copiarlos.
- **Los abonos viven en un ledger propio** (`Abono`, con fecha y quién
  lo registró — no un campo `saldo` que se sobrescribe), para tener el
  historial completo de pagos parciales y cumplir el requisito de
  auditoría transversal de `CLAUDE.md` ("quién y cuándo").
- **Solo Administrador tiene acceso** — igual que Estado de Resultados y
  Gastos Administrativos, es información financiera de cobros/pagos que
  no encaja en el alcance descrito para Operación ni Ventas.

---

Con esto quedan completas las 12 fases de construcción de módulos del
plan (`docs/plan_fases.md`). Lo único que falta del plan original es la
**Fase 13 — Pulido general**: consistencia visual, exportación a Excel/
PDF en los módulos financieros, manejo de errores y revisión de
auditoría — es una revisión transversal de lo ya construido, no un
módulo nuevo.
