-- AlterTable
ALTER TABLE "File" ALTER COLUMN "creationDate" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Folder" ALTER COLUMN "creationDate" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "join_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
