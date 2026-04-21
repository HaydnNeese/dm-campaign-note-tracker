/*
  Warnings:

  - You are about to drop the column `extractedNpcsJson` on the `SessionProcessResult` table. All the data in the column will be lost.
  - Added the required column `extractedEntitiesJson` to the `SessionProcessResult` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SessionProcessResult" DROP COLUMN "extractedNpcsJson",
ADD COLUMN     "extractedEntitiesJson" JSONB NOT NULL;
