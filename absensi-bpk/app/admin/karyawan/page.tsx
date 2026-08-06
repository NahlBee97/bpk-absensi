"use client";

import { formatTitleCase } from "@/helper";
import axios from "axios";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminKaryawanPage() {
  const router = useRouter();
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
  const [isSavingEmployee, setIsSavingEmployee] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null); // null = tidak ada yang dihapus

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

  const handleEmployeeFormChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
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
              emp.id === editingEmployee.id
                ? { ...emp, ...employeeForm }
                : emp,
            ),
          );
        }
      } else {
        // Mode tambah
        const response = await axios.post(
          "/api/karyawan",
          employeeForm,
        );
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
      const response = await axios.delete(
        `/api/karyawan/${deleteTarget.id}`,
      );
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

  return (
    <main className="grow p-8 overflow-x-auto">
      <div className="max-w-6xl mx-auto">
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
                    {formatTitleCase(
                      deleteTarget.nama || deleteTarget.name,
                    )}
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

          <div className="p-4 border-t text-sm text-slate-500">
            Menampilkan {employees.length} karyawan
          </div>
        </div>
      </div>
    </main>
  );
}