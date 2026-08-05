-- CreateTable
CREATE TABLE "Karyawan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nama" TEXT NOT NULL,
    "password" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Absensi" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "karyawanId" INTEGER NOT NULL,
    "waktuMasuk" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "waktuKeluar" DATETIME,
    "fotoMasuk" TEXT NOT NULL,
    "fotoKeluar" TEXT,
    CONSTRAINT "Absensi_karyawanId_fkey" FOREIGN KEY ("karyawanId") REFERENCES "Karyawan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
