-- CreateEnum
CREATE TYPE "EtapaNegocio" AS ENUM ('COTIZADO', 'GANADO', 'PERDIDO');

-- CreateTable
CREATE TABLE "negocios" (
    "id" TEXT NOT NULL,
    "clienteNombre" TEXT NOT NULL,
    "clienteIdentificacion" TEXT NOT NULL DEFAULT '',
    "telefono" TEXT NOT NULL DEFAULT '',
    "nombreEvento" TEXT NOT NULL,
    "fechaEvento" TIMESTAMP(3) NOT NULL,
    "valorAntesImpuestos" DECIMAL(14,2) NOT NULL,
    "etapa" "EtapaNegocio" NOT NULL DEFAULT 'COTIZADO',
    "eventoId" TEXT,
    "vendedorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "negocios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "negocios_eventoId_key" ON "negocios"("eventoId");

-- AddForeignKey
ALTER TABLE "negocios" ADD CONSTRAINT "negocios_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "eventos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negocios" ADD CONSTRAINT "negocios_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
