// Envuelve la API Express existente (apps/api/src/app.ts) como una
// Netlify Function — no se duplica ninguna ruta ni lógica de negocio,
// solo se adapta el mismo `app` al formato request/response de Lambda
// que usa Netlify por debajo.
import serverless from 'serverless-http';
import { app } from '../../apps/api/src/app.js';

export const handler = serverless(app);
