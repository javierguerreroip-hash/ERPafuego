-- AlterTable
ALTER TABLE "parametros_nomina" ADD COLUMN "porcentajeIncapacidad" DECIMAL(5,4) NOT NULL DEFAULT 0.6667;

-- CreateTable
CREATE TABLE "incapacidades" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "observaciones" TEXT NOT NULL DEFAULT '',
    "registeredById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incapacidades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "incapacidades_userId_fecha_key" ON "incapacidades"("userId", "fecha");

-- AddForeignKey
ALTER TABLE "incapacidades" ADD CONSTRAINT "incapacidades_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incapacidades" ADD CONSTRAINT "incapacidades_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
