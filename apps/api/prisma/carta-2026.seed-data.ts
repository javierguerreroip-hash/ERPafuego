import type { OpcionMenuCategoria, PriceType } from '@erp-afuego/shared';

export interface CartaItemSeed {
  name: string;
  category: OpcionMenuCategoria;
  priceType: PriceType;
  price: number;
  description: string;
}

// Catálogo semilla — Anexo A "Carta 2026" (docs/spec_erp_afuego.md).
// Nota: la especificación menciona "Momento 90 MIL (x2 variantes adicionales
// según carta, mismo rango de precio)" sin describir su contenido — no se
// inventaron esos dos platos; se pueden agregar luego desde la interfaz
// cuando se conozca su composición real.
export const CARTA_2026: CartaItemSeed[] = [
  // Momentos / Fuertes
  {
    name: 'Momento 100 MIL — Porcheta de Cerdo / Dos Carnes',
    category: 'MOMENTOS_FUERTES',
    priceType: 'POR_PERSONA',
    price: 100000,
    description:
      'Entrada: porcheta de cerdo. Fuerte: 2 carnes (punta de anca/chata de 160gr) más churrasco de pollo de 120gr en romero y mostaza, papa americana, mezclum de lechugas con tomate cherry y vinagreta balsámica.',
  },
  {
    name: 'Momento 100 MIL — Ceviche de Chicharrón / Beef Chorizo',
    category: 'MOMENTOS_FUERTES',
    priceType: 'POR_PERSONA',
    price: 100000,
    description:
      'Entrada: ceviche de chicharrón. Fuerte: beef chorizo/churrasco argentino entre 220 y 250gr, mezclum de lechugas con tomate cherry, vinagreta balsámica y puré de papa cremoso.',
  },
  {
    name: 'Momento 95 MIL — Pinchos de Langostinos / Solomito Baby Beef',
    category: 'MOMENTOS_FUERTES',
    priceType: 'POR_PERSONA',
    price: 95000,
    description:
      'Entrada: pinchos de langostinos. Fuerte: solomito baby beef de 220gr, mezclum de lechugas con tomate cherry, vinagreta balsámica y papa en casco.',
  },
  {
    name: 'Momento 95 MIL — Ensalada Mezclum / Punta de Anca',
    category: 'MOMENTOS_FUERTES',
    priceType: 'POR_PERSONA',
    price: 95000,
    description:
      'Entrada: ensalada de mezclum, queso feta, jamón serrano y duraznos. Fuerte: punta de anca 200gr, mezclum de lechugas, tomate cherry, vinagreta balsámica, papas provenzales, acompañado de chimichurri.',
  },
  {
    name: 'Momento 90 MIL — Solomito / Punta de Anca',
    category: 'MOMENTOS_FUERTES',
    priceType: 'POR_PERSONA',
    price: 90000,
    description:
      'Fuerte: solomito/punta de anca con mezclum de lechugas, tomate cherry, vinagreta balsámica y papa al vapor.',
  },
  {
    name: 'Momento 90 MIL — Rack de Costillas BBQ',
    category: 'MOMENTOS_FUERTES',
    priceType: 'POR_PERSONA',
    price: 90000,
    description: 'Fuerte: rack de costillas 450gr en BBQ de guayaba, milhoja de papa.',
  },
  {
    name: 'Hamburguesa Angus',
    category: 'MOMENTOS_FUERTES',
    priceType: 'POR_PERSONA',
    price: 75000,
    description:
      'Pan y carne artesanal de 150gr, tocineta, queso, cebolla caramelizada, tomate, lechuga y salsa.',
  },
  {
    name: 'Fuerte 65 MIL',
    category: 'MOMENTOS_FUERTES',
    priceType: 'POR_PERSONA',
    price: 65000,
    description: 'Variante de menú del día / opción económica (composición pendiente de detallar).',
  },

  // Parrilla
  {
    name: 'Parrilla 10 Momentos',
    category: 'PARRILLA',
    priceType: 'POR_PERSONA',
    price: 110000,
    description:
      'Costillas, punta de anca, choripán argentino, ceviche de chicharrón, tacos de carnitas, perritos de camarones, elote, arepas con guacamole, queso asado, pinchos de vegetales con pesto.',
  },
  {
    name: 'Parrilla 9 Momentos',
    category: 'PARRILLA',
    priceType: 'POR_PERSONA',
    price: 90000,
    description:
      'Punta de anca, pollo, chicharrón, morcilla, costilla, queso asado, choripán argentino, solomito de res, piña asada. Guarniciones: papa, tostones, arepas, guacamole y hogao.',
  },
  {
    name: 'Parrilla 7 Momentos',
    category: 'PARRILLA',
    priceType: 'POR_PERSONA',
    price: 80000,
    description:
      'Punta de anca, pollo, chicharrón, morcilla, costilla, queso asado, choripán argentino. Guarniciones: papa, tostones, arepas, guacamole y hogao.',
  },
  {
    name: 'Parrilla 5 Momentos',
    category: 'PARRILLA',
    priceType: 'POR_PERSONA',
    price: 70000,
    description:
      'Ceviche de chicharrón, tacos de pulled pork, punta de anca, trenza de chorizos, queso asado con mermelada de tomate. Guarniciones: papa, tostones, arepas, guacamole y hogao.',
  },

  // Paellas
  {
    name: 'Paella Valenciana',
    category: 'PAELLAS',
    priceType: 'POR_PERSONA',
    price: 95000,
    description:
      'Colas de langosta, langostinos, camarones, anillos de calamar, pulpo, mejillón y palmitos de cangrejo. Acompañada de alioli, baguette y limón.',
  },
  {
    name: 'Paella Marinera Especial',
    category: 'PAELLAS',
    priceType: 'POR_PERSONA',
    price: 80000,
    description: 'Langostinos, camarones, anillos de calamar, pulpo, mejillón y palmitos de cangrejo.',
  },
  {
    name: 'Paella Mixta',
    category: 'PAELLAS',
    priceType: 'POR_PERSONA',
    price: 65000,
    description:
      'Langostinos, camarones, anillos de calamar, mejillones, costilla, chorizo, pierna de cerdo y colombinas de pollo.',
  },
  {
    name: 'Paella Marinera',
    category: 'PAELLAS',
    priceType: 'POR_PERSONA',
    price: 55000,
    description: 'Costilla de cerdo, colombinas de pollo, chorizo y pierna de cerdo.',
  },
  {
    name: 'Paella Vegetariana',
    category: 'PAELLAS',
    priceType: 'POR_PERSONA',
    price: 55000,
    description:
      'Base de arroz preparada en fondo de vegetales, con espárragos, setas, guisantes y tofu.',
  },

  // Menú infantil
  {
    name: 'Nuggets de Pollo con Chips de Papa',
    category: 'INFANTIL',
    priceType: 'POR_UNIDAD',
    price: 25000,
    description: '',
  },
  {
    name: 'Mini Hamburguesa',
    category: 'INFANTIL',
    priceType: 'POR_UNIDAD',
    price: 25000,
    description: '',
  },
  {
    name: 'Mini Chuzo de Pollo con Chips de Papa',
    category: 'INFANTIL',
    priceType: 'POR_UNIDAD',
    price: 30000,
    description: '',
  },

  // Bocados / Snacks (mínimo 4 tipos, 15 unidades c/u — ver ficha comercial)
  {
    name: 'Shot Dip Tomate Seco con Grissini',
    category: 'BOCADOS_SNACKS',
    priceType: 'POR_UNIDAD',
    price: 7000,
    description: '',
  },
  {
    name: 'Shot de Arándanos y Tocineta con Grissini',
    category: 'BOCADOS_SNACKS',
    priceType: 'POR_UNIDAD',
    price: 12000,
    description: '',
  },
  {
    name: 'Langostino Apanado',
    category: 'BOCADOS_SNACKS',
    priceType: 'POR_UNIDAD',
    price: 12000,
    description: '',
  },
  {
    name: 'Empanada de Lechona',
    category: 'BOCADOS_SNACKS',
    priceType: 'POR_UNIDAD',
    price: 5000,
    description: '',
  },
  { name: 'Pastel de Pollo', category: 'BOCADOS_SNACKS', priceType: 'POR_UNIDAD', price: 5000, description: '' },
  {
    name: 'Tabla de Madurados',
    category: 'BOCADOS_SNACKS',
    priceType: 'POR_UNIDAD',
    price: 12000,
    description: '',
  },
  {
    name: 'Ceviche de Chicharrón',
    category: 'BOCADOS_SNACKS',
    priceType: 'POR_UNIDAD',
    price: 12000,
    description: '',
  },
  {
    name: 'Baos de Bondiola Ahumada',
    category: 'BOCADOS_SNACKS',
    priceType: 'POR_UNIDAD',
    price: 10000,
    description: '',
  },
  {
    name: 'Montaditos o Tapas (Tomates Secos y Jamón Serrano)',
    category: 'BOCADOS_SNACKS',
    priceType: 'POR_UNIDAD',
    price: 10000,
    description: '',
  },
  {
    name: 'Montaditos (Carne, Queso, Tomate y Cogollo)',
    category: 'BOCADOS_SNACKS',
    priceType: 'POR_UNIDAD',
    price: 160000,
    description:
      '70gr de carne de res, queso, tomate y cogollo. Precio de referencia por tabla/lote — validar la unidad exacta antes de cotizar.',
  },
  {
    name: 'Bocado de Choripán',
    category: 'BOCADOS_SNACKS',
    priceType: 'POR_UNIDAD',
    price: 9000,
    description: '',
  },
  {
    name: 'Mini Hamburguesa (Bocado)',
    category: 'BOCADOS_SNACKS',
    priceType: 'POR_UNIDAD',
    price: 12000,
    description: '',
  },
  {
    name: 'Perrito Americano',
    category: 'BOCADOS_SNACKS',
    priceType: 'POR_UNIDAD',
    price: 8000,
    description: 'Salchicha americana, salsas y ripio.',
  },
  {
    name: 'Mini Wrap de Pollo',
    category: 'BOCADOS_SNACKS',
    priceType: 'POR_UNIDAD',
    price: 10000,
    description: '',
  },
  { name: 'Elotes Dulces', category: 'BOCADOS_SNACKS', priceType: 'POR_UNIDAD', price: 8000, description: '' },
  {
    name: 'Canasticas de Plátano con Carne Desmechada',
    category: 'BOCADOS_SNACKS',
    priceType: 'POR_UNIDAD',
    price: 10000,
    description: '',
  },
  {
    name: 'Arepitas de Queso',
    category: 'BOCADOS_SNACKS',
    priceType: 'POR_UNIDAD',
    price: 7000,
    description: '',
  },
  {
    name: 'Cóctel de Camarones con Guacamole y Chicharrón',
    category: 'BOCADOS_SNACKS',
    priceType: 'POR_UNIDAD',
    price: 12000,
    description: '',
  },
  {
    name: 'Ceviche (Pesca Blanca en Leche de Tigre)',
    category: 'BOCADOS_SNACKS',
    priceType: 'POR_UNIDAD',
    price: 12000,
    description: '',
  },
  { name: 'Shot de Parfait', category: 'BOCADOS_SNACKS', priceType: 'POR_UNIDAD', price: 12000, description: '' },
  {
    name: 'Burritos Mexicanos',
    category: 'BOCADOS_SNACKS',
    priceType: 'POR_UNIDAD',
    price: 14000,
    description: '',
  },
  {
    name: 'Totopos con Salsa Taquera',
    category: 'BOCADOS_SNACKS',
    priceType: 'POR_UNIDAD',
    price: 12000,
    description: 'Lluvia de totopos con salsa taquera.',
  },

  // Refrigerios
  {
    name: 'Sánduche Burrata',
    category: 'REFRIGERIOS',
    priceType: 'POR_PERSONA',
    price: 25000,
    description:
      'Pan de avena y masa madre, jamón de pavo, burrata, tomate seco, rúgula y aderezo de mostaza. Acompañante: brownie, fruta picada, papa chip o corazón hojaldrado.',
  },
  {
    name: 'Sándwich Club',
    category: 'REFRIGERIOS',
    priceType: 'POR_PERSONA',
    price: 21000,
    description:
      'Pan molde dorado, jamón de cerdo, pollo, queso, tomate, lechuga y aderezo de la casa. Acompañante: brownie, fruta picada, papa chip o corazón hojaldrado.',
  },
  {
    name: 'Burro Mexicano',
    category: 'REFRIGERIOS',
    priceType: 'POR_PERSONA',
    price: 22000,
    description:
      'Tortilla, frijol refrito, carne molida, pico de gallo, guacamole, sour cream, lechuga y queso. Acompañante: lluvia de totopos.',
  },
  {
    name: 'Parfait',
    category: 'REFRIGERIOS',
    priceType: 'POR_PERSONA',
    price: 15000,
    description: 'Granola natural, yogurt griego, frutas y mermelada de frutos rojos, en recipiente de vidrio.',
  },
  {
    name: 'Wrap de Pollo',
    category: 'REFRIGERIOS',
    priceType: 'POR_PERSONA',
    price: 19000,
    description: 'Tortilla, cubos de pollo, lechuga y aderezo. Acompañante: chips de plátano.',
  },
  {
    name: 'Croissant de Tocineta y Queso Crema Dulce',
    category: 'REFRIGERIOS',
    priceType: 'POR_PERSONA',
    price: 18000,
    description: 'Acompañante: alfajor, brownie o fruta.',
  },
  {
    name: 'Croissant de Jamón Serrano y Aceitunas',
    category: 'REFRIGERIOS',
    priceType: 'POR_PERSONA',
    price: 18000,
    description: 'Acompañante: alfajor, brownie o fruta.',
  },
  {
    name: 'Waffles con Arequipe o Nutella',
    category: 'REFRIGERIOS',
    priceType: 'POR_PERSONA',
    price: 18000,
    description: 'Acompañados de fresas y banano.',
  },

  // Adicionales
  {
    name: 'Papas Chip (Adicional)',
    category: 'ADICIONALES',
    priceType: 'POR_UNIDAD',
    price: 40000,
    description: 'Adicional para Hamburguesa Angus — precio de referencia según carta.',
  },
  {
    name: 'Papas Francesas (Adicional)',
    category: 'ADICIONALES',
    priceType: 'POR_UNIDAD',
    price: 45000,
    description: 'Adicional para Hamburguesa Angus — precio de referencia según carta.',
  },
  {
    name: 'Montaje de Mesa (Adicional Bocados)',
    category: 'ADICIONALES',
    priceType: 'POR_UNIDAD',
    price: 150000,
    description: 'Adicional del módulo de bocados a fuego.',
  },
  {
    name: 'Transporte Medellín y Alrededores (Adicional Bocados)',
    category: 'ADICIONALES',
    priceType: 'POR_UNIDAD',
    price: 80000,
    description: 'Adicional del módulo de bocados a fuego.',
  },
];
