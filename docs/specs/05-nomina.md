# 05 · Nómina de cocina

**Estado:** vigente · **Verificado contra el código:** 2026-11-18 (parámetros y reglas verificados contra el esquema; valores legales los confirma el negocio cada año)

## Para qué sirve
Liquidar cada quincena a los empleados de cocina según las horas marcadas,
aplicando las reglas del Código Sustantivo del Trabajo. Es la fórmula más
compleja del sistema.

## Reglas

### Turnos
- El empleado (rol Cocina/Nómina) marca su **entrada y salida** en "Mi Turno" y ve su historial y su liquidación (por defecto, la quincena actual).
- Los roles administrativos pueden crear, editar y borrar turnos de cualquier empleado (por ejemplo, para corregir una salida olvidada).
- Todas las horas se interpretan en **hora de Colombia (UTC−5)**.

### Clasificación de horas
Se separan en 8 conceptos: diurna, nocturna, extra diurna, extra nocturna, dominical/festiva diurna y nocturna, y extra dominical/festiva diurna y nocturna. Se pagan en horas y en $.

### Reglas que se aplican, en este orden
1. **Hora de entrada autorizada (2026-10-01):** si el empleado marca **antes** de la hora autorizada (por defecto **09:30**), esos minutos no se pagan ni cuentan como extra: se calcula como si hubiera marcado a esa hora. Si marca **después**, se usa su hora real. La **salida nunca se recorta**. Es una regla **global** (todo el personal de cocina comparte horario). `"00:00"` la desactiva. Se aplica antes de clasificar y también alimenta el tope semanal.
2. **Descuento de almuerzo (2026-09-15):** 0,5 h por turno, a cargo del empleado. Se descuenta de las horas **ordinarias** (nunca de extras): primero diurna, luego nocturna, luego dominical/festiva. La lista de turnos sigue mostrando el tiempo bruto reloj-a-reloj para poder auditar.
3. **Tope diario:** la jornada ordinaria se limita a 8 h por turno; el resto es extra.
4. **Tope semanal de 42 h (2026-10-01):** (Ley 2101 de 2021; configurable porque la ley ya cambió 4 veces). Las semanas van de **lunes a domingo**. Si el acumulado de horas **ordinarias** (diurna + nocturna; nunca la dominical/festiva ni la extra ya generada) supera el tope, el excedente pasa a extra, tomándolo de los turnos **más recientes** de la semana. Se calcula sobre **semanas completas** que tocan el período, y luego se filtra a lo que se paga en esa liquidación (un turno de la quincena anterior no se vuelve a pagar).

### Dinero
- **Auxilio de transporte:** prorrateado por días efectivamente trabajados. No es base de cotización.
- **Incapacidades (2026-09-15):** un registro por día y por empleado, liquidadas al **66,67 %** del salario diario (SMLV/30). No cuentan como turno trabajado ni afectan el auxilio.
- **Deducciones (2026-09-15):** **4 % EPS + 4 % AFP** sobre el devengado (horas + incapacidad, **sin** auxilio).
- **Total a pagar = (devengado por horas + incapacidad) − (EPS + AFP) + auxilio de transporte.**

### Parámetros (todos editables, nunca fijos en el código)
SMLV (2026: $1.750.905), divisor de horas mensuales (210), auxilio de transporte ($249.095/mes), los **7 recargos**, jornada semanal máxima (42 h), hora de entrada autorizada (09:30), porcentaje de incapacidad (66,67 %), porcentaje EPS y AFP (4 % c/u) y el **calendario de festivos** (se llena a mano cada año).

### Cálculo en vivo, no congelado
Nada se guarda hasta que se paga. Consultar una liquidación **siempre recalcula con las reglas vigentes** (también las ya revisadas). **Límite conocido:** liquidar un período a medio terminar y volverlo a liquidar después puede dar resultados distintos si cambiaron los turnos.

## Quién puede hacer qué
| Rol | Mi turno | Ver liquidación | Editar turnos, incapacidades, parámetros |
|---|---|---|---|
| Cocina/Nómina | Marca; ve lo suyo (solo lectura) | Solo la propia | No |
| Administrador, Operación, Ventas | — | De cualquier empleado | Sí |
| Consulta | — | De cualquier empleado | No |

(Ver [diferencias por confirmar](diferencias-por-confirmar.md): la documentación vieja decía "solo Administrador".)

## Criterios de aceptación
- [ ] Un turno que marca entrada a las 8:40 se liquida como si fuera a las 9:30.
- [ ] Un turno que marca entrada a las 10:00 se liquida desde las 10:00.
- [ ] Una semana con turnos que suman más de 42 h ordinarias reclasifica el excedente a extra, tomándolo de los turnos más recientes.
- [ ] Un turno de 9:30 a 17:00 con almuerzo descuenta 0,5 h de la diurna ordinaria.
- [ ] Una incapacidad se paga al 66,67 % del salario diario y no suma al auxilio de transporte.
- [ ] Cambiar la jornada semanal máxima en Parámetros cambia el resultado sin tocar código.
- [ ] El total a pagar de la quincena 1–15 sept. 2026 de los dos empleados de referencia coincide con la nómina manual en Excel.

## Pruebas que las vigilan
`apps/api/src/modules/nomina/nomina.calculations.test.ts` (clasificación, almuerzo, tope diario, `aplicarTopeSemanal` con reconstrucción de la semana real que motivó el hallazgo, `recortarEntradaAutorizada`, deducciones, incapacidad).

## Fuera de alcance
- **Prestaciones sociales** (cesantías, prima, vacaciones, parafiscales): excluidas por decisión del negocio. La liquidación es solo el devengado quincenal.

## Pendiente
- El informe de aclaración de liquidación quincenal (artefacto antiguo) está desactualizado: no refleja el tope semanal ni la hora de entrada autorizada.
