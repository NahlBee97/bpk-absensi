import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  // Hapus cookie dengan nama 'admin_token'
  const cookieStore = await cookies();
  cookieStore.delete("admin_token");

  return NextResponse.json({ success: true, message: "Logout berhasil" });
}
