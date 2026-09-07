-- CreateTable
CREATE TABLE "parametros_nomina" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "smlv" DECIMAL(14,2) NOT NULL,
    "divisorHoras" DECIMAL(6,2) NOT NULL,
    "auxilioTransporte" DECIMAL(14,2) NOT NULL,
    "recargoNocturno" DECIMAL(5,4) NOT NULL,
    "recargoExtraDiurna" DECIMAL(5,4) NOT NULL,
    "recargoExtraNocturna" DECIMAL(5,4) NOT NULL,
    "recargoDominicalFestiva" DECIMAL(5,4) NOT NULL,
    "recargoNocturnoDomFestivo" DECIMAL(5,4) NOT NULL,
    "recargoExtraDiurnaDomFestiva" DECIMAL(5,4) NOT NULL,
    "recargoExtraNocturnaDomFestiva" DECIMAL(5,4) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parametros_nomina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dias_festivos" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "nombre" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "dias_festivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turnos" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "horaEntrada" TIMESTAMP(3) NOT NULL,
    "horaSalida" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turnos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dias_festivos_fecha_key" ON "dias_festivos"("fecha");

-- CreateIndex
CREATE INDEX "turnos_userId_idx" ON "turnos"("userId");

-- AddForeignKey
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
