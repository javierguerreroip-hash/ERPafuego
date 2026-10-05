-- CreateTable
CREATE TABLE "evento_archivos" (
    "id" TEXT NOT NULL,
    "eventoId" TEXT NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "contenido" BYTEA NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_archivos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "evento_archivos_eventoId_idx" ON "evento_archivos"("eventoId");

-- AddForeignKey
ALTER TABLE "evento_archivos" ADD CONSTRAINT "evento_archivos_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento_archivos" ADD CONSTRAINT "evento_archivos_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Trazabilidad del vendedor: los registros de Agenda sin vendedor toman el
-- del evento (que viene del CRM). Solo rellena los vacíos, nunca pisa uno
-- ya asignado.
UPDATE "agenda_eventos" AS a
SET "vendedorId" = e."vendedorId"
FROM "eventos" AS e
WHERE a."eventoId" = e."id"
  AND a."vendedorId" IS NULL
  AND e."vendedorId" IS NOT NULL;
