import { existsSync } from 'node:fs';
import { config } from 'dotenv';
import pkg from 'pg';

const { Client } = pkg;

// Carga las variables de entorno del backend para saber a qué base de datos conectarse
const apiEnvPath = 'apps/api/.env';
if (existsSync(apiEnvPath)) {
  config({ path: apiEnvPath });
} else {
  config();
}

const MAX_ATTEMPTS = 30;
const DELAY_MS = 1000;

async function waitForDb() {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
      await client.connect();
      await client.end();
      console.log('Base de datos disponible.');
      return;
    } catch {
      console.log(`Esperando PostgreSQL... intento ${attempt}/${MAX_ATTEMPTS}`);
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }
  console.error('No fue posible conectar a PostgreSQL a tiempo.');
  process.exit(1);
}

waitForDb();
