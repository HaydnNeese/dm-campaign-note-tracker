/*
  Warnings:

  - You are about to drop the column `suggestedLinksJson` on the `SessionProcessResult` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SessionProcessResult" DROP COLUMN "suggestedLinksJson";
