CREATE TABLE "CustomerAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "CustomerAccount_email_key" ON "CustomerAccount"("email");
CREATE TABLE "CustomerSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "CustomerSession_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "CustomerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "CustomerSession_accountId_idx" ON "CustomerSession"("accountId");
CREATE INDEX "CustomerSession_expiresAt_idx" ON "CustomerSession"("expiresAt");
ALTER TABLE "Order" ADD COLUMN "accountId" TEXT REFERENCES "CustomerAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Order_accountId_id_idx" ON "Order"("accountId", "id");
