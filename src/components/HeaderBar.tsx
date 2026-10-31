import React, { useState, useRef, useEffect } from 'react';
import {
  Crosshair,
  Plus,
  Image as ImageIcon,
  MapPin,
  ChevronDown,
  ChevronUp,
  FileDown,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { UnitData } from '../types';

interface HeaderBarProps {
  units: UnitData[];
  activeFilterStatus: string;
  onSelectFilterStatus: (status: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onAddNewUnit: () => void;
  isFirebaseConnected: boolean;
  isSyncing: boolean;
  onUploadBackground: () => void;
  pointScale?: number;
  onChangePointScale?: (newScale: number) => void;
  onOpenReportModal: () => void;
  onAutoPlaceUnits?: () => void;
  onLogout?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  units,
  activeFilterStatus,
  onSelectFilterStatus,
  isEditMode,
  onToggleEditMode,
  onAddNewUnit,
  isFirebaseConnected,
  isSyncing,
  onUploadBackground,
  pointScale = 1.0,
  onChangePointScale,
  onOpenReportModal,
  onAutoPlaceUnits,
  onLogout,
}) => {
  // Compute counts
  const total = units.length;
  const countTersedia = units.filter((u) => u.status === 'tersedia').length;
  const countBooking = units.filter((u) => u.status === 'booking').length;
  const countBangun = units.filter((u) => u.status === 'bangun').length;
  const countRealisasi = units.filter((u) => u.status === 'realisasi').length;

  // Top-Left Title Dropdown (Menu Edit)
  const [isEditMenuOpen, setIsEditMenuOpen] = useState(false);
  const editMenuRef = useRef<HTMLDivElement>(null);

  // Top-Right Status Dropdown
  const [isStatusVisible, setIsStatusVisible] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (editMenuRef.current && !editMenuRef.current.contains(e.target as Node)) {
        setIsEditMenuOpen(false);
      }
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setIsStatusVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="absolute top-0 left-0 right-0 z-30 p-2.5 sm:p-4 pointer-events-none flex items-start justify-between gap-2.5 select-none">
      {/* TOP-LEFT: Clickable Title "Griya Secawan Indah" -> Opens Edit Menu */}
      <div ref={editMenuRef} className="pointer-events-auto relative">
        <button
          onClick={() => setIsEditMenuOpen((prev) => !prev)}
          className={`h-9 px-3.5 rounded-full backdrop-blur-md border flex items-center gap-2 shadow-lg transition active:scale-95 cursor-pointer ${
            isEditMode
              ? 'bg-yellow-400 text-black border-yellow-300 shadow-yellow-400/40'
              : isEditMenuOpen
              ? 'bg-white text-black border-white'
              : 'bg-black/85 hover:bg-black/95 border-white/15 text-white'
          }`}
          title="Klik untuk membuka Menu Edit & Pengaturan"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isEditMode ? 'bg-black animate-ping' : 'bg-emerald-400 animate-pulse'
            }`}
          />
          <span className="text-[12px] sm:text-[13px] font-extrabold tracking-tight">
            Griya Secawan Indah
          </span>
          {isEditMenuOpen ? (
            <ChevronUp className="w-3.5 h-3.5 opacity-75" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 opacity-75" />
          )}
        </button>

        {/* Edit & Control Dropdown Menu */}
        {isEditMenuOpen && (
          <div className="absolute left-0 mt-2 w-60 rounded-2xl bg-zinc-950/95 backdrop-blur-xl border border-white/15 shadow-2xl p-1.5 text-white z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-1.5 border-b border-white/10 mb-1 flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                Menu Edit & Kontrol
              </span>
              <span className="text-[10px] font-mono text-emerald-400">Vol ± Zoom</span>
            </div>

            {/* Otomatis Tempatkan Nomor Rumah */}
            {onAutoPlaceUnits && (
              <button
                onClick={() => {
                  setIsEditMenuOpen(false);
                  onAutoPlaceUnits();
                }}
                className="w-full px-3 py-2 rounded-xl hover:bg-white/10 text-left text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Otomatis Pas Nomor Rumah</span>
              </button>
            )}

            {/* Pas Titik / Mode Edit */}
            <button
              onClick={() => {
                setIsEditMenuOpen(false);
                onToggleEditMode();
              }}
              className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
                isEditMode
                  ? 'bg-yellow-400/20 text-yellow-300 hover:bg-yellow-400/30'
                  : 'hover:bg-white/10 text-white'
              }`}
            >
              <Crosshair className="w-4 h-4 text-yellow-400 shrink-0" />
              <span>{isEditMode ? 'Selesai Pas Titik' : 'Pas Titik Manual'}</span>
            </button>

            {/* Tambah Unit */}
            <button
              onClick={() => {
                setIsEditMenuOpen(false);
                onAddNewUnit();
              }}
              className="w-full px-3 py-2 rounded-xl hover:bg-white/10 text-left text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Tambah Unit Baru</span>
            </button>

            {/* Laporan PDF */}
            <button
              onClick={() => {
                setIsEditMenuOpen(false);
                onOpenReportModal();
              }}
              className="w-full px-3 py-2 rounded-xl hover:bg-white/10 text-left text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Laporan PDF Offline</span>
            </button>

            {/* Ganti Background Latar Denah */}
            <button
              onClick={() => {
                setIsEditMenuOpen(false);
                onUploadBackground();
              }}
              className="w-full px-3 py-2 rounded-xl hover:bg-white/10 text-left text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Ganti Latar Denah</span>
            </button>

            {/* Lokasi OpenStreetMap */}
            <a
              href="https://www.openstreetmap.org/search?query=Griya%20Indah%20Secawan"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsEditMenuOpen(false)}
              className="w-full px-3 py-2 rounded-xl hover:bg-white/10 text-left text-xs font-semibold flex items-center gap-2.5 transition"
            >
              <MapPin className="w-4 h-4 text-red-400 shrink-0" />
              <span>Lokasi OpenStreetMap</span>
            </a>

            {/* Point Scale Adjuster (A+ / A-) */}
            {onChangePointScale && (
              <div className="my-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-[11px] font-medium text-zinc-300">Ukuran Titik Pin</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onChangePointScale(Math.max(0.6, pointScale - 0.15))}
                    className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white transition cursor-pointer"
                    title="Perkecil Titik Pin"
                  >
                    A-
                  </button>
                  <button
                    onClick={() => onChangePointScale(Math.min(2.0, pointScale + 0.15))}
                    className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white transition cursor-pointer"
                    title="Perbesar Titik Pin"
                  >
                    A+
                  </button>
                </div>
              </div>
            )}

            {/* Logout Button */}
            {onLogout && (
              <div className="pt-1 mt-1 border-t border-white/10">
                <button
                  onClick={() => {
                    setIsEditMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-red-500/20 text-red-300 text-left text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-red-400 shrink-0" />
                  <span>Keluar (Logout)</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* TOP-RIGHT: Status Dropdown Menu */}
      <div ref={statusMenuRef} className="pointer-events-auto relative flex flex-col items-end">
        <button
          onClick={() => setIsStatusVisible((prev) => !prev)}
          className="h-9 px-3.5 rounded-full bg-black/85 hover:bg-black/95 backdrop-blur-md border border-white/20 text-white text-[12px] font-bold flex items-center gap-1.5 shadow-2xl transition active:scale-95 cursor-pointer"
          title="Klik untuk tampilkan / sembunyikan filter status unit"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isSyncing
                ? 'bg-amber-400 animate-spin'
                : isFirebaseConnected
                ? 'bg-emerald-400 animate-pulse'
                : 'bg-zinc-400'
            }`}
          />
          <span>Status</span>
          {activeFilterStatus !== 'ALL' && (
            <span className="px-1.5 py-0.2 rounded-full bg-white/15 text-[10px] uppercase">
              {activeFilterStatus}
            </span>
          )}
          {isStatusVisible ? (
            <ChevronUp className="w-3.5 h-3.5 text-white/70" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-white/70" />
          )}
        </button>

        {/* Status Dropdown List */}
        {isStatusVisible && (
          <div className="absolute right-0 mt-11 w-48 rounded-2xl bg-zinc-950/95 backdrop-blur-xl border border-white/15 shadow-2xl p-1.5 flex flex-col gap-1 z-50 animate-in fade-in zoom-in-95 duration-150">
            {/* Total Badge */}
            <button
              onClick={() => {
                onSelectFilterStatus('ALL');
                setIsStatusVisible(false);
              }}
              className={`w-full px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                activeFilterStatus === 'ALL'
                  ? 'bg-white text-black'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>Semua Unit</span>
              <span className="font-mono">{total}</span>
            </button>

            {/* Tersedia */}
            <button
              onClick={() => {
                onSelectFilterStatus(activeFilterStatus === 'tersedia' ? 'ALL' : 'tersedia');
                setIsStatusVisible(false);
              }}
              className={`w-full px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                activeFilterStatus === 'tersedia'
                  ? 'bg-emerald-500 text-white shadow'
                  : 'text-emerald-300 hover:bg-emerald-500/20'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Tersedia</span>
              </span>
              <span className="font-mono">{countTersedia}</span>
            </button>

            {/* Booking */}
            <button
              onClick={() => {
                onSelectFilterStatus(activeFilterStatus === 'booking' ? 'ALL' : 'booking');
                setIsStatusVisible(false);
              }}
              className={`w-full px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                activeFilterStatus === 'booking'
                  ? 'bg-amber-400 text-black shadow'
                  : 'text-amber-300 hover:bg-amber-400/20'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Booking</span>
              </span>
              <span className="font-mono">{countBooking}</span>
            </button>

            {/* Bangun */}
            <button
              onClick={() => {
                onSelectFilterStatus(activeFilterStatus === 'bangun' ? 'ALL' : 'bangun');
                setIsStatusVisible(false);
              }}
              className={`w-full px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                activeFilterStatus === 'bangun'
                  ? 'bg-sky-500 text-white shadow'
                  : 'text-sky-300 hover:bg-sky-500/20'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span>Bangun</span>
              </span>
              <span className="font-mono">{countBangun}</span>
            </button>

            {/* Realisasi */}
            <button
              onClick={() => {
                onSelectFilterStatus(activeFilterStatus === 'realisasi' ? 'ALL' : 'realisasi');
                setIsStatusVisible(false);
              }}
              className={`w-full px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                activeFilterStatus === 'realisasi'
                  ? 'bg-zinc-400 text-black shadow'
                  : 'text-zinc-300 hover:bg-white/10'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-zinc-400" />
                <span>Realisasi</span>
              </span>
              <span className="font-mono">{countRealisasi}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
