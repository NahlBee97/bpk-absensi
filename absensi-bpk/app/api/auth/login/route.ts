import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";
import { cookies } from "next/headers";

// Kunci rahasia untuk enkripsi (Bisa Anda pindahkan ke .env nanti)
const secretKey = new TextEncoder().encode(
  process.env.JWT_SECRET || "rahasia-perusahaan-cv-bisnis-pro",
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // 1. Cari user di database
    // Catatan: Sesuaikan 'prisma.user' atau 'prisma.users' dengan nama model Anda
    const user = await prisma.users.findFirst({
      where: { nama: username, password: password },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Username atau Password salah!" },
        { status: 401 },
      );
    }

    // 2. Pastikan role-nya adalah admin
    if (user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Akses ditolak! Anda bukan Admin." },
        { status: 403 },
      );
    }

    // 3. Buat Token JWT
    const token = await new SignJWT({
      id: user.id,
      nama: user.nama,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("8h") // Token akan otomatis hangus dalam 8 jam
      .sign(secretKey);

    const cookieStore = await cookies();

    // 4. Simpan Token ke dalam HTTP-Only Cookie
    cookieStore.set("admin_token", token, {
      httpOnly: true, // Tidak bisa diakses oleh JavaScript frontend (Aman dari XSS)
      secure: process.env.NODE_ENV === "production", // Wajib HTTPS jika di production
      sameSite: "strict",
      maxAge: 60 * 60 * 8, // 8 Jam dalam detik
      path: "/", // Cookie berlaku untuk seluruh halaman aplikasi
    });

    return NextResponse.json({
      success: true,
      message: "Login berhasil!",
    });
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server saat login" },
      { status: 500 },
    );
  }
}
