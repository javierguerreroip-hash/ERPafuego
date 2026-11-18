# 04 · Inventario, CMV y resultados

**Estado:** vigente · **Verificado contra el código:** 2026-11-18 (conteos, plazo y CMV verificados; porcentajes del Dashboard por confirmar)

Este grupo es una **cadena**: Inventario → Juego de Inventarios (CMV) → Estado de
Resultados. Lo de cada módulo se calcula de lo anterior y **no se digita**.

## 1. Inventario

### Para qué sirve
Saber cuánto hay de cada materia prima, cuánto debería haber y cuánta
diferencia existe.

### Reglas
- **Solo muestra artículos de Materia prima** (desde 2026-09-24).
- Con un período (día, semana, mes, personalizado), por artículo y consolidado:
  - **Inventario inicial:** se digita (o llega del cierre del mes anterior).
  - **Compras:** automático desde Compras.
  - **Costos y consumos:** automático desde los eventos.
  - **Inventario final teórico** = inicial + compras − consumo.
  - **Inventario final físico:** el conteo de cierre (ver abajo).
  - **Desviación** = físico − teórico. Positiva = hay más de lo esperado; negativa = merma o pérdida.
- Por artículo se ve en **cantidad**; el consolidado, en **valor $** (no se suman kilos con unidades).
- Buscador de texto.

### Cierre de mes: conteo #1 y conteo #2 (2026-10-05)
- El cierre de cada mes tiene **dos conteos** por artículo:
  - **Conteo #1:** primer conteo, por Excel con **plantilla ciega** (sin el teórico). Sirve para **detectar diferencias**.
  - **Conteo #2:** el **definitivo**, después del reconteo (dando el beneficio de la duda al error humano). Su plantilla trae teórico, conteo #1 y diferencia, con la columna a diligenciar **precargada con el #1** para corregir solo lo que cambió.
- **El inventario final físico es siempre el conteo #2.** Mientras no exista, el artículo aparece "Sin registrar" y **el CMV no usa el #1**. El #1 se ve en su propia columna, con su diferencia contra el teórico, solo para identificar diferencias.
- **Solo el conteo #2 se vuelve el inventario inicial del mes siguiente** (cantidad, costo unitario y valor), cuando el cierre es el último día del mes. Cada vez que el #2 se edita, el inicial del mes siguiente se **sobrescribe**, aunque se haya digitado a mano; ambos se guardan en una sola transacción. Un conteo a mitad de mes no genera nada.
- En la carga por Excel, las filas **sin cantidad se omiten** (no se fuerzan a cero), para poder contar en varias sesiones.
- **Plazo de cierre de 7 días:** el cierre de un mes se puede cargar o corregir (#1 y #2) hasta **7 días después de su último día** (inclusive) y aun así queda como inicial del mes en curso. Pasado el plazo, **solo el Administrador** puede cargarlo o corregirlo. La pantalla avisa el plazo cuando el período termina un fin de mes.
- Ojo: un conteo hecho varios días después se registra con fecha de fin de mes, así que las compras/consumos de esos días de gracia **ya pertenecen al mes nuevo**.
- El **costo unitario** de un físico o inicial sin costo sigue la [regla única de costo](03-ventas-eventos.md#regla-única-de-costo-unitario).

### Quién puede hacer qué
| Rol | Ver | Registrar inicial / conteos |
|---|---|---|
| Administrador | Sí | Sí, también fuera del plazo de 7 días |
| Operación, Ventas | Sí | Sí, dentro del plazo |
| Consulta | Sí | No |

### Criterios de aceptación
- [ ] Cargar conteo #1 de septiembre **no** crea inventario inicial de octubre.
- [ ] Cargar conteo #2 de septiembre crea el inicial de octubre (día 1) con cantidad y costo del #2.
- [ ] Editar el conteo #2 cambia el inicial de octubre aunque este se hubiera digitado a mano.
- [ ] Un artículo con #1 pero sin #2 aparece "Sin registrar" en físico y el CMV no lo usa.
- [ ] Cargar un conteo del cierre de septiembre el 10 de octubre es rechazado para Operación y permitido para el Administrador.
- [ ] Un conteo del 20 de septiembre (mitad de mes) no genera inventario inicial.
- [ ] La plantilla del #1 no trae el teórico; la del #2 sí, con el #1 precargado.

### Pruebas que lo vigilan
`apps/api/src/modules/inventario/inventario.calculations.test.ts` (inventario final, desviación, fecha del mes siguiente, plazo de cierre).

## 2. Juego de Inventarios (CMV)

### Reglas
- **Un solo CMV** (desde 2026-09-24): **CMV = inventario inicial + compras − inventario final físico (conteo #2)**. Solo materia prima. Se muestra en $ y en % sobre la venta, por artículo y consolidado.
- **Solo lectura.** La comparación teórico-vs-físico vive en Inventario.
- Es la **definición contable** del costo de lo vendido: nunca usa el teórico.

### Criterios de aceptación
- [ ] Con el mismo período, el CMV del Juego de Inventarios es igual al CMV del Estado de Resultados.
- [ ] El CMV de la tarjeta del Dashboard **no** tiene por qué coincidir con ellos (ver sección Dashboard).
- [ ] No existe forma de digitar el conteo físico desde esta pantalla.

### Prueba
`apps/api/src/modules/juego-inventarios/juego-inventarios.calculations.test.ts`.

## 3. Dashboard

### Reglas
- Pantalla de inicio con el mismo filtro de período del Inventario.
- Tarjetas (valor $ y % sobre la venta): ventas totales, costos totales, utilidad operativa, CMV (solo materia prima), mano de obra tercerizada, transporte, servicios artísticos. Una tarjeta aparte por cada categoría de **solo monitoreo**.
- Gráfica de composición de costos y de tendencia diaria de ventas y utilidad.
- **100 % derivado, sin datos propios.** Ventas = valor antes de impuestos de los eventos; costos = consumos de eventos.
- **Ojo, dos "CMV" distintos (verificado en el código 2026-11-18):** la tarjeta **CMV del Dashboard** es la suma de los **consumos de materia prima cargados en los eventos** (el costo de lo que se registró como usado en cada venta). El **CMV del Juego de Inventarios y del Estado de Resultados** es **inicial + compras − final físico (conteo #2)**. Pueden dar cifras diferentes en el mismo período (la diferencia son mermas, desperdicios y consumos sin cargar). Ver [Por confirmar](diferencias-por-confirmar.md#dashboard-cmv).

## 4. Gastos Administrativos

### Reglas
- Un registro por **año + mes**, con **12 rubros fijos**: arriendo, nómina administrativa, servicios públicos, honorarios de contador y socios, control de plagas, seguros, internet, adicionales, cuota de obligación financiera, **Publicidad**, **Lavandería** y **Seguridad Social** (los tres últimos agregados 2026-09-10 y 2026-09-29).
- **El total del mes no se guarda**: se suma al consultar.
- Agregar un rubro nuevo requiere un cambio de base de datos (es una columna fija, no un catálogo abierto).

### Criterios de aceptación
- [ ] Guardar un valor en "Seguridad Social" suma al total del mes y al Estado de Resultados.

## 5. Estado de Resultados

### Reglas
- Por período, en $ y % sobre la venta:
  1. **Ingreso total** = ventas (Módulo de Ventas).
  2. **CMV** = el del Juego de Inventarios.
  3. **Gastos de venta** = consumos de eventos que **no** son materia prima (ni monitoreo).
  4. **Gastos administrativos** = total del mes.
  5. **Utilidad neta = Ingreso − CMV − Gastos de venta − Gastos administrativos.**
- **100 % derivado**, sin tabla propia.
- Exportación a Excel y PDF.

### Criterios de aceptación
- [ ] La utilidad neta cuadra con la fórmula con datos de prueba conocidos.
- [ ] Las compras de Insumos de Aseo/Utensilios no cambian el resultado.

### Prueba
`apps/api/src/modules/estado-resultados/estado-resultados.calculations.test.ts`.
