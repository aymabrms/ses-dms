-- CreateEnum
CREATE TYPE "SyncRequestStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "sync_requests" (
    "id" UUID NOT NULL,
    "clientRequestId" UUID NOT NULL,
    "status" "SyncRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestJson" JSONB,
    "responseJson" JSONB,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sync_requests_clientRequestId_key" ON "sync_requests"("clientRequestId");
