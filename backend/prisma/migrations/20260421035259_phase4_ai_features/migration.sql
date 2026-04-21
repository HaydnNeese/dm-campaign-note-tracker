-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "processedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isPremium" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "SessionProcessResult" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "extractedNpcsJson" JSONB NOT NULL,
    "suggestedLinksJson" JSONB NOT NULL,
    "questUpdatesJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionProcessResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionRecap" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionRecap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SessionProcessResult_noteId_idx" ON "SessionProcessResult"("noteId");

-- CreateIndex
CREATE INDEX "SessionRecap_noteId_idx" ON "SessionRecap"("noteId");

-- AddForeignKey
ALTER TABLE "SessionProcessResult" ADD CONSTRAINT "SessionProcessResult_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionRecap" ADD CONSTRAINT "SessionRecap_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;
