-- DropIndex
DROP INDEX "User_id_key" CASCADE;

-- AlterTable
ALTER TABLE "User" ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
