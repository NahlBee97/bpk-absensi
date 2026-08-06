"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  LogOut,
  CheckCircle,
  XCircle,
  LogIn,
} from "lucide-react";
import { useFormik } from "formik";
import axios from "axios";
import Webcam from "react-webcam";

export default function Main() {
  const router = useRouter();
  const webcamRef = useRef<Webcam>(null);

  const [time, setTime] = useState<Date | null>(null);
  const [message, setMessage] = useState({ text: "", type: "" });

  // State tambahan untuk mendeteksi tombol mana (In/Out) yang ditekan
  const [absenType, setAbsenType] = useState("");

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
  // Update jam setiap detik
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

  const handleAbsenClick = async (type: string) => {
    setAbsenType(type);
    const errors = await formik.validateForm();

    if (Object.keys(errors).length > 0) {
      formik.setTouched({ username: true, password: true });
      setMessage({ text: "Username dan Password wajib diisi!", type: "error" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      return;
    }

    // 1. Ambil foto saat tombol diklik
    const fotoBase64 = capturePhoto();

    if (!fotoBase64) {
      setMessage({ text: "Gagal mengakses kamera!", type: "error" });
      return;
    }

    try {
      // 2. Kirim data teks dan foto ke backend
      const response = await axios.post("/api/absen", {
        username: formik.values.username,
        password: formik.values.password,
        type: type,
        foto: fotoBase64, // Menyisipkan foto ke payload
      });

      setMessage({ text: `📸 ${response.data.message}`, type: "success" });
      formik.resetForm();
    } catch (error: any) {
      if (error.response) {
        setMessage({ text: error.response.data.message, type: "error" });
      } else {
        setMessage({ text: "Gagal terhubung ke server", type: "error" });
      }
    }

    setTimeout(() => setMessage({ text: "", type: "" }), 4000);
  };

  if (!time) return null; // atau tampilkan placeholder statis saat SSR

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      {/* Kiri: Brand & Kamera */}
      <div className="w-1/2 bg-white flex flex-col p-8 border-r-4 border-accent">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-primary">
            CV. BISNIS PRO KOMPUTAMA
          </h1>
          <p className="text-lg italic font-semibold mt-1 text-accent">
            Support All of Your Needs
          </p>
        </div>

        <div className="grow flex flex-col items-center justify-center">
          <div className="w-full max-w-md aspect-video bg-slate-900 rounded-2xl border-4 border-secondary relative overflow-hidden shadow-inner flex items-center justify-center">
            {/* Implementasi Webcam */}
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "user" }}
              className="object-cover w-full h-full"
            />

            {/* Sudut kamera (UI embellishment) */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-white/50 z-10"></div>
            <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-white/50 z-10"></div>
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-white/50 z-10"></div>
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-white/50 z-10"></div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center w-full gap-2"
          >
            <LogIn size={16} /> Masuk sebagai Admin
          </button>
        </div>
      </div>

      {/* Kanan: Interaksi Kiosk */}
      <div className="w-1/2 flex flex-col items-center justify-center p-12 bg-primary">
        {/* Jam Digital */}
        <div className="text-white text-center mb-12">
          <div className="text-7xl font-bold tracking-wider mb-2 drop-shadow-lg">
            {time.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </div>
          <div className="text-2xl font-light opacity-80">
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
            className="flex-1 py-4 rounded-xl text-white font-bold text-xl shadow-lg hover:brightness-110 active:scale-95 transition-all flex flex-col items-center gap-1 bg-secondary"
          >
            <Users size={24} />
            CHECK-IN
          </button>
          <button
            type="button"
            onClick={() => handleAbsenClick("out")}
            className="flex-1 py-4 rounded-xl text-white font-bold text-xl shadow-lg hover:brightness-110 active:scale-95 transition-all flex flex-col items-center gap-1 bg-accent"
          >
            <LogOut size={24} />
            CHECK-OUT
          </button>
        </div>
      </div>
    </div>
  );
}
