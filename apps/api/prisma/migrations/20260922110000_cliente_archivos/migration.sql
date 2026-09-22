-- CreateTable
CREATE TABLE "cliente_archivos" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "contenido" BYTEA NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cliente_archivos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "cliente_archivos" ADD CONSTRAINT "cliente_archivos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cliente_archivos" ADD CONSTRAINT "cliente_archivos_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
