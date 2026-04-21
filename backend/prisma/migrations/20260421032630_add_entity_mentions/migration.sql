-- CreateTable
CREATE TABLE "EntityMention" (
    "id" TEXT NOT NULL,
    "sourceEntityId" TEXT NOT NULL,
    "targetEntityId" TEXT NOT NULL,
    "startIndex" INTEGER NOT NULL,
    "endIndex" INTEGER NOT NULL,
    "displayText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntityMention_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EntityMention_sourceEntityId_idx" ON "EntityMention"("sourceEntityId");

-- CreateIndex
CREATE INDEX "EntityMention_targetEntityId_idx" ON "EntityMention"("targetEntityId");

-- AddForeignKey
ALTER TABLE "EntityMention" ADD CONSTRAINT "EntityMention_sourceEntityId_fkey" FOREIGN KEY ("sourceEntityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityMention" ADD CONSTRAINT "EntityMention_targetEntityId_fkey" FOREIGN KEY ("targetEntityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
