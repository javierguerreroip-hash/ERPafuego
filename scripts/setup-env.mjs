import { existsSync, copyFileSync } from 'node:fs';

// Crea los archivos .env locales a partir de los .env.example la primera vez
// que se corre el proyecto, para que "npm run dev" funcione con un solo comando.
const envFiles = [
  ['.env.example', '.env'],
  ['apps/api/.env.example', 'apps/api/.env'],
  ['apps/web/.env.example', 'apps/web/.env'],
];

for (const [example, target] of envFiles) {
  if (!existsSync(target) && existsSync(example)) {
    copyFileSync(example, target);
    console.log(`Creado ${target} a partir de ${example}`);
  }
}
