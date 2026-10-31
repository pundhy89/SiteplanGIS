import { UnitData, UnitStatus, ProgressStage, PersetujuanPembangunan, ServiceMutuItem } from '../types';

export const BUILD_STAGES = [
  { id: 'persetujuan', label: 'Persetujuan Pembangunan', items: ['Review denah custom konsumen', 'Checklist penambahan mutu', 'Verifikasi estimasi biaya', 'TTD digital persetujuan'] },
  { id: 'persiapan', label: 'Persiapan Lahan', items: ['Pembersihan lahan', 'Pengukuran & Bowplank', 'Pematangan tanah'] },
  { id: 'pondasi', label: 'Pondasi', items: ['Galian pondasi batu kali', 'Pasangan batu kali', 'Sloof beton bertulang'] },
  { id: 'dinding', label: 'Dinding / Struktur', items: ['Pasangan bata merah / hebel', 'Kolom praktis & balok', 'Ring balk keliling'] },
  { id: 'atap', label: 'Rangka & Penutup Atap', items: ['Rangka baja ringan', 'Penutup genteng / spandek', 'Talang air & lisplang'] },
  { id: 'plumbing', label: 'Plumbing & Kelistrikan', items: ['Instalasi pipa air bersih & kotor', 'Instalasi kabel & saklar/stopkontak', 'Septic tank biofilter & sumur bor'] },
  { id: 'finishing', label: 'Finishing & Cat', items: ['Plester aci dinding', 'Plafon gypsum / GRC', 'Pemasangan keramik lantai & dinding', 'Kusen pintu & jendela', 'Pengecatan dasar & finishing'] },
  { id: 'serah', label: 'Serah Terima Kunci', items: ['General cleaning akhir', 'Quality check bersama konsumen', 'Berita Acara Serah Terima (BAST)', 'Penyerahan kunci rumah'] },
];

export const BERKAS_LIST = [
  'KTP Pemohon & Pasangan',
  'Kartu Keluarga (KK)',
  'Buku Nikah / Akta Cerai',
  'NPWP Pribadi',
  'Slip Gaji 3 Bulan Terakhir',
  'Rekening Koran 3 Bulan',
  'Surat Keterangan Kerja Aktif',
  'Surat Pernyataan Belum Memiliki Rumah',
  'Surat Penegasan Persetujuan Kredit (SP3K)',
  'Kwitansi Tanda Jadi / Booking Fee',
];

export const DEFAULT_CONSUMERS = [
  'Ahmad Syaifullah',
  'Siti Rahmawati',
  'Budi Pratama',
  'Dewi Lestari',
  'Rizki Ananda',
  'Lina Marlina',
  'Joko Wahyudi',
  'Nurul Hidayah',
  'Eko Saputra',
  'Fitri Anggraini',
  'Hendro Kusumo',
  'Rini Wulandari',
];

export const TYPE_OPTIONS = ['36/72', '36/84', '45/90', '54/108', '60/120'];

// Seed base coordinates for all 69 units mapped directly onto the unit badges on the Griya Indah Secawan siteplan drawing
export const BASELINE_UNITS: Array<{ id: string; display: string; block: string; x: number; y: number; defaultStatus?: UnitStatus }> = [
  // Blok A (01 - 13)
  { id: 'A01', display: 'A.01', block: 'A', x: 33.3, y: 17.6, defaultStatus: 'tersedia' },
  { id: 'A02', display: 'A.02', block: 'A', x: 38.5, y: 18.8, defaultStatus: 'booking' },
  { id: 'A03', display: 'A.03', block: 'A', x: 43.5, y: 20.0, defaultStatus: 'tersedia' },
  { id: 'A04', display: 'A.04', block: 'A', x: 48.5, y: 21.1, defaultStatus: 'bangun' },
  { id: 'A05', display: 'A.05', block: 'A', x: 53.3, y: 22.1, defaultStatus: 'tersedia' },
  { id: 'A06', display: 'A.06', block: 'A', x: 58.3, y: 23.2, defaultStatus: 'booking' },
  { id: 'A07', display: 'A.07', block: 'A', x: 63.3, y: 24.4, defaultStatus: 'realisasi' },
  { id: 'A08', display: 'A.08', block: 'A', x: 68.2, y: 25.5, defaultStatus: 'tersedia' },
  { id: 'A09', display: 'A.09', block: 'A', x: 73.2, y: 26.6, defaultStatus: 'bangun' },
  { id: 'A10', display: 'A.10', block: 'A', x: 78.1, y: 27.7, defaultStatus: 'tersedia' },
  { id: 'A11', display: 'A.11', block: 'A', x: 83.0, y: 28.8, defaultStatus: 'booking' },
  { id: 'A12', display: 'A.12', block: 'A', x: 87.8, y: 29.8, defaultStatus: 'tersedia' },
  { id: 'A13', display: 'A.13', block: 'A', x: 92.5, y: 30.8, defaultStatus: 'tersedia' },

  // Blok B (01 - 21)
  { id: 'B01', display: 'B.01', block: 'B', x: 27.2, y: 33.4, defaultStatus: 'tersedia' },
  { id: 'B02', display: 'B.02', block: 'B', x: 29.1, y: 30.6, defaultStatus: 'booking' },
  { id: 'B03', display: 'B.03', block: 'B', x: 31.1, y: 27.8, defaultStatus: 'realisasi' },
  { id: 'B04', display: 'B.04', block: 'B', x: 38.2, y: 29.3, defaultStatus: 'tersedia' },
  { id: 'B05', display: 'B.05', block: 'B', x: 43.4, y: 30.5, defaultStatus: 'bangun' },
  { id: 'B06', display: 'B.06', block: 'B', x: 48.5, y: 31.6, defaultStatus: 'tersedia' },
  { id: 'B07', display: 'B.07', block: 'B', x: 53.8, y: 32.8, defaultStatus: 'booking' },
  { id: 'B08', display: 'B.08', block: 'B', x: 59.3, y: 34.1, defaultStatus: 'tersedia' },
  { id: 'B09', display: 'B.09', block: 'B', x: 64.9, y: 35.3, defaultStatus: 'bangun' },
  { id: 'B10', display: 'B.10', block: 'B', x: 70.6, y: 36.6, defaultStatus: 'tersedia' },
  { id: 'B11', display: 'B.11', block: 'B', x: 76.0, y: 37.8, defaultStatus: 'booking' },
  { id: 'B12', display: 'B.12', block: 'B', x: 81.4, y: 39.0, defaultStatus: 'realisasi' },
  { id: 'B13', display: 'B.13', block: 'B', x: 79.3, y: 42.8, defaultStatus: 'booking' },
  { id: 'B14', display: 'B.14', block: 'B', x: 73.7, y: 41.6, defaultStatus: 'tersedia' },
  { id: 'B15', display: 'B.15', block: 'B', x: 68.2, y: 40.4, defaultStatus: 'realisasi' },
  { id: 'B16', display: 'B.16', block: 'B', x: 62.6, y: 39.2, defaultStatus: 'bangun' },
  { id: 'B17', display: 'B.17', block: 'B', x: 57.1, y: 37.9, defaultStatus: 'tersedia' },
  { id: 'B18', display: 'B.18', block: 'B', x: 51.7, y: 36.7, defaultStatus: 'booking' },
  { id: 'B19', display: 'B.19', block: 'B', x: 46.3, y: 35.5, defaultStatus: 'tersedia' },
  { id: 'B20', display: 'B.20', block: 'B', x: 41.0, y: 34.4, defaultStatus: 'bangun' },
  { id: 'B21', display: 'B.21', block: 'B', x: 35.6, y: 33.4, defaultStatus: 'tersedia' },

  // Blok C (01 - 20)
  { id: 'C01', display: 'C.01', block: 'C', x: 27.2, y: 42.6, defaultStatus: 'tersedia' },
  { id: 'C02', display: 'C.02', block: 'C', x: 32.5, y: 43.8, defaultStatus: 'booking' },
  { id: 'C03', display: 'C.03', block: 'C', x: 37.8, y: 45.0, defaultStatus: 'bangun' },
  { id: 'C04', display: 'C.04', block: 'C', x: 43.1, y: 46.2, defaultStatus: 'tersedia' },
  { id: 'C05', display: 'C.05', block: 'C', x: 48.6, y: 47.4, defaultStatus: 'realisasi' },
  { id: 'C06', display: 'C.06', block: 'C', x: 54.1, y: 48.6, defaultStatus: 'tersedia' },
  { id: 'C07', display: 'C.07', block: 'C', x: 59.7, y: 49.7, defaultStatus: 'booking' },
  { id: 'C08', display: 'C.08', block: 'C', x: 65.2, y: 50.9, defaultStatus: 'bangun' },
  { id: 'C09', display: 'C.09', block: 'C', x: 70.8, y: 52.0, defaultStatus: 'tersedia' },
  { id: 'C10', display: 'C.10', block: 'C', x: 76.2, y: 53.2, defaultStatus: 'tersedia' },
  { id: 'C11', display: 'C.11', block: 'C', x: 73.5, y: 57.3, defaultStatus: 'realisasi' },
  { id: 'C12', display: 'C.12', block: 'C', x: 68.1, y: 56.1, defaultStatus: 'bangun' },
  { id: 'C13', display: 'C.13', block: 'C', x: 62.7, y: 54.9, defaultStatus: 'tersedia' },
  { id: 'C14', display: 'C.14', block: 'C', x: 57.5, y: 53.7, defaultStatus: 'booking' },
  { id: 'C15', display: 'C.15', block: 'C', x: 51.9, y: 52.5, defaultStatus: 'tersedia' },
  { id: 'C16', display: 'C.16', block: 'C', x: 46.5, y: 51.4, defaultStatus: 'realisasi' },
  { id: 'C17', display: 'C.17', block: 'C', x: 41.1, y: 50.2, defaultStatus: 'tersedia' },
  { id: 'C18', display: 'C.18', block: 'C', x: 35.6, y: 49.0, defaultStatus: 'bangun' },
  { id: 'C19', display: 'C.19', block: 'C', x: 30.2, y: 47.9, defaultStatus: 'booking' },
  { id: 'C20', display: 'C.20', block: 'C', x: 24.8, y: 46.7, defaultStatus: 'tersedia' },

  // Blok D (01 - 15)
  { id: 'D01', display: 'D.01', block: 'D', x: 22.3, y: 56.3, defaultStatus: 'tersedia' },
  { id: 'D02', display: 'D.02', block: 'D', x: 27.6, y: 57.5, defaultStatus: 'booking' },
  { id: 'D03', display: 'D.03', block: 'D', x: 32.9, y: 58.6, defaultStatus: 'bangun' },
  { id: 'D04', display: 'D.04', block: 'D', x: 38.2, y: 59.8, defaultStatus: 'tersedia' },
  { id: 'D05', display: 'D.05', block: 'D', x: 43.8, y: 61.0, defaultStatus: 'realisasi' },
  { id: 'D06', display: 'D.06', block: 'D', x: 49.6, y: 62.3, defaultStatus: 'tersedia' },
  { id: 'D07', display: 'D.07', block: 'D', x: 55.6, y: 63.6, defaultStatus: 'booking' },
  { id: 'D08', display: 'D.08', block: 'D', x: 61.5, y: 64.9, defaultStatus: 'bangun' },
  { id: 'D09', display: 'D.09', block: 'D', x: 67.3, y: 66.2, defaultStatus: 'tersedia' },
  { id: 'D10', display: 'D.10', block: 'D', x: 73.0, y: 67.4, defaultStatus: 'tersedia' },
  { id: 'D11', display: 'D.11', block: 'D', x: 41.6, y: 65.5, defaultStatus: 'tersedia' },
  { id: 'D12', display: 'D.12', block: 'D', x: 36.0, y: 64.2, defaultStatus: 'realisasi' },
  { id: 'D13', display: 'D.13', block: 'D', x: 30.5, y: 63.0, defaultStatus: 'bangun' },
  { id: 'D14', display: 'D.14', block: 'D', x: 25.0, y: 61.8, defaultStatus: 'booking' },
  { id: 'D15', display: 'D.15', block: 'D', x: 19.6, y: 60.5, defaultStatus: 'tersedia' },
];

export function generateDefaultBuildProgress(completedStagesCount: number): Record<string, ProgressStage> {
  const result: Record<string, ProgressStage> = {};
  BUILD_STAGES.forEach((stage, idx) => {
    const isDone = idx < completedStagesCount;
    result[stage.id] = {
      done: isDone,
      photos: isDone ? [{ name: `Bukti_${stage.id}.jpg` }] : [],
      checklist: stage.items.map((item, itemIdx) => ({
        name: item,
        done: isDone || (idx === completedStagesCount && itemIdx === 0),
      })),
    };
  });
  return result;
}

export function generateDefaultServiceMutu(): ServiceMutuItem[] {
  return [
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
  ];
}

export function generateDefaultPersetujuan(_display: string): PersetujuanPembangunan {
  return {
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
  };
}

export function createInitialUnitData(base: { id: string; display: string; block: string; x: number; y: number; defaultStatus?: UnitStatus }, idx: number): UnitData {
  const status: UnitStatus = base.defaultStatus || 'tersedia';
  const luas = 72 + (idx % 5) * 6;
  const tipe = idx % 4 === 0 ? '36/72' : idx % 4 === 1 ? '36/84' : idx % 4 === 2 ? '45/90' : '54/108';
  const hargaJt = 185 + (idx % 6) * 15;
  const harga = `Rp ${hargaJt} Jt`;
  const hargaFull = `Rp ${hargaJt}.000.000`;

  const unit: UnitData = {
    id: base.id,
    display: base.display,
    block: base.block,
    x: base.x,
    y: base.y,
    status,
    type: tipe,
    luas,
    harga,
    hargaFull,
    updatedAt: new Date().toISOString(),
  };

  if (status === 'booking' || status === 'bangun' || status === 'realisasi') {
    unit.konsumen = DEFAULT_CONSUMERS[idx % DEFAULT_CONSUMERS.length];
    const d = new Date();
    d.setDate(d.getDate() - (idx * 3 + 2));
    unit.tglBooking = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    unit.berkas = BERKAS_LIST.map((name, i) => {
      const item: { name: string; done: boolean; fileName?: string } = {
        name,
        done: i < 4 + (idx % 6),
      };
      if (i < 4) {
        item.fileName = `${name.split(' ')[0]}_${base.id}.pdf`;
      }
      return item;
    });
  }

  if (status === 'bangun') {
    const completedStages = 2 + (idx % 4);
    unit.buildProgress = generateDefaultBuildProgress(completedStages);
    unit.progress = Math.round((completedStages / BUILD_STAGES.length) * 100);
    unit.persetujuan = generateDefaultPersetujuan(base.display);
  }

  if (status === 'realisasi') {
    const d = new Date();
    d.setMonth(d.getMonth() - (idx % 4 + 1));
    const st = new Date(d);
    st.setDate(st.getDate() + 14);
    unit.tglRealisasi = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    unit.tglSerahTerima = st.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    unit.buildProgress = generateDefaultBuildProgress(BUILD_STAGES.length);
    unit.progress = 100;
    unit.serviceMutu = generateDefaultServiceMutu();
    unit.persetujuan = generateDefaultPersetujuan(base.display);
    unit.persetujuan.approved = true;
    unit.persetujuan.ttd = true;
    unit.persetujuan.setuju = 'Ya';
    unit.persetujuan.totalEstimasi = 5000000;
  }

  return unit;
}

export function getInitialUnitsList(): UnitData[] {
  return BASELINE_UNITS.map((base, idx) => createInitialUnitData(base, idx));
}

// Function to auto-sort units naturally
export function sortUnitsAlphanumeric(units: UnitData[]): UnitData[] {
  return [...units].sort((a, b) => {
    if (a.block !== b.block) {
      return a.block.localeCompare(b.block);
    }
    // Extract numerical part from display or id (e.g. "A.04B" -> num 4, suffix "B")
    const getParts = (str: string) => {
      const match = str.match(/([A-Z]+)[._]?(\d+)([A-Z0-9]*)/i);
      if (match) {
        return { block: match[1], num: parseInt(match[2], 10), suffix: match[3] || '' };
      }
      return { block: str, num: 0, suffix: '' };
    };

    const pa = getParts(a.display || a.id);
    const pb = getParts(b.display || b.id);
    if (pa.num !== pb.num) {
      return pa.num - pb.num;
    }
    return pa.suffix.localeCompare(pb.suffix);
  });
}

// Spatial sorting: order points by position on the siteplan (e.g. Left-to-Right within each block) and auto-resequence
export function sortUnitsSpatial(units: UnitData[], renumber: boolean = false): UnitData[] {
  // Group by block
  const blocks = Array.from(new Set(units.map((u) => u.block))).sort();
  const sorted: UnitData[] = [];

  blocks.forEach((blockKey) => {
    const blockUnits = units.filter((u) => u.block === blockKey);
    // Sort primarily by Y (lane/row, within ~6% margin) then X (left to right)
    blockUnits.sort((a, b) => {
      const rowDiff = Math.abs(a.y - b.y);
      if (rowDiff > 5) {
        return a.y - b.y;
      }
      return a.x - b.x;
    });

    if (renumber) {
      blockUnits.forEach((u, idx) => {
        const numStr = (idx + 1).toString().padStart(2, '0');
        sorted.push({
          ...u,
          display: `${blockKey}.${numStr}`,
          id: `${blockKey}${numStr}`,
        });
      });
    } else {
      sorted.push(...blockUnits);
    }
  });

  return sorted;
}
