"use client";

import { MenuKey } from "@/types";
import axios from "axios";
import {
  ChevronLeft,
  LayoutDashboard,
  Menu,
  Users,
  LogOut,
  Trash2,
  DoorOpen,
  Loader2,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useRef, useState } from "react";

// Utility: delay promise
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type ProcessStatus = "idle" | "processing" | "success" | "error";
type LogoutStepKey = "ending" | "clearing" | "redirecting";

const LOGOUT_STEP_DURATIONS: Record<LogoutStepKey, number> = {
  ending: 1400,
  clearing: 1200,
  redirecting: 1000,
};

const LOGOUT_STEP_ORDER: LogoutStepKey[] = [
  "ending",
  "clearing",
  "redirecting",
];

const LOGOUT_STEP_CONFIG: Record<
  LogoutStepKey,
  { label: string; description: string; icon: any }
> = {
  ending: {
    label: "Mengakhiri Sesi",
    description: "Menghapus sesi login Anda...",
    icon: LogOut,
  },
  clearing: {
    label: "Membersihkan Data Lokal",
    description: "Menghapus data sementara di perangkat...",
    icon: Trash2,
  },
  redirecting: {
    label: "Mengalihkan Halaman",
    description: "Kembali ke halaman utama...",
    icon: DoorOpen,
  },
};

export const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ================= STATE: MODAL PROSES LOGOUT =================
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [logoutStatus, setLogoutStatus] = useState<ProcessStatus>("idle");
  const [logoutStepIndex, setLogoutStepIndex] = useState(0);
  const [logoutResultMessage, setLogoutResultMessage] = useState("");
  const logoutRunId = useRef(0);

  const runLogoutProcess = async () => {
    const runId = ++logoutRunId.current;

    setLogoutStatus("processing");
    setLogoutStepIndex(0);
    setLogoutResultMessage("");
    setLogoutModalOpen(true);

    // Tembak request logout di background
    const apiPromise = axios
      .post("/api/auth/logout")
      .then(() => ({ ok: true as const }))
      .catch((err) => ({
        ok: false as const,
        message: err?.response?.data?.message || "Gagal terhubung ke server",
      }));

    try {
      // Tahap 1: Mengakhiri Sesi — tunggu hasil API di sini
      setLogoutStepIndex(0);
      const [apiResult] = await Promise.all([
        apiPromise,
        delay(LOGOUT_STEP_DURATIONS.ending),
      ]);
      if (runId !== logoutRunId.current) return;

      if (!apiResult.ok) {
        setLogoutStatus("error");
        setLogoutResultMessage(apiResult.message);
        return;
      }

      // Tahap 2: Membersihkan Data Lokal
      setLogoutStepIndex(1);
      await delay(LOGOUT_STEP_DURATIONS.clearing);
      if (runId !== logoutRunId.current) return;

      // Tahap 3: Mengalihkan Halaman
      setLogoutStepIndex(2);
      await delay(LOGOUT_STEP_DURATIONS.redirecting);
      if (runId !== logoutRunId.current) return;

      // Sukses
      setLogoutStatus("success");
      setLogoutResultMessage("Anda telah keluar dari sistem");

      await delay(1000);
      if (runId !== logoutRunId.current) return;
      router.push("/");
    } catch (error) {
      if (runId !== logoutRunId.current) return;
      setLogoutStatus("error");
      setLogoutResultMessage(
        "Terjadi kesalahan tak terduga. Silakan coba lagi.",
      );
    }
  };

  const handleRetryLogout = () => {
    runLogoutProcess();
  };

  const closeLogoutModal = () => {
    logoutRunId.current++;
    setLogoutModalOpen(false);
    setLogoutStatus("idle");
    setLogoutStepIndex(0);
    setLogoutResultMessage("");
  };

  const menuItems: { key: MenuKey; label: string; icon: any; link: string }[] =
    [
      {
        key: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        link: "/admin",
      },
      {
        key: "karyawan",
        label: "Karyawan",
        icon: Users,
        link: "/admin/karyawan",
      },
    ];

  return (
    <>
      <aside
        className={`relative flex flex-col text-white transition-all duration-300 overflow-hidden bg-primary ${
          sidebarOpen ? "w-64" : "w-16"
        }`}
      >
        {/* Dekorasi gradient & bentuk abstrak */}
        <div className="absolute inset-0 bg-linear-to-b from-primary via-primary to-slate-900 opacity-95" />
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 w-48 h-48 rounded-full bg-secondary/20 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Konten */}
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-3 p-4 border-b border-white/10">
            <div className="bg-white p-2 rounded-lg shrink-0 shadow-lg">
              <div className="w-8 h-8 font-bold text-center leading-8 rounded text-primary border-2 border-accent">
                BP
              </div>
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <h2 className="font-bold text-lg leading-tight truncate">
                  Admin Panel
                </h2>
                <p className="text-xs opacity-80 text-accent truncate">
                  CV. Bisnis Pro Komputama
                </p>
              </div>
            )}
          </div>

          <nav className="flex-1 p-3 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.link === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.link);

              return (
                <button
                  key={item.key}
                  onClick={() => router.push(item.link)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-sm font-medium ${
                    isActive
                      ? "bg-white text-primary shadow-md"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                  title={item.label}
                >
                  <Icon size={20} className="shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>

          <div className="p-3 border-t border-white/10 space-y-1">
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors text-sm"
            >
              <Menu size={20} className="shrink-0" />
              {sidebarOpen && <span>Minimize</span>}
            </button>
            <button
              onClick={runLogoutProcess}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-white/80 hover:bg-red-500/20 hover:text-red-200 transition-colors text-sm"
            >
              <ChevronLeft size={20} className="shrink-0" />
              {sidebarOpen && <span>Keluar</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* ================= MODAL PROSES LOGOUT ================= */}
      {logoutModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-slate-800">
                Proses Keluar
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {logoutStatus === "error"
                  ? "Proses gagal, silakan coba lagi."
                  : "Mohon tunggu sebentar..."}
              </p>
            </div>

            {logoutStatus === "success" ? (
              /* Sukses */
              <div className="flex flex-col items-center py-4">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle2 size={44} className="text-green-600" />
                </div>
                <p className="text-lg font-bold text-green-700 text-center">
                  Berhasil Keluar
                </p>
                <p className="text-sm text-slate-500 text-center mt-1">
                  {logoutResultMessage}
                </p>
              </div>
            ) : logoutStatus === "error" ? (
              /* Error */
              <div className="flex flex-col items-center py-4">
                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <XCircle size={44} className="text-red-600" />
                </div>
                <p className="text-sm text-red-600 text-center mb-6">
                  {logoutResultMessage ||
                    "Terjadi kesalahan. Silakan coba lagi."}
                </p>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={closeLogoutModal}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-slate-600 font-semibold hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleRetryLogout}
                    className="flex-1 px-4 py-3 rounded-xl bg-accent text-white font-semibold hover:opacity-90 flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={16} />
                    Coba Lagi
                  </button>
                </div>
              </div>
            ) : (
              /* Sedang berjalan: daftar tahapan */
              <div className="space-y-5">
                {LOGOUT_STEP_ORDER.map((stepKey, index) => {
                  const config = LOGOUT_STEP_CONFIG[stepKey];
                  const Icon = config.icon;
                  const isDone = index < logoutStepIndex;
                  const isActive = index === logoutStepIndex;

                  return (
                    <div key={stepKey} className="flex items-center gap-4">
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          isDone
                            ? "bg-green-100 text-green-600"
                            : isActive
                              ? "bg-accent/10 text-accent"
                              : "bg-slate-100 text-slate-300"
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 size={22} />
                        ) : isActive ? (
                          <Loader2 size={22} className="animate-spin" />
                        ) : (
                          <Icon size={20} />
                        )}
                      </div>

                      <div className="flex-1">
                        <p
                          className={`font-semibold text-sm ${
                            isDone
                              ? "text-slate-700"
                              : isActive
                                ? "text-slate-800"
                                : "text-slate-400"
                          }`}
                        >
                          {config.label}
                        </p>
                        {isActive && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {config.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Progress bar keseluruhan */}
                <div className="pt-2">
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all duration-700 ease-linear"
                      style={{
                        width: `${
                          ((logoutStepIndex + 1) / LOGOUT_STEP_ORDER.length) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
