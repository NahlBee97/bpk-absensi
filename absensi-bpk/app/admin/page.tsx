"use client";

import { Camera, ChevronLeft, FileSpreadsheet } from "lucide-react";
import { useRouter } from "next/navigation";

// Data dummy untuk tabel admin
const initialHistory = [
  {
    id: 1,
    name: "Budi Santoso",
    date: new Date("2026-08-05T08:00:00"),
    timeIn: "08:00 AM",
    timeOut: "17:05 PM",
    status: "Selesai",
  },
  {
    id: 2,
    name: "Siti Aminah",
    date: new Date("2026-08-05T08:15:00"),
    timeIn: "08:15 AM",
    timeOut: "-",
    status: "Bekerja",
  },
  {
    id: 3,
    name: "Agus Pratama",
    date: new Date("2026-08-04T07:55:00"),
    timeIn: "07:55 AM",
    timeOut: "16:50 PM",
    status: "Selesai",
  },
];

export default function AdminDashboard() {
  const router = useRouter();
  const formatDateMMDDYY = (dateObj: any) => {
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    const yy = String(dateObj.getFullYear()).slice(-2);
    return `${mm}/${dd}/${yy}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      {/* Navbar Admin */}
      <nav className="text-white p-4 shadow-md flex justify-between items-center bg-primary">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-lg">
            {/* Logo Placeholder (Mini) */}
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
          onClick={() => router.push("/")}
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
              <p className="text-slate-500">
                Pantau absensi harian karyawan.
              </p>
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
                    <th className="p-4 border-b">
                      Tanggal (MM/DD/YY)
                    </th>
                    <th className="p-4 border-b">Waktu Masuk</th>
                    <th className="p-4 border-b">Waktu Keluar</th>
                    <th className="p-4 border-b">Status</th>
                    <th className="p-4 border-b text-center">Foto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {initialHistory.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-4 text-slate-500 font-mono">
                        #{String(row.id).padStart(3, "0")}
                      </td>
                      <td className="p-4 font-semibold text-slate-800">
                        {row.name}
                      </td>

                      {/* Format Tanggal sesuai permintaan: MM/DD/YY */}
                      <td className="p-4 text-slate-600 font-mono">
                        {formatDateMMDDYY(row.date)}
                      </td>

                      <td className="p-4 text-slate-600">
                        {row.timeIn}
                      </td>
                      <td className="p-4 text-slate-600">
                        {row.timeOut}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            row.status === "Bekerja"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="p-4 flex justify-center">
                        <div className="w-10 h-10 bg-slate-200 rounded border border-slate-300 flex items-center justify-center text-slate-400 text-xs">
                          <Camera size={16} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Mock */}
            <div className="p-4 border-t flex justify-between items-center text-sm text-slate-500">
              Menampilkan 3 dari 3 data
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
};
