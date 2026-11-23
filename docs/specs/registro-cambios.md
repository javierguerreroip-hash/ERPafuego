# Registro de cambios

Historial de cambios del sistema, del más reciente al más antiguo (tomado
del historial de Git de la rama `main`). Cada cambio nuevo debe
anotarse aquí, con el enlace a la ficha que lo describe.

Los cambios de este listado hasta 2026-11-17 son anteriores al método por
especificaciones: sus reglas están recogidas en las fichas `01` a `08`.
Desde 2026-11-18, cada fila nueva debe enlazar a su ficha.

| Fecha | Cambio | Hash |
|---|---|---|
| 2026-11-23 | Decisiones del dueño registradas: permisos se mantienen; el CMV del Dashboard saldrá del Juego de Inventarios (propuesta 002); todo negocio nacerá de una cotización (propuesta 001). Solo documentación | — |
| 2026-11-23 | Hoja de ruta de la organización por especificaciones. Solo documentación | `926bb4d` |
| 2026-11-18 | Se organiza la documentación por especificaciones (`docs/specs/`): fichas 01–08, diferencias por confirmar y este registro. Solo documentación, sin cambios de código | — |
| 2026-11-17 | Hace visible el error al guardar una cotizacion y amplia el limite de la descripcion | `739ce5d` |
| 2026-11-17 | Agrega las ilustraciones Mexicano y Plato fuerte asado a las cotizaciones | `2dd256c` |
| 2026-11-10 | Agrega la ilustracion de desayuno a las opciones de cotizacion | `38990a0` |
| 2026-10-29 | El filtro de periodo del CRM tambien filtra las columnas de negocios | `7fab3f0` |
| 2026-10-29 | Actualiza la cuenta de consignacion en las condiciones de las cotizaciones | `0943a85` |
| 2026-10-27 | Permite varias opciones de menu en una venta | `ef4bf0b` |
| 2026-10-12 | El costo unitario ya no queda en cero si existe algun dato de costo | `3aa19a3` |
| 2026-10-12 | Muestra la unidad de medida del articulo al cargar los costos de un evento | `add7fdf` |
| 2026-10-12 | Muestra la unidad de medida del articulo al ingresar una compra | `0e818e1` |
| 2026-10-10 | Agranda el logo de A Fuego en el PDF de la cotizacion | `156b850` |
| 2026-10-10 | Permite marcar a un usuario como vendedor sin cambiar su rol | `477254a` |
| 2026-10-10 | Permite editar cotizaciones y precarga su descripcion desde Opciones de Menu | `93ad3cc` |
| 2026-10-08 | El filtro de periodo de Ventas tambien filtra la tabla de eventos | `87cca79` |
| 2026-10-05 | El inventario fisico y el CMV usan siempre el conteo #2 | `d0453e8` |
| 2026-10-05 | Agrega conteo #1 y #2 al cierre de inventario y plazo de 7 dias | `b8a9341` |
| 2026-10-05 | El inventario final fisico de fin de mes pasa a ser el inicial del mes siguiente | `da7686c` |
| 2026-10-05 | Agrega recetas y costo por opcion de menu con plantilla y carga masiva en Excel | `1c4efc9` |
| 2026-10-05 | Agrega adjuntos en Ventas y trazabilidad del vendedor hasta la Agenda | `7f58f53` |
| 2026-10-01 | Corrige error de build TS2362 en NominaParametrosPage | `45627fd` |
| 2026-10-01 | Agrega la hora de entrada autorizada a la liquidacion de Nomina | `428afaa` |
| 2026-10-01 | Agrega el tope semanal de 42 horas a la liquidación de Nómina | `f7b5007` |
| 2026-09-29 | Agrega el rubro "Seguridad Social" en Gastos Administrativos | `d5e5a8f` |
| 2026-09-29 | Permite editar un abono en Cartera, solo para Administrador | `9e1deca` |
| 2026-09-29 | Agrega botón "Editar" en Ventas y Costos por Evento | `dfb9a41` |
| 2026-09-28 | Corrige "Error interno del servidor" al registrar compras con muchos ítems | `7fab2f3` |
| 2026-09-23 | Agrega filtro de período y tarjeta de total en Compras | `667ef5a` |
| 2026-09-23 | Corrige el costo por defecto del Inventario Final Físico sin compras | `8b9a853` |
| 2026-09-23 | Agrega la unidad de medida a la plantilla de conteo físico | `1d45ca7` |
| 2026-09-23 | Corrige error de build: paréntesis entre ?? y  | `| en InventarioFinalFisicoImportModal|26d70b7` |
| 2026-09-23 | Categoría Utensilios, categoría por ítem en Compras, e Inventario restringido a materia prima con conteo físico por Excel | `c25c987` |
| 2026-09-23 | Corrige el costo unitario de consumo cuando el artículo nunca tuvo compras | `84c094b` |
| 2026-09-23 | Corrige nombres genéricos en Auditoría para Inventario Inicial y otros | `49e63cb` |
| 2026-09-23 | Agrega categoría "Insumos de Aseo" (monitoreo de compras, sin afectar costos) | `044d796` |
| 2026-09-23 | Etapa 4 y 5: menú adaptado a celular y búsqueda por palabras clave | `904e6f9` |
| 2026-09-23 | Etapa 3: rol de Consulta externa (solo lectura) | `d80336c` |
| 2026-09-22 | Etapa 2: notificaciones dentro de la aplicación (sin correo) | `3fb2e7c` |
| 2026-09-22 | Amplía la auditoría a todos los módulos del sistema | `81b5994` |
| 2026-09-22 | Etapa 1: historial de auditoría (panel exclusivo de Administrador) | `9b6998c` |
| 2026-09-22 | Agranda el logo del menú lateral para que llene su casilla | `a8e7208` |
| 2026-09-22 | Corrige descarga de archivos adjuntos de Cliente (atob mal codificado) | `9a54fde` |
| 2026-09-22 | Permite eliminar compras, restringido solo a Administrador | `18fc1fa` |
| 2026-09-22 | Agrega archivos adjuntos al módulo de Clientes | `6f66939` |
| 2026-09-22 | Agrega selección de vendedor en Ventas y Costos por Evento | `bac6131` |
| 2026-09-21 | Restringe cliente/vendedor en Cotizaciones y unifica vendedores con el CRM | `e33fbc2` |
| 2026-09-21 | Restringe el CRM a seleccionar clientes ya creados en el Módulo 1 | `f667a90` |
| 2026-09-21 | Bloquea números de factura repetidos por proveedor en Compras | `6941233` |
| 2026-09-21 | Promedia el costo unitario en Ventas y Costos con el inventario ingresado | `f07c669` |
| 2026-09-18 | Corrige gráfica del CRM desactualizada tras marcar Perdido/Ganado | `eae6aba` |
| 2026-09-17 | Permite editar negocios Ganados en el CRM y sincroniza Venta y Agenda | `001e41d` |
| 2026-09-15 | Permite asignar explícitamente el vendedor de un negocio en el CRM | `336d4dc` |
| 2026-09-15 | Corrige fusión incorrecta de clientes en el CRM por identificación placeholder | `611910c` |
| 2026-09-15 | Permite eliminar negocios del CRM para corregir errores | `a8757c5` |
| 2026-09-15 | Agrega deducciones de EPS y AFP a la liquidación de nómina | `9dfa309` |
| 2026-09-15 | Descuenta almuerzo en cada turno y agrega liquidación de incapacidades | `3e900f3` |
| 2026-09-11 | Agrega ranking de opciones vendidas y tipo de cliente (Corporativo/Persona natural) | `9a57fdc` |
| 2026-09-11 | Corrige fechas mostradas un día atrás en Colombia (CRM, Cartera, Agenda, Compras, Eventos) | `aad7d28` |
| 2026-09-11 | Agrega gráfica circular de resumen comercial y eficiencia al CRM | `2b6010c` |
| 2026-09-10 | Agrega eliminación protegida por contraseña para ventas y artículos | `5a9aa47` |
| 2026-09-10 | Corrige columnas encimadas (CANT/Vr Und/Vr Total) en el PDF de cotización | `d485f7a` |
| 2026-09-10 | Agrega la ilustración de costillas a Cotizaciones | `94d5c14` |
| 2026-09-10 | Agrega módulo de Cotizaciones integrado con el CRM, con export a PDF | `a1c68b3` |
| 2026-09-10 | Agrega Lavandería como rubro de Gastos Administrativos | `7a2992d` |
| 2026-09-10 | Agrega Publicidad como décimo rubro de Gastos Administrativos | `ac97756` |
| 2026-09-10 | Corrige que el inventario final físico apareciera como "sin registrar" | `12e9c7e` |
| 2026-09-09 | Amplía permisos de Administrador/Operación/Ventas y agrega módulo de Usuarios | `b5cccf0` |
| 2026-09-08 | Agrega carga masiva desde Excel, gráfica de ventas/costos/utilidad y logo más grande | `68fb44d` |
| 2026-09-07 | Merge branch 'main' of https://github.com/javierguerreroip-hash/ERPafuego | `c96a3aa` |
| 2026-09-07 | Build completo del ERP A Fuego Catering (fases 0-13 + branding + despliegue) | `11b0c37` |
| 2026-09-07 | Initial commit | `3bcccdb` |
