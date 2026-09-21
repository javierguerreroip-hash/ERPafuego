-- AlterTable
ALTER TABLE "negocios" ADD COLUMN "clienteId" TEXT;

-- AddForeignKey
ALTER TABLE "negocios" ADD CONSTRAINT "negocios_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
