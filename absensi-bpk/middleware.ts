import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secretKey = new TextEncoder().encode(
  process.env.JWT_SECRET || "rahasia-perusahaan-cv-bisnis-pro",
);

export async function middleware(request: NextRequest) {
  // Hanya jalankan middleware ini jika user mencoba mengakses halaman /admin
  if (request.nextUrl.pathname.startsWith("/admin")) {
    // Ambil karcis (cookie)
    const token = request.cookies.get("admin_token")?.value;

    // Jika tidak ada karcis, usir kembali ke halaman login (/)
    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    try {
      // Verifikasi keaslian karcis
      const verified = await jwtVerify(token, secretKey);

      // Jika karcis asli tapi bukan admin, usir juga
      if (verified.payload.role !== "admin") {
        return NextResponse.redirect(new URL("/", request.url));
      }

      // Jika lolos semua, izinkan masuk ke halaman admin
      return NextResponse.next();
    } catch (err) {
      // Token palsu atau sudah kadaluarsa (lebih dari 8 jam)
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

// Konfigurasi agar Middleware hanya memantau rute tertentu
export const config = {
  matcher: ["/admin/:path*"],
};
