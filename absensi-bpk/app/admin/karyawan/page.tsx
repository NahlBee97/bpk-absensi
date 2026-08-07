"use client";

import { formatTitleCase } from "@/helper";
import axios from "axios";
import {
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
  ShieldCheck,
  UserCog,
  ClipboardCheck,
  Database,
  Search,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const ROLE_OPTIONS = [
  { value: "user", label: "Karyawan" },
  { value: "admin", label: "Admin" },
];

const getRoleLabel = (role: string) =>
  ROLE_OPTIONS.find((r) => r.value === role)?.label || formatTitleCase(role);

// Utility: delay promise
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type OperationType = "add" | "edit" | "delete";
type ProcessStatus = "idle" | "processing" | "success" | "error";

// Konfigurasi tahapan per jenis operasi
const OPERATION_STEPS: Record<
  OperationType,
  {
    key: string;
    label: string;
    description: string;
    icon: any;
    duration: number;
  }[]
> = {
  add: [
    {
      key: "validating",
      label: "Memvalidasi Data",
      description: "Mengecek kelengkapan data karyawan...",
      icon: ClipboardCheck,
      duration: 1300,
    },
    {
      key: "saving",
      label: "Menyimpan ke Database",
      description: "Menambahkan data karyawan baru...",
      icon: Database,
      duration: 1800,
    },
  ],
  edit: [
    {
      key: "validating",
      label: "Memvalidasi Data",
      description: "Mengecek perubahan data karyawan...",
      icon: ClipboardCheck,
      duration: 1300,
    },
    {
      key: "saving",
      label: "Memperbarui Database",
      description: "Menyimpan perubahan data karyawan...",
      icon: Database,
      duration: 1800,
    },
  ],
  delete: [
    {
      key: "checking",
      label: "Memeriksa Data Terkait",
      description: "Mengecek riwayat absensi karyawan...",
      icon: Search,
      duration: 1200,
    },
    {
      key: "deleting",
      label: "Menghapus dari Database",
      description: "Menghapus data karyawan secara permanen...",
      icon: Trash2,
      duration: 1600,
    },
  ],
};

const OPERATION_TITLE: Record<OperationType, string> = {
  add: "Menambah Karyawan",
  edit: "Memperbarui Karyawan",
  delete: "Menghapus Karyawan",
};

const OPERATION_SUCCESS_TITLE: Record<OperationType, string> = {
  add: "Karyawan Ditambahkan!",
  edit: "Data Diperbarui!",
  delete: "Karyawan Dihapus!",
};

export default function AdminKaryawanPage() {
  const router = useRouter();
  // ================= STATE: KARYAWAN =================
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null); // null = mode tambah
  const [employeeForm, setEmployeeForm] = useState({
    nama: "",
    password: "",
    role: "user",
  });
  const [deleteTarget, setDeleteTarget] = useState<any>(null); // null = tidak ada yang dihapus

  // ================= STATE: MODAL PROSES CRUD =================
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [processOperation, setProcessOperation] =
    useState<OperationType>("add");
  const [processStatus, setProcessStatus] = useState<ProcessStatus>("idle");
  const [processStepIndex, setProcessStepIndex] = useState(0);
  const [processResultMessage, setProcessResultMessage] = useState("");
  const processRunId = useRef(0);

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

  useEffect(() => {
    fetchEmployees();
  }, []);

  // ================= CRUD: BUKA/TUTUP MODAL FORM =================
  const openAddEmployeeModal = () => {
    setEditingEmployee(null);
    setEmployeeForm({ nama: "", password: "", role: "user" });
    setEmployeeModalOpen(true);
  };

  const openEditEmployeeModal = (emp: any) => {
    setEditingEmployee(emp);
    setEmployeeForm({
      nama: emp.nama || "",
      password: "", // dikosongkan; hanya dikirim kalau admin mengisi ulang
      role: emp.role || "user",
    });
    setEmployeeModalOpen(true);
  };

  const closeEmployeeModal = () => {
    setEmployeeModalOpen(false);
    setEditingEmployee(null);
  };

  const handleEmployeeFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setEmployeeForm((prev) => ({ ...prev, [name]: value }));
  };

  // ================= PROSES CRUD (MODAL BERTAHAP) =================
  const runCrudProcess = async (
    operation: OperationType,
    apiCall: () => Promise<any>,
    onSuccess: (data: any) => void,
  ) => {
    const runId = ++processRunId.current;
    const steps = OPERATION_STEPS[operation];

    setProcessOperation(operation);
    setProcessStatus("processing");
    setProcessStepIndex(0);
    setProcessResultMessage("");
    setProcessModalOpen(true);

    // Tembak request asli di background
    const apiPromise = apiCall()
      .then((res) => ({ ok: true as const, data: res.data }))
      .catch((err) => ({
        ok: false as const,
        message: err?.response?.data?.message || "Gagal terhubung ke server",
      }));

    try {
      // Semua tahap sebelum tahap terakhir hanya simulasi visual
      for (let i = 0; i < steps.length - 1; i++) {
        setProcessStepIndex(i);
        await delay(steps[i].duration);
        if (runId !== processRunId.current) return;
      }

      // Tahap terakhir: tunggu request asli SELESAI + minimal durasi simulasi
      const lastIndex = steps.length - 1;
      setProcessStepIndex(lastIndex);
      const [apiResult] = await Promise.all([
        apiPromise,
        delay(steps[lastIndex].duration),
      ]);
      if (runId !== processRunId.current) return;

      if (!apiResult.ok) {
        setProcessStatus("error");
        setProcessResultMessage(apiResult.message);
        return;
      }

      // Sukses
      setProcessStatus("success");
      setProcessResultMessage(
        apiResult.data?.message ||
          (operation === "add"
            ? "Karyawan baru berhasil ditambahkan"
            : operation === "edit"
              ? "Perubahan data berhasil disimpan"
              : "Data karyawan berhasil dihapus"),
      );
      onSuccess(apiResult.data);

      await delay(1200);
      if (runId !== processRunId.current) return;
      setProcessModalOpen(false);
    } catch (error) {
      if (runId !== processRunId.current) return;
      setProcessStatus("error");
      setProcessResultMessage(
        "Terjadi kesalahan tak terduga. Silakan coba lagi.",
      );
    }
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    closeEmployeeModal();

    if (editingEmployee) {
      const payload: any = {
        nama: employeeForm.nama,
        role: employeeForm.role,
      };
      if (employeeForm.password.trim()) {
        payload.password = employeeForm.password;
      }

      await runCrudProcess(
        "edit",
        () => axios.put(`/api/karyawan?id=${editingEmployee.id}`, payload),
        () => {
          setEmployees((prev) =>
            prev.map((emp) =>
              emp.id === editingEmployee.id
                ? { ...emp, nama: payload.nama, role: payload.role }
                : emp,
            ),
          );
        },
      );
    } else {
      await runCrudProcess(
        "add",
        () => axios.post("/api/karyawan", employeeForm),
        (data) => {
          setEmployees((prev) => [...prev, data?.data]);
        },
      );
    }
  };

  const handleDeleteEmployee = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);

    await runCrudProcess(
      "delete",
      () => axios.delete(`/api/karyawan?id=${target.id}`),
      () => {
        setEmployees((prev) => prev.filter((emp) => emp.id !== target.id));
      },
    );
  };

  const handleRetryProcess = () => {
    // Retry sederhana: tutup modal, biarkan admin mengulang aksi dari awal
    setProcessModalOpen(false);
    setProcessStatus("idle");
    setProcessStepIndex(0);
    setProcessResultMessage("");
  };

  const closeProcessModal = () => {
    processRunId.current++;
    setProcessModalOpen(false);
    setProcessStatus("idle");
    setProcessStepIndex(0);
    setProcessResultMessage("");
  };

  return (
    <>
      <main className="grow p-8 overflow-x-auto bg-slate-50">
        <div className="max-w-6xl mx-auto">
          {/* ================= HEADER (gradient, senada dengan halaman lain) ================= */}
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
                  Karyawan
                </p>
                <h3 className="text-2xl font-bold text-white">Data Karyawan</h3>
                <p className="text-white/60 text-sm mt-1">
                  Kelola akun karyawan CV. Bisnis Pro Komputama.
                </p>
              </div>

              <button
                onClick={openAddEmployeeModal}
                className="flex items-center gap-2 px-4 py-2.5 text-primary font-semibold rounded-xl shadow hover:brightness-95 transition-all bg-white"
              >
                <Plus size={19} />
                Tambah Karyawan
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
                    <th className="p-4 border-b">Nama</th>
                    <th className="p-4 border-b">Role</th>
                    <th className="p-4 border-b text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingEmployees ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-10 text-center text-slate-500"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Loader2
                            size={22}
                            className="animate-spin text-accent"
                          />
                          Memuat data karyawan...
                        </div>
                      </td>
                    </tr>
                  ) : employees.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-10 text-center text-slate-500"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Users size={28} className="text-slate-300" />
                          Belum ada data karyawan.
                        </div>
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
                          {formatTitleCase(emp.nama)}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                              emp.role === "admin"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {emp.role === "admin" ? (
                              <ShieldCheck size={12} />
                            ) : (
                              <UserCog size={12} />
                            )}
                            {getRoleLabel(emp.role)}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => openEditEmployeeModal(emp)}
                              className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 flex items-center justify-center hover:bg-blue-100 transition-colors"
                              title="Edit"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(emp)}
                              className="w-9 h-9 bg-red-50 text-red-600 rounded-lg border border-red-100 flex items-center justify-center hover:bg-red-100 transition-colors"
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
        </div>
      </main>

      {/* ================= MODAL TAMBAH/EDIT KARYAWAN ================= */}
      {employeeModalOpen && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={closeEmployeeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeEmployeeModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X size={20} />
            </button>

            <div className="mb-5">
              <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-1">
                {editingEmployee ? "Edit Data" : "Data Baru"}
              </p>
              <h3 className="text-lg font-bold text-slate-800">
                {editingEmployee ? "Edit Karyawan" : "Tambah Karyawan"}
              </h3>
            </div>

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
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password
                  {editingEmployee && (
                    <span className="font-normal text-slate-400">
                      {" "}
                      (kosongkan jika tidak diubah)
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  name="password"
                  value={employeeForm.password}
                  onChange={handleEmployeeFormChange}
                  required={!editingEmployee}
                  placeholder={editingEmployee ? "••••••••" : ""}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Role
                </label>
                <select
                  name="role"
                  value={employeeForm.role}
                  onChange={handleEmployeeFormChange}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all bg-white"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeEmployeeModal}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-accent text-white font-semibold hover:opacity-90"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL KONFIRMASI HAPUS ================= */}
      {deleteTarget && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Trash2 size={20} className="text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              Hapus Karyawan?
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Apakah Anda yakin ingin menghapus{" "}
              <span className="font-semibold text-slate-700">
                {formatTitleCase(deleteTarget.nama)}
              </span>
              ? Tindakan ini tidak dapat dibatalkan, termasuk seluruh riwayat
              absensi yang terkait.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteEmployee}
                className="px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL PROSES CRUD (Tambah/Edit/Hapus) ================= */}
      {processModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
            {/* Header */}
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-slate-800">
                {OPERATION_TITLE[processOperation]}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {processStatus === "error"
                  ? "Proses gagal, silakan coba lagi."
                  : "Mohon tunggu sebentar..."}
              </p>
            </div>

            {processStatus === "success" ? (
              /* Sukses */
              <div className="flex flex-col items-center py-4">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle2 size={44} className="text-green-600" />
                </div>
                <p className="text-lg font-bold text-green-700 text-center">
                  {OPERATION_SUCCESS_TITLE[processOperation]}
                </p>
                <p className="text-sm text-slate-500 text-center mt-1">
                  {processResultMessage}
                </p>
              </div>
            ) : processStatus === "error" ? (
              /* Error */
              <div className="flex flex-col items-center py-4">
                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <XCircle size={44} className="text-red-600" />
                </div>
                <p className="text-sm text-red-600 text-center mb-6">
                  {processResultMessage ||
                    "Terjadi kesalahan. Silakan coba lagi."}
                </p>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={closeProcessModal}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-slate-600 font-semibold hover:bg-slate-50"
                  >
                    Tutup
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
                {OPERATION_STEPS[processOperation].map((step, index) => {
                  const Icon = step.icon;
                  const isDone = index < processStepIndex;
                  const isActive = index === processStepIndex;

                  return (
                    <div key={step.key} className="flex items-center gap-4">
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
                          {step.label}
                        </p>
                        {isActive && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {step.description}
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
                          ((processStepIndex + 1) /
                            OPERATION_STEPS[processOperation].length) *
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
