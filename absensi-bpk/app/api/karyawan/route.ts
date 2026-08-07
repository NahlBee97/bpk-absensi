import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ==========================================
// 1. GET - READ (Membaca Data)
// ==========================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    // Get by ID
    if (id) {
      const user = await prisma.users.findUnique({
        where: { id: parseInt(id) },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, message: "Data users tidak ditemukan!" },
          { status: 404 },
        );
      }

      return NextResponse.json({ success: true, data: user });
    }

    // Get All
    const semuaKaryawan = await prisma.users.findMany({
      orderBy: { id: "asc" },
    });

    return NextResponse.json({ success: true, data: semuaKaryawan });
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat mengambil data" },
      { status: 500 },
    );
  }
}

// ==========================================
// 2. POST - CREATE (Membuat Data Baru)
// ==========================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama, password, role } = body;

    // Validasi input dasar
    if (!nama || !password) {
      return NextResponse.json(
        { success: false, message: "Nama dan Password wajib diisi!" },
        { status: 400 },
      );
    }

    // Simpan ke database
    const newUser = await prisma.users.create({
      data: {
        nama: nama,
        password: password,
        role: role || "user", // Jika role tidak dikirim, otomatis jadi "user"
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Berhasil menambahkan user baru",
        data: newUser,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat menambah data" },
      { status: 500 },
    );
  }
}

// ==========================================
// 3. PUT - UPDATE (Memperbarui Data)
// ==========================================
export async function PUT(request: Request) {
  try {
    // Ambil id dari dynamic route params
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const body = await request.json();
    const { nama, password, role } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID wajib disertakan untuk update!" },
        { status: 400 },
      );
    }

    // Update data (hanya update field yang dikirim dari frontend)
    const updatedUser = await prisma.users.update({
      where: { id: parseInt(id) },
      data: {
        ...(nama && { nama }),
        ...(password && { password }),
        ...(role && { role }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Berhasil memperbarui data user",
      data: updatedUser,
    });
  } catch (error) {
    console.error("PUT Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat memperbarui data (Pastikan ID benar)",
      },
      { status: 500 },
    );
  }
}

// ==========================================
// 4. DELETE - DELETE (Menghapus Data)
// ==========================================
export async function DELETE(request: Request) {
  try {
    // Kita menangkap ID dari URL (contoh: /api/users?id=1) agar seragam dengan GET
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "ID wajib disertakan di URL untuk menghapus data!",
        },
        { status: 400 },
      );
    }

    await prisma.users.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      success: true,
      message: "Berhasil menghapus data user",
    });
  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat menghapus data (Pastikan ID benar)",
      },
      { status: 500 },
    );
  }
}
