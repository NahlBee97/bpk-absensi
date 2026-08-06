"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, LogIn } from "lucide-react";
import { useFormik } from "formik";
import axios from "axios";

export default function Login() {
  const router = useRouter();

  const [time, setTime] = useState(new Date());
  const [message, setMessage] = useState({ text: "", type: "" });

  // Update jam setiap detik
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Konfigurasi Formik untuk Login
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
    onSubmit: (values, { resetForm }) => {
      // Simulasi Verifikasi Login Admin
      setMessage({
        text: "Login berhasil! Mengalihkan ke Dashboard...",
        type: "success",
      });

      resetForm();

      // Jeda sejenak agar notifikasi terlihat sebelum pindah halaman
      setTimeout(() => {
        setMessage({ text: "", type: "" });
        router.push("/admin");
      }, 1500);
    },
  });

  // Validasi manual saat tombol diklik (menampilkan notifikasi toast jika kosong)
  const handleLoginClick = async () => {
    const errors = await formik.validateForm();

    try {
      const response = await axios.post("/api/auth/login", {
        username: formik.values.username,
        password: formik.values.password,
      });

      setMessage({ text: response.data.message, type: "success" });

      // Redirect ke Admin jika sukses
      setTimeout(() => {
        router.push("/admin");
      }, 1500);
    } catch (error: any) {
      if (error.response) {
        setMessage({ text: error.response.data.message, type: "error" });
      }
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      {/* Kiri: Brand & Info */}
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
          <div className="w-full max-w-md aspect-video bg-slate-200 rounded-2xl border-4 border-secondary flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
            <p className="text-slate-500 font-medium text-xl">
              Selamat Datang Admin!
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push("/")}
            className="text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center w-full gap-2"
          >
            <LogIn size={16} className="rotate-180" /> Kembali ke Absensi
          </button>
        </div>
      </div>

      {/* Kanan: Interaksi Login */}
      <div className="w-1/2 flex flex-col items-center justify-center p-12 bg-primary">
        {/* Jam Digital */}
        <div className="text-white text-center mb-12">
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
            className="flex-1 py-4 rounded-xl text-white font-bold text-xl shadow-lg hover:brightness-110 active:scale-95 transition-all flex flex-col items-center gap-1 bg-secondary"
          >
            <LogIn size={24} />
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
