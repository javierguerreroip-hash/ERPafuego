-- CreateTable
CREATE TABLE "evento_opciones_menu" (
    "id" TEXT NOT NULL,
    "eventoId" TEXT NOT NULL,
    "opcionMenuId" TEXT NOT NULL,
    "numeroPersonas" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_opciones_menu_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "evento_opciones_menu_opcionMenuId_idx" ON "evento_opciones_menu"("opcionMenuId");

-- CreateIndex
CREATE UNIQUE INDEX "evento_opciones_menu_eventoId_opcionMenuId_key" ON "evento_opciones_menu"("eventoId", "opcionMenuId");

-- AddForeignKey
ALTER TABLE "evento_opciones_menu" ADD CONSTRAINT "evento_opciones_menu_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento_opciones_menu" ADD CONSTRAINT "evento_opciones_menu_opcionMenuId_fkey" FOREIGN KEY ("opcionMenuId") REFERENCES "opciones_menu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Los eventos existentes pasan a tener una línea con su opción de menú y
-- su número de personas actuales.
INSERT INTO "evento_opciones_menu" ("id", "eventoId", "opcionMenuId", "numeroPersonas")
SELECT gen_random_uuid()::text, "id", "opcionMenuId", "numeroPersonas"
FROM "eventos";
