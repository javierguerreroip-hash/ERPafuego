-- DropIndex
DROP INDEX "inventario_final_fisico_articuloId_fecha_key";

-- AlterTable: los registros existentes quedan como conteo 2 (definitivo).
ALTER TABLE "inventario_final_fisico" ADD COLUMN "conteo" INTEGER NOT NULL DEFAULT 2;

-- CreateIndex
CREATE UNIQUE INDEX "inventario_final_fisico_articuloId_fecha_conteo_key" ON "inventario_final_fisico"("articuloId", "fecha", "conteo");
