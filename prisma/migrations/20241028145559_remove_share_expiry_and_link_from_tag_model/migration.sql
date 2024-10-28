/*
  Warnings:

  - You are about to drop the column `shareExpirationDate` on the `Tag` table. All the data in the column will be lost.
  - You are about to drop the column `shareLink` on the `Tag` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Tag" DROP COLUMN "shareExpirationDate",
DROP COLUMN "shareLink";
