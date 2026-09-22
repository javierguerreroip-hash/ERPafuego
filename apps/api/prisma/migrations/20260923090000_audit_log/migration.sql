-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "registroId" TEXT NOT NULL,
    "registroNombre" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "detalle" JSONB,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_modelo_idx" ON "audit_logs"("modelo");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
