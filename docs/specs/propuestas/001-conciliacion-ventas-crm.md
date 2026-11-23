# Propuesta 001 · Que Ventas totales (Dashboard) y Total ganado (CRM) cuadren

**Fecha:** 2026-11-23 · **Módulos:** Ventas, CRM, Dashboard · **Estado:** PROPUESTA (esperando tu aprobación; no se ha tocado código)

## Para qué sirve
Hoy el Dashboard y el CRM pueden mostrar cifras distintas para el mismo mes y
el negocio no sabe cuál creer. Caso real, noviembre 2026:

| | Valor |
|---|---|
| Ventas totales (Dashboard) | $42.387.793 |
| Total ganado (CRM) | $40.595.793 |
| **Diferencia** | **$1.792.000** |

## Por qué pasa (verificado en el código el 2026-11-23)
Cada módulo guarda y suma **su propia copia** del valor y de la fecha:

- **Dashboard:** suma **todas las ventas** (eventos) del mes, por la fecha y el valor **de la venta**.
- **CRM:** suma solo los **negocios en etapa Ganado**, por la fecha y el valor **del negocio**.

Eso abre dos huecos:
1. **Venta creada directo en "Ventas y Costos"** (sin pasar por el CRM): suma en el Dashboard y no existe en el CRM.
2. **Venta editada después de ganarla** (cambiar valor o fecha en Ventas): el negocio del CRM **no se entera**. (En sentido contrario sí: editar el negocio ganado desde el CRM actualiza venta y agenda.)

Esto va contra la regla de `CLAUDE.md`: *un dato derivado de otro módulo se calcula, no se copia ni se digita dos veces.* La Agenda ya funciona bien así (lee en vivo de la venta).

## Opciones

### Opción A (recomendada): el CRM lee en vivo la venta de los negocios ganados
- Para un negocio **Ganado**, el CRM toma **valor y fecha de la venta ligada**, no del negocio. Así el hueco 2 **desaparece para siempre** y no hay nada que sincronizar.
- El hueco 1 se **explica en vez de esconderse**: el Dashboard (y el resumen del CRM) muestran el desglose *"ventas que vienen del CRM / ventas creadas directo en Ventas"*. La suma sigue siendo la misma; ahora se entiende de dónde sale.
- Cambio pequeño y de bajo riesgo: solo lectura/cálculo, **no cambia ni borra datos**.

### Opción B: sincronizar copias
- Al editar una venta, se actualiza también su negocio.
- Funciona, pero mantiene **dos copias** que pueden volver a separarse si alguien toca la base de datos o si se agrega otra pantalla de edición.

### Opción C: no hacer nada, solo documentar
- Dejar la diferencia como "comportamiento esperado" y explicarla en la pantalla con un texto.

## Reglas propuestas (si se aprueba la A)
- El **Total ganado del CRM** de un período = suma de la **venta ligada** (valor antes de impuestos) de cada negocio Ganado cuya **fecha de venta** cae en el período.
- La **eficiencia comercial** = ese total ganado ÷ (cotizado + ganado + perdido del período), con la misma definición de hoy para Cotizado y Perdido (siguen leyendo del negocio).
- El **Dashboard** muestra bajo "Ventas totales" el desglose: *del CRM* + *directas* = total.
- Nada de lo anterior se **guarda**; todo se calcula al consultar.

## Criterios de aceptación
- [ ] Editar el valor de una venta ganada en Ventas cambia el "Total ganado" del CRM de ese mes, sin tocar el CRM.
- [ ] Cambiar la fecha de una venta ganada a otro mes la mueve de mes en el CRM.
- [ ] Una venta creada directo en Ventas suma en el Dashboard y aparece en "directas", y **no** altera el "Total ganado" del CRM.
- [ ] *Total ganado del CRM + ventas directas = Ventas totales del Dashboard*, para cualquier mes.
- [ ] Cotizado y Perdido no cambian de valor respecto a hoy.

## Prueba que la vigilaría
Prueba unitaria de la función de resumen del CRM y manual con los pasos de arriba.

## Antes de construir: confirmar la causa real
Ejecutar en Supabase la consulta de diagnóstico (ver respuesta del 2026-11-20) para saber **qué filas** explican los $1.792.000 de noviembre. No cambia la propuesta, pero confirma si hace falta además corregir datos puntuales.

## Decisión del dueño
- [ ] Opción A  ·  [ ] Opción B  ·  [ ] Opción C  ·  Comentarios: ______________________
