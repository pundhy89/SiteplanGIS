export type UnitStatus = 'tersedia' | 'booking' | 'bangun' | 'realisasi';

export interface BerkasItem {
  name: string;
  done: boolean;
  fileName?: string;
  updatedAt?: string;
}

export interface ChecklistItem {
  name: string;
  done: boolean;
}

export interface ProgressStage {
  done: boolean;
  photos: { name: string; url?: string }[];
  checklist: ChecklistItem[];
}

export interface ServiceMutuItem {
  id: string;
  label: string;
  checked: boolean;
  fields: Record<string, string>;
  biaya: number;
  status: 'Pending' | 'Selesai';
}

export interface PersetujuanMutuItem {
  id: string;
  label: string;
  checked: boolean;
  detail: Record<string, string>;
  biaya: number;
  volume: string;
  hargaSatuan: string;
}

export interface PersetujuanPembangunan {
  denahFileName?: string;
  mutuItems: PersetujuanMutuItem[];
  approved: boolean;
  ttd: boolean;
  setuju: 'Ya' | 'Tidak' | '';
  totalEstimasi: number;
}

export interface UnitData {
  id: string; // e.g. "A01"
  display: string; // e.g. "A.01"
  block: string; // e.g. "A"
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  status: UnitStatus;
  type: string; // e.g. "36/72"
  luas: number; // e.g. 72
  harga: string; // e.g. "Rp 185 Jt"
  hargaFull: string; // e.g. "Rp 185.000.000"
  konsumen?: string;
  tglBooking?: string;
  tglRealisasi?: string;
  tglSerahTerima?: string;
  progress?: number;
  berkas?: BerkasItem[];
  buildProgress?: Record<string, ProgressStage>;
  serviceMutu?: ServiceMutuItem[];
  persetujuan?: PersetujuanPembangunan;
  updatedAt?: string;
  updatedBy?: string;
}

export interface SiteplanConfig {
  id: string;
  bgType: 'image' | 'video';
  bgFileName?: string;
  bgUrl?: string;
  pointScale: number;
  labelDisplayMode: 'short' | 'full'; // '01' vs 'A.01'
  updatedAt?: string;
}
