-- AlterTable
ALTER TABLE "parametros_nomina" ADD COLUMN "porcentajeEPS" DECIMAL(5,4) NOT NULL DEFAULT 0.04;
ALTER TABLE "parametros_nomina" ADD COLUMN "porcentajeAFP" DECIMAL(5,4) NOT NULL DEFAULT 0.04;
