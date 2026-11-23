# Diferencias por confirmar

Al pasar la documentación a especificaciones se contrastó cada regla con el
código (2026-11-18). Estas son las cosas donde **la documentación vieja y el
sistema no coinciden**, o donde el sistema hace algo que conviene que
confirmes. **No se cambió nada del sistema**: en cada caso, las fichas
describen lo que el código hace hoy. Marca tu decisión en cada una.

## Quién ve qué

El README y la especificación original decían que estos módulos eran **solo
para Administrador**. El código (servidor y menú) los abre a más roles:

| Módulo | Documentación vieja | Lo que hace el sistema hoy |
|---|---|---|
| Estado de Resultados | Solo Administrador | Lo ven Administrador, Operación, Ventas y Consulta |
| Cartera | Solo Administrador | Lo ven los mismos cuatro; abonar: Administrador, Operación, Ventas (editar abono: solo Administrador) |
| Liquidación de Nómina | Administrador | Ven la de cualquiera: Administrador, Operación, Ventas, Consulta. Cocina/Nómina solo la propia |
| Parámetros Fiscales | Edita solo Administrador | Editan Administrador, Operación y Ventas |
| Parámetros de Nómina | Edita solo Administrador | Editan Administrador, Operación y Ventas; Consulta lo ve |

**Por qué importa:** el Estado de Resultados (utilidad del negocio) y la
nómina de todos los empleados son información sensible. Si el negocio quiere
que sean solo del Administrador, hay que **cerrar el permiso** (es un cambio
pequeño de código).

- [x] **RESUELTA 2026-11-23 — decisión del dueño: se deja como está.** Todos los roles actuales siguen viendo estos módulos. Las fichas 05, 07 y 08 ya describen ese comportamiento; no hay cambio de código.

## Dashboard: CMV

La tarjeta **CMV del Dashboard** suma los **consumos de materia prima
cargados en los eventos**. El **CMV del Juego de Inventarios y del Estado de
Resultados** se calcula como **inicial + compras − conteo físico #2**. Son dos
números distintos con el mismo nombre; pueden no coincidir (la diferencia son
mermas, desperdicio y consumos que no se cargaron a ningún evento).

- [x] **DECIDIDA 2026-11-23 — el Dashboard debe usar el CMV del Juego de Inventarios;** los consumos por evento se siguen registrando para la rentabilidad de cada evento. Falta cerrar detalles en la [propuesta 002](propuestas/002-cmv-dashboard-desde-juego-inventarios.md) (qué mostrar mientras el mes no tiene conteo #2). Mientras tanto, la ficha 04 describe el comportamiento actual.

## Ventas totales (Dashboard) vs Total ganado (CRM)

Descubierto el 2026-11-20 con datos reales de noviembre: $42.387.793 contra
$40.595.793 (diferencia $1.792.000). Cada módulo suma su propia copia de
valor y fecha, y editar una venta no actualiza su negocio del CRM.

- [x] **DECIDIDA 2026-11-23:** que todo negocio nazca de una cotización y no se puedan crear ventas ni negocios por otra vía. Detalle y preguntas abiertas en la [propuesta 001](propuestas/001-todo-negocio-nace-de-una-cotizacion.md).

## Otras observaciones

1. **Archivo `docs/spec_erp_afuego.md`:** conserva descripciones que ya cambiaron (por ejemplo, "CMV teórico vs real" dentro del Juego de Inventarios, cuando hoy es un solo CMV real). Se dejó intacto por ser histórico; manda `docs/specs/`.
2. **README de la raíz, sección "Pendiente antes de producción":** varios puntos están desactualizados (por ejemplo, ya existe pantalla de Usuarios y ya existe Auditoría; el sistema ya está desplegado y en uso). No se tocó; conviene limpiarlo en una pasada aparte.
3. **Decisión de la Fase 10 en el README** dice que el cliente del CRM es texto libre; se revirtió el 2026-09-21 (hoy se elige de Clientes). Quedó en el README como texto histórico, con la nota de reversión debajo.
4. **Sin pruebas de integración:** solo hay pruebas unitarias de las fórmulas. Los criterios de aceptación de las fichas marcados con casillas **aún no se han convertido en pruebas automáticas ni se han recorrido uno por uno**.
5. **Datos de prueba pendientes de limpieza (de tu lado):** el consumo de prueba de *Aceite de Oliva* (0,09 L) en un evento; los registros con costo $0 anteriores a la corrección del 2026-10-12.
6. **Mensaje de error de guardado de Cotizaciones:** el 2026-11-17 se hizo visible el error y el 2026-11-23 el dueño confirmó que ya está desplegado; falta saber si ahora guarda o qué dice el mensaje en rojo.
