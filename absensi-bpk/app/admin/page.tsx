"use client";

import { useState, useEffect } from "react";
import { Camera, ChevronLeft, FileSpreadsheet } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function AdminDashboard() {
  const router = useRouter();

  // State untuk menampung data dari API dan status loading
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fungsi format tanggal (MM/DD/YY)
  const formatDateMMDDYY = (dateString: any) => {
    if (!dateString) return "-";
    const dateObj = new Date(dateString);
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    const yy = String(dateObj.getFullYear()).slice(-2);
    return `${mm}/${dd}/${yy}`;
  };

  // Fungsi untuk memastikan setiap kata diawali huruf kapital
  const formatTitleCase = (str: string) => {
    if (!str) return "-";
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  useEffect(() => {
    // Fungsi untuk menarik data dari backend
    const fetchHistory = async () => {
      try {
        // Ganti URL endpoint sesuai dengan struktur file Anda (contoh: /api/history)
        const response = await axios.get("/api/history");
        if (response.data.success) {
          setHistoryData(response.data.data);
        }
      } catch (error) {
        console.error("Gagal menarik data riwayat:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout");
      router.push("/");
    } catch (error) {
      console.error("Gagal logout:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      {/* Navbar Admin */}
      <nav className="text-white p-4 shadow-md flex justify-between items-center bg-primary">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-lg">
            <div className="w-8 h-8 font-bold text-center leading-8 rounded text-primary border-2 border-accent">
              BP
            </div>
          </div>
          <div>
            <h2 className="font-bold text-xl">Admin Dashboard</h2>
            <p className="text-xs opacity-80 text-accent">
              CV. Bisnis Pro Komputama
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors"
        >
          <ChevronLeft size={20} /> Keluar
        </button>
      </nav>

      {/* Konten Utama */}
      <main className="grow p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h3 className="text-2xl font-bold text-slate-800">
                Riwayat Kehadiran
              </h3>
              <p className="text-slate-500">Pantau absensi harian karyawan.</p>
            </div>

            <button className="flex items-center gap-2 px-4 py-2 text-white rounded-lg shadow hover:opacity-90 transition-opacity bg-accent">
              <FileSpreadsheet size={20} />
              Export to Excel
            </button>
          </div>

          {/* Tabel Container */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 text-sm uppercase tracking-wider">
                    <th className="p-4 border-b">ID</th>
                    <th className="p-4 border-b">Nama Karyawan</th>
                    <th className="p-4 border-b">Hari, Tanggal</th>
                    <th className="p-4 border-b">Waktu Masuk</th>
                    <th className="p-4 border-b">Waktu Keluar</th>
                    <th className="p-4 border-b">Status</th>
                    <th className="p-4 border-b text-center">Foto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-8 text-center text-slate-500"
                      >
                        Memuat data absensi...
                      </td>
                    </tr>
                  ) : historyData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-8 text-center text-slate-500"
                      >
                        Belum ada data absensi.
                      </td>
                    </tr>
                  ) : (
                    historyData.map((row) => {
                      // Menentukan status berdasarkan ketersediaan waktu keluar
                      const statusKehadiran =
                        row.waktuKeluar === null || row.waktuKeluar === "-"
                          ? "Sedang Bekerja"
                          : "Selesai";

                      return (
                        <tr
                          key={row.id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="p-4 text-slate-500 font-mono">
                            #{String(row.id).padStart(3, "0")}
                          </td>
                          <td className="p-4 font-semibold text-slate-800">
                            {formatTitleCase(row.nama || row.name)}
                          </td>
                          <td className="p-4 text-slate-600 font-mono">
                            {row.waktuMasuk
                              ? new Date(row.waktuMasuk).toLocaleDateString("id-ID", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })
                              : "-"}
                          </td>
                          <td className="p-4 text-slate-600">
                            {row.waktuMasuk
                              ? new Date(row.waktuMasuk).toLocaleTimeString(
                                  "id-ID",
                                  { hour: "2-digit", minute: "2-digit" },
                                )
                              : "-"}
                          </td>
                          <td className="p-4 text-slate-600">
                            {row.waktuKeluar && row.waktuKeluar !== "-"
                              ? new Date(row.waktuKeluar).toLocaleTimeString(
                                  "id-ID",
                                  { hour: "2-digit", minute: "2-digit" },
                                )
                              : "-"}
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                statusKehadiran === "Sedang Bekerja"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {statusKehadiran}
                            </span>
                          </td>
                          <td className="p-4 flex justify-center">
                            <button
                              className="w-10 h-10 bg-slate-200 rounded border border-slate-300 flex items-center justify-center text-slate-400 text-xs hover:bg-slate-300 transition-colors"
                              title="Lihat Foto"
                            >
                              <Camera size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t flex justify-between items-center text-sm text-slate-500">
              Menampilkan {historyData.length} data
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50"
                  disabled
                >
                  Prev
                </button>
                <button
                  className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50"
                  disabled
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
