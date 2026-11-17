CREATE TABLE "CustomerAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomerAccount_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CustomerAccount_email_key" ON "CustomerAccount"("email");
CREATE TABLE "CustomerSession" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CustomerSession_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CustomerSession_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "CustomerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "CustomerSession_accountId_idx" ON "CustomerSession"("accountId");
CREATE INDEX "CustomerSession_expiresAt_idx" ON "CustomerSession"("expiresAt");
ALTER TABLE "Order" ADD COLUMN "accountId" TEXT;
CREATE INDEX "Order_accountId_id_idx" ON "Order"("accountId", "id");
ALTER TABLE "Order" ADD CONSTRAINT "Order_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "CustomerAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
