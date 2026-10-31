import React, { useState } from 'react';
import {
  X,
  Check,
  UserPlus,
  Home,
  Clock,
  Hammer,
  FileText,
  FileImage,
  Upload,
  Eye,
  Trash2,
  Paperclip,
  Wrench,
  ChevronDown,
  ChevronUp,
  Banknote,
  Calculator,
  Grid3x3,
  Layers,
  ClipboardCheck,
} from 'lucide-react';
import {
  UnitData,
  UnitStatus,
  BerkasItem,
  ProgressStage,
  ServiceMutuItem,
  PersetujuanPembangunan,
  PersetujuanMutuItem,
} from '../types';
import { BUILD_STAGES, BERKAS_LIST } from '../data/initialUnits';
import { STATUS_COLORS } from './SiteplanCanvas';

interface UnitDetailModalProps {
  unit: UnitData | null;
  onClose: () => void;
  onUpdateUnit: (updatedUnit: UnitData) => void;
  onShowNotification: (msg: string) => void;
}

export const UnitDetailModal: React.FC<UnitDetailModalProps> = ({
  unit,
  onClose,
  onUpdateUnit,
  onShowNotification,
}) => {
  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    nama: '',
    nik: '',
    wa: '',
    email: '',
    pekerjaan: 'Karyawan Swasta Pabrik',
    instansi: 'PT Astra Otoparts Tbk',
    gaji: '5200000',
    statusNikah: 'Menikah (Wajib KTP Pasangan)',
    bank: 'Bank BTN (Kantor Cabang Cikarang)',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Accordion & sub-modal states
  const [isBerkasOpen, setIsBerkasOpen] = useState(false);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set(['persetujuan', 'persiapan']));

  // Service Mutu Sub-Modal State
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [serviceItems, setServiceItems] = useState<ServiceMutuItem[]>([]);

  // Persetujuan Sub-Modal State
  const [isPersetujuanModalOpen, setIsPersetujuanModalOpen] = useState(false);
  const [persetujuanData, setPersetujuanData] = useState<PersetujuanPembangunan>({
    mutuItems: [],
    approved: false,
    ttd: false,
    setuju: '',
    totalEstimasi: 0,
  });

  if (!unit) return null;

  const statusCfg = STATUS_COLORS[unit.status] || STATUS_COLORS.tersedia;

  // File picker simulation helper
  const triggerFilePicker = (accept: string, onFileSelected: (fileName: string) => void) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) onFileSelected(file.name);
    };
    input.click();
  };

  // Submit SPR Booking Form
  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!bookingForm.nama.trim()) errors.nama = 'Nama lengkap wajib diisi';
    if (!bookingForm.nik.trim()) errors.nik = 'NIK e-KTP wajib diisi';
    else if (bookingForm.nik.replace(/\D/g, '').length !== 16) errors.nik = 'NIK harus 16 digit';
    if (!bookingForm.wa.trim()) errors.wa = 'Nomor WhatsApp aktif wajib diisi';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      onShowNotification('Harap lengkapi semua field bertanda bintang (*)');
      return;
    }

    const todayStr = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const updated: UnitData = {
      ...unit,
      status: 'booking',
      konsumen: bookingForm.nama.trim(),
      tglBooking: todayStr,
      berkas: BERKAS_LIST.map((bName, idx) => ({
        name: bName,
        done: idx === 0, // KTP done
        fileName: idx === 0 ? `KTP_${bookingForm.nama.split(' ')[0]}.pdf` : undefined,
      })),
      updatedAt: new Date().toISOString(),
    };

    onUpdateUnit(updated);
    onShowNotification(`Unit ${unit.display} berhasil dibooking atas nama ${bookingForm.nama}!`);
  };

  // Advance from booking to pembangunan
  const handleAdvanceToBangun = () => {
    const persetujuanStage = BUILD_STAGES.find((s) => s.id === 'persetujuan') || BUILD_STAGES[0];
    const persiapanStage = BUILD_STAGES.find((s) => s.id === 'persiapan') || BUILD_STAGES[1];
    const updated: UnitData = {
      ...unit,
      status: 'bangun',
      progress: 15,
      buildProgress: {
        persetujuan: {
          done: true,
          photos: [{ name: 'Foto_Persetujuan_Konsumen.jpg' }],
          checklist: persetujuanStage.items.map((it) => ({ name: it, done: true })),
        },
        persiapan: {
          done: false,
          photos: [],
          checklist: persiapanStage.items.map((it, idx) => ({ name: it, done: idx === 0 })),
        },
      },
      updatedAt: new Date().toISOString(),
    };
    onUpdateUnit(updated);
    onShowNotification(`Unit ${unit.display} telah masuk tahap Pembangunan!`);
  };

  // Toggle stage checklist item
  const handleToggleChecklist = (stageId: string, itemName: string) => {
    const currentProgress = unit.buildProgress || {};
    const stage = currentProgress[stageId] || {
      done: false,
      photos: [],
      checklist: (BUILD_STAGES.find((s) => s.id === stageId)?.items || []).map((i) => ({
        name: i,
        done: false,
      })),
    };

    const newChecklist = stage.checklist.map((c) => (c.name === itemName ? { ...c, done: !c.done } : c));
    const isStageDone = newChecklist.every((c) => c.done);

    const updatedStages = {
      ...currentProgress,
      [stageId]: {
        ...stage,
        checklist: newChecklist,
        done: isStageDone,
      },
    };

    const doneCount = Object.values(updatedStages).filter((s) => s.done).length;
    const progressPct = Math.round((doneCount / BUILD_STAGES.length) * 100);

    const updated: UnitData = {
      ...unit,
      buildProgress: updatedStages,
      progress: progressPct,
      updatedAt: new Date().toISOString(),
    };
    onUpdateUnit(updated);
  };

  // Upload photo for construction stage
  const handleUploadStagePhoto = (stageId: string) => {
    triggerFilePicker('image/*', (fileName) => {
      const currentProgress = unit.buildProgress || {};
      const stage = currentProgress[stageId] || {
        done: false,
        photos: [],
        checklist: (BUILD_STAGES.find((s) => s.id === stageId)?.items || []).map((i) => ({
          name: i,
          done: false,
        })),
      };

      const updatedStages = {
        ...currentProgress,
        [stageId]: {
          ...stage,
          photos: [...stage.photos, { name: fileName }],
        },
      };

      const updated: UnitData = {
        ...unit,
        buildProgress: updatedStages,
        updatedAt: new Date().toISOString(),
      };
      onUpdateUnit(updated);
      onShowNotification(`Foto bukti ${fileName} diunggah`);
    });
  };

  // Upload / Remove Berkas
  const handleUploadBerkas = (berkasName: string) => {
    triggerFilePicker('.pdf,image/*', (fileName) => {
      const list = unit.berkas || [];
      const updatedList = list.map((b) => (b.name === berkasName ? { ...b, done: true, fileName } : b));
      onUpdateUnit({
        ...unit,
        berkas: updatedList,
        updatedAt: new Date().toISOString(),
      });
      onShowNotification(`Berkas ${berkasName} diupload: ${fileName}`);
    });
  };

  const handleRemoveBerkas = (berkasName: string) => {
    const list = unit.berkas || [];
    const updatedList = list.map((b) => (b.name === berkasName ? { ...b, done: false, fileName: undefined } : b));
    onUpdateUnit({
      ...unit,
      berkas: updatedList,
      updatedAt: new Date().toISOString(),
    });
    onShowNotification(`Berkas ${berkasName} dihapus`);
  };

  // Open Persetujuan Sub-Modal
  const openPersetujuanModal = () => {
    const current = unit.persetujuan;
    if (current) {
      setPersetujuanData(JSON.parse(JSON.stringify(current)));
    } else {
      setPersetujuanData({
        denahFileName: undefined,
        mutuItems: [
          {
            id: 'pondasi',
            label: 'Kedalaman Pondasi',
            checked: false,
            detail: { dari: '80cm', ke: '100cm' },
            biaya: 1500000,
            volume: '1',
            hargaSatuan: '1500000',
          },
          {
            id: 'dinding',
            label: 'Peninggian Dinding Kamar & Ruang Tamu',
            checked: false,
            detail: { dari: '3.0m', ke: '3.5m' },
            biaya: 2500000,
            volume: '1',
            hargaSatuan: '2500000',
          },
          {
            id: 'keramik',
            label: 'Upgrade Keramik Lantai',
            checked: false,
            detail: { dari: '40x40 Standar', ke: '60x60 Granit Tile', merk: 'Roman / Garuda' },
            biaya: 3500000,
            volume: '1',
            hargaSatuan: '3500000',
          },
          {
            id: 'cat',
            label: 'Upgrade Cat Dinding Luar & Dalam',
            checked: false,
            detail: { merk: 'Dulux Weathershield / Jotun', warna: 'Putih Gading Minimalis' },
            biaya: 1800000,
            volume: '1',
            hargaSatuan: '1800000',
          },
          {
            id: 'kusen',
            label: 'Ganti Kusen & Daun Pintu Utama',
            checked: false,
            detail: { dari: 'Aluminium Standar', ke: 'Kayu Jati Solid Finishing Melamic' },
            biaya: 4500000,
            volume: '1',
            hargaSatuan: '4500000',
          },
        ],
        approved: false,
        ttd: false,
        setuju: '',
        totalEstimasi: 0,
      });
    }
    setIsPersetujuanModalOpen(true);
  };

  // Open Service Mutu Sub-Modal
  const openServiceModal = () => {
    const current = unit.serviceMutu;
    if (current && current.length > 0) {
      setServiceItems(JSON.parse(JSON.stringify(current)));
    } else {
      setServiceItems([
        {
          id: 'pagarDepan',
          label: 'Pagar Depan',
          checked: false,
          fields: { tinggi: '1.5m', material: 'Besi Hollow Minimalis' },
          biaya: 3500000,
          status: 'Pending',
        },
        {
          id: 'pagarBelakang',
          label: 'Pagar Belakang / Dinding Keliling',
          checked: false,
          fields: { tinggi: '2m', material: 'Batako Plester Aci' },
          biaya: 4200000,
          status: 'Pending',
        },
        {
          id: 'dapur',
          label: 'Dapur & Meja Wastafel',
          checked: false,
          fields: { meja: 'Granit Tile 60x60', wastafel: 'Single Bowl Stainless', kitchenSet: 'Meja Cor + Pintu Bawah' },
          biaya: 4800000,
          status: 'Pending',
        },
        {
          id: 'kanopi',
          label: 'Kanopi Carport',
          checked: false,
          fields: { ukuran: 'Carport 3x4.5m', atap: 'Alderon / Spandek Pasir', rangka: 'Baja Ringan 0.75' },
          biaya: 3800000,
          status: 'Pending',
        },
        {
          id: 'lainnya',
          label: 'Pekerjaan Tambahan Lainnya',
          checked: false,
          fields: { deskripsi: '' },
          biaya: 0,
          status: 'Pending',
        },
      ]);
    }
    setIsServiceModalOpen(true);
  };

  // Save Service Mutu
  const handleSaveServiceMutu = () => {
    const total = serviceItems.reduce((acc, it) => acc + (it.checked ? it.biaya : 0), 0);
    const updated: UnitData = {
      ...unit,
      serviceMutu: serviceItems,
      updatedAt: new Date().toISOString(),
    };
    onUpdateUnit(updated);
    setIsServiceModalOpen(false);
    onShowNotification(`Service unit ${unit.display} disimpan. Total: Rp ${total.toLocaleString('id-ID')}`);
  };

  // Save Persetujuan Pembangunan
  const handleSavePersetujuan = () => {
    if (!persetujuanData.ttd) {
      alert('Harap centang Tanda Tangan Digital Konsumen untuk menyetujui');
      return;
    }

    const total = persetujuanData.mutuItems.reduce((acc, it) => {
      if (!it.checked) return acc;
      const vol = parseFloat(it.volume) || 1;
      const hrg = parseFloat(it.hargaSatuan) || it.biaya;
      return acc + vol * hrg;
    }, 0);

    const updatedPersetujuan: PersetujuanPembangunan = {
      ...persetujuanData,
      approved: persetujuanData.setuju === 'Ya',
      totalEstimasi: total,
    };

    // Also mark persetujuan stage as done in buildProgress
    const currentProgress = unit.buildProgress || {};
    const updatedStages = { ...currentProgress };
    if (updatedStages.persetujuan && updatedPersetujuan.approved) {
      updatedStages.persetujuan = {
        ...updatedStages.persetujuan,
        done: true,
        checklist: (updatedStages.persetujuan.checklist || []).map((c) => ({ ...c, done: true })),
      };
    }

    const updated: UnitData = {
      ...unit,
      persetujuan: updatedPersetujuan,
      buildProgress: updatedStages,
      updatedAt: new Date().toISOString(),
    };

    onUpdateUnit(updated);
    setIsPersetujuanModalOpen(false);
    onShowNotification(`Persetujuan pembangunan disimpan. Estimasi: Rp ${total.toLocaleString('id-ID')}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-[10px]" onClick={onClose} />

      {/* Main Container */}
      <div className="relative w-full max-w-[500px] max-h-[92vh] rounded-[28px] bg-[#121216] text-white shadow-[0_24px_80px_rgba(0,0,0,0.6)] border border-white/15 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-bold ${
                unit.status === 'tersedia'
                  ? 'bg-emerald-500 text-white'
                  : unit.status === 'booking'
                  ? 'bg-amber-400 text-black'
                  : unit.status === 'bangun'
                  ? 'bg-sky-500 text-white'
                  : 'bg-zinc-600 text-white'
              }`}
            >
              {unit.status === 'tersedia' ? (
                <UserPlus className="w-5 h-5" />
              ) : unit.status === 'booking' ? (
                <Clock className="w-5 h-5" />
              ) : unit.status === 'bangun' ? (
                <Hammer className="w-5 h-5" />
              ) : (
                <Home className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-[17px] font-extrabold text-white truncate">Unit {unit.display}</h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                    statusCfg.badgeBg
                  } ${unit.status === 'booking' ? 'text-black' : 'text-white'}`}
                >
                  {statusCfg.label}
                </span>
              </div>
              <p className="text-[11px] text-white/50 truncate">
                Blok {unit.block} • Tipe {unit.type} • LT {unit.luas}m² • {unit.hargaFull}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 transition shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 no-scrollbar">
          {/* TAB 1: TERSEDIA -> REGISTRATION FORM */}
          {unit.status === 'tersedia' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex items-center justify-between">
                <div>
                  <div className="text-[12px] font-bold text-emerald-300">Formulir Booking SPR Online</div>
                  <div className="text-[11px] text-emerald-100/70">Submisi instan tersinkronisasi ke seluruh perangkat</div>
                </div>
                <span className="text-[14px] font-extrabold text-emerald-300 font-mono">{unit.hargaFull}</span>
              </div>

              <form onSubmit={handleBookingSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[12px] font-semibold text-white/80 mb-1">
                    Nama Lengkap Pemohon (Sesuai KTP) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={bookingForm.nama}
                    onChange={(e) => setBookingForm({ ...bookingForm, nama: e.target.value })}
                    placeholder="Contoh: Muhammad Arif Rahman"
                    className={`w-full h-10 px-3.5 rounded-xl bg-white/5 border text-[13px] text-white outline-none focus:border-emerald-400 transition ${
                      formErrors.nama ? 'border-red-400 bg-red-500/10' : 'border-white/15'
                    }`}
                  />
                  {formErrors.nama && <p className="text-[10px] text-red-400 mt-0.5">{formErrors.nama}</p>}
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-white/80 mb-1">
                    NIK e-KTP (16 Digit) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={16}
                    value={bookingForm.nik}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, nik: e.target.value.replace(/\D/g, '').slice(0, 16) })
                    }
                    placeholder="3201xxxxxxxxxxxx"
                    className={`w-full h-10 px-3.5 rounded-xl bg-white/5 border text-[13px] text-white font-mono outline-none focus:border-emerald-400 transition ${
                      formErrors.nik ? 'border-red-400 bg-red-500/10' : 'border-white/15'
                    }`}
                  />
                  {formErrors.nik && <p className="text-[10px] text-red-400 mt-0.5">{formErrors.nik}</p>}
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-white/80 mb-1">
                    Nomor WhatsApp Aktif <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    value={bookingForm.wa}
                    onChange={(e) => setBookingForm({ ...bookingForm, wa: e.target.value })}
                    placeholder="0812xxxxxxxx"
                    className={`w-full h-10 px-3.5 rounded-xl bg-white/5 border text-[13px] text-white outline-none focus:border-emerald-400 transition ${
                      formErrors.wa ? 'border-red-400 bg-red-500/10' : 'border-white/15'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-white/70 mb-1">Pekerjaan</label>
                    <input
                      type="text"
                      value={bookingForm.pekerjaan}
                      onChange={(e) => setBookingForm({ ...bookingForm, pekerjaan: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl bg-white/5 border border-white/15 text-[12px] text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-white/70 mb-1">Gaji Bulanan</label>
                    <input
                      type="number"
                      value={bookingForm.gaji}
                      onChange={(e) => setBookingForm({ ...bookingForm, gaji: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl bg-white/5 border border-white/15 text-[12px] text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-white/70 mb-1">Status Pernikahan</label>
                  <select
                    value={bookingForm.statusNikah}
                    onChange={(e) => setBookingForm({ ...bookingForm, statusNikah: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl bg-[#202026] border border-white/15 text-[12px] text-white outline-none"
                  >
                    <option>Menikah (Wajib KTP Pasangan)</option>
                    <option>Belum Menikah</option>
                    <option>Cerai Hidup / Mati</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-white/70 mb-1">Bank Penyalur KPR</label>
                  <select
                    value={bookingForm.bank}
                    onChange={(e) => setBookingForm({ ...bookingForm, bank: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl bg-[#202026] border border-white/15 text-[12px] text-white outline-none"
                  >
                    <option>Bank BTN (Kantor Cabang Cikarang)</option>
                    <option>Bank BTN Syariah</option>
                    <option>Bank BNI</option>
                    <option>Bank BRI</option>
                  </select>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between">
                  <span className="text-[12px] text-white/70">Booking Fee Wajib:</span>
                  <span className="text-[14px] font-extrabold text-emerald-400 font-mono">Rp 1.500.000</span>
                </div>

                <button
                  type="submit"
                  className="w-full h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold flex items-center justify-center gap-2 shadow-lg transition"
                >
                  <Check className="w-4 h-4" /> Kunci & Booking Unit {unit.display}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: BOOKING -> STATUS & BERKAS */}
          {unit.status === 'booking' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-amber-400/10 border border-amber-400/20 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-white/50">Pemesan Terdaftar</span>
                    <h3 className="text-[15px] font-extrabold text-white">{unit.konsumen || 'Konsumen'}</h3>
                    <p className="text-[11px] text-amber-300 mt-0.5">Booking sejak: {unit.tglBooking || '-'}</p>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-amber-400/20 flex items-center justify-center text-amber-300">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Pantau Berkas Accordion */}
              <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                <button
                  onClick={() => setIsBerkasOpen(!isBerkasOpen)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/5 transition"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span className="text-[13px] font-bold text-white">Kelengkapan Berkas Konsumen</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-white/50">
                      {(unit.berkas || []).filter((b) => b.done).length} / {(unit.berkas || []).length || 10}
                    </span>
                    {isBerkasOpen ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
                  </div>
                </button>

                {isBerkasOpen && (
                  <div className="p-4 pt-1 space-y-2 border-t border-white/10">
                    {(unit.berkas || BERKAS_LIST.map((n): BerkasItem => ({ name: n, done: false }))).map((berkas) => (
                      <div
                        key={berkas.name}
                        className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border text-[12px] transition ${
                          berkas.done
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100'
                            : 'bg-white/[0.03] border-white/10 text-white/70'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                              berkas.done ? 'bg-emerald-500 text-black font-bold' : 'border border-white/30'
                            }`}
                          >
                            {berkas.done ? '✓' : ''}
                          </span>
                          <div className="truncate">
                            <span className="font-medium">{berkas.name}</span>
                            {berkas.fileName && (
                              <span className="block text-[10px] text-white/40 truncate">{berkas.fileName}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {!berkas.done ? (
                            <button
                              onClick={() => handleUploadBerkas(berkas.name)}
                              className="h-7 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] font-medium flex items-center gap-1 text-white"
                            >
                              <Paperclip className="w-3 h-3" /> Upload
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => onShowNotification(`Membuka dokumen ${berkas.fileName || berkas.name}`)}
                                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70"
                                title="Lihat"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleRemoveBerkas(berkas.name)}
                                className="w-7 h-7 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 flex items-center justify-center"
                                title="Hapus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action: Lanjutkan ke Pembangunan */}
              <button
                onClick={handleAdvanceToBangun}
                className="w-full h-11 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white text-[13px] font-bold flex items-center justify-center gap-2 shadow-lg transition"
              >
                <Hammer className="w-4 h-4" /> Lanjutkan ke Tahap Pembangunan
              </button>
            </div>
          )}

          {/* TAB 3: BANGUN -> STEPPER 8 TAHAP + FINISHING BARU */}
          {unit.status === 'bangun' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-sky-500/10 border border-sky-500/30 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-semibold text-white/70">Progress Pembangunan</span>
                  <span className="text-[14px] font-extrabold text-sky-400 font-mono">{unit.progress || 0}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full transition-all duration-300"
                    style={{ width: `${unit.progress || 0}%` }}
                  />
                </div>
              </div>

              {/* Stepper Stages */}
              <div className="space-y-2">
                {BUILD_STAGES.map((stage, idx) => {
                  const stageData = unit.buildProgress?.[stage.id];
                  const isDone = stageData?.done || false;
                  const isExpanded = expandedStages.has(stage.id);
                  const isFinishing = stage.id === 'finishing';
                  const isPersetujuan = stage.id === 'persetujuan';

                  return (
                    <div
                      key={stage.id}
                      className={`rounded-2xl border transition overflow-hidden ${
                        isFinishing
                          ? 'bg-amber-500/10 border-amber-500/30'
                          : isPersetujuan
                          ? 'bg-violet-500/10 border-violet-500/30'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <button
                        onClick={() =>
                          setExpandedStages((prev) => {
                            const next = new Set(prev);
                            if (next.has(stage.id)) next.delete(stage.id);
                            else next.add(stage.id);
                            return next;
                          })
                        }
                        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                              isDone ? 'bg-emerald-500 text-black' : 'bg-white/20 text-white'
                            }`}
                          >
                            {isDone ? '✓' : idx + 1}
                          </span>
                          <div>
                            <span className="text-[13px] font-bold text-white flex items-center gap-1.5">
                              {stage.label}
                              {isFinishing && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-400 text-black">
                                  BARU
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-white/50 block">
                              {(stageData?.checklist || []).filter((c) => c.done).length} / {stage.items.length} selesai
                            </span>
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-white/10">
                          {/* Checklist items */}
                          <div className="space-y-1.5">
                            {stage.items.map((itemName) => {
                              const checked = (stageData?.checklist || []).find((c) => c.name === itemName)?.done || false;
                              return (
                                <label
                                  key={itemName}
                                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 cursor-pointer text-[12px]"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => handleToggleChecklist(stage.id, itemName)}
                                    className="w-3.5 h-3.5 accent-emerald-500 rounded"
                                  />
                                  <span className={checked ? 'line-through text-white/40' : 'text-white/80'}>
                                    {itemName}
                                  </span>
                                </label>
                              );
                            })}
                          </div>

                          {/* Photos Section */}
                          <div className="bg-black/30 p-2.5 rounded-xl border border-white/10">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[11px] text-white/60">Foto Bukti Lapangan:</span>
                              <button
                                onClick={() => handleUploadStagePhoto(stage.id)}
                                className="h-6 px-2.5 rounded-md bg-white/15 hover:bg-white/25 text-[10px] font-semibold text-white flex items-center gap-1"
                              >
                                <Upload className="w-3 h-3" /> Tambah Foto
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {(stageData?.photos || []).map((ph, pIdx) => (
                                <span
                                  key={pIdx}
                                  className="px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-[10px] text-white/80 flex items-center gap-1"
                                >
                                  <FileImage className="w-3 h-3 text-sky-400" />
                                  {ph.name}
                                </span>
                              ))}
                              {(!stageData?.photos || stageData.photos.length === 0) && (
                                <span className="text-[10px] text-white/30 italic">Belum ada foto</span>
                              )}
                            </div>
                          </div>

                          {isPersetujuan && (
                            <button
                              type="button"
                              onClick={openPersetujuanModal}
                              className="w-full h-9 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow transition"
                            >
                              <ClipboardCheck className="w-3.5 h-3.5" /> Form Persetujuan Pembangunan & Mutu
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons for Bangun */}
              <button
                onClick={openPersetujuanModal}
                className="w-full h-11 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white text-[13px] font-bold flex items-center justify-center gap-2 shadow-lg transition"
              >
                <ClipboardCheck className="w-4 h-4" /> Buka Persetujuan Pembangunan & Mutu
              </button>

              <button
                onClick={() => {
                  onUpdateUnit({
                    ...unit,
                    status: 'realisasi',
                    progress: 100,
                    tglRealisasi: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
                    tglSerahTerima: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
                    updatedAt: new Date().toISOString(),
                  });
                  onShowNotification(`Unit ${unit.display} telah resmi Realisasi KPR & Serah Terima!`);
                }}
                className="w-full h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-[12px] font-semibold flex items-center justify-center gap-2 transition"
              >
                <Check className="w-4 h-4 text-emerald-400" /> Selesai Pembangunan & Realisasi KPR
              </button>
            </div>
          )}

          {/* TAB 4: REALISASI -> SERAH TERIMA & SERVICE MUTU */}
          {unit.status === 'realisasi' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-2">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-white/50">Pemilik Rumah:</span>
                  <span className="font-bold text-white">{unit.konsumen || '-'}</span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-white/50">Akad KPR Realisasi:</span>
                  <span className="font-medium text-white">{unit.tglRealisasi || '-'}</span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-white/50">Serah Terima Kunci:</span>
                  <span className="font-medium text-emerald-400">{unit.tglSerahTerima || '-'}</span>
                </div>
              </div>

              {/* Service & Penambahan Mutu Summary */}
              <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-orange-400" />
                    <span className="text-[13px] font-bold text-white">Service & Penambahan Mutu</span>
                  </div>
                  <span className="text-[11px] text-orange-300 font-mono">
                    {(unit.serviceMutu || []).filter((s) => s.checked).length} Item
                  </span>
                </div>
                <p className="text-[11px] text-white/60">
                  Pekerjaan pagar, dapur, kanopi, atau perbaikan pasca serah terima kunci.
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {(unit.serviceMutu || []).filter((s) => s.checked).map((s) => (
                    <span
                      key={s.id}
                      className="px-2.5 py-1 rounded-lg bg-orange-500/20 border border-orange-500/30 text-[10px] text-orange-200"
                    >
                      {s.label}: Rp {s.biaya.toLocaleString('id-ID')} ({s.status})
                    </span>
                  ))}
                  {(!unit.serviceMutu || (unit.serviceMutu || []).filter((s) => s.checked).length === 0) && (
                    <span className="text-[11px] text-white/30 italic">Belum ada service mutu aktif</span>
                  )}
                </div>

                <button
                  onClick={openServiceModal}
                  className="w-full h-10 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-[12px] font-bold flex items-center justify-center gap-2 shadow-lg transition"
                >
                  <Wrench className="w-3.5 h-3.5" /> Kelola Service & Penambahan Mutu
                </button>
              </div>

              <button
                onClick={openPersetujuanModal}
                className="w-full h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-[12px] font-medium flex items-center justify-center gap-2 transition"
              >
                <ClipboardCheck className="w-4 h-4" /> Lihat Dokumen Persetujuan Pembangunan
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SUB-MODAL 1: PERSETUJUAN PEMBANGUNAN & PENAMBAHAN MUTU */}
      {isPersetujuanModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsPersetujuanModalOpen(false)} />

          <div className="relative w-full max-w-[620px] max-h-[92vh] rounded-[26px] bg-[#141418] text-white border border-white/15 shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 pt-5 pb-4 border-b border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <ClipboardCheck className="w-5 h-5 text-violet-400" />
                <h3 className="text-[15px] font-bold text-white">
                  Persetujuan Pembangunan & Mutu Unit {unit.display}
                </h3>
              </div>
              <button
                onClick={() => setIsPersetujuanModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 no-scrollbar">
              {/* Section 1: Denah Custom */}
              <div className="space-y-2">
                <h4 className="text-[12px] font-bold text-violet-300 flex items-center gap-1.5">
                  <FileImage className="w-4 h-4" /> Section 1: Gambar Denah Custom
                </h4>
                <div
                  onClick={() => triggerFilePicker('image/*,.pdf', (f) => setPersetujuanData({ ...persetujuanData, denahFileName: f }))}
                  className="rounded-2xl border-2 border-dashed border-white/20 bg-white/5 p-4 text-center cursor-pointer hover:bg-white/10 transition"
                >
                  {persetujuanData.denahFileName ? (
                    <div>
                      <Check className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                      <div className="text-[12px] font-bold text-white">{persetujuanData.denahFileName}</div>
                      <div className="text-[10px] text-white/50">Klik untuk ganti gambar denah custom</div>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-6 h-6 text-white/40 mx-auto mb-1" />
                      <div className="text-[12px] font-semibold text-white">Upload Gambar Denah Custom</div>
                      <div className="text-[10px] text-white/50">Klik untuk pilih file JPG, PNG, atau PDF</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Penambahan Mutu Checklist */}
              <div className="space-y-2.5">
                <h4 className="text-[12px] font-bold text-amber-300 flex items-center gap-1.5">
                  <Hammer className="w-4 h-4" /> Section 2: Checklist Penambahan Mutu
                </h4>
                <div className="space-y-2">
                  {persetujuanData.mutuItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border text-[12px] ${
                        item.checked ? 'bg-amber-500/10 border-amber-500/30 text-white' : 'bg-white/5 border-white/10 text-white/70'
                      }`}
                    >
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={(e) =>
                              setPersetujuanData({
                                ...persetujuanData,
                                mutuItems: persetujuanData.mutuItems.map((it) =>
                                  it.id === item.id ? { ...it, checked: e.target.checked } : it
                                ),
                              })
                            }
                            className="w-3.5 h-3.5 accent-violet-600 rounded"
                          />
                          <span className="font-semibold text-white">{item.label}</span>
                        </div>
                        <span className="text-[11px] font-mono text-amber-400">
                          Rp {(parseFloat(item.hargaSatuan) * (parseFloat(item.volume) || 1) || item.biaya).toLocaleString('id-ID')}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: Total & Persetujuan TTD */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-white/70">Total Estimasi Penambahan Mutu:</span>
                  <span className="text-[15px] font-extrabold text-emerald-400 font-mono">
                    Rp{' '}
                    {persetujuanData.mutuItems
                      .reduce((acc, it) => (it.checked ? acc + (parseFloat(it.hargaSatuan) * (parseFloat(it.volume) || 1) || it.biaya) : acc), 0)
                      .toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-white/70">Disetujui Konsumen:</span>
                    <select
                      value={persetujuanData.setuju}
                      onChange={(e) =>
                        setPersetujuanData({
                          ...persetujuanData,
                          setuju: e.target.value as 'Ya' | 'Tidak',
                        })
                      }
                      className="h-8 px-2 rounded-lg bg-[#202026] border border-white/20 text-[11px] text-white"
                    >
                      <option value="">Pilih</option>
                      <option value="Ya">Ya, Disetujui</option>
                      <option value="Tidak">Tidak</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-[11px] font-semibold text-white">
                    <input
                      type="checkbox"
                      checked={persetujuanData.ttd}
                      onChange={(e) => setPersetujuanData({ ...persetujuanData, ttd: e.target.checked })}
                      className="w-3.5 h-3.5 accent-emerald-500 rounded"
                    />
                    TTD Digital Konsumen
                  </label>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex items-center justify-end gap-2 shrink-0">
              <button
                onClick={() => setIsPersetujuanModalOpen(false)}
                className="h-9 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-[12px] font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleSavePersetujuan}
                className="h-9 px-5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[12px] font-bold flex items-center gap-1.5 transition"
              >
                <Check className="w-4 h-4" /> Simpan Persetujuan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL 2: SERVICE & PENAMBAHAN MUTU (REALISASI) */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsServiceModalOpen(false)} />

          <div className="relative w-full max-w-[560px] max-h-[92vh] rounded-[26px] bg-[#141418] text-white border border-white/15 shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 pt-5 pb-4 border-b border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Wrench className="w-5 h-5 text-orange-400" />
                <h3 className="text-[15px] font-bold text-white">Service & Penambahan Mutu Unit {unit.display}</h3>
              </div>
              <button
                onClick={() => setIsServiceModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3.5 no-scrollbar">
              {serviceItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border transition ${
                    item.checked ? 'bg-orange-500/10 border-orange-500/30' : 'bg-white/5 border-white/10'
                  }`}
                >
                  <label className="flex items-center justify-between cursor-pointer mb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={(e) =>
                          setServiceItems((prev) =>
                            prev.map((it) => (it.id === item.id ? { ...it, checked: e.target.checked } : it))
                          )
                        }
                        className="w-4 h-4 accent-orange-500 rounded"
                      />
                      <span className="text-[13px] font-bold text-white">{item.label}</span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        item.status === 'Selesai'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                      }`}
                    >
                      {item.status}
                    </span>
                  </label>

                  {item.checked && (
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <label className="block text-white/50 mb-0.5">Biaya Rp</label>
                          <input
                            type="number"
                            value={item.biaya || ''}
                            onChange={(e) =>
                              setServiceItems((prev) =>
                                prev.map((it) =>
                                  it.id === item.id ? { ...it, biaya: parseInt(e.target.value) || 0 } : it
                                )
                              )
                            }
                            className="w-full h-8 px-2.5 rounded-lg bg-black/40 border border-white/20 text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-white/50 mb-0.5">Status Pekerjaan</label>
                          <select
                            value={item.status}
                            onChange={(e) =>
                              setServiceItems((prev) =>
                                prev.map((it) =>
                                  it.id === item.id ? { ...it, status: e.target.value as 'Pending' | 'Selesai' } : it
                                )
                              )
                            }
                            className="w-full h-8 px-2 rounded-lg bg-[#202026] border border-white/20 text-white"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Selesai">Selesai</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex items-center justify-between shrink-0">
              <span className="text-[12px] text-white/60">
                Total: Rp{' '}
                {serviceItems.reduce((acc, it) => acc + (it.checked ? it.biaya : 0), 0).toLocaleString('id-ID')}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsServiceModalOpen(false)}
                  className="h-9 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-[12px] font-medium"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveServiceMutu}
                  className="h-9 px-5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-[12px] font-bold flex items-center gap-1.5 transition"
                >
                  <Check className="w-4 h-4" /> Simpan Service
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
