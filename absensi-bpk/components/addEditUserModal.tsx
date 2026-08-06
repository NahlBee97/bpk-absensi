"use client";

import { X } from "lucide-react";
import { useState } from "react";

export const AddEditEmployeeModal = ({
  isOpen,
  onClose,
  onSave,
  employeeData,
  isSavingEmployee,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  employeeData?: any; // Data karyawan yang akan diedit, jika ada
  isSavingEmployee: boolean;
}) => {
  const [formData, setFormData] = useState({
    nama: employeeData?.nama || "",
    email: employeeData?.email || "",
    posisi: employeeData?.posisi || "",
    noHp: employeeData?.noHp || "",
  });

  const handleEmployeeFormChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEmployee = (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <div
            className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X size={22} />
            </button>

            <h3 className="text-lg font-bold text-slate-800 mb-4">
              {employeeData ? "Edit Karyawan" : "Tambah Karyawan"}
            </h3>

            <form onSubmit={handleSaveEmployee} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nama
                </label>
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
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
                  value={formData.email}
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
                  value={formData.posisi}
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
                  value={formData.noHp}
                  onChange={handleEmployeeFormChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
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
    </>
  );
};
