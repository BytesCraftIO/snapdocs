/*
  Warnings:

  - You are about to drop the `PageBlock` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PageBlock" DROP CONSTRAINT "PageBlock_pageId_fkey";

-- DropTable
DROP TABLE "PageBlock";
