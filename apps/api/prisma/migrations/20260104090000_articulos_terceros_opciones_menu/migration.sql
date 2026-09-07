-- CreateEnum
CREATE TYPE "ArticuloCategoria" AS ENUM ('MATERIA_PRIMA', 'MANO_DE_OBRA', 'SERVICIO_TRANSPORTE', 'SERVICIOS_ARTISTICOS', 'ALQUILER_MENAJE_EQUIPOS');

-- CreateEnum
CREATE TYPE "OpcionMenuCategoria" AS ENUM ('MOMENTOS_FUERTES', 'PARRILLA', 'PAELLAS', 'BOCADOS_SNACKS', 'REFRIGERIOS', 'INFANTIL', 'ADICIONALES');

-- CreateEnum
CREATE TYPE "PriceType" AS ENUM ('POR_PERSONA', 'POR_UNIDAD');

-- CreateTable
CREATE TABLE "articulos" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ArticuloCategoria" NOT NULL,
    "unit" TEXT NOT NULL,
    "lastPurchasePrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articulos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opciones_menu" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "OpcionMenuCategoria" NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "priceType" "PriceType" NOT NULL,
    "price" DECIMAL(14,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opciones_menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "identificacion" TEXT NOT NULL,
    "telefono" TEXT NOT NULL DEFAULT '',
    "correo" TEXT NOT NULL DEFAULT '',
    "direccion" TEXT NOT NULL DEFAULT '',
    "ciudad" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "identificacion" TEXT NOT NULL,
    "telefono" TEXT NOT NULL DEFAULT '',
    "correo" TEXT NOT NULL DEFAULT '',
    "categoria" "ArticuloCategoria" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "articulos_code_key" ON "articulos"("code");

-- CreateIndex
CREATE UNIQUE INDEX "opciones_menu_name_key" ON "opciones_menu"("name");
