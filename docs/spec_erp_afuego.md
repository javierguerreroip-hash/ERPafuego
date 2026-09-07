PROMPT MAESTRO — SISTEMA ERP MODULAR PARA A FUEGO CATERING
============================================================

CONTEXTO DEL NEGOCIO
---------------------
A Fuego Catering es una empresa de catering y eventos (parrillas, paellas,
bocados, refrigerios, montajes empresariales y familiares) que opera desde
2008 en Medellín y alrededores. Vende "opciones de menú" cotizadas por
persona/evento y necesita reemplazar el control manual actual por un ERP
web modular, interactivo e intuitivo, que centralice: catálogo de
artículos/servicios, terceros, compras, ventas y costos por evento,
inventario en tiempo real, gastos administrativos, comparación de
inventarios (CMV teórico vs. real), estado de resultados, nómina de
cocina y CRM comercial.

ROL Y TAREA PARA LA IA / EQUIPO DE DESARROLLO
-----------------------------------------------
Actúa como arquitecto de software y desarrollador full-stack senior
especializado en sistemas ERP para PYMES. Diseña y construye una
aplicación web modular, con base de datos relacional, interfaz gráfica
intuitiva (dashboards, tablas editables, formularios con validación,
navegación por módulos en un menú lateral) y control de roles de usuario.
Cada módulo descrito abajo debe construirse en el orden indicado, ya que
existen dependencias de datos entre módulos (los módulos posteriores
consumen información generada en los módulos anteriores).

REQUISITOS TRANSVERSALES (APLICAN A TODO EL SISTEMA)
-------------------------------------------------------
- Interfaz intuitiva, visual, con gráficos (barras, dona/pie, líneas) y
  tablas dinámicas filtrables por fecha, cliente, categoría y evento.
- Todos los valores monetarios en pesos colombianos (COP), con opción de
  ver en valor absoluto y en porcentaje donde se indique.
- Todo dato que provenga de otro módulo debe ser de "solo lectura" en el
  módulo destino (no editable manualmente), para mantener la trazabilidad
  entre compras → inventario → costos → estado de resultados.
- Historial/auditoría de cambios (quién y cuándo registró o modificó un
  dato).
- Roles de usuario: Administrador/Gerencia (acceso total), Operación
  (compras, inventario, eventos), Cocina/Nómina (solo su módulo), Ventas
  (solo CRM).
- Exportación de reportes a Excel/PDF en los módulos financieros.

============================================================
MÓDULO 1 — MAESTROS: ARTÍCULOS/SERVICIOS Y TERCEROS
============================================================
1.1 Creación de artículos y servicios, clasificados por categoría:
    a) Materia prima
    b) Mano de obra (tercerizada)
    c) Servicio de transporte
    d) Servicios artísticos
    e) Alquiler de menaje y equipos
    f) Transporte
    Cada artículo/servicio debe registrar: código, nombre, categoría,
    unidad de medida, último precio de compra (se autoactualiza desde el
    Módulo 2), estado (activo/inactivo).

    Usa como catálogo semilla las opciones de venta del menú vigente
    "CARTA 2026" (ver Anexo A al final de este documento) para poblar
    los artículos/opciones que se pueden vender y así relacionarlos
    luego con los eventos del Módulo 3. Cada opción del menú debe quedar
    registrada con: nombre de la opción, categoría (Momentos/Fuertes,
    Parrilla, Paellas, Bocados/Snacks, Refrigerios, Infantil, Adicionales),
    descripción completa (ingredientes/composición) y precio de venta por
    persona o por unidad, según corresponda.

1.2 Creación de clientes: nombre o razón social, identificación
    (cédula/NIT), teléfono, correo, dirección, ciudad.

1.3 Creación de proveedores: nombre o razón social, identificación
    (NIT), teléfono, correo, categoría de lo que provee (materia prima,
    transporte, artistas, menaje, etc.).

============================================================
MÓDULO 2 — REGISTRO DE COMPRAS
============================================================
- Cada compra se registra ítem por ítem, seleccionando el artículo ya
  creado en el Módulo 1, con: proveedor, fecha, cantidad, unidad de
  medida, precio unitario y valor total.
- Cada compra debe registrarse asociada a una factura del proveedor,
  con: número de factura, condición de pago (contado / crédito) y,
  si es a crédito, fecha de vencimiento del pago. Estos datos son los
  que alimentarán las Cuentas por Pagar del módulo de Cartera.
- El sistema debe actualizar automáticamente el "último precio de
  compra" de cada artículo de materia prima en el Módulo 1, para poder
  consultarlo fácilmente en cualquier momento.
- Debe existir un histórico de precios de compra por artículo (línea de
  tiempo/tabla) para análisis de variación de precios.
- Esta información alimenta automáticamente:
    * Módulo 4 (Inventario) → variable "Compras".
    * Módulo 8 (Juego de Inventarios) → cálculo del CMV.
    * Módulo de Cartera → Cuentas por Pagar (una por cada factura de
      compra registrada).

============================================================
MÓDULO 3 — VENTAS Y COSTOS POR EVENTO
============================================================
Organiza la información por cada evento vendido, con una fila/registro
por evento que contenga:
- Fecha del evento
- Nombre del cliente
- Opción de menú vendida (del catálogo del Módulo 1)
- Número de personas
- Valor antes de impuestos
- Valor después de impuestos
- Costos asociados al evento
- Utilidad operacional del evento (valor y %)

Funcionalidad clave: al hacer doble clic sobre un evento, se debe abrir
una vista de detalle donde el operador pueda cargar, artículo por
artículo, los consumos de materia prima y servicios que requiere ese
evento específico (seleccionados del catálogo del Módulo 1, con
cantidad y costo unitario tomado del último precio de compra).

Cálculos que debe mostrar el módulo, por evento y consolidado:
- Costo total del evento, en $ y en % sobre la venta.
- Utilidad operacional del evento = Valor venta − Costos asociados,
  en $ y en %.

Esta información alimenta automáticamente:
    * Módulo 4 (Inventario) → variable "Costos y consumos".
    * Módulo 5 (Dashboard) → ventas, costos y utilidad totales.
    * Módulo 8 (Estado de Resultados) → ingresos y CMV.
    * Módulo de Cartera → Cuentas por Cobrar (una por cada evento
      facturado).

============================================================
MÓDULO 4 — INVENTARIO EN TIEMPO REAL
============================================================
Control de inventario filtrable por rango de fechas, con cuatro
variables por período:
1. Inventario inicial → ingreso manual por el operador al iniciar cada
   período.
2. Compras → se alimenta automáticamente desde el Módulo 2.
3. Costos y consumos → se alimenta automáticamente desde los consumos
   cargados en el Módulo 3 (por evento).
4. Inventario final → calculado automáticamente:
   Inventario final = Inventario inicial + Compras − Consumo

El módulo debe permitir ver el detalle por artículo y el consolidado
general, con filtro de fechas (día, semana, mes, período personalizado).

============================================================
PANTALLA PRINCIPAL — DASHBOARD GENERAL
============================================================
Indicadores gráficos (valor $ y % ), filtrables por período:
- Ventas totales
- Costos totales
- Utilidad operativa total ($ y %)
- Costo de mercancía vendida (CMV): solo artículos de categoría
  "Materia prima" — valor $ y % sobre la venta
- Mano de obra tercerizada (mano de obra + artistas): valor $ y %
- Servicios de transporte: valor $ y %
- Servicios artísticos: valor $ y %
(Nota: transporte y servicios artísticos se muestran cada uno en su
propio indicador, sin duplicar la categoría de mano de obra.)

Visualización sugerida: tarjetas KPI en la parte superior + gráficos de
barras/dona para composición de costos por categoría + gráfico de
tendencia de ventas/utilidad en el tiempo.

============================================================
MÓDULO — GASTOS ADMINISTRATIVOS
============================================================
Registro periódico (mensual) de gastos fijos administrativos:
- Arriendo
- Nómina (administrativa, distinta de la nómina de cocina del Módulo 9)
- Servicios públicos
- Honorarios de contador y socios
- Control de plagas
- Seguros
- Internet
- Adicionales
- Cuota de obligación financiera

Esta información alimenta automáticamente el Módulo de Estado de
Resultados (gastos administrativos).

============================================================
MÓDULO — JUEGO DE INVENTARIOS (CMV TEÓRICO VS. REAL)
============================================================
Objetivo: comparar el Costo de Mercancía Vendida (CMV) teórico contra el
CMV real y calcular la desviación.

Fórmula base: CMV = Inventario inicial + Compras − Inventario final

- CMV teórico: se calcula 100% con datos del sistema —
  Inventario inicial (Módulo 4) + Compras (Módulo 2) − Inventario final
  registrado en el sistema (Módulo 4).

- CMV real: se calcula con Inventario inicial (Módulo 4) + Compras
  (Módulo 2) − Inventario final físico, tomado del conteo real hecho en
  sitio/bodega (este inventario final físico se ingresa manualmente en
  este módulo, de forma independiente al inventario final "de sistema").

El módulo debe mostrar, para cada uno (teórico y real) de forma
independiente:
- Valor en pesos
- Porcentaje sobre la venta
- Desviación entre el CMV real y el CMV teórico (valor y %), para
  identificar mermas, pérdidas o descuadres de inventario.

============================================================
MÓDULO — ESTADO DE RESULTADOS
============================================================
Construido con cinco pilares, por período:

1. Ingreso total = Ventas totales del período (Módulo 3)
2. Costo de mercancía vendida = CMV real (Módulo "Juego de Inventarios")
3. Gastos de venta = suma de: mano de obra tercerizada, alquiler de
   menaje, servicios artísticos, servicios de transporte y alquileres en
   general.
4. Gastos administrativos = arriendo, nómina administrativa, servicios
   públicos, internet, honorarios de contador y socios, liquidaciones,
   seguros, compras adicionales y cuota de obligación financiera
   (Módulo Gastos Administrativos).
5. Utilidad neta = Ingreso total − CMV − Gastos de venta − Gastos
   administrativos, mostrada en valor ($) y en porcentaje (%) sobre la
   venta.

============================================================
MÓDULO — NÓMINA (COCINA)
============================================================
Módulo independiente con usuario propio para el/los empleado(s) de
cocina, donde el empleado registra hora de entrada y hora de salida por
turno.

El sistema debe liquidar automáticamente, según la normativa laboral
colombiana vigente (Código Sustantivo del Trabajo):
- Horas diurnas
- Horas nocturnas
- Horas festivas
- Horas dominicales
- Horas extra (diurnas, nocturnas, dominicales/festivas) cuando aplique

Consideraciones:
- El empleado devenga salario mínimo legal vigente, con todas las
  prestaciones/aportes de ley vigentes (parafiscales, seguridad social,
  prestaciones sociales).
- Los recargos y porcentajes legales (recargo nocturno, dominical/
  festivo, horas extra, etc.) deben quedar como PARÁMETROS
  CONFIGURABLES en el sistema (no fijos en el código), ya que la
  legislación laboral colombiana se actualiza periódicamente (por
  ejemplo cada año con el salario mínimo). Se recomienda validar los
  porcentajes vigentes con un contador o abogado laboral antes de
  poner el módulo en producción.
- Al cierre de cada quincena, el sistema debe mostrar el valor final a
  pagar al empleado, con el desglose de horas y recargos aplicados.

============================================================
MÓDULO — CRM DE VENTAS
============================================================
Gestión comercial de clientes potenciales y cotizaciones, con:
- Nombre o razón social del cliente
- Número de cédula/NIT (opcional)
- Teléfono
- Evento
- Fecha del evento
- Valor del evento antes de impuestos
- Etapa del negocio: Cotizado / Ganado / Perdido

Cuando un negocio pasa a "Ganado", debe poder convertirse/vincularse
automáticamente con un nuevo registro en el Módulo 3 (Ventas y Costos),
evitando doble digitación.

============================================================
MÓDULO — AGENDA DE EVENTOS
============================================================
Objetivo: tener un calendario/listado operativo de todos los eventos
confirmados, con la información logística necesaria para su ejecución
(distinta del detalle financiero, que vive en el Módulo 3).

Campos a diligenciar por evento:
- Fecha del evento
- Persona de contacto
- Número/teléfono de la persona de contacto
- Número de personas
- Menú elegido (seleccionado del catálogo del Módulo 1)
- Dirección del evento
- Hora de servicio
- Valor antes de impuestos
- Anticipo (valor recibido) → el sistema debe calcular automáticamente
  el saldo pendiente = Valor antes de impuestos − Anticipo
- Vendedor (responsable comercial del evento)
- Observaciones adicionales (campo de texto libre)

Reglas de integración (para evitar doble digitación):
- Cuando un negocio del CRM pasa a "Ganado", el sistema debe crear
  automáticamente el registro correspondiente tanto en el Módulo 3
  (Ventas y Costos) como en la Agenda de Eventos, precargando los
  campos que ya existen en el CRM (cliente, fecha, valor antes de
  impuestos, vendedor si aplica) para que el operador solo complete los
  campos logísticos adicionales (contacto, dirección, hora de servicio,
  anticipo, observaciones).
- Los campos compartidos con el Módulo 3 (fecha, cliente/menú, valor
  antes de impuestos) deben quedar sincronizados: si se edita en uno,
  se refleja en el otro, para no tener información contradictoria entre
  la parte comercial/financiera y la parte operativa.

Vista de la agenda:
- Vista de calendario (mensual/semanal) y vista de lista, ambas
  filtrables por fecha, vendedor y estado (con anticipo pagado / saldo
  pendiente / sin anticipo).
- Cada evento debe mostrar de forma visible el saldo pendiente de cobro,
  para dar seguimiento a los anticipos faltantes antes de la fecha del
  evento.

============================================================
MÓDULO — CARTERA (CUENTAS POR COBRAR Y CUENTAS POR PAGAR)
============================================================
Objetivo: controlar el dinero pendiente por cobrar a clientes y por
pagar a proveedores, sin doble digitación, tomando la información de
los módulos que ya la generan.

7.1 CUENTAS POR COBRAR (CxC)
--------------------------------------------------------------
- Se genera automáticamente un registro de CxC por cada evento
  facturado en el Módulo 3 (Ventas y Costos), enlazado también con el
  anticipo registrado en la Agenda de Eventos si existe.
- Campos por registro: cliente, evento, fecha del evento/factura,
  valor total facturado (después de impuestos), anticipo recibido
  (desde Agenda de Eventos), saldo pendiente, fecha de vencimiento de
  pago, estado.
- Fórmula: Saldo pendiente = Valor total facturado − Anticipo −
  Abonos registrados.
- Estados: Pendiente, Pagada, Vencida (vencida = pendiente y con fecha
  de vencimiento ya pasada; el sistema debe recalcular este estado
  automáticamente, no manualmente).
- Debe permitir registrar abonos/pagos parciales del cliente; cuando el
  saldo llega a $0, el estado cambia automáticamente a "Pagada".

7.2 CUENTAS POR PAGAR (CxP)
--------------------------------------------------------------
- Se genera automáticamente un registro de CxP por cada factura de
  compra registrada en el Módulo 2 (Registro de compras), enlazada al
  proveedor correspondiente (Módulo 1).
- Campos por registro: proveedor, número de factura, fecha de compra,
  valor total de la factura, condición de pago, fecha de vencimiento,
  saldo pendiente, estado.
- Fórmula: Saldo pendiente = Valor total de la factura − Abonos
  realizados a esa factura.
- Estados: Pendiente, Pagada, Vencida (misma lógica de recálculo
  automático que en CxC).
- Debe permitir registrar abonos/pagos parciales a proveedores; cuando
  el saldo llega a $0, el estado cambia automáticamente a "Pagada".

7.3 VISTA GENERAL DE CARTERA
--------------------------------------------------------------
- Dos listados/tableros independientes (CxC y CxP), filtrables por
  cliente/proveedor, estado y rango de fechas.
- Totalizadores visibles: total cartera por cobrar, total cartera por
  pagar, total vencido en cada una.
- Todo registro de CxC y CxP debe ser de solo lectura en cuanto a los
  datos que vienen de Ventas (Módulo 3) o Compras (Módulo 2) — solo se
  editan/agregan los abonos y su fecha de pago.

============================================================
ANEXO A — CATÁLOGO DE OPCIONES DEL MENÚ "CARTA 2026"
(Fuente: A Fuego Catering — para poblar el Módulo 1)
============================================================

CATEGORÍA: MOMENTOS (ENTRADA + FUERTE) — Precio por persona
--------------------------------------------------------------
- Momento 100 MIL — Entrada: Porcheta de cerdo. Fuerte: 2 carnes (punta
  de anca/chata de 160gr) más churrasco de pollo de 120gr en romero y
  mostaza, papa americana, mezclum de lechugas con tomate cherry y
  vinagreta balsámica.
- Momento 100 MIL — Entrada: Ceviche de chicharrón. Fuerte: Beef
  chorizo/churrasco argentino entre 220 y 250gr, mezclum de lechugas con
  tomate cherry, vinagreta balsámica y puré de papa cremoso.
- Momento 95 MIL — Entrada: Pinchos de langostinos. Fuerte: Solomito
  baby beef de 220gr, mezclum de lechugas con tomate cherry, vinagreta
  balsámica y papa en casco.
- Momento 95 MIL — Entrada: Ensalada de mezclum, queso feta, jamón
  serrano y duraznos. Fuerte: Punta de anca 200gr, mezclum de lechugas,
  tomate cherry, vinagreta balsámica, papas provenzales, acompañado de
  chimichurri.
- Momento 90 MIL — Fuerte: Solomito/punta de anca con mezclum de
  lechugas, tomate cherry, vinagreta balsámica y papa al vapor.
- Momento 90 MIL — Fuerte: Rack de costillas 450gr en BBQ de guayaba,
  milhoja de papa.
- Momento 90 MIL (x2 variantes adicionales según carta, mismo rango de
  precio).

CATEGORÍA: FUERTE INDIVIDUAL — Precio por persona
--------------------------------------------------------------
- Hamburguesa Angus 75 MIL — Pan y carne artesanal de 150gr, tocineta,
  queso, cebolla caramelizada, tomate, lechuga y salsa.
  Adicionales: Papas chip 40 MIL / Papas francesas 45 MIL.
- Fuerte 65 MIL (variante de menú del día / opción económica).

CATEGORÍA: PARRILLA (MOMENTOS EN PARRILLA) — Precio por persona
--------------------------------------------------------------
- Parrilla 10 Momentos — 110 MIL — Costillas, punta de anca, choripán
  argentino, ceviche de chicharrón, tacos de carnitas, perritos de
  camarones, elote, arepas con guacamole, queso asado, pinchos de
  vegetales con pesto.
- Parrilla 9 Momentos — 90 MIL — Punta de anca, pollo, chicharrón,
  morcilla, costilla, queso asado, choripán argentino, solomito de res,
  piña asada. Guarniciones: papa, tostones, arepas, guacamole y hogao.
- Parrilla 7 Momentos — 80 MIL — Punta de anca, pollo, chicharrón,
  morcilla, costilla, queso asado, choripán argentino. Guarniciones:
  papa, tostones, arepas, guacamole y hogao.
- Parrilla 5 Momentos — 70 MIL — Ceviche de chicharrón, tacos de pulled
  pork, punta de anca, trenza de chorizos, queso asado con mermelada de
  tomate. Guarniciones: papa, tostones, arepas, guacamole y hogao.

CATEGORÍA: PAELLAS — Precio por persona
--------------------------------------------------------------
- Paella Valenciana — 95 MIL — Colas de langosta, langostinos, camarones,
  anillos de calamar, pulpo, mejillón y palmitos de cangrejo. Acompañada
  de alioli, baguette y limón.
- Paella Marinera Especial — 80 MIL — Langostinos, camarones, anillos de
  calamar, pulpo, mejillón y palmitos de cangrejo.
- Paella Mixta — 65 MIL — Langostinos, camarones, anillos de calamar,
  mejillones, costilla, chorizo, pierna de cerdo y colombinas de pollo.
- Paella Marinera — 55 MIL — Costilla de cerdo, colombinas de pollo,
  chorizo y pierna de cerdo.
- Paella Vegetariana — 55 MIL — Base de arroz preparada en fondo de
  vegetales, con espárragos, setas, guisantes y tofu.
Nota: el transporte y el servicio se cotizan según cantidad de personas
y ubicación del evento (aplica también a Parrillas).

CATEGORÍA: MENÚ INFANTIL — Precio por unidad
--------------------------------------------------------------
- Nuggets de pollo con chips de papa — 25 MIL
- Mini hamburguesa — 25 MIL
- Mini chuzo de pollo con chips de papa — 30 MIL

CATEGORÍA: BOCADOS A FUEGO / TAPAS Y MONTADITOS — Precio por unidad
(cantidad mínima 4 tipos de snacks, mínimo 15 unidades de cada uno)
--------------------------------------------------------------
- Shot dip tomate seco con grissini — 7 MIL
- Shot de arándanos, tocineta con grissini — 12 MIL
- Langostino apanado — 12 MIL
- Empanada de lechona — 5 MIL
- Pastel de pollo — 5 MIL
- Tabla de madurados — 12 MIL
- Ceviche de chicharrón — 12 MIL
- Baos de bondiola ahumada — 10 MIL
- Montaditos o tapas (tomates secos y jamón serrano) — 10 MIL
- Montaditos (70gr de carne de res, queso, tomate y cogollo) — 160 MIL
  (precio de referencia por tabla/lote — validar unidad de medida)
- Bocados de choripán — 9 MIL
- Mini hamburguesa (bocado) — 12 MIL
- Perrito (salchicha americana, salsas y ripio) — 8 MIL
- Mini wrap de pollo — 10 MIL
- Elotes dulces — 8 MIL
- Canasticas de plátano con carne desmechada — 10 MIL
- Arepitas de queso — 7 MIL
- Cóctel de camarones con guacamole y chicharrón — 12 MIL
- Ceviche (pesca blanca en leche de tigre) — 12 MIL
- Shot de parfait — 12 MIL
- Burritos mexicanos — 14 MIL
- Totopos (lluvia de totopos con salsa taquera) — 12 MIL
Adicionales del módulo de bocados: montaje de mesa +150.000; transporte
Medellín y alrededores 80.000; pedido con mínimo 3 días de anticipación.

CATEGORÍA: REFRIGERIOS — Precio por persona
(pedido mínimo 15 unidades iguales, mínimo 2 días de anticipación,
domicilio según ubicación)
--------------------------------------------------------------
- Sánduche Burrata (pan de avena y masa madre, jamón de pavo, burrata,
  tomate seco, rúgula y aderezo de mostaza) — 25 MIL. Acompañante:
  brownie, fruta picada, papa chip o corazón hojaldrado.
- Sándwich Club (pan molde dorado, jamón de cerdo, pollo, queso, tomate,
  lechuga y aderezo de la casa) — 21 MIL. Mismo acompañante.
- Burro Mexicano (tortilla, frijol refrito, carne molida, pico de gallo,
  guacamole, sour cream, lechuga y queso) — 22 MIL. Acompañante: lluvia
  de totopos.
- Parfait (granola natural, yogurt griego, frutas y mermelada de frutos
  rojos, en recipiente de vidrio) — 15 MIL.
- Wrap de pollo (tortilla, cubos de pollo, lechuga y aderezo) — 19 MIL.
  Acompañante: chips de plátano.
- Croissant de tocineta y queso crema dulce — 18 MIL. Acompañante:
  alfajor, brownie o fruta.
- Croissant de jamón serrano y aceitunas — 18 MIL. Mismo acompañante.
- Waffles con arequipe o Nutella, acompañados de fresas y banano —
  18 MIL.

FIN DEL ANEXO — Fuente: archivo "CARTA_AFUEGO_2026" (menú vigente 2026).
Nota: valida antes de la implementación que los precios y descripciones
correspondan a la versión más reciente de la carta, ya que pueden
actualizarse.

============================================================
ENTREGABLE ESPERADO DE ESTE PROMPT
============================================================
Con base en todo lo anterior, entrega:
1. Modelo de datos (entidades y relaciones) para los 9 módulos.
2. Arquitectura técnica propuesta (frontend, backend, base de datos).
3. Wireframes o descripción de pantallas por módulo.
4. Plan de construcción en el orden: Módulo 1 → 2 → 3 → 4 → Dashboard →
   Gastos Administrativos → Juego de Inventarios → Estado de Resultados
   → Nómina → CRM → Agenda de Eventos → Cartera (CxC y CxP).
