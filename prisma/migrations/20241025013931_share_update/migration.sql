-- AlterTable
ALTER TABLE "File" ADD COLUMN     "shareExpirationDate" TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "Folder" ADD COLUMN     "shareExpirationDate" TIMESTAMPTZ;
