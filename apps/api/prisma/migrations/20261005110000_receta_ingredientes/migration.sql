-- CreateTable
CREATE TABLE "receta_ingredientes" (
    "id" TEXT NOT NULL,
    "opcionMenuId" TEXT NOT NULL,
    "articuloId" TEXT NOT NULL,
    "cantidad" DECIMAL(14,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receta_ingredientes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "receta_ingredientes_articuloId_idx" ON "receta_ingredientes"("articuloId");

-- CreateIndex
CREATE UNIQUE INDEX "receta_ingredientes_opcionMenuId_articuloId_key" ON "receta_ingredientes"("opcionMenuId", "articuloId");

-- AddForeignKey
ALTER TABLE "receta_ingredientes" ADD CONSTRAINT "receta_ingredientes_opcionMenuId_fkey" FOREIGN KEY ("opcionMenuId") REFERENCES "opciones_menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receta_ingredientes" ADD CONSTRAINT "receta_ingredientes_articuloId_fkey" FOREIGN KEY ("articuloId") REFERENCES "articulos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
