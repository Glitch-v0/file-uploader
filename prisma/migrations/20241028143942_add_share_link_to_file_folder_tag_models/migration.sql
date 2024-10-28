-- AlterTable
ALTER TABLE "File" ADD COLUMN     "shareLink" TEXT;

-- AlterTable
ALTER TABLE "Folder" ADD COLUMN     "shareLink" TEXT;

-- AlterTable
ALTER TABLE "Tag" ADD COLUMN     "shareExpirationDate" TIMESTAMPTZ,
ADD COLUMN     "shareLink" TEXT;
