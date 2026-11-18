# 08 · Transversal: roles, seguridad, auditoría y herramientas comunes

**Estado:** vigente · **Verificado contra el código:** 2026-11-18

## 1. Roles y permisos

### Los 5 roles
| Rol | Para quién |
|---|---|
| **Administrador** | Gerencia. Todo, incluida Auditoría, Usuarios y operaciones sensibles. |
| **Operación** | Equipo operativo. Edita casi todo. |
| **Ventas** | Equipo comercial. Mismo alcance de edición que Operación. |
| **Cocina/Nómina** | Solo "Mi Turno" y su propia liquidación: marca entrada/salida y ve lo suyo. |
| **Consulta externa** | Contador, socios… **Solo lectura** de módulos operativos y financieros. |

### Reglas
- Dos grupos compartidos en el código: **acceso completo** = Administrador, Operación, Ventas; **acceso de lectura** = esos tres + Consulta. Son el único lugar donde se ajusta quién lee o edita.
- **Consulta ve (solo lectura):** Dashboard, Artículos, Clientes, Proveedores, Compras, Ventas (con consumos y adjuntos), Inventario, Juego de Inventarios, Gastos Administrativos, Estado de Resultados, Parámetros Fiscales, Liquidación de Nómina y Cartera. **No ve:** CRM, Agenda, Opciones de Menú, Cotizaciones, Usuarios ni Auditoría.
- **Solo Administrador:** Usuarios, Auditoría, eliminar compras, editar abonos, cargar el cierre de inventario fuera del plazo de 7 días.
- **El permiso se aplica en dos capas:** el servidor es quien realmente bloquea; el menú y los botones ocultos son solo comodidad. Si alguien manipulara la petición, el servidor igual la rechaza.
- **Contraseña de autorización** (variable de entorno `DELETE_AUTH_PASSWORD`, nunca en el código): se pide para eliminar ventas, artículos y compras.

### Criterios de aceptación
- [ ] Un usuario Consulta no ve CRM, Agenda, Opciones de Menú, Cotizaciones, Usuarios ni Auditoría, y no ve botones de crear/editar/eliminar.
- [ ] Un POST de un usuario Consulta a cualquier ruta de escritura devuelve 403.
- [ ] Un usuario Cocina/Nómina solo ve "Mi Turno" y su propia "Liquidación de Nómina".

## 2. Usuarios
- Solo el Administrador crea y edita usuarios y los activa/desactiva (hay pantalla de Usuarios con buscador).
- Casilla **"Puede ser seleccionado como vendedor"** (`esVendedor`, 2026-10-10): suma al usuario a las listas de vendedores sin cambiar su rol.
- Un usuario inactivo no puede iniciar sesión ni elegirse como vendedor.
- La sesión expirada cierra sesión sola y envía al login.

## 3. Auditoría
- Cada creación, edición o eliminación de **cualquier** dato queda registrada (quién, sobre qué registro, qué acción, cuándo y el detalle del cambio). Panel exclusivo del Administrador, con buscador.
- Se hace con un interceptor automático para todos los modelos, más registro explícito en los catálogos (artículos, clientes, proveedores, opciones de menú, impuestos, parámetros de nómina, festivos, usuarios).
- Los registros de inventario, consumos, turnos e incapacidades guardan el **nombre legible** del artículo o empleado (2026-09-24). Los registros anteriores a esa fecha conservan el nombre genérico.
- **Limitación aceptada:** si una transacción falla después de que se escribió el log, puede quedar una entrada de un cambio que no se completó. Un fallo al guardar el log nunca tumba la operación real.

## 4. Archivos adjuntos
- Se guardan en la **base de datos** (no en un servicio de archivos aparte), codificados en base64 dentro de la petición, **máximo 3 MB por archivo**. Aplica a Clientes (cédula, RUT, contrato…) y a Ventas (detalle de lo vendido). Se borran con su cliente o venta.
- El componente de interfaz es compartido: Ver (imágenes y PDF en pestaña nueva), Descargar, Eliminar.

## 5. Búsqueda, período y exportación
- **Buscador de texto** en Artículos, Clientes, Proveedores, Opciones de Menú, Compras, Ventas, Inventario, Juego de Inventarios, Cartera, CRM, Agenda, Cotizaciones, Usuarios y Auditoría. Corre en el navegador sobre lo ya cargado, sin distinguir mayúsculas ni tildes. No existe en reportes de un solo período ni en catálogos cortos (Gastos Administrativos, Estado de Resultados, Parámetros, Dashboard).
- **Filtro de período** común (día, semana, quincena, mes, personalizado) en Dashboard, Inventario, Compras, Ventas, CRM, Agenda, etc. Las fechas se comparan como día calendario (`fecha.slice(0,10)`) para no desfasar por zona horaria.
- **Exportación a Excel y PDF** en los 6 módulos financieros (Dashboard, Estado de Resultados, Gastos Administrativos, Juego de Inventarios, Cartera, Liquidación de Nómina): lo que se exporta es idéntico a lo que se ve.

## 6. Celular
- El menú lateral es un panel deslizante en pantallas angostas (< 768 px), con botón hamburguesa; elegir un módulo lo cierra. En escritorio no cambia.

## 7. Errores y robustez
- Rutas inexistentes responden JSON, no HTML.
- Un error de pantalla no deja la página en blanco: hay un mensaje con opción de recargar.
- Una transacción demasiado larga responde con un mensaje claro y no con un error genérico.
- En formularios largos, el **mensaje de error de guardado se muestra resaltado y a la vista** (2026-11-17, en Cotizaciones; **pendiente** extenderlo a los demás formularios).

## 8. Datos, zona horaria y dinero
- Todo en **COP**. Zona horaria **Colombia (UTC−5)** para nómina y cortes de día.
- Los datos derivados (costos, saldos, estados, totales) **se calculan al consultar y no se guardan**.

## 9. Despliegue y operación
- **Netlify** (sitio y API como función), **Supabase** (PostgreSQL), código en **GitHub** (rama `main`).
- Cada cambio se publica con **Trigger deploy → Deploy site** en Netlify (no se publica solo). Las migraciones de base de datos corren automáticamente en ese despliegue.
- Las migraciones se escriben a mano (SQL); los cambios de datos masivos sobre registros viejos se entregan como SQL para ejecutar en Supabase.

## Pendiente
- Pruebas de integración de flujos completos (hoy solo hay pruebas unitarias de fórmulas).
- Calendario de festivos de nómina: llenarlo cada año.
- Revisar periódicamente la vigencia de los recargos de nómina y las tasas de impuesto.
