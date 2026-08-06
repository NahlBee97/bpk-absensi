import { formatTitleCase } from "@/helper";
import { X } from "lucide-react";

export const InOutModal = ({
  selectedRow,
  closePhotoModal,
}: {
  selectedRow: any;
  closePhotoModal: () => void;
}) => {
  return (
    selectedRow && (
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
              ? new Date(selectedRow.waktuMasuk).toLocaleDateString(
                  "id-ID",
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                )
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
    )
  );
};
