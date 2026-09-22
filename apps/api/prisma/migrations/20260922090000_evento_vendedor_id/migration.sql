-- AlterTable
ALTER TABLE "eventos" ADD COLUMN "vendedorId" TEXT;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
