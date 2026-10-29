-- Cambio de la cuenta de consignación en las condiciones comerciales de
-- las cotizaciones ya guardadas: solo reemplaza la frase exacta que venía
-- por defecto; si alguien editó ese texto a mano, no se toca.
UPDATE "cotizaciones"
SET "condicionesComerciales" = REPLACE(
  "condicionesComerciales",
  'Consignar a la cuenta de ahorros No. 00715370042 de Bancolombia, a nombre de Afuego Eventos S.A.S. - NIT 901.530.094-4.',
  'Consignar a la cuenta de ahorros Bancolombia No. 43600001941, a nombre de Afuego Eventos S.A.S. - NIT 901530094-4.'
)
WHERE "condicionesComerciales" LIKE '%00715370042%';
