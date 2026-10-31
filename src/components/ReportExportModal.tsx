import React, { useState, useMemo } from 'react';
import {
  X,
  FileDown,
  FileText,
  Building2,
  CheckCircle2,
  TrendingUp,
  Banknote,
  Filter,
  Layers,
  ClipboardList,
  Download,
} from 'lucide-react';
import { UnitData } from '../types';
import {
  aggregateUnitsData,
  exportUnitsReportToPdf,
  formatRupiah,
  formatStatusLabel,
} from '../services/pdfReportExporter';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  units: UnitData[];
  initialFilterStatus?: string;
  onShowNotification: (msg: string) => void;
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({
  isOpen,
  onClose,
  units,
  initialFilterStatus = 'ALL',
  onShowNotification,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>(initialFilterStatus || 'ALL');
  const [filterBlock, setFilterBlock] = useState<string>('ALL');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [preparedBy, setPreparedBy] = useState<string>('Tim Manajemen & Pemasaran GIS');
  const [notes, setNotes] = useState<string>('');

  // Sections to include
  const [includeExecutiveSummary, setIncludeExecutiveSummary] = useState<boolean>(true);
  const [includeBlockSummary, setIncludeBlockSummary] = useState<boolean>(true);
  const [includeUnitTable, setIncludeUnitTable] = useState<boolean>(true);
  const [includeDetailedAppendix, setIncludeDetailedAppendix] = useState<boolean>(true);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Extract unique blocks for filter dropdown
  const availableBlocks = useMemo(() => {
    const set = new Set<string>();
    units.forEach((u) => {
      if (u.block) set.add(u.block);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [units]);

  // Filtered units & live aggregation preview
  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      if (filterStatus !== 'ALL' && u.status !== filterStatus) return false;
      if (filterBlock !== 'ALL' && u.block !== filterBlock) return false;
      return true;
    });
  }, [units, filterStatus, filterBlock]);

  const report = useMemo(() => aggregateUnitsData(filteredUnits), [filteredUnits]);

  if (!isOpen) return null;

  const handleExportPdf = () => {
    setIsGenerating(true);
    try {
      const fileName = exportUnitsReportToPdf(units, {
        preparedBy: preparedBy.trim() || 'Tim Manajemen & Pemasaran GIS',
        notes,
        filterStatus,
        filterBlock,
        orientation,
        includeExecutiveSummary,
        includeBlockSummary,
        includeUnitTable,
        includeDetailedAppendix,
      });
      onShowNotification(`Laporan PDF berhasil diunduh: ${fileName}`);
    } catch (error) {
      console.error('Error generating PDF report:', error);
      onShowNotification('Gagal membuat file PDF laporan');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-5 select-none">
      <div className="w-full max-w-5xl max-h-[92vh] bg-zinc-950 border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 bg-zinc-900/90 border-b border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold tracking-tight flex items-center gap-2">
                <span>REKAPITULASI DATA & EXPORT LAPORAN PDF</span>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  OFFLINE REPORT
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                Agregasi real-time seluruh unit, finansial, progres konstruksi 8-tahap, berkas KPR &
                service mutu
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Top KPI Aggregation Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Total & Occupancy */}
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/10">
              <div className="flex items-center justify-between text-zinc-400 text-[11px] font-semibold mb-1">
                <span>TOTAL UNIT TERDATA</span>
                <Building2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-extrabold font-mono text-white">
                {report.totalUnits} <span className="text-xs font-normal text-zinc-400">Kavling</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2 text-[11px]">
                <span className="text-emerald-400 font-semibold">
                  Serapan: {report.occupancyRate}%
                </span>
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-400">
                  Luas: {report.totalLuasAll.toLocaleString('id-ID')} m²
                </span>
              </div>
            </div>

            {/* Nilai Proyek & Penjualan */}
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/10">
              <div className="flex items-center justify-between text-zinc-400 text-[11px] font-semibold mb-1">
                <span>ESTIMASI NILAI PROYEK</span>
                <Banknote className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-base sm:text-lg font-extrabold font-mono text-amber-300 truncate">
                {formatRupiah(report.totalNilaiProyek)}
              </div>
              <div className="mt-1.5 text-[11px] text-zinc-400 truncate">
                Terpesan/Terjual:{' '}
                <span className="text-white font-semibold">
                  {formatRupiah(report.totalNilaiTerjual)}
                </span>
              </div>
            </div>

            {/* Rata Progres & Pemberkasan */}
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/10">
              <div className="flex items-center justify-between text-zinc-400 text-[11px] font-semibold mb-1">
                <span>PROGRES & BERKAS KPR</span>
                <TrendingUp className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-xl font-extrabold font-mono text-sky-300">
                {report.avgBuildProgressActive}%{' '}
                <span className="text-xs font-normal text-zinc-400">Fisik Aktif</span>
              </div>
              <div className="mt-1.5 text-[11px] text-zinc-400">
                Rata Kelengkapan Berkas:{' '}
                <span className="text-white font-semibold">{report.avgBerkasCompletion}%</span>
              </div>
            </div>

            {/* Tambah Mutu & Service */}
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/10">
              <div className="flex items-center justify-between text-zinc-400 text-[11px] font-semibold mb-1">
                <span>TAMBAH MUTU & SERVICE</span>
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-base sm:text-lg font-extrabold font-mono text-purple-300 truncate">
                {formatRupiah(
                  report.totalEstimasiPersetujuanMutu + report.totalBiayaServiceMutu
                )}
              </div>
              <div className="mt-1.5 text-[11px] text-zinc-400 truncate">
                Mutu: {formatRupiah(report.totalEstimasiPersetujuanMutu)} • Svc:{' '}
                {formatRupiah(report.totalBiayaServiceMutu)}
              </div>
            </div>
          </div>

          {/* Status Distribution Bar */}
          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4 flex-wrap text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-zinc-300">Tersedia:</span>
                <span className="font-mono font-bold text-white">
                  {report.statusCounts.tersedia}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="text-zinc-300">Booking:</span>
                <span className="font-mono font-bold text-white">
                  {report.statusCounts.booking}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                <span className="text-zinc-300">Proses Bangun:</span>
                <span className="font-mono font-bold text-white">
                  {report.statusCounts.bangun}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
                <span className="text-zinc-300">Realisasi:</span>
                <span className="font-mono font-bold text-white">
                  {report.statusCounts.realisasi}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-zinc-400 font-mono">
              Waktu Rekap: {report.generatedAt}
            </div>
          </div>

          {/* Configuration & Filter Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left 5 Cols: PDF Options & Filters */}
            <div className="lg:col-span-5 p-4 rounded-xl bg-zinc-900/70 border border-white/10 space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <Filter className="w-3.5 h-3.5" />
                <span>Pengaturan & Filter Laporan PDF</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Filter Status Unit</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg bg-zinc-950 border border-white/15 text-xs text-white outline-none focus:border-emerald-400"
                  >
                    <option value="ALL">Semua Status ({units.length})</option>
                    <option value="tersedia">Tersedia</option>
                    <option value="booking">Booking</option>
                    <option value="bangun">Proses Bangun</option>
                    <option value="realisasi">Realisasi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Filter Blok</label>
                  <select
                    value={filterBlock}
                    onChange={(e) => setFilterBlock(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg bg-zinc-950 border border-white/15 text-xs text-white outline-none focus:border-emerald-400"
                  >
                    <option value="ALL">Semua Blok</option>
                    {availableBlocks.map((blk) => (
                      <option key={blk} value={blk}>
                        Blok {blk}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Orientasi Kertas A4</label>
                  <select
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value as 'landscape' | 'portrait')}
                    className="w-full h-9 px-2.5 rounded-lg bg-zinc-950 border border-white/15 text-xs text-white outline-none focus:border-emerald-400"
                  >
                    <option value="landscape">Landscape (Mendatar - Disarankan)</option>
                    <option value="portrait">Portrait (Tegak)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Disusun Oleh</label>
                  <input
                    type="text"
                    value={preparedBy}
                    onChange={(e) => setPreparedBy(e.target.value)}
                    placeholder="Nama petugas / divisi..."
                    className="w-full h-9 px-2.5 rounded-lg bg-zinc-950 border border-white/15 text-xs text-white outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  Catatan Tambahan di Header PDF (Opsional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Laporan mingguan rapat evaluasi progres lapangan..."
                  className="w-full h-9 px-2.5 rounded-lg bg-zinc-950 border border-white/15 text-xs text-white outline-none focus:border-emerald-400"
                />
              </div>

              <div className="pt-1 border-t border-white/10 space-y-2">
                <div className="text-[11px] font-semibold text-zinc-300">
                  Bagian yang Disertakan dalam PDF:
                </div>

                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeExecutiveSummary}
                    onChange={(e) => setIncludeExecutiveSummary(e.target.checked)}
                    className="rounded accent-emerald-500"
                  />
                  <span>1. Ringkasan Eksekutif & Nilai Finansial Proyek</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeBlockSummary}
                    onChange={(e) => setIncludeBlockSummary(e.target.checked)}
                    className="rounded accent-emerald-500"
                  />
                  <span>2. Tabel Rekapitulasi Per Blok Kavling</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeUnitTable}
                    onChange={(e) => setIncludeUnitTable(e.target.checked)}
                    className="rounded accent-emerald-500"
                  />
                  <span>3. Tabel Master Seluruh Unit, Konsumen & Tanggal</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeDetailedAppendix}
                    onChange={(e) => setIncludeDetailedAppendix(e.target.checked)}
                    className="rounded accent-emerald-500"
                  />
                  <span>4. Lampiran 8-Tahap Konstruksi, Berkas & Service Mutu</span>
                </label>
              </div>
            </div>

            {/* Right 7 Cols: Block Aggregation Preview Table */}
            <div className="lg:col-span-7 p-4 rounded-xl bg-zinc-900/70 border border-white/10 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Pratinjau Agregasi Per Blok</span>
                </div>
                <span className="text-[11px] text-zinc-400">
                  {report.blockStats.length} Blok Terdata
                </span>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/15 text-[11px] text-zinc-400">
                      <th className="py-2 px-2">Blok</th>
                      <th className="py-2 px-2 text-center">Total</th>
                      <th className="py-2 px-2 text-center text-emerald-400">Tersedia</th>
                      <th className="py-2 px-2 text-center text-amber-400">Booking</th>
                      <th className="py-2 px-2 text-center text-sky-400">Bangun</th>
                      <th className="py-2 px-2 text-center text-zinc-300">Realisasi</th>
                      <th className="py-2 px-2 text-center">Progres</th>
                      <th className="py-2 px-2 text-right">Nilai Unit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                    {report.blockStats.map((b) => (
                      <tr key={b.block} className="hover:bg-white/5">
                        <td className="py-2 px-2 font-sans font-bold text-white">
                          Blok {b.block}
                        </td>
                        <td className="py-2 px-2 text-center text-zinc-300">{b.totalUnits}</td>
                        <td className="py-2 px-2 text-center text-emerald-400 font-bold">
                          {b.tersedia}
                        </td>
                        <td className="py-2 px-2 text-center text-amber-400 font-bold">
                          {b.booking}
                        </td>
                        <td className="py-2 px-2 text-center text-sky-400 font-bold">{b.bangun}</td>
                        <td className="py-2 px-2 text-center text-zinc-300 font-bold">
                          {b.realisasi}
                        </td>
                        <td className="py-2 px-2 text-center text-zinc-300">{b.avgProgress}%</td>
                        <td className="py-2 px-2 text-right text-white font-semibold">
                          {formatRupiah(b.totalNilaiUnit)}
                        </td>
                      </tr>
                    ))}
                    {report.blockStats.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-zinc-500 font-sans">
                          Tidak ada unit yang sesuai dengan filter saat ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mini Preview of Filtered Units */}
              <div className="mt-4 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-300">
                    <ClipboardList className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Pratinjau Daftar Unit ({report.sortedUnits.length} Unit)</span>
                  </div>
                  <span className="text-[10px] text-zinc-500">
                    Seluruh baris akan dicetak lengkap di dalam file PDF
                  </span>
                </div>
                <div className="max-h-36 overflow-y-auto rounded-lg border border-white/10 bg-zinc-950/80 divide-y divide-white/5 text-[11px]">
                  {report.sortedUnits.slice(0, 25).map((u) => {
                    const berkasDone = u.berkas ? u.berkas.filter((b) => b.done).length : 0;
                    const berkasTotal = u.berkas?.length || 10;
                    return (
                      <div
                        key={u.id}
                        className="px-3 py-1.5 flex items-center justify-between gap-2 hover:bg-white/5"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono font-bold text-white w-10 shrink-0">
                            {u.display}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                              u.status === 'tersedia'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : u.status === 'booking'
                                ? 'bg-amber-500/20 text-amber-300'
                                : u.status === 'bangun'
                                ? 'bg-sky-500/20 text-sky-300'
                                : 'bg-zinc-500/30 text-zinc-300'
                            }`}
                          >
                            {formatStatusLabel(u.status)}
                          </span>
                          <span className="text-zinc-300 truncate">
                            {u.konsumen && u.konsumen !== '-' ? u.konsumen : 'Belum ada konsumen'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 font-mono text-[10px] text-zinc-400 shrink-0">
                          <span>Tipe {u.type}</span>
                          <span>Berkas: {u.status === 'tersedia' ? '-' : `${berkasDone}/${berkasTotal}`}</span>
                          <span>Fisik: {u.progress || 0}%</span>
                          <span className="text-white font-semibold">{u.harga}</span>
                        </div>
                      </div>
                    );
                  })}
                  {report.sortedUnits.length > 25 && (
                    <div className="px-3 py-1.5 text-center text-[10px] text-zinc-400 bg-zinc-900/50">
                      + {report.sortedUnits.length - 25} unit lainnya disertakan lengkap dalam PDF
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-3.5 bg-zinc-900/90 border-t border-white/10 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              File PDF akan diunduh langsung ke perangkat lokal Anda untuk pelaporan offline.
            </span>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              onClick={onClose}
              className="h-9 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 transition"
            >
              Batal
            </button>
            <button
              onClick={handleExportPdf}
              disabled={isGenerating || report.totalUnits === 0}
              className="h-9 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>
                {isGenerating
                  ? 'Menyiapkan PDF...'
                  : `Unduh Laporan PDF (${report.totalUnits} Unit)`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
