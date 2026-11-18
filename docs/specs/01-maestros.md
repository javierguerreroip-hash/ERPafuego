# 01 · Maestros: artículos, menú, clientes, proveedores, impuestos

**Estado:** vigente · **Verificado contra el código:** 2026-11-18 (salvo lo marcado)
**Origen:** especificación original (Módulo 1) + cambios posteriores al lanzamiento.

## Para qué sirve
Es el catálogo base. Todo lo demás (compras, ventas, inventario, cotizaciones)
elige de aquí. Si algo está mal en este módulo, se arrastra a todos.

## 1. Artículos y Servicios

### Reglas
- Cada artículo tiene **código, nombre, categoría y unidad de medida** (kg, L, unidad…). El **último precio de compra** no se digita: lo pone el módulo de Compras (solo lectura aquí). El histórico de precios sale de las compras ("Ver histórico").
- **Categorías (7):**
  - De costo: Materia prima · Mano de obra tercerizada · Servicio de transporte · Servicios artísticos · Alquiler de menaje y equipos.
  - De **solo monitoreo** (2026-09-23/24): Insumos de Aseo · Utensilios. Sirven para ver cuánto se compra, pero **nunca** entran a: consumos de evento (el sistema lo rechaza), Inventario, CMV, Estado de Resultados ni a los costos del Dashboard. El Dashboard les muestra una tarjeta aparte "solo monitoreo".
- Un artículo **no se borra si tiene historial** (compras, consumos, inventarios o recetas): se desactiva. Eliminar de verdad solo se permite si nunca se usó, con la **contraseña de autorización** (2026-09-10).
- Se puede crear, editar y activar/desactivar. Hay buscador de texto.

### Criterios de aceptación
- [ ] Crear un artículo sin unidad de medida es rechazado.
- [ ] Un artículo de categoría Insumos de Aseo no aparece en el selector de consumos de un evento y el servidor rechaza intentarlo.
- [ ] Intentar eliminar un artículo con compras devuelve un mensaje claro ("desactívalo").
- [ ] Intentar eliminar un artículo que es ingrediente de una receta es rechazado.
- [ ] Eliminar sin la contraseña de autorización es rechazado.

## 2. Opciones de Menú (catálogo de venta) y recetas

### Reglas
- Catálogo de venta con el menú **Carta 2026** precargado (grupos: Momentos/Fuertes, Parrilla, Paellas, Bocados/Snacks, Refrigerios, Infantil, Adicionales). Cada opción tiene nombre, descripción, precio y tipo de precio (por persona o por unidad).
- **Receta (2026-10-05):** cada opción puede tener ingredientes (solo artículos de **Materia prima**) con la cantidad de cada uno **por una unidad de venta**, en la unidad del artículo.
- **Costo del menú** (columna "Costo"): se calcula en vivo, **nunca se guarda**. Costo = suma de (cantidad × costo unitario del ingrediente), redondeando cada línea. Se muestra en $ y en % sobre el precio. Dice "Sin receta" si no tiene ingredientes.
- El **costo unitario** de cada ingrediente sigue la regla única de costo (ver [03 · Ventas](03-ventas-eventos.md#regla-única-de-costo-unitario)).
- **Plantilla de Excel de recetas:** una fila por ingrediente de cada menú activo, con la receta ya guardada y, como sugerencia, los artículos de materia prima cuyo nombre aparece en la descripción del menú. Unidad, costo y costo del ingrediente vienen por fórmula; solo se digita **"Cantidad por porción"**.
- **Carga masiva:** se valida en el navegador (menú por nombre, artículo por código, cantidades > 0, sin repetidos) y solo se habilita "Importar" si no hay errores. La receta de un menú que traiga al menos una cantidad **reemplaza** la anterior; los menús sin cantidades **no se tocan** (no se puede vaciar una receta desde el Excel). Cada menú importado deja una entrada en Auditoría.
- La receta es **solo referencia del costo teórico**: no genera consumos automáticos en los eventos.

### Criterios de aceptación
- [ ] La columna Costo de un menú con receta muestra valor y %; sin receta muestra "Sin receta".
- [ ] Subir una plantilla con errores no habilita "Importar".
- [ ] Subir una plantilla donde un menú no trae cantidades deja su receta anterior intacta.
- [ ] Cambiar el último precio de compra de un ingrediente cambia el costo del menú sin guardar nada.

### Pruebas que lo vigilan
`apps/api/src/modules/opciones-menu/opcion-menu.calculations.test.ts` (costo y sugerencia de ingredientes).

### Pendiente
- Cargar los consumos de un evento automáticamente desde la receta (no se ha pedido).
- Poder vaciar una receta desde el Excel.

## 3. Clientes y Proveedores

### Reglas
- CRUD con activar/desactivar (no se eliminan, para no romper la trazabilidad).
- **Clientes:** adjuntos (cédula, RUT, contrato…) hasta **3 MB** cada uno, guardados en la base de datos (decisión 2026-09-22: no se usa un servicio de almacenamiento aparte). Solo se adjunta a un cliente ya guardado.
- Un cliente nuevo puede nacer desde el CRM al ganar un negocio, pero **el CRM y las Cotizaciones solo permiten elegir clientes ya creados** (2026-09-21), para evitar duplicados y errores de digitación.
- Los proveedores comparten las mismas categorías que los artículos.

### Criterios de aceptación
- [ ] Un adjunto de más de 3 MB es rechazado con mensaje claro.
- [ ] La sección de archivos no aparece en "Nuevo cliente", solo en "Editar".

## 4. Parámetros Fiscales (impuestos)

### Reglas
- Tasas configurables precargadas: IVA 19 %, IVA 5 %, Impuesto al Consumo 8 %. Se eligen al crear una venta o una cotización.
- Quién edita: ver [diferencias por confirmar](diferencias-por-confirmar.md) (el código permite a Administrador, Operación y Ventas; la documentación vieja decía solo Administrador).

## Quién puede hacer qué

| Rol | Artículos / Clientes / Proveedores / Impuestos | Opciones de Menú |
|---|---|---|
| Administrador, Operación, Ventas | Ver y editar | Ver y editar |
| Consulta externa | Solo ver | No lo ve |
| Cocina/Nómina | No lo ve | No lo ve |

Eliminar artículos requiere además la contraseña de autorización.
