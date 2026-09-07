-- CreateTable
CREATE TABLE "gastos_administrativos" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "arriendo" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "nomina" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "serviciosPublicos" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "honorariosContadorSocios" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "controlPlagas" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "seguros" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "internet" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "adicionales" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "cuotaObligacionFinanciera" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "registeredById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gastos_administrativos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gastos_administrativos_year_month_key" ON "gastos_administrativos"("year", "month");

-- AddForeignKey
ALTER TABLE "gastos_administrativos" ADD CONSTRAINT "gastos_administrativos_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
