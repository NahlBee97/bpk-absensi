import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const riwayat = await prisma.absensi.findMany({
      include: {
        users: true, // Gabungkan data nama karyawan dari tabel relasi
      },
      orderBy: {
        waktuMasuk: "desc", // Urutkan dari yang paling baru
      },
    });

    // Format data agar siap dirender oleh tabel frontend
    const formattedData = riwayat.map((absen: any) => {
      // Pembentukan format tanggal m/d/y
      const dateObj = new Date(absen.waktuMasuk);
      const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
      const dd = String(dateObj.getDate()).padStart(2, "0");
      const yy = String(dateObj.getFullYear()).slice(-2);
      const formattedDate = `${mm}/${dd}/${yy}`;

      return {
        id: absen.id,
        nama: absen.users.nama,
        tanggal: formattedDate,
        fotoMasuk: absen.fotoMasuk,
        fotoKeluar: absen.fotoKeluar,
        waktuMasuk: absen.waktuMasuk,
        waktuKeluar: absen.waktuKeluar || "-",
      };
    });

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data" },
      { status: 500 },
    );
  }
}
