"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  XCircle,
  LogIn,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  RotateCcw,
  Users,
  FileSpreadsheet,
  Camera,
  ClipboardCheck,
} from "lucide-react";
import { useFormik } from "formik";
import axios from "axios";
import { LoginStepKey, ProcessStatus, ProcessStepKeyLogin } from "@/types";

// Utility: delay promise
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Durasi tiap tahap (ms)
const STEP_DURATIONS: Record<LoginStepKey, number> = {
  verifying: 2800,
  session: 2200,
  redirecting: 2000,
};

const STEP_ORDER: Exclude<ProcessStepKeyLogin, "done">[] = [
  "verifying",
  "session",
  "redirecting",
];

const STEP_CONFIG: Record<
  Exclude<ProcessStepKeyLogin, "done">,
  { label: string; description: string; icon: any }
> = {
  verifying: {
    label: "Memverifikasi Identitas",
    description: "Mengecek username dan password Anda...",
    icon: ShieldCheck,
  },
  session: {
    label: "Menyiapkan Sesi",
    description: "Membuat sesi autentikasi...",
    icon: Users,
  },
  redirecting: {
    label: "Mengalihkan ke Dashboard",
    description: "Mengarahkan Anda ke halaman admin...",
    icon: LogIn,
  },
};

// Sapaan dinamis berdasarkan jam
const getGreeting = (date: Date) => {
  const hour = date.getHours();
  if (hour >= 4 && hour < 11) return "Selamat Pagi";
  if (hour >= 11 && hour < 15) return "Selamat Siang";
  if (hour >= 15 && hour < 18) return "Selamat Sore";
  return "Selamat Malam";
};

export default function Login() {
  const router = useRouter();

  const [time, setTime] = useState<Date | null>(null);

  // ================= STATE: MODAL PROSES LOGIN =================
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [processStatus, setProcessStatus] = useState<ProcessStatus>("idle");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [resultMessage, setResultMessage] = useState("");
  const [formError, setFormError] = useState("");
  const processRunId = useState({ current: 0 })[0];

  // Update jam setiap detik
  useEffect(() => {
    const update = () => setTime(new Date());
    update(); // set langsung saat mount di client
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  // Konfigurasi Formik untuk Login (validasi saja, submit ditangani terpisah)
  const formik = useFormik({
    initialValues: {
      username: "",
      password: "",
    },
    validate: (values) => {
      const errors: { username?: string; password?: string } = {};
      if (!values.username.trim()) {
        errors.username = "Wajib diisi";
      }
      if (!values.password.trim()) {
        errors.password = "Wajib diisi";
      }
      return errors;
    },
    onSubmit: () => {},
  });

  // ================= PROSES LOGIN (MODAL BERTAHAP) =================
  const runLoginProcess = async (username: string, password: string) => {
    const runId = ++processRunId.current;

    setProcessStatus("processing");
    setCurrentStepIndex(0);
    setResultMessage("");
    setProcessModalOpen(true);

    // Tembak request asli ke backend di background
    const apiPromise = axios
      .post("/api/auth/login", { username, password })
      .then((res) => ({ ok: true as const, data: res.data }))
      .catch((err) => ({
        ok: false as const,
        message: err?.response?.data?.message || "Gagal terhubung ke server",
      }));

    try {
      // Tahap 1: Memverifikasi Kredensial — tunggu hasil API di sini juga,
      // supaya kalau salah, modal berhenti lebih awal (tidak lanjut ke "sesi")
      setCurrentStepIndex(0);
      const [apiResult] = await Promise.all([
        apiPromise,
        delay(STEP_DURATIONS.verifying),
      ]);
      if (runId !== processRunId.current) return;

      if (!apiResult.ok) {
        setProcessStatus("error");
        setResultMessage(apiResult.message);
        return;
      }

      // Tahap 2: Menyiapkan Sesi
      setCurrentStepIndex(1);
      await delay(STEP_DURATIONS.session);
      if (runId !== processRunId.current) return;

      // Tahap 3: Mengalihkan ke Dashboard
      setCurrentStepIndex(2);
      await delay(STEP_DURATIONS.redirecting);
      if (runId !== processRunId.current) return;

      // Sukses
      setProcessStatus("success");
      setResultMessage(apiResult.data?.message || "Login berhasil");
      formik.resetForm();

      await delay(1200);
      if (runId !== processRunId.current) return;
      router.push("/admin");
    } catch (error) {
      if (runId !== processRunId.current) return;
      setProcessStatus("error");
      setResultMessage("Terjadi kesalahan tak terduga. Silakan coba lagi.");
    }
  };

  const handleLoginClick = async () => {
    const errors = await formik.validateForm();

    if (Object.keys(errors).length > 0) {
      formik.setTouched({ username: true, password: true });
      setFormError("Username dan Password wajib diisi!");
      setTimeout(() => setFormError(""), 3000);
      return;
    }

    runLoginProcess(formik.values.username, formik.values.password);
  };

  const handleRetryProcess = () => {
    runLoginProcess(formik.values.username, formik.values.password);
  };

  const handleCloseProcessModal = () => {
    processRunId.current++;
    setProcessModalOpen(false);
    setProcessStatus("idle");
    setCurrentStepIndex(0);
    setResultMessage("");
  };

  if (!time) return null;

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      {/* ================= Kiri: Welcome Screen ================= */}
      <div className="w-1/2 relative flex flex-col p-6 overflow-hidden bg-primary">
        {/* Dekorasi gradient & bentuk abstrak */}
        <div className="absolute inset-0 bg-linear-to-br from-primary via-primary to-slate-900 opacity-95" />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-secondary/20 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Konten */}
        <div className="relative z-10 flex flex-col h-full min-h-0">
          <div className="mb-4 shrink-0">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              CV. BISNIS PRO KOMPUTAMA
            </h1>
            <p className="text-base italic font-semibold mt-1 text-accent">
              Support All of Your Needs
            </p>
          </div>

          <div className="grow flex flex-col items-center justify-center text-center min-h-0 overflow-y-auto py-2">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center mb-4 shadow-lg shrink-0">
              <ShieldCheck size={26} className="text-accent" />
            </div>

            <p className="text-accent font-semibold text-xs uppercase tracking-widest mb-1.5 shrink-0">
              {getGreeting(time)}
            </p>
            <h2 className="text-white text-2xl font-bold mb-2 shrink-0">
              Selamat Datang, Admin!
            </h2>
            <p className="text-white/60 max-w-sm mb-6 text-sm shrink-0">
              Masuk untuk mengelola data kehadiran dan karyawan CV. Bisnis Pro
              Komputama dengan mudah dan aman.
            </p>

            {/* Ringkasan fitur admin panel */}
            <div className="grid grid-cols-1 gap-2 w-full max-w-xs shrink-0">
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-left backdrop-blur">
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                  <Camera size={15} className="text-accent" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">
                    Pantau Kehadiran
                  </p>
                  <p className="text-white/50 text-xs">
                    Riwayat absensi & foto real-time
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-left backdrop-blur">
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                  <Users size={15} className="text-accent" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">
                    Kelola Karyawan
                  </p>
                  <p className="text-white/50 text-xs">
                    Tambah, ubah, dan hapus data karyawan
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-left backdrop-blur">
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                  <FileSpreadsheet size={15} className="text-accent" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">
                    Export Laporan
                  </p>
                  <p className="text-white/50 text-xs">
                    Unduh data absensi ke Excel kapan saja
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center shrink-0 pt-2">
            <button
              onClick={() => router.push("/")}
              className="text-white/50 hover:text-white transition-colors flex items-center justify-center w-full gap-2 text-sm"
            >
              <LogIn size={16} className="rotate-180" /> Kembali ke Absensi
            </button>
          </div>
        </div>
      </div>

      {/* Kanan: Interaksi Login */}
      <div className="w-1/2 flex flex-col items-center justify-center p-12 bg-primary">
        {/* Jam Digital */}
        <div className="text-white text-center mb-10">
          <div className="text-6xl font-bold tracking-wider mb-2 drop-shadow-lg">
            {time.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </div>
          <div className="text-xl font-light opacity-80">
            {time.toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>

        {/* Notifikasi (khusus error validasi form) */}
        <div className="w-full max-w-sm mb-6 h-16 flex items-center justify-center">
          {formError && (
            <div className="px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 animate-bounce shadow-lg text-center bg-red-100 text-red-700">
              <XCircle className="shrink-0" />
              {formError}
            </div>
          )}
        </div>

        {/* Form Login (Menggunakan Formik) */}
        <form
          className="w-full max-w-sm flex flex-col gap-4 mb-8"
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formik.values.username}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={`w-full px-5 py-4 rounded-xl bg-white text-slate-800 text-lg shadow-md border-2 outline-none transition-all placeholder:text-slate-400
              ${formik.touched.username && formik.errors.username ? "border-red-500" : "border-transparent focus:border-secondary"}`}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={`w-full px-5 py-4 rounded-xl bg-white text-slate-800 text-lg shadow-md border-2 outline-none transition-all placeholder:text-slate-400
              ${formik.touched.password && formik.errors.password ? "border-red-500" : "border-transparent focus:border-secondary"}`}
          />
        </form>

        {/* Tombol Aksi */}
        <div className="flex w-full max-w-sm">
          <button
            type="button"
            onClick={handleLoginClick}
            disabled={processModalOpen && processStatus === "processing"}
            className="flex-1 py-4 rounded-xl text-white font-bold text-xl shadow-lg hover:brightness-110 active:scale-95 transition-all flex flex-col items-center gap-1 bg-secondary disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            <LogIn size={24} />
            Login
          </button>
        </div>
      </div>

      {/* ================= MODAL PROSES LOGIN ================= */}
      {processModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-slate-800">Proses Login</h3>
              <p className="text-sm text-slate-500 mt-1">
                {processStatus === "error"
                  ? "Proses gagal, silakan coba lagi."
                  : "Mohon tunggu sebentar..."}
              </p>
            </div>

            {/* Sukses */}
            {processStatus === "success" ? (
              <div className="flex flex-col items-center py-4">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle2 size={44} className="text-green-600" />
                </div>
                <p className="text-lg font-bold text-green-700 text-center">
                  Login Berhasil!
                </p>
                <p className="text-sm text-slate-500 text-center mt-1">
                  {resultMessage}
                </p>
              </div>
            ) : processStatus === "error" ? (
              /* Error */
              <div className="flex flex-col items-center py-4">
                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <XCircle size={44} className="text-red-600" />
                </div>
                <p className="text-sm text-red-600 text-center mb-6">
                  {resultMessage || "Terjadi kesalahan. Silakan coba lagi."}
                </p>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={handleCloseProcessModal}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-slate-600 font-semibold hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleRetryProcess}
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
                {STEP_ORDER.map((stepKey, index) => {
                  const config = STEP_CONFIG[stepKey];
                  const Icon = config.icon;
                  const isDone = index < currentStepIndex;
                  const isActive = index === currentStepIndex;

                  return (
                    <div key={stepKey} className="flex items-center gap-4">
                      {/* Ikon status */}
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

                      {/* Label */}
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
                          ((currentStepIndex + 1) / STEP_ORDER.length) * 100
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
    </div>
  );
}
