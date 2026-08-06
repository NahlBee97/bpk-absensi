/*
  Warnings:

  - You are about to drop the `Karyawan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `karyawanId` on the `Absensi` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Absensi` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Karyawan";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nama" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user'
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Absensi" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "waktuMasuk" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "waktuKeluar" DATETIME,
    "fotoMasuk" TEXT NOT NULL,
    "fotoKeluar" TEXT,
    CONSTRAINT "Absensi_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Absensi" ("fotoKeluar", "fotoMasuk", "id", "waktuKeluar", "waktuMasuk") SELECT "fotoKeluar", "fotoMasuk", "id", "waktuKeluar", "waktuMasuk" FROM "Absensi";
DROP TABLE "Absensi";
ALTER TABLE "new_Absensi" RENAME TO "Absensi";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
