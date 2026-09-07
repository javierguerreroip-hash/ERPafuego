-- CreateTable
CREATE TABLE "inventario_final_fisico" (
    "id" TEXT NOT NULL,
    "articuloId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "unitCost" DECIMAL(14,2) NOT NULL,
    "value" DECIMAL(14,2) NOT NULL,
    "registeredById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventario_final_fisico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inventario_final_fisico_articuloId_fecha_key" ON "inventario_final_fisico"("articuloId", "fecha");

-- AddForeignKey
ALTER TABLE "inventario_final_fisico" ADD CONSTRAINT "inventario_final_fisico_articuloId_fkey" FOREIGN KEY ("articuloId") REFERENCES "articulos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_final_fisico" ADD CONSTRAINT "inventario_final_fisico_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
