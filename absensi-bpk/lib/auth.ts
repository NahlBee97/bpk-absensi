import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { NextResponse } from "next/server";

type AdminTokenPayload = {
  id?: number;
  nama?: string;
  role?: string;
  [key: string]: unknown;
};

const secretKey = new TextEncoder().encode(
  process.env.JWT_SECRET || "rahasia-perusahaan-cv-bisnis-pro",
);

export async function getAdminSession(): Promise<AdminTokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return null;

  try {
    const verified = await jwtVerify(token, secretKey);
    const payload = verified.payload as AdminTokenPayload;
    if (payload.role !== "admin") return null;
    return payload;
  } catch {
    return null;
  }
}

export function unauthorizedAdminResponse() {
  return NextResponse.json(
    {
      success: false,
      message: "Unauthorized: akses terbatas untuk admin aktif.",
    },
    { status: 401 },
  );
}
