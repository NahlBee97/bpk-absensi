"use client";

import { useState, useEffect } from "react";
import {
  Camera,
  FileSpreadsheet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";
import * as XLSX from "xlsx";
import { InOutModal } from "@/components/inOutModal";
import { formatTitleCase } from "@/helper";

export default function AdminDashboard() {
  const router = useRouter();

  // ================= STATE: RIWAYAT KEHADIRAN =================
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState<any>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
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

  // ================= EXPORT EXCEL =================
  const handleExportExcel = () => {
    if (historyData.length === 0) return;

    const dataToExport = historyData.map((row) => {
      const statusKehadiran =
        row.waktuKeluar === null || row.waktuKeluar === "-"
          ? "Sedang Bekerja"
          : "Selesai";

      return {
        ID: `#${String(row.id).padStart(3, "0")}`,
        "Nama Karyawan": formatTitleCase(row.nama || row.name),
        "Hari, Tanggal": row.waktuMasuk
          ? new Date(row.waktuMasuk).toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "-",
        "Waktu Masuk": row.waktuMasuk
          ? new Date(row.waktuMasuk).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-",
        "Waktu Keluar":
          row.waktuKeluar && row.waktuKeluar !== "-"
            ? new Date(row.waktuKeluar).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "-",
        Status: statusKehadiran,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 25 },
      { wch: 30 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Riwayat Kehadiran",
    );

    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Riwayat_Kehadiran_${today}.xlsx`);
  };

  const handleShowPhoto = (row: any) => setSelectedRow(row);
  const closePhotoModal = () => setSelectedRow(null);

  return (
    <>
      {/* ================= KONTEN UTAMA ================= */}
      <main className="grow p-8 overflow-x-auto">
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

            <button
              onClick={handleExportExcel}
              disabled={historyData.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-white rounded-lg shadow hover:opacity-90 transition-opacity bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet size={20} />
              Export to Excel
            </button>
          </div>

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
                      const statusKehadiran =
                        row.waktuKeluar === null ||
                        row.waktuKeluar === "-"
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
                              ? new Date(
                                  row.waktuMasuk,
                                ).toLocaleDateString("id-ID", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })
                              : "-"}
                          </td>
                          <td className="p-4 text-slate-600">
                            {row.waktuMasuk
                              ? new Date(
                                  row.waktuMasuk,
                                ).toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "-"}
                          </td>
                          <td className="p-4 text-slate-600">
                            {row.waktuKeluar &&
                            row.waktuKeluar !== "-"
                              ? new Date(
                                  row.waktuKeluar,
                                ).toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
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
                              onClick={() => handleShowPhoto(row)}
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
          <InOutModal
            selectedRow={selectedRow}
            closePhotoModal={closePhotoModal}
          />
        </div>
      </main>
    </>
  );
}