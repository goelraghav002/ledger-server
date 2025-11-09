-- CreateTable
CREATE TABLE "Balance" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "partyId" TEXT,
    "amount" DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Balance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Balance_orgId_idx" ON "Balance"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Balance_orgId_partyId_key" ON "Balance"("orgId", "partyId");
