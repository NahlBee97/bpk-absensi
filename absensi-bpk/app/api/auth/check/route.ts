import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const isLogin = cookieStore.has("admin_token");

    return NextResponse.json({ isLogin: isLogin }, { status: 200 });
  } catch (error) {
    // Membantu Anda melihat jika ada error di terminal
    console.error("Gagal mengecek cookie:", error);

    return NextResponse.json({ isLogin: false }, { status: 500 });
  }
}
