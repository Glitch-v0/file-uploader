/*
  Warnings:

  - You are about to drop the column `creationDate` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `first_name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `join_date` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `last_name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `password_hash` on the `User` table. All the data in the column will be lost.
  - Added the required column `size` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "File" DROP COLUMN "creationDate",
ADD COLUMN     "size" INTEGER NOT NULL,
ADD COLUMN     "uploadDate" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "first_name",
DROP COLUMN "join_date",
DROP COLUMN "last_name",
DROP COLUMN "password_hash",
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "joinDate" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "passwordHash" TEXT;
