import React, { useState, useMemo } from 'react';
import { ArrowDownAZ, Compass, ListOrdered, Check, X, RefreshCw, Layers } from 'lucide-react';
import { UnitData } from '../types';
import { sortUnitsAlphanumeric, sortUnitsSpatial } from '../data/initialUnits';

interface AutoSortModalProps {
  isOpen: boolean;
  onClose: () => void;
  units: UnitData[];
  onApplySort: (sortedUnits: UnitData[]) => void;
}

export const AutoSortModal: React.FC<AutoSortModalProps> = ({
  isOpen,
  onClose,
  units,
  onApplySort,
}) => {
  const [sortMethod, setSortMethod] = useState<'alpha' | 'spatial' | 'spatial_renumber' | 'status'>('alpha');
  const [selectedBlock, setSelectedBlock] = useState<string>('ALL');

  const availableBlocks = useMemo(() => {
    return Array.from(new Set(units.map((u) => u.block))).sort();
  }, [units]);

  // Compute preview of sorted units
  const previewUnits = useMemo(() => {
    let target = [...units];
    if (selectedBlock !== 'ALL') {
      target = target.filter((u) => u.block === selectedBlock);
    }

    let result: UnitData[] = [];
    if (sortMethod === 'alpha') {
      result = sortUnitsAlphanumeric(target);
    } else if (sortMethod === 'spatial') {
      result = sortUnitsSpatial(target, false);
    } else if (sortMethod === 'spatial_renumber') {
      result = sortUnitsSpatial(target, true);
    } else if (sortMethod === 'status') {
      const order = { tersedia: 1, booking: 2, bangun: 3, realisasi: 4 };
      result = [...target].sort((a, b) => order[a.status] - order[b.status]);
    }

    // If a specific block was selected, merge back into the full list
    if (selectedBlock !== 'ALL') {
      const otherUnits = units.filter((u) => u.block !== selectedBlock);
      return [...result, ...otherUnits];
    }

    return result;
  }, [units, sortMethod, selectedBlock]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplySort(previewUnits);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-[10px]" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-[640px] max-h-[92vh] rounded-[24px] bg-[#141418] text-white shadow-[0_24px_80px_rgba(0,0,0,0.6)] border border-white/15 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/10 flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
              <ListOrdered className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold tracking-tight text-white">
                Otomatis Mengurutkan Nomor Unit Rumah
              </h2>
              <p className="text-[12px] text-white/50 mt-0.5">
                Urutkan nomor & susunan kavling secara otomatis dan sinkronkan ke Firebase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 no-scrollbar">
          {/* Method Selection */}
          <div className="space-y-2.5">
            <label className="block text-[12px] font-semibold text-white/70">
              Metode Pengurutan:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option 1: Alphanumeric */}
              <button
                type="button"
                onClick={() => setSortMethod('alpha')}
                className={`p-3 rounded-2xl border text-left transition flex items-start gap-3 ${
                  sortMethod === 'alpha'
                    ? 'bg-yellow-400/15 border-yellow-400 text-white shadow-lg'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                    sortMethod === 'alpha' ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white'
                  }`}
                >
                  <ArrowDownAZ className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-bold text-white">
                    Urutkan Nomor Alfanumerik (Rekomendasi)
                  </div>
                  <div className="text-[10px] text-white/50 mt-0.5">
                    A.01, A.02 ... B.01, B.02 ... C.01 ... D.01 secara rapi & alami
                  </div>
                </div>
              </button>

              {/* Option 2: Spatial (Position on map) */}
              <button
                type="button"
                onClick={() => setSortMethod('spatial')}
                className={`p-3 rounded-2xl border text-left transition flex items-start gap-3 ${
                  sortMethod === 'spatial'
                    ? 'bg-yellow-400/15 border-yellow-400 text-white shadow-lg'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                    sortMethod === 'spatial' ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-bold text-white">
                    Urutkan Berdasarkan Posisi Denah
                  </div>
                  <div className="text-[10px] text-white/50 mt-0.5">
                    Mengurutkan urutan titik dari kiri ke kanan (Barat ke Timur)
                  </div>
                </div>
              </button>

              {/* Option 3: Spatial + Auto-Renumber */}
              <button
                type="button"
                onClick={() => setSortMethod('spatial_renumber')}
                className={`p-3 rounded-2xl border text-left transition flex items-start gap-3 sm:col-span-2 ${
                  sortMethod === 'spatial_renumber'
                    ? 'bg-yellow-400/15 border-yellow-400 text-white shadow-lg'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                    sortMethod === 'spatial_renumber' ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white'
                  }`}
                >
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-bold text-white">
                    Nomor Ulang Otomatis dari Denah (Auto-Sequence)
                  </div>
                  <div className="text-[10px] text-white/50 mt-0.5">
                    Menyusun ulang dan memberi nomor urut baru (misal A.01, A.02, A.03...) berurutan sesuai titik pada denah dari kiri ke kanan.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Block Scope */}
          <div className="flex items-center justify-between gap-4 bg-white/5 p-3 rounded-xl border border-white/10">
            <span className="text-[12px] font-medium text-white/70 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-yellow-400" /> Terapkan ke Blok:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSelectedBlock('ALL')}
                className={`h-7 px-2.5 rounded-lg text-[11px] font-bold transition ${
                  selectedBlock === 'ALL'
                    ? 'bg-yellow-400 text-black'
                    : 'bg-white/10 text-white/70 hover:bg-white/15'
                }`}
              >
                Semua Blok
              </button>
              {availableBlocks.map((b) => (
                <button
                  key={b}
                  onClick={() => setSelectedBlock(b)}
                  className={`h-7 px-2.5 rounded-lg text-[11px] font-bold transition ${
                    selectedBlock === b
                      ? 'bg-yellow-400 text-black'
                      : 'bg-white/10 text-white/70 hover:bg-white/15'
                  }`}
                >
                  Blok {b}
                </button>
              ))}
            </div>
          </div>

          {/* Preview Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-white/60">
              <span>Pratinjau Hasil Urutan ({previewUnits.length} unit):</span>
              <span className="text-yellow-400 font-mono">Real-time Preview</span>
            </div>

            <div className="max-h-[220px] overflow-y-auto rounded-xl border border-white/10 bg-black/40">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-white/10 text-white/60 sticky top-0 backdrop-blur-md">
                  <tr>
                    <th className="px-3 py-2 font-semibold">No</th>
                    <th className="px-3 py-2 font-semibold">Nomor Unit</th>
                    <th className="px-3 py-2 font-semibold">Blok</th>
                    <th className="px-3 py-2 font-semibold">Status</th>
                    <th className="px-3 py-2 font-semibold text-right">Posisi (X, Y)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {previewUnits.slice(0, 30).map((u, idx) => (
                    <tr key={u.id} className="hover:bg-white/5">
                      <td className="px-3 py-1.5 text-white/40">{idx + 1}</td>
                      <td className="px-3 py-1.5 font-bold text-yellow-300">{u.display}</td>
                      <td className="px-3 py-1.5 text-white/70">{u.block}</td>
                      <td className="px-3 py-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            u.status === 'tersedia'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : u.status === 'booking'
                              ? 'bg-amber-400/20 text-amber-300'
                              : u.status === 'bangun'
                              ? 'bg-sky-500/20 text-sky-300'
                              : 'bg-zinc-500/20 text-zinc-300'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-right text-white/50">
                        {u.x.toFixed(1)}%, {u.y.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                  {previewUnits.length > 30 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-2 text-center text-white/40 italic">
                        ... dan {previewUnits.length - 30} unit lainnya
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-white/50">
            Perubahan urutan akan otomatis disinkronkan ke seluruh perangkat.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="h-9 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-[12px] font-semibold transition"
            >
              Batal
            </button>
            <button
              onClick={handleApply}
              className="h-9 px-5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-black text-[12px] font-bold flex items-center gap-1.5 shadow-lg transition"
            >
              <Check className="w-4 h-4" /> Terapkan & Sinkron ke Firebase
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
