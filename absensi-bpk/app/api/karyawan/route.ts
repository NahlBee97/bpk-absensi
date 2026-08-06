import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    // Menangkap parameter dari URL (contoh: /api/users?id=1)
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    // 1. Logika: Get Karyawan by ID (Jika parameter ID tersedia)
    if (id) {
      const user = await prisma.users.findUnique({
        where: {
          id: parseInt(id), // Ubah string ID dari URL menjadi angka (Integer)
        },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, message: "Data users tidak ditemukan!" },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        data: user,
      });
    }

    // 2. Logika: Get All Karyawan (Jika parameter ID tidak ada)
    const semuaKaryawan = await prisma.users.findMany({
      orderBy: {
        id: "asc", // Opsional: mengurutkan berdasarkan ID terkecil/terlama
      },
    });

    return NextResponse.json({
      success: true,
      data: semuaKaryawan,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server saat mengambil data users",
      },
      { status: 500 },
    );
  }
}
