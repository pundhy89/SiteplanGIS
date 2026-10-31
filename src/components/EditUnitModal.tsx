import React, { useState, useEffect } from 'react';
import { Check, X, Trash2, Home, MapPin, Tag } from 'lucide-react';
import { UnitData, UnitStatus } from '../types';
import { TYPE_OPTIONS } from '../data/initialUnits';

interface EditUnitModalProps {
  unit: UnitData | null;
  onClose: () => void;
  onSave: (updatedUnit: UnitData) => void;
  onDelete?: (unitId: string) => void;
}

export const EditUnitModal: React.FC<EditUnitModalProps> = ({
  unit,
  onClose,
  onSave,
  onDelete,
}) => {
  const [formData, setFormData] = useState<UnitData | null>(null);

  useEffect(() => {
    if (unit) {
      setFormData({ ...unit });
    } else {
      setFormData(null);
    }
  }, [unit]);

  if (!unit || !formData) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.display.trim()) {
      return;
    }
    // Update block letter from display prefix if available
    const blockMatch = formData.display.match(/^([A-Z]+)/i);
    const block = blockMatch ? blockMatch[1].toUpperCase() : formData.block;

    onSave({
      ...formData,
      display: formData.display.trim(),
      block,
      x: Number(formData.x),
      y: Number(formData.y),
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-[8px]" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-[400px] rounded-[24px] bg-[#16161a] text-white shadow-[0_24px_80px_rgba(0,0,0,0.5)] border border-white/15 overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-3.5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-yellow-400 text-black flex items-center justify-center font-bold text-[13px]">
              <Home className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-white">Edit Unit {unit.display}</h3>
              <p className="text-[11px] text-white/50">Sesuaikan nomor, status, tipe, dan koordinat</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-3.5">
          {/* Display & Block */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-white/70 mb-1">
                Nomor Tampilan Unit
              </label>
              <input
                type="text"
                value={formData.display}
                onChange={(e) => setFormData({ ...formData, display: e.target.value })}
                placeholder="Contoh: A.01"
                className="w-full h-9 px-3 rounded-xl bg-white/5 border border-white/15 text-[13px] font-mono font-bold text-yellow-300 outline-none focus:border-yellow-400"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-white/70 mb-1">
                Blok
              </label>
              <input
                type="text"
                value={formData.block}
                onChange={(e) => setFormData({ ...formData, block: e.target.value.toUpperCase() })}
                placeholder="A"
                maxLength={4}
                className="w-full h-9 px-3 rounded-xl bg-white/5 border border-white/15 text-[13px] font-bold text-white outline-none focus:border-yellow-400"
                required
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-semibold text-white/70 mb-1">
              Status Unit (Warna Pin)
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as UnitStatus })}
              className="w-full h-9 px-3 rounded-xl bg-[#202026] border border-white/15 text-[13px] text-white outline-none focus:border-yellow-400"
            >
              <option value="tersedia">🟢 Tersedia (Hijau)</option>
              <option value="booking">🟡 Terbooking (Kuning)</option>
              <option value="bangun">🔵 Terbangun (Biru)</option>
              <option value="realisasi">⚪ Realisasi KPR (Abu-abu)</option>
            </select>
          </div>

          {/* Tipe & Luas */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-white/70 mb-1">
                Tipe Rumah
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full h-9 px-3 rounded-xl bg-[#202026] border border-white/15 text-[12px] text-white outline-none focus:border-yellow-400"
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-white/70 mb-1">
                Luas Tanah (m²)
              </label>
              <input
                type="number"
                value={formData.luas}
                onChange={(e) => setFormData({ ...formData, luas: Number(e.target.value) || 0 })}
                className="w-full h-9 px-3 rounded-xl bg-white/5 border border-white/15 text-[12px] text-white outline-none focus:border-yellow-400"
              />
            </div>
          </div>

          {/* Harga */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-white/70 mb-1">
                Ringkasan Harga
              </label>
              <input
                type="text"
                value={formData.harga}
                onChange={(e) => setFormData({ ...formData, harga: e.target.value })}
                placeholder="Rp 185 Jt"
                className="w-full h-9 px-3 rounded-xl bg-white/5 border border-white/15 text-[12px] text-white outline-none focus:border-yellow-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-white/70 mb-1">
                Harga Penuh
              </label>
              <input
                type="text"
                value={formData.hargaFull}
                onChange={(e) => setFormData({ ...formData, hargaFull: e.target.value })}
                placeholder="Rp 185.000.000"
                className="w-full h-9 px-3 rounded-xl bg-white/5 border border-white/15 text-[12px] text-white outline-none focus:border-yellow-400"
              />
            </div>
          </div>

          {/* Coordinates (X, Y) */}
          <div>
            <label className="block text-[11px] font-semibold text-white/70 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-yellow-400" /> Koordinat Menimpa Denah (0 - 100%)
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex items-center gap-1 bg-white/5 px-2.5 rounded-xl border border-white/10">
                <span className="text-[11px] font-mono text-white/50">X:</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.x}
                  onChange={(e) => setFormData({ ...formData, x: parseFloat(e.target.value) || 0 })}
                  className="w-full h-8 bg-transparent text-[12px] font-mono font-bold text-yellow-300 outline-none"
                />
                <span className="text-[11px] text-white/40">%</span>
              </div>
              <div className="flex items-center gap-1 bg-white/5 px-2.5 rounded-xl border border-white/10">
                <span className="text-[11px] font-mono text-white/50">Y:</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.y}
                  onChange={(e) => setFormData({ ...formData, y: parseFloat(e.target.value) || 0 })}
                  className="w-full h-8 bg-transparent text-[12px] font-mono font-bold text-yellow-300 outline-none"
                />
                <span className="text-[11px] text-white/40">%</span>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            {onDelete ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const targetId = unit.id;
                  onClose();
                  onDelete(targetId);
                }}
                className="h-9 px-3 rounded-xl bg-red-500/20 hover:bg-red-500/35 active:scale-95 border border-red-500/30 text-red-300 text-[12px] font-semibold flex items-center gap-1 cursor-pointer transition"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hapus
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-[12px] font-semibold text-white"
              >
                Batal
              </button>
              <button
                type="submit"
                className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold flex items-center gap-1.5 transition"
              >
                <Check className="w-3.5 h-3.5" /> Simpan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
