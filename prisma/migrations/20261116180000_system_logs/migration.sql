-- CreateTable
CREATE TABLE "SystemLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "entityId" TEXT,
    "requestId" TEXT,
    "details" JSONB NOT NULL,

    CONSTRAINT "SystemLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SystemLog_createdAt_id_idx" ON "SystemLog"("createdAt", "id");

-- CreateIndex
CREATE INDEX "SystemLog_category_createdAt_idx" ON "SystemLog"("category", "createdAt");

-- CreateIndex
CREATE INDEX "SystemLog_level_createdAt_idx" ON "SystemLog"("level", "createdAt");
