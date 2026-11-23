-- CreateEnum
CREATE TYPE "ProductKind" AS ENUM ('MAIN', 'ORDER_BUMP');

-- CreateEnum
CREATE TYPE "ConsentPurpose" AS ENUM ('PALM_READING', 'INTERNATIONAL_TRANSFER');

-- CreateEnum
CREATE TYPE "ConsentUseState" AS ENUM ('PENDING', 'COMPLETED', 'REFUNDED');

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "ProductKind" NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PalmConsentRecord" (
    "id" TEXT NOT NULL,
    "receiptHash" CHAR(64) NOT NULL,
    "consentVersion" VARCHAR(16) NOT NULL,
    "purposes" "ConsentPurpose"[],
    "adultDeclared" BOOLEAN NOT NULL,
    "acceptedAt" TIMESTAMPTZ(0) NOT NULL,
    "receiptExpiresAt" TIMESTAMPTZ(3) NOT NULL,
    "analysesUsed" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMPTZ(0),
    "revokedAt" TIMESTAMPTZ(0),
    "deleteAfter" TIMESTAMPTZ(0) NOT NULL,

    CONSTRAINT "PalmConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PalmConsentUse" (
    "id" TEXT NOT NULL,
    "consentId" TEXT NOT NULL,
    "requestHash" CHAR(64) NOT NULL,
    "state" "ConsentUseState" NOT NULL DEFAULT 'PENDING',
    "leaseId" CHAR(32) NOT NULL,
    "leaseUntil" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" TIMESTAMPTZ(3),

    CONSTRAINT "PalmConsentUse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PalmSharedResult" (
    "useId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PalmSharedResult_pkey" PRIMARY KEY ("useId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PalmConsentRecord_receiptHash_key" ON "PalmConsentRecord"("receiptHash");

-- CreateIndex
CREATE INDEX "PalmConsentRecord_deleteAfter_idx" ON "PalmConsentRecord"("deleteAfter");

-- CreateIndex
CREATE INDEX "PalmConsentUse_state_leaseUntil_idx" ON "PalmConsentUse"("state", "leaseUntil");

-- CreateIndex
CREATE INDEX "PalmConsentUse_settledAt_idx" ON "PalmConsentUse"("settledAt");

-- CreateIndex
CREATE UNIQUE INDEX "PalmConsentUse_consentId_requestHash_key" ON "PalmConsentUse"("consentId", "requestHash");

-- CreateIndex
CREATE INDEX "PalmSharedResult_expiresAt_idx" ON "PalmSharedResult"("expiresAt");

-- AddForeignKey
ALTER TABLE "PalmConsentUse" ADD CONSTRAINT "PalmConsentUse_consentId_fkey" FOREIGN KEY ("consentId") REFERENCES "PalmConsentRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PalmSharedResult" ADD CONSTRAINT "PalmSharedResult_useId_fkey" FOREIGN KEY ("useId") REFERENCES "PalmConsentUse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Restrições de integridade (Fase 03G.3): a contagem nunca fica negativa,
-- toda evidência tem ao menos uma finalidade, e os hashes têm formato fixo.
ALTER TABLE "PalmConsentRecord"
  ADD CONSTRAINT "PalmConsentRecord_analysesUsed_check" CHECK ("analysesUsed" >= 0),
  ADD CONSTRAINT "PalmConsentRecord_purposes_check" CHECK (cardinality("purposes") >= 1),
  ADD CONSTRAINT "PalmConsentRecord_receiptHash_check" CHECK ("receiptHash" ~ '^[0-9a-f]{64}$');
ALTER TABLE "PalmConsentUse"
  ADD CONSTRAINT "PalmConsentUse_requestHash_check" CHECK ("requestHash" ~ '^[0-9a-f]{64}$');
