-- CreateEnum
CREATE TYPE "CondicionPago" AS ENUM ('CONTADO', 'CREDITO');

-- CreateTable
CREATE TABLE "compras" (
    "id" TEXT NOT NULL,
    "articuloId" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" DECIMAL(14,2) NOT NULL,
    "totalValue" DECIMAL(14,2) NOT NULL,
    "facturaNumero" TEXT NOT NULL,
    "condicionPago" "CondicionPago" NOT NULL,
    "fechaVencimiento" TIMESTAMP(3),
    "registeredById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compras_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "compras_articuloId_idx" ON "compras"("articuloId");

-- CreateIndex
CREATE INDEX "compras_proveedorId_idx" ON "compras"("proveedorId");

-- CreateIndex
CREATE INDEX "compras_facturaNumero_idx" ON "compras"("facturaNumero");

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_articuloId_fkey" FOREIGN KEY ("articuloId") REFERENCES "articulos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
