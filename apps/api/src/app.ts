import express from 'express';
import cors from 'cors';
import { router } from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { env } from './config/env.js';

export const app = express();

app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());

app.use('/api', router);

// 404 consistente en JSON para rutas no encontradas — sin esto, Express
// responde con su página HTML por defecto, distinta al resto de errores
// de la API.
app.use((_req, res) => {
  res.status(404).json({ message: 'Recurso no encontrado' });
});

app.use(errorHandler);
