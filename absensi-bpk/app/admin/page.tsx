"use client";

import { useState, useEffect } from "react";
import {
  Camera,
  ChevronLeft,
  FileSpreadsheet,
  X,
  LayoutDashboard,
  Users,
  Plus,
  Pencil,
  Trash2,
  Menu,
} from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";
import * as XLSX from "xlsx";

type MenuKey = "dashboard" | "karyawan";

export default function AdminDashboard() {
  const router = useRouter();

  const [activeMenu, setActiveMenu] = useState<MenuKey>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ================= STATE: RIWAYAT KEHADIRAN =================
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState<any>(null);

  // ================= STATE: KARYAWAN =================
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null); // null = mode tambah
  const [employeeForm, setEmployeeForm] = useState({
    nama: "",
    email: "",
    posisi: "",
    noHp: "",
  });
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [isSavingEmployee, setIsSavingEmployee] = useState(false);

  // Fungsi format tanggal (MM/DD/YY)
  const formatDateMMDDYY = (dateString: any) => {
    if (!dateString) return "-";
    const dateObj = new Date(dateString);
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    const yy = String(dateObj.getFullYear()).slice(-2);
    return `${mm}/${dd}/${yy}`;
  };

  const formatTitleCase = (str: string) => {
    if (!str) return "-";
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  useEffect(() => {
    fetchHistory();
    fetchEmployees();
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

  const fetchEmployees = async () => {
    setIsLoadingEmployees(true);
    try {
      const response = await axios.get("/api/karyawan");
      if (response.data.success) {
        setEmployees(response.data.data);
      }
    } catch (error) {
      console.error("Gagal menarik data karyawan:", error);
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout");
      router.push("/");
    } catch (error) {
      console.error("Gagal logout:", error);
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Riwayat Kehadiran");

    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Riwayat_Kehadiran_${today}.xlsx`);
  };

  const handleShowPhoto = (row: any) => setSelectedRow(row);
  const closePhotoModal = () => setSelectedRow(null);

  // ================= CRUD KARYAWAN =================
  const openAddEmployeeModal = () => {
    setEditingEmployee(null);
    setEmployeeForm({ nama: "", email: "", posisi: "", noHp: "" });
    setEmployeeModalOpen(true);
  };

  const openEditEmployeeModal = (emp: any) => {
    setEditingEmployee(emp);
    setEmployeeForm({
      nama: emp.nama || emp.name || "",
      email: emp.email || "",
      posisi: emp.posisi || "",
      noHp: emp.noHp || "",
    });
    setEmployeeModalOpen(true);
  };

  const closeEmployeeModal = () => {
    setEmployeeModalOpen(false);
    setEditingEmployee(null);
  };

  const handleEmployeeFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEmployeeForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEmployee(true);
    try {
      if (editingEmployee) {
        // Mode edit
        const response = await axios.put(
          `/api/karyawan/${editingEmployee.id}`,
          employeeForm,
        );
        if (response.data.success) {
          setEmployees((prev) =>
            prev.map((emp) =>
              emp.id === editingEmployee.id ? { ...emp, ...employeeForm } : emp,
            ),
          );
        }
      } else {
        // Mode tambah
        const response = await axios.post("/api/karyawan", employeeForm);
        if (response.data.success) {
          setEmployees((prev) => [...prev, response.data.data]);
        }
      }
      closeEmployeeModal();
    } catch (error) {
      console.error("Gagal menyimpan data karyawan:", error);
    } finally {
      setIsSavingEmployee(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!deleteTarget) return;
    try {
      const response = await axios.delete(`/api/karyawan/${deleteTarget.id}`);
      if (response.data.success) {
        setEmployees((prev) =>
          prev.filter((emp) => emp.id !== deleteTarget.id),
        );
      }
    } catch (error) {
      console.error("Gagal menghapus karyawan:", error);
    } finally {
      setDeleteTarget(null);
    }
  };

  const menuItems: { key: MenuKey; label: string; icon: any }[] = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "karyawan", label: "Karyawan", icon: Users },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      {/* ================= SIDEBAR ================= */}
      <aside
        className={`bg-primary text-white flex flex-col shadow-lg transition-all duration-200 ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="flex items-center gap-3 p-4 border-b border-white/10">
          <div className="bg-white p-2 rounded-lg shrink-0">
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
            const isActive = activeMenu === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveMenu(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-sm font-medium ${
                  isActive
                    ? "bg-white text-primary"
                    : "text-white/90 hover:bg-white/10"
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
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-white/90 hover:bg-white/10 transition-colors text-sm"
          >
            <Menu size={20} className="shrink-0" />
            {sidebarOpen && <span>Ciutkan</span>}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-white/90 hover:bg-white/10 transition-colors text-sm"
          >
            <ChevronLeft size={20} className="shrink-0" />
            {sidebarOpen && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      {/* ================= KONTEN UTAMA ================= */}
      <main className="grow p-8 overflow-x-auto">
        <div className="max-w-6xl mx-auto">
          {activeMenu === "dashboard" ? (
            <>
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
                                      {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      },
                                    )
                                  : "-"}
                              </td>
                              <td className="p-4 text-slate-600">
                                {row.waktuKeluar && row.waktuKeluar !== "-"
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
            </>
          ) : (
            <>
              {/* ================= LIST KARYAWAN ================= */}
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">
                    Data Karyawan
                  </h3>
                  <p className="text-slate-500">
                    Kelola data karyawan CV. Bisnis Pro Komputama.
                  </p>
                </div>

                <button
                  onClick={openAddEmployeeModal}
                  className="flex items-center gap-2 px-4 py-2 text-white rounded-lg shadow hover:opacity-90 transition-opacity bg-accent"
                >
                  <Plus size={20} />
                  Tambah Karyawan
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 text-sm uppercase tracking-wider">
                        <th className="p-4 border-b">ID</th>
                        <th className="p-4 border-b">Nama</th>
                        <th className="p-4 border-b">Email</th>
                        <th className="p-4 border-b">Posisi</th>
                        <th className="p-4 border-b">No. HP</th>
                        <th className="p-4 border-b text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {isLoadingEmployees ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="p-8 text-center text-slate-500"
                          >
                            Memuat data karyawan...
                          </td>
                        </tr>
                      ) : employees.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="p-8 text-center text-slate-500"
                          >
                            Belum ada data karyawan.
                          </td>
                        </tr>
                      ) : (
                        employees.map((emp) => (
                          <tr
                            key={emp.id}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="p-4 text-slate-500 font-mono">
                              #{String(emp.id).padStart(3, "0")}
                            </td>
                            <td className="p-4 font-semibold text-slate-800">
                              {formatTitleCase(emp.nama || emp.name)}
                            </td>
                            <td className="p-4 text-slate-600">
                              {emp.email || "-"}
                            </td>
                            <td className="p-4 text-slate-600">
                              {emp.posisi || "-"}
                            </td>
                            <td className="p-4 text-slate-600">
                              {emp.noHp || "-"}
                            </td>
                            <td className="p-4">
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => openEditEmployeeModal(emp)}
                                  className="w-9 h-9 bg-blue-50 text-blue-600 rounded border border-blue-100 flex items-center justify-center hover:bg-blue-100 transition-colors"
                                  title="Edit"
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  onClick={() => setDeleteTarget(emp)}
                                  className="w-9 h-9 bg-red-50 text-red-600 rounded border border-red-100 flex items-center justify-center hover:bg-red-100 transition-colors"
                                  title="Hapus"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 border-t text-sm text-slate-500">
                  Menampilkan {employees.length} karyawan
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* ================= MODAL FOTO MASUK & KELUAR ================= */}
      {selectedRow && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={closePhotoModal}
        >
          <div
            className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closePhotoModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X size={22} />
            </button>

            <h3 className="text-lg font-bold text-slate-800 mb-1">
              Foto Absensi
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {formatTitleCase(selectedRow.nama || selectedRow.name)} —{" "}
              {selectedRow.waktuMasuk
                ? new Date(selectedRow.waktuMasuk).toLocaleDateString("id-ID", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "-"}
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                  Foto Masuk
                </p>
                <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200">
                  {selectedRow.fotoMasuk ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedRow.fotoMasuk}
                      alt="Foto Masuk"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">
                      Tidak ada foto
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                  Foto Keluar
                </p>
                <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200">
                  {selectedRow.fotoKeluar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedRow.fotoKeluar}
                      alt="Foto Keluar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">
                      Tidak ada foto
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL TAMBAH/EDIT KARYAWAN ================= */}
      {employeeModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={closeEmployeeModal}
        >
          <div
            className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeEmployeeModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X size={22} />
            </button>

            <h3 className="text-lg font-bold text-slate-800 mb-4">
              {editingEmployee ? "Edit Karyawan" : "Tambah Karyawan"}
            </h3>

            <form onSubmit={handleSaveEmployee} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nama
                </label>
                <input
                  type="text"
                  name="nama"
                  value={employeeForm.nama}
                  onChange={handleEmployeeFormChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={employeeForm.email}
                  onChange={handleEmployeeFormChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Posisi
                </label>
                <input
                  type="text"
                  name="posisi"
                  value={employeeForm.posisi}
                  onChange={handleEmployeeFormChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  No. HP
                </label>
                <input
                  type="text"
                  name="noHp"
                  value={employeeForm.noHp}
                  onChange={handleEmployeeFormChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeEmployeeModal}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEmployee}
                  className="px-4 py-2 rounded-lg bg-accent text-white hover:opacity-90 disabled:opacity-50"
                >
                  {isSavingEmployee ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL KONFIRMASI HAPUS ================= */}
      {deleteTarget && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              Hapus Karyawan?
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Apakah Anda yakin ingin menghapus{" "}
              <span className="font-semibold">
                {formatTitleCase(deleteTarget.nama || deleteTarget.name)}
              </span>
              ? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteEmployee}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
