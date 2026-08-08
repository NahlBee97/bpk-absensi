"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  LogOut,
  CheckCircle,
  XCircle,
  LogIn,
  ShieldCheck,
  Camera,
  ClipboardCheck,
  Loader2,
  CheckCircle2,
  RotateCcw,
  Fingerprint,
} from "lucide-react";
import { useFormik } from "formik";
import axios from "axios";
import Webcam from "react-webcam";

// Utility: delay promise
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type ProcessStatus = "idle" | "processing" | "success" | "error";

// Durasi tiap tahap (ms) — total simulasi ±13.5 detik sebelum tahap sukses,
// lalu ditambah jeda tampil sukses ±1.5 detik (total maksimal ±15 detik)
const STEP_DURATIONS = {
  verifying: 4000,
  capturing: 3500,
  recording: 6000,
} as const;

type ProcessStepKey = keyof typeof STEP_DURATIONS;

const STEP_ORDER: Exclude<ProcessStepKey, "done">[] = [
  "verifying",
  "capturing",
  "recording",
];

const STEP_CONFIG: Record<
  Exclude<ProcessStepKey, "done">,
  { label: string; description: string; icon: any }
> = {
  verifying: {
    label: "Memverifikasi Identitas",
    description: "Mengecek username dan password Anda...",
    icon: ShieldCheck,
  },
  capturing: {
    label: "Mengambil Foto",
    description: "Menangkap gambar dari kamera...",
    icon: Camera,
  },
  recording: {
    label: "Mencatat Kehadiran",
    description: "Menyimpan data kehadiran ke sistem...",
    icon: ClipboardCheck,
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

export default function Main() {
  const router = useRouter();
  const webcamRef = useRef<Webcam>(null);

  const [time, setTime] = useState<Date | null>(null);
  const [message, setMessage] = useState({ text: "", type: "" });

  // State tambahan untuk mendeteksi tombol mana (In/Out) yang ditekan
  const [absenType, setAbsenType] = useState("");

  // ================= STATE: MODAL PROSES ABSEN =================
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [processStatus, setProcessStatus] = useState<ProcessStatus>("idle");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [resultMessage, setResultMessage] = useState("");
  const processRunId = useRef(0); // untuk cancel proses lama kalau user retry

  useEffect(() => {
    const checkAlreadyLogin = async () => {
      try {
        const response = await axios.get("/api/auth/check");

        if (response.data.isLogin) {
          router.push("/admin");
        }
      } catch (error) {
        console.error("Gagal mengecek status login", error);
      }
    };

    // Eksekusi fungsinya
    checkAlreadyLogin();
  }, [router]);

  // Update jam setiap detik (dimulai di client saja untuk hindari hydration mismatch)
  useEffect(() => {
    const update = () => setTime(new Date());
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      return webcamRef.current.getScreenshot();
    }
    return null;
  }, [webcamRef]);

  const formik = useFormik({
    initialValues: { username: "", password: "" },
    validate: (values) => {
      const errors: { username?: string; password?: string } = {};
      if (!values.username.trim()) errors.username = "Wajib diisi";
      if (!values.password.trim()) errors.password = "Wajib diisi";
      return errors;
    },
    onSubmit: () => {},
  });

  // ================= PROSES ABSEN (MODAL BERTAHAP) =================
  const runAbsenProcess = async (
    type: string,
    username: string,
    password: string,
  ) => {
    const runId = ++processRunId.current;

    setProcessStatus("processing");
    setCurrentStepIndex(0);
    setResultMessage("");
    setProcessModalOpen(true);

    // Ambil foto di awal (dipakai untuk payload, ditampilkan seolah diambil di tahap ke-2)
    const fotoBase64 = capturePhoto();

    if (!fotoBase64) {
      if (runId !== processRunId.current) return;
      setProcessStatus("error");
      setResultMessage(
        "Gagal mengakses kamera. Pastikan izin kamera diaktifkan.",
      );
      return;
    }

    // Tembak request asli ke backend di background, tidak langsung ditunggu
    const apiPromise = axios
      .post("/api/absen", {
        username,
        password,
        type,
        foto: fotoBase64,
      })
      .then((res) => ({ ok: true as const, data: res.data }))
      .catch((err) => ({
        ok: false as const,
        message: err?.response?.data?.message || "Gagal terhubung ke server",
      }));

    try {
      // Tahap 1: Memverifikasi
      setCurrentStepIndex(0);
      await delay(STEP_DURATIONS.verifying);
      if (runId !== processRunId.current) return;

      // Tahap 2: Mengambil Foto
      setCurrentStepIndex(1);
      await delay(STEP_DURATIONS.capturing);
      if (runId !== processRunId.current) return;

      // Tahap 3: Mencatat Kehadiran — tunggu request asli SELESAI,
      // tapi minimal tetap menampilkan durasi simulasi ini
      setCurrentStepIndex(2);
      const [apiResult] = await Promise.all([
        apiPromise,
        delay(STEP_DURATIONS.recording),
      ]);
      if (runId !== processRunId.current) return;

      if (!apiResult.ok) {
        setProcessStatus("error");
        setResultMessage(apiResult.message);
        return;
      }

      // Tahap 4: Berhasil
      setProcessStatus("success");
      setResultMessage(apiResult.data?.message || "Absensi berhasil dicatat");
      formik.resetForm();

      await delay(1500);
      if (runId !== processRunId.current) return;
      setProcessModalOpen(false);
    } catch (error) {
      if (runId !== processRunId.current) return;
      setProcessStatus("error");
      setResultMessage("Terjadi kesalahan tak terduga. Silakan coba lagi.");
    }
  };

  const handleAbsenClick = async (type: string) => {
    setAbsenType(type);
    const errors = await formik.validateForm();

    if (Object.keys(errors).length > 0) {
      formik.setTouched({ username: true, password: true });
      setMessage({ text: "Username dan Password wajib diisi!", type: "error" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      return;
    }

    runAbsenProcess(type, formik.values.username, formik.values.password);
  };

  const handleRetryProcess = () => {
    runAbsenProcess(absenType, formik.values.username, formik.values.password);
  };

  const handleCloseProcessModal = () => {
    // Batalkan proses yang mungkin masih berjalan
    processRunId.current++;
    setProcessModalOpen(false);
    setProcessStatus("idle");
    setCurrentStepIndex(0);
    setResultMessage("");
  };

  if (!time) return null; // hindari hydration mismatch, tunggu client mount

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      {/* ================= Kiri: Welcome Screen + Kamera ================= */}
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
          <div className="mb-4 shrink-0 flex items-center gap-2">
            <img
              className="w-16 h-16 rounded"
              src="/logo.png"
              alt="Logo"
            />
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                CV. BISNIS PRO KOMPUTAMA
              </h1>
              <p className="text-base italic font-semibold mt-1 text-accent">
                Support All of Your Needs
              </p>
            </div>
          </div>

          <div className="grow flex flex-col items-center justify-center text-center min-h-0 overflow-y-auto py-2 gap-4">
            <div className="shrink-0">
              <p className="text-accent font-semibold text-xs uppercase tracking-widest mb-1.5 flex items-center justify-center gap-1.5">
                <Fingerprint size={14} />
                {getGreeting(time)}
              </p>
              <h2 className="text-white text-2xl font-bold mb-1.5">
                Sistem Absensi Digital
              </h2>
              <p className="text-white/60 max-w-sm mx-auto text-sm">
                Posisikan wajah Anda di dalam bingkai, lalu isi username &
                password untuk mencatat kehadiran.
              </p>
            </div>

            {/* Kamera */}
            <div className="w-full max-w-md shrink-0">
              <div className="aspect-video bg-slate-900 rounded-2xl border-2 border-white/20 relative overflow-hidden shadow-2xl flex items-center justify-center">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: "user" }}
                  className="object-cover w-full h-full"
                />

                {/* Sudut kamera (UI embellishment) */}
                <div className="absolute top-3 left-3 w-7 h-7 border-t-4 border-l-4 border-accent/80 z-10 rounded-tl-md" />
                <div className="absolute top-3 right-3 w-7 h-7 border-t-4 border-r-4 border-accent/80 z-10 rounded-tr-md" />
                <div className="absolute bottom-3 left-3 w-7 h-7 border-b-4 border-l-4 border-accent/80 z-10 rounded-bl-md" />
                <div className="absolute bottom-3 right-3 w-7 h-7 border-b-4 border-r-4 border-accent/80 z-10 rounded-br-md" />

                {/* Badge live */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur px-2.5 py-1 rounded-full flex items-center gap-1.5 z-10">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-white tracking-wider">
                    LIVE
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center shrink-0 pt-2">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-white/50 hover:text-white transition-colors flex items-center justify-center w-full gap-2 text-sm"
            >
              <LogIn size={16} /> Masuk sebagai Admin
            </button>
          </div>
        </div>
      </div>

      {/* Kanan: Interaksi Kiosk */}
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

        {/* Notifikasi */}
        <div className="w-full max-w-sm mb-6 h-16 flex items-center justify-center">
          {message.text && (
            <div
              className={`px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 animate-bounce shadow-lg text-center
              ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
            >
              {message.type === "success" ? (
                <CheckCircle className="shrink-0" />
              ) : (
                <XCircle className="shrink-0" />
              )}
              {message.text}
            </div>
          )}
        </div>

        {/* Form Login / Absen (Menggunakan Formik) */}
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
        <div className="flex gap-4 w-full max-w-sm">
          <button
            type="button"
            onClick={() => handleAbsenClick("in")}
            disabled={processModalOpen && processStatus === "processing"}
            className="flex-1 py-4 rounded-xl text-white font-bold text-xl shadow-lg hover:brightness-110 active:scale-95 transition-all flex flex-col items-center gap-1 bg-secondary disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            <Users size={24} />
            CHECK-IN
          </button>
          <button
            type="button"
            onClick={() => handleAbsenClick("out")}
            disabled={processModalOpen && processStatus === "processing"}
            className="flex-1 py-4 rounded-xl text-white font-bold text-xl shadow-lg hover:brightness-110 active:scale-95 transition-all flex flex-col items-center gap-1 bg-accent disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            <LogOut size={24} />
            CHECK-OUT
          </button>
        </div>
      </div>

      {/* ================= MODAL PROSES ABSEN ================= */}
      {processModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-slate-800">
                {absenType === "in" ? "Proses Check-In" : "Proses Check-Out"}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {processStatus === "error"
                  ? "Proses gagal, silakan coba lagi."
                  : "Mohon tunggu, jangan tutup halaman ini..."}
              </p>
            </div>

            {/* Sukses */}
            {processStatus === "success" ? (
              <div className="flex flex-col items-center py-4">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle2 size={44} className="text-green-600" />
                </div>
                <p className="text-lg font-bold text-green-700 text-center">
                  {absenType === "in"
                    ? "Check-In Berhasil!"
                    : "Check-Out Berhasil!"}
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
