/*
  Warnings:

  - You are about to drop the column `url` on the `Folder` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Folder_url_key";

-- AlterTable
ALTER TABLE "Folder" DROP COLUMN "url";
