# Propuesta 004 · Una cotización con hasta 5 opciones en un solo archivo

**Fecha:** 2026-11-23 · **Módulos:** Cotizaciones, CRM, Ventas, Agenda · **Estado:** PROPUESTA — esperando tus decisiones (sección final). No se ha tocado código.

## Petición del dueño
> Permitir hacer varias cotizaciones para el mismo evento, cuando el cliente quiere analizar varias opciones. Deben salir en un solo archivo, como "Opción 1" y "Opción 2". Hasta 5 opciones para un mismo cliente en un solo archivo.

## Para qué sirve
Hoy una cotización tiene un solo conjunto de ítems y logística. Si el cliente quiere comparar (por ejemplo, parrilla vs. paella, o con y sin servicio de meseros), hay que hacer cotizaciones separadas, que además crean **negocios duplicados** en el CRM y suman dos veces al "Total cotizado".

## La idea
**Una sola cotización = un solo evento = un solo negocio en el CRM**, que contiene de 1 a 5 **opciones**. Cada opción tiene sus propios ítems de menú, logística y total. El PDF las muestra todas en un solo archivo.

```
COTIZACIÓN (un cliente, un evento, un vendedor, una fecha, un lugar)
 ├─ Opción 1: Parrilla      → ítems + logística → Total $3.100.000
 ├─ Opción 2: Paella        → ítems + logística → Total $2.950.000
 └─ Opción 3: Mixta         → ítems + logística → Total $3.400.000
        │  un solo negocio en el CRM (Cotizado)
        ▼  el cliente elige la Opción 2
     Marcar Ganado → "¿Cuál opción aceptó?" → la venta se arma con la Opción 2
```

## Qué es común y qué es de cada opción

| Común a todo el documento | Propio de cada opción |
|---|---|
| Cliente, vendedor, asunto, fecha del evento, lugar, invitados | Nombre de la opción (por defecto "Opción 1", "Opción 2"…, editable: "Opción Parrilla") |
| Tasa de impuesto | Ítems de menú (con sus cantidades y valores) |
| Condiciones comerciales y firma | Logística |
| | Descripción (se llena sola desde los menús de esa opción) |
| | Ilustración |

## Reglas propuestas

### 1. Crear y editar
- La cotización arranca con **una opción**. Un botón **"Agregar opción"** (hasta **5**) crea la siguiente. Un botón **"Duplicar opción"** copia una existente como punto de partida (lo más rápido para variantes parecidas).
- Cada opción se edita en su propia pestaña (Opción 1, Opción 2…). Se puede **quitar** una opción mientras quede al menos una.
- **Cada opción debe tener al menos una opción de menú** (regla vigente de la propuesta 001).
- Tope de 5 opciones, validado en pantalla y en el servidor.

### 2. El archivo PDF
- **Un solo archivo.** Una **página por opción**, con el mismo diseño de hoy (papel kraft, logo, ilustración de esa opción, tabla de ítems y logística, subtotal / impuesto / total, descripción).
- Cada página lleva un rótulo **"Opción N de M"** y su nombre. Las condiciones comerciales y la firma van en cada página, para que cualquier página se entienda sola.
- Con **una sola opción** el PDF queda **igual que hoy**, sin rótulo.

### 3. En el CRM
- **Un solo negocio por cotización**, aunque tenga 5 opciones: no se duplica el "Total cotizado".
- Mientras está "Cotizado", el valor del negocio es el de la **opción principal** (por defecto la Opción 1; el vendedor puede marcar otra). La tarjeta muestra "3 opciones: de $2.950.000 a $3.400.000".
- "Ver cotización" muestra todas las opciones.

### 4. Al marcar "Ganado"
- Si hay **una** opción, nada cambia respecto a hoy (sin preguntas).
- Si hay **varias**, aparece **una sola pregunta**: **"¿Cuál opción aceptó el cliente?"**, mostrando cada opción con su total.
- La **venta, la agenda y el valor del negocio se arman con la opción elegida** (ítems de menú, cantidades, impuesto). Las demás opciones **quedan guardadas como historial**, marcadas "No elegida". La elegida queda marcada "Elegida".
- Se podrán descargar **dos PDF**: el **completo** (todas las opciones que se mandaron al cliente) y el **de la opción elegida** (lo vendido).

### 5. Después de vender
- Las modificaciones posteriores (propuesta 003) se aplican **solo a la opción elegida**; las otras quedan como están, solo de consulta.

### 6. Qué NO cambia
- Un evento = un negocio. No se crean negocios duplicados por tener varias opciones.
- Cliente y vendedor, y todo lo ya vendido, siguen igual.
- Las cotizaciones que ya existen se convierten solas en cotizaciones de **una opción** (sin cambio visible).

## Criterios de aceptación
- [ ] Se pueden crear hasta 5 opciones en una cotización; la sexta es rechazada con un mensaje claro.
- [ ] "Duplicar opción" copia ítems, logística y descripción de la opción elegida.
- [ ] El PDF de una cotización con 3 opciones tiene 3 páginas, cada una con su rótulo "Opción N de 3", su nombre, sus totales y las condiciones.
- [ ] El PDF de una cotización con 1 opción es igual al de hoy.
- [ ] Una cotización con 3 opciones crea **un solo** negocio en el CRM, y "Total cotizado" suma solo la opción principal.
- [ ] Marcar Ganado con varias opciones pide elegir cuál; con una sola no pregunta nada.
- [ ] La venta creada refleja los ítems, cantidades, valor e impuesto de la opción elegida, con fecha del evento.
- [ ] Las opciones no elegidas siguen visibles en la cotización, marcadas "No elegida".
- [ ] Las cotizaciones anteriores se ven y se imprimen igual que antes.
- [ ] Cada opción exige al menos un ítem de menú enlazado.

## Decisión técnica (resumen)
- Para no tocar lo que ya funciona (CRM, ganar, totales), la **Opción 1 sigue en las columnas actuales** de la cotización y las opciones 2 a 5 se guardan en un campo nuevo. Un solo cambio de base de datos, sin mover registros existentes. Más adelante se puede unificar.
- El PDF se genera repitiendo la misma plantilla por cada opción.

## Entrega por etapas
1. **Crear y editar varias opciones** + validaciones + CRM muestra todas las opciones.
2. **PDF de varias páginas** (completo).
3. **Marcar Ganado con elección de opción** + PDF de la opción elegida + marcas "Elegida / No elegida".

## Relación con otras propuestas
- **Propuesta 003 (modificar cotización vendida):** conviene construir **esta primero**, porque cambia la estructura del documento y las versiones de la 003 guardarán una copia de todas las opciones.
- **Propuesta 001:** se mantiene (todo negocio nace de una cotización con al menos una opción de menú).

## Decisiones que necesito del dueño
1. **PDF:** ¿una página por opción, con el mismo diseño de hoy y las condiciones en cada página? *(Recomiendo que sí.)*
2. **Valor en el CRM** mientras hay varias opciones: ¿cuenta la **opción principal** (Opción 1 por defecto, editable)? *(Recomiendo que sí.)*
3. **Al ganar:** ¿se pregunta cuál opción aceptó el cliente y la venta se arma con esa? *(Recomiendo que sí.)*
4. **Qué es común:** ¿cliente, vendedor, fecha, lugar, invitados, impuesto y condiciones son iguales para todas las opciones? *(Recomiendo que sí; si alguna opción tuviera distintos invitados, dímelo.)*
5. **Nombre de cada opción** editable ("Opción Parrilla") y botón "Duplicar opción". *(Recomiendo que sí.)*
6. **Orden de construcción:** esta propuesta antes que la 003. *(Recomiendo que sí.)*

## Decisión del dueño
- [ ] Apruebo con las recomendaciones  ·  [ ] Apruebo con cambios: ______________________
