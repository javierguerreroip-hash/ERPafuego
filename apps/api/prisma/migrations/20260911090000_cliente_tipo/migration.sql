-- CreateEnum
CREATE TYPE "ClienteTipo" AS ENUM ('PERSONA_NATURAL', 'CORPORATIVO');

-- AlterTable
ALTER TABLE "clientes" ADD COLUMN "tipoCliente" "ClienteTipo" NOT NULL DEFAULT 'PERSONA_NATURAL';
