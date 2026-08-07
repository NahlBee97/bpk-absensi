"use client";

import { useState, useEffect } from "react";
import {
  Camera,
  FileSpreadsheet,
  Database,
  FileCog,
  Download,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";
import * as XLSX from "xlsx";
import { InOutModal } from "@/components/inOutModal";
import { formatTitleCase } from "@/helper";

// Utility: delay promise
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Durasi tiap tahap export (ms) — total 5 detik sebelum file diunduh
const EXPORT_STEP_DURATIONS = {
  preparing: 1700,
  formatting: 1800,
  downloading: 1500,
} as const;

type ExportStepKey = keyof typeof EXPORT_STEP_DURATIONS;

const EXPORT_STEP_ORDER: ExportStepKey[] = [
  "preparing",
  "formatting",
  "downloading",
];

const EXPORT_STEP_CONFIG: Record<
  ExportStepKey,
  { label: string; description: string; icon: any }
> = {
  preparing: {
    label: "Menyiapkan Data",
    description: "Mengumpulkan riwayat kehadiran...",
    icon: Database,
  },
  formatting: {
    label: "Memformat Laporan",
    description: "Menyusun kolom dan gaya spreadsheet...",
    icon: FileCog,
  },
  downloading: {
    label: "Mengunduh File",
    description: "Menyiapkan file untuk diunduh...",
    icon: Download,
  },
};

export default function AdminDashboard() {
  const router = useRouter();

  // ================= STATE: RIWAYAT KEHADIRAN =================
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState<any>(null);

  // ================= STATE: MODAL PROSES EXPORT =================
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [exportStepIndex, setExportStepIndex] = useState(0);
  const exportRunId = useState({ current: 0 })[0];

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

  // ================= EXPORT EXCEL (DENGAN MODAL PROSES) =================
  const buildWorkbookAndDownload = () => {
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Riwayat Kehadiran");

    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Riwayat_Kehadiran_${today}.xlsx`);
  };

  const handleExportExcel = async () => {
    if (historyData.length === 0) return;

    const runId = ++exportRunId.current;
    setExportDone(false);
    setExportStepIndex(0);
    setExportModalOpen(true);

    for (let i = 0; i < EXPORT_STEP_ORDER.length; i++) {
      setExportStepIndex(i);
      await delay(EXPORT_STEP_DURATIONS[EXPORT_STEP_ORDER[i]]);
      if (runId !== exportRunId.current) return;
    }

    // Generate & download file setelah semua tahap visual selesai
    buildWorkbookAndDownload();
    setExportDone(true);

    await delay(1200);
    if (runId !== exportRunId.current) return;
    setExportModalOpen(false);
  };

  const closeExportModal = () => {
    exportRunId.current++;
    setExportModalOpen(false);
    setExportDone(false);
    setExportStepIndex(0);
  };

  const handleShowPhoto = (row: any) => setSelectedRow(row);
  const closePhotoModal = () => setSelectedRow(null);

  return (
    <>
      {/* ================= KONTEN UTAMA ================= */}
      <main className="grow p-8 overflow-x-auto bg-slate-50">
        <div className="max-w-6xl mx-auto">
          {/* ================= HEADER (gradient, senada dengan Login/Absen) ================= */}
          <div className="relative overflow-hidden rounded-2xl bg-primary mb-6 shadow-lg">
            <div className="absolute inset-0 bg-linear-to-br from-primary via-primary to-slate-900 opacity-95" />
            <div className="absolute -top-16 -right-10 w-64 h-64 rounded-full bg-accent/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-10 w-64 h-64 rounded-full bg-secondary/20 blur-3xl" />
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
                backgroundSize: "36px 36px",
              }}
            />

            <div className="relative z-10 flex justify-between items-end gap-4 p-6 flex-wrap">
              <div>
                <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-1">
                  Dashboard
                </p>
                <h3 className="text-2xl font-bold text-white">
                  Riwayat Kehadiran
                </h3>
                <p className="text-white/60 text-sm mt-1">
                  Pantau absensi harian karyawan secara real-time.
                </p>
              </div>

              <button
                onClick={handleExportExcel}
                disabled={historyData.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 text-primary font-semibold rounded-xl shadow hover:brightness-95 transition-all bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileSpreadsheet size={19} />
                Export to Excel
              </button>
            </div>
          </div>

          {/* ================= TABEL ================= */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
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
                        className="p-10 text-center text-slate-500"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Loader2
                            size={22}
                            className="animate-spin text-accent"
                          />
                          Memuat data absensi...
                        </div>
                      </td>
                    </tr>
                  ) : historyData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-10 text-center text-slate-500"
                      >
                        Belum ada data absensi.
                      </td>
                    </tr>
                  ) : (
                    historyData.map((row) => {
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
                              ? new Date(row.waktuMasuk).toLocaleDateString(
                                  "id-ID",
                                  {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  },
                                )
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
                              onClick={() => handleShowPhoto(row)}
                              className="w-10 h-10 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-accent/10 hover:text-accent hover:border-accent/30 transition-colors"
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
                  className="px-3 py-1.5 border rounded-lg hover:bg-slate-50 disabled:opacity-50"
                  disabled
                >
                  Prev
                </button>
                <button
                  className="px-3 py-1.5 border rounded-lg hover:bg-slate-50 disabled:opacity-50"
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

      {/* ================= MODAL PROSES EXPORT EXCEL ================= */}
      {exportModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
            {exportDone && (
              <button
                onClick={closeExportModal}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            )}

            {/* Header */}
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-slate-800">
                Export ke Excel
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {exportDone
                  ? "File berhasil diunduh."
                  : "Mohon tunggu, sedang menyiapkan file..."}
              </p>
            </div>

            {exportDone ? (
              /* Sukses */
              <div className="flex flex-col items-center py-4">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle2 size={44} className="text-green-600" />
                </div>
                <p className="text-lg font-bold text-green-700 text-center">
                  Export Berhasil!
                </p>
                <p className="text-sm text-slate-500 text-center mt-1">
                  Riwayat_Kehadiran_{new Date().toISOString().slice(0, 10)}.xlsx
                </p>
              </div>
            ) : (
              /* Sedang berjalan: daftar tahapan */
              <div className="space-y-5">
                {EXPORT_STEP_ORDER.map((stepKey, index) => {
                  const config = EXPORT_STEP_CONFIG[stepKey];
                  const Icon = config.icon;
                  const isDone = index < exportStepIndex;
                  const isActive = index === exportStepIndex;

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
                          ((exportStepIndex + 1) / EXPORT_STEP_ORDER.length) *
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
}
