import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

// Fungsi format log transaksi (Memastikan setiap kata diawali huruf kapital)
const formatTitleCase = (str: string) => {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, type, foto } = body;

    const user = await prisma.users.findFirst({
      where: { nama: username, password },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Username atau Password salah!" },
        { status: 401 },
      );
    }

    // -- LOGIKA PENYIMPANAN FOTO FISIK --
    let fotoPath = "";
    if (foto) {
      // Hilangkan header data base64
      const base64Data = foto.replace(/^data:image\/jpeg;base64,/, "");

      // Buat nama file unik (Contoh: in-admin-1701234567.jpg)
      const fileName = `${type}-${username}-${Date.now()}.jpg`;

      // Tentukan lokasi folder (public/uploads)
      const uploadDir = join(process.cwd(), "public", "uploads");

      // Buat folder jika belum ada
      await mkdir(uploadDir, { recursive: true });

      // Simpan file ke sistem
      const filePath = join(uploadDir, fileName);
      await writeFile(filePath, base64Data, "base64");

      // Path yang akan direkam ke database
      fotoPath = `/uploads/${fileName}`;
    }

    // -- LOGIKA DATABASE --
    if (type === "in") {
      // PERBAIKAN: Ubah karyawanId menjadi userId
      const absenAktif = await prisma.absensi.findFirst({
        where: { userId: user.id, waktuKeluar: null },
      });

      if (absenAktif) {
        return NextResponse.json(
          { success: false, message: "Masih dalam status bekerja!" },
          { status: 400 },
        );
      }

      const absenBaru = await prisma.absensi.create({
        data: {
          userId: user.id,
          fotoMasuk: fotoPath,
        },
      });

      return NextResponse.json({
        success: true,
        message: formatTitleCase("proses check in berhasil"),
        data: absenBaru,
      });
    }

    if (type === "out") {
      const absenAktif = await prisma.absensi.findFirst({
        where: { userId: user.id, waktuKeluar: null },
        orderBy: { waktuMasuk: "desc" },
      });

      if (!absenAktif) {
        return NextResponse.json(
          { success: false, message: "Tidak ada data Check-In aktif!" },
          { status: 400 },
        );
      }

      const absenSelesai = await prisma.absensi.update({
        where: { id: absenAktif.id },
        data: {
          waktuKeluar: new Date(),
          fotoKeluar: fotoPath,
        },
      });

      return NextResponse.json({
        success: true,
        message: formatTitleCase("proses check out berhasil"),
        data: absenSelesai,
      });
    }

    return NextResponse.json(
      { success: false, message: "Tipe absen tidak valid" },
      { status: 400 },
    );
  } catch (error) {
    // PERBAIKAN: Tambahkan console.error agar jika crash, error aslinya terlihat di terminal
    console.error("API Absen Error:", error);

    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}
