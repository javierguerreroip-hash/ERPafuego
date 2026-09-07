-- CreateTable
CREATE TABLE "agenda_eventos" (
    "id" TEXT NOT NULL,
    "eventoId" TEXT NOT NULL,
    "personaContacto" TEXT NOT NULL DEFAULT '',
    "telefonoContacto" TEXT NOT NULL DEFAULT '',
    "direccion" TEXT NOT NULL DEFAULT '',
    "horaServicio" TEXT NOT NULL DEFAULT '',
    "anticipo" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "observaciones" TEXT NOT NULL DEFAULT '',
    "vendedorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agenda_eventos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agenda_eventos_eventoId_key" ON "agenda_eventos"("eventoId");

-- AddForeignKey
ALTER TABLE "agenda_eventos" ADD CONSTRAINT "agenda_eventos_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "eventos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda_eventos" ADD CONSTRAINT "agenda_eventos_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
