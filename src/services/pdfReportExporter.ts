import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UnitData, UnitStatus } from '../types';
import { BUILD_STAGES, sortUnitsAlphanumeric } from '../data/initialUnits';

export interface AggregatedBlockStat {
  block: string;
  totalUnits: number;
  tersedia: number;
  booking: number;
  bangun: number;
  realisasi: number;
  totalLuas: number;
  totalNilaiUnit: number;
  totalBiayaMutu: number;
  avgProgress: number;
}

export interface AggregatedSiteplanReport {
  generatedAt: string;
  totalUnits: number;
  statusCounts: Record<UnitStatus, number>;
  occupancyRate: number; // percentage of non-available units
  realisasiRate: number; // percentage of realisasi units
  totalLuasAll: number;
  totalNilaiProyek: number;
  totalNilaiTerjual: number;
  totalNilaiTersedia: number;
  totalEstimasiPersetujuanMutu: number;
  totalBiayaServiceMutu: number;
  avgBuildProgressActive: number;
  avgBerkasCompletion: number;
  blockStats: AggregatedBlockStat[];
  sortedUnits: UnitData[];
}

export interface PdfExportOptions {
  title?: string;
  subtitle?: string;
  preparedBy?: string;
  notes?: string;
  filterStatus?: string; // 'ALL' | UnitStatus
  filterBlock?: string; // 'ALL' | 'A' | 'B' ...
  orientation?: 'landscape' | 'portrait';
  includeExecutiveSummary?: boolean;
  includeBlockSummary?: boolean;
  includeUnitTable?: boolean;
  includeDetailedAppendix?: boolean;
}

/**
 * Helper to parse Indonesian currency string like "Rp 185.000.000" or "Rp 185 Jt" into numeric Rupiah
 */
export function parseRupiahString(str?: string): number {
  if (!str) return 0;
  const cleaned = str.trim();
  if (/jt/i.test(cleaned)) {
    const numMatch = cleaned.replace(/[^\d.,]/g, '').replace(',', '.');
    const val = parseFloat(numMatch);
    return isNaN(val) ? 0 : Math.round(val * 1_000_000);
  }
  const digits = cleaned.replace(/\D/g, '');
  const parsed = parseInt(digits, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format numeric Rupiah into readable string e.g. "Rp 185.000.000"
 */
export function formatRupiah(amount: number): string {
  return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
}

/**
 * Format Status label in Indonesian
 */
export function formatStatusLabel(status: UnitStatus): string {
  switch (status) {
    case 'tersedia':
      return 'TERSEDIA';
    case 'booking':
      return 'BOOKING';
    case 'bangun':
      return 'PROSES BANGUN';
    case 'realisasi':
      return 'REALISASI';
    default:
      return String(status).toUpperCase();
  }
}

/**
 * Compute comprehensive aggregated statistics from an array of UnitData
 */
export function aggregateUnitsData(units: UnitData[]): AggregatedSiteplanReport {
  const sortedUnits = sortUnitsAlphanumeric(units);
  const totalUnits = sortedUnits.length;

  const statusCounts: Record<UnitStatus, number> = {
    tersedia: 0,
    booking: 0,
    bangun: 0,
    realisasi: 0,
  };

  let totalLuasAll = 0;
  let totalNilaiProyek = 0;
  let totalNilaiTerjual = 0;
  let totalNilaiTersedia = 0;
  let totalEstimasiPersetujuanMutu = 0;
  let totalBiayaServiceMutu = 0;

  let activeProgressSum = 0;
  let activeProgressCount = 0;

  let berkasRatioSum = 0;
  let berkasUnitCount = 0;

  const blockMap = new Map<string, UnitData[]>();

  for (const unit of sortedUnits) {
    const st = unit.status || 'tersedia';
    statusCounts[st] = (statusCounts[st] || 0) + 1;

    const luas = Number(unit.luas) || 0;
    totalLuasAll += luas;

    const unitPrice = parseRupiahString(unit.hargaFull || unit.harga);
    totalNilaiProyek += unitPrice;

    if (st === 'tersedia') {
      totalNilaiTersedia += unitPrice;
    } else {
      totalNilaiTerjual += unitPrice;
    }

    const estimasiMutu = unit.persetujuan?.totalEstimasi || 0;
    totalEstimasiPersetujuanMutu += estimasiMutu;

    const serviceCost = (unit.serviceMutu || [])
      .filter((s) => s.checked)
      .reduce((acc, item) => acc + (Number(item.biaya) || 0), 0);
    totalBiayaServiceMutu += serviceCost;

    if (st === 'bangun' || st === 'realisasi') {
      activeProgressSum += Number(unit.progress) || 0;
      activeProgressCount += 1;
    }

    if (st !== 'tersedia' && unit.berkas && unit.berkas.length > 0) {
      const doneCount = unit.berkas.filter((b) => b.done).length;
      berkasRatioSum += (doneCount / unit.berkas.length) * 100;
      berkasUnitCount += 1;
    }

    const blk = unit.block || 'Lainnya';
    if (!blockMap.has(blk)) {
      blockMap.set(blk, []);
    }
    blockMap.get(blk)!.push(unit);
  }

  const blockStats: AggregatedBlockStat[] = Array.from(blockMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([block, blkUnits]) => {
      const tersedia = blkUnits.filter((u) => u.status === 'tersedia').length;
      const booking = blkUnits.filter((u) => u.status === 'booking').length;
      const bangun = blkUnits.filter((u) => u.status === 'bangun').length;
      const realisasi = blkUnits.filter((u) => u.status === 'realisasi').length;
      const totalLuas = blkUnits.reduce((acc, u) => acc + (Number(u.luas) || 0), 0);
      const totalNilaiUnit = blkUnits.reduce(
        (acc, u) => acc + parseRupiahString(u.hargaFull || u.harga),
        0
      );
      const totalBiayaMutu = blkUnits.reduce((acc, u) => {
        const pMutu = u.persetujuan?.totalEstimasi || 0;
        const sMutu = (u.serviceMutu || [])
          .filter((s) => s.checked)
          .reduce((sum, item) => sum + (Number(item.biaya) || 0), 0);
        return acc + pMutu + sMutu;
      }, 0);

      const avgProgress =
        blkUnits.length > 0
          ? Math.round(
              blkUnits.reduce((acc, u) => acc + (Number(u.progress) || 0), 0) / blkUnits.length
            )
          : 0;

      return {
        block,
        totalUnits: blkUnits.length,
        tersedia,
        booking,
        bangun,
        realisasi,
        totalLuas,
        totalNilaiUnit,
        totalBiayaMutu,
        avgProgress,
      };
    });

  const soldCount = statusCounts.booking + statusCounts.bangun + statusCounts.realisasi;
  const occupancyRate = totalUnits > 0 ? Math.round((soldCount / totalUnits) * 100) : 0;
  const realisasiRate =
    totalUnits > 0 ? Math.round((statusCounts.realisasi / totalUnits) * 100) : 0;
  const avgBuildProgressActive =
    activeProgressCount > 0 ? Math.round(activeProgressSum / activeProgressCount) : 0;
  const avgBerkasCompletion =
    berkasUnitCount > 0 ? Math.round(berkasRatioSum / berkasUnitCount) : 0;

  const generatedAt = new Date().toLocaleString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return {
    generatedAt,
    totalUnits,
    statusCounts,
    occupancyRate,
    realisasiRate,
    totalLuasAll,
    totalNilaiProyek,
    totalNilaiTerjual,
    totalNilaiTersedia,
    totalEstimasiPersetujuanMutu,
    totalBiayaServiceMutu,
    avgBuildProgressActive,
    avgBerkasCompletion,
    blockStats,
    sortedUnits,
  };
}

/**
 * Generates and downloads a comprehensive multi-page PDF report to the user's local device
 */
export function exportUnitsReportToPdf(units: UnitData[], options: PdfExportOptions = {}): string {
  const {
    title = 'LAPORAN REKAPITULASI SITEPLAN & MONITORING UNIT',
    subtitle = 'PROYEK PERUMAHAN GRIYA INDAH SECAWAN',
    preparedBy = 'Tim Manajemen & Pemasaran GIS',
    notes = '',
    filterStatus = 'ALL',
    filterBlock = 'ALL',
    orientation = 'landscape',
    includeExecutiveSummary = true,
    includeBlockSummary = true,
    includeUnitTable = true,
    includeDetailedAppendix = true,
  } = options;

  // Filter units according to options
  const filteredUnits = units.filter((u) => {
    if (filterStatus !== 'ALL' && u.status !== filterStatus) return false;
    if (filterBlock !== 'ALL' && u.block !== filterBlock) return false;
    return true;
  });

  const report = aggregateUnitsData(filteredUnits);

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;

  // Draw Header Banner on Page 1
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, pageWidth, 32, 'F');

  // Accent Emerald Strip
  doc.setFillColor(16, 185, 129); // Emerald 500
  doc.rect(0, 32, pageWidth, 1.8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(title, margin, 13);

  doc.setFontSize(10);
  doc.setTextColor(16, 185, 129);
  doc.text(subtitle, margin, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  const filterInfo = `Filter Status: ${filterStatus === 'ALL' ? 'Semua Status' : formatStatusLabel(filterStatus as UnitStatus)} | Filter Blok: ${filterBlock === 'ALL' ? 'Semua Blok' : 'Blok ' + filterBlock}`;
  doc.text(filterInfo, margin, 26.5);

  // Right-aligned metadata on Header
  doc.setFontSize(8.5);
  doc.text(`Dicetak: ${report.generatedAt}`, pageWidth - margin, 13, { align: 'right' });
  doc.text(`Disusun Oleh: ${preparedBy}`, pageWidth - margin, 19.5, { align: 'right' });
  doc.text(`Total Data: ${report.totalUnits} Kavling Unit`, pageWidth - margin, 26.5, {
    align: 'right',
  });

  let currentY = 40;

  // Optional Notes
  if (notes.trim()) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 12, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text('Catatan Laporan:', margin + 3, currentY + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.text(notes.trim(), margin + 30, currentY + 4.5, {
      maxWidth: pageWidth - margin * 2 - 34,
    });
    currentY += 16;
  }

  // 1. EXECUTIVE SUMMARY SECTION
  if (includeExecutiveSummary) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('1. RINGKASAN EKSEKUTIF & KINERJA PROYEK', margin, currentY);
    currentY += 3;

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [
        [
          'Indikator Kuantitas Unit',
          'Jumlah / Persentase',
          'Indikator Finansial & Konstruksi',
          'Nilai Agregat',
        ],
      ],
      body: [
        [
          'Total Unit Kavling Terdata',
          `${report.totalUnits} Unit (Luas Total: ${report.totalLuasAll.toLocaleString('id-ID')} m²)`,
          'Total Nilai Proyek (Harga Jual Unit)',
          formatRupiah(report.totalNilaiProyek),
        ],
        [
          'Status Tersedia (Siap Dipasarkan)',
          `${report.statusCounts.tersedia} Unit (${report.totalUnits ? Math.round((report.statusCounts.tersedia / report.totalUnits) * 100) : 0}%)`,
          'Nilai Unit Terpesan / Terjual (Booking+Bangun+Realisasi)',
          formatRupiah(report.totalNilaiTerjual),
        ],
        [
          'Status Booking (SPR & Pemberkasan)',
          `${report.statusCounts.booking} Unit (${report.totalUnits ? Math.round((report.statusCounts.booking / report.totalUnits) * 100) : 0}%)`,
          'Nilai Inventori Unit Tersedia',
          formatRupiah(report.totalNilaiTersedia),
        ],
        [
          'Status Proses Bangun (Konstruksi Aktif)',
          `${report.statusCounts.bangun} Unit (${report.totalUnits ? Math.round((report.statusCounts.bangun / report.totalUnits) * 100) : 0}%)`,
          'Total Estimasi Penambahan Mutu (Disetujui)',
          formatRupiah(report.totalEstimasiPersetujuanMutu),
        ],
        [
          'Status Realisasi (Akad / Serah Terima)',
          `${report.statusCounts.realisasi} Unit (${report.realisasiRate}%)`,
          'Total Biaya Klaim / Service Mutu',
          formatRupiah(report.totalBiayaServiceMutu),
        ],
        [
          'Tingkat Serapan Pasar (Occupancy Rate)',
          `${report.occupancyRate}% (${report.totalUnits - report.statusCounts.tersedia} dari ${report.totalUnits} Unit)`,
          'Rata-rata Progres Konstruksi / Pemberkasan KPR',
          `Fisik: ${report.avgBuildProgressActive}% | Berkas KPR: ${report.avgBerkasCompletion}%`,
        ],
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
        cellPadding: 2.5,
      },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 55 },
        1: { cellWidth: 55 },
        2: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 68 },
      },
    });

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  // 2. BLOCK SUMMARY SECTION
  if (includeBlockSummary && report.blockStats.length > 0) {
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = 18;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('2. REKAPITULASI DATA PER BLOK KAVLING', margin, currentY);
    currentY += 3;

    const blockRows = report.blockStats.map((b) => [
      `Blok ${b.block}`,
      `${b.totalUnits} Unit`,
      `${b.tersedia}`,
      `${b.booking}`,
      `${b.bangun}`,
      `${b.realisasi}`,
      `${b.totalLuas.toLocaleString('id-ID')} m²`,
      `${b.avgProgress}%`,
      formatRupiah(b.totalNilaiUnit),
      formatRupiah(b.totalBiayaMutu),
    ]);

    // Footer total row
    blockRows.push([
      'TOTAL KESELURUHAN',
      `${report.totalUnits} Unit`,
      `${report.statusCounts.tersedia}`,
      `${report.statusCounts.booking}`,
      `${report.statusCounts.bangun}`,
      `${report.statusCounts.realisasi}`,
      `${report.totalLuasAll.toLocaleString('id-ID')} m²`,
      `${report.avgBuildProgressActive}%`,
      formatRupiah(report.totalNilaiProyek),
      formatRupiah(report.totalEstimasiPersetujuanMutu + report.totalBiayaServiceMutu),
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [
        [
          'Blok',
          'Total',
          'Tersedia',
          'Booking',
          'Bangun',
          'Realisasi',
          'Total Luas',
          'Rata Progres',
          'Total Nilai Unit',
          'Total Biaya Mutu/Service',
        ],
      ],
      body: blockRows,
      theme: 'striped',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 8,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
        cellPadding: 2.2,
      },
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'left' },
        1: { halign: 'center' },
        2: { halign: 'center', textColor: [5, 150, 105], fontStyle: 'bold' },
        3: { halign: 'center', textColor: [217, 119, 6], fontStyle: 'bold' },
        4: { halign: 'center', textColor: [2, 132, 199], fontStyle: 'bold' },
        5: { halign: 'center', textColor: [71, 85, 105], fontStyle: 'bold' },
        6: { halign: 'right' },
        7: { halign: 'center' },
        8: { halign: 'right', fontStyle: 'bold' },
        9: { halign: 'right' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index === blockRows.length - 1) {
          data.cell.styles.fillColor = [226, 232, 240];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [15, 23, 42];
        }
      },
    });

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  // 3. MASTER UNIT TABLE SECTION
  if (includeUnitTable) {
    if (currentY > pageHeight - 45) {
      doc.addPage();
      currentY = 18;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('3. DAFTAR LENGKAP UNIT KAVLING, KONSUMEN & PROGRES', margin, currentY);
    currentY += 3;

    const unitRows = report.sortedUnits.map((u, idx) => {
      const berkasTotal = u.berkas?.length || 10;
      const berkasDone = u.berkas ? u.berkas.filter((b) => b.done).length : 0;
      const berkasText = u.status === 'tersedia' ? '-' : `${berkasDone}/${berkasTotal}`;

      const stagesDone = u.buildProgress
        ? Object.values(u.buildProgress).filter((st) => st.done).length
        : 0;
      const progressText =
        u.status === 'tersedia' ? '0%' : `${u.progress || 0}% (${stagesDone}/8 Thp)`;

      const datesInfo: string[] = [];
      if (u.tglBooking && u.tglBooking !== '-') datesInfo.push(`Bkg: ${u.tglBooking}`);
      if (u.tglRealisasi && u.tglRealisasi !== '-') datesInfo.push(`Real: ${u.tglRealisasi}`);
      if (u.tglSerahTerima && u.tglSerahTerima !== '-') datesInfo.push(`BAST: ${u.tglSerahTerima}`);

      const mutuCost = u.persetujuan?.totalEstimasi || 0;
      const serviceCost = (u.serviceMutu || [])
        .filter((s) => s.checked)
        .reduce((acc, item) => acc + (Number(item.biaya) || 0), 0);

      const tambahanText =
        mutuCost + serviceCost > 0 ? formatRupiah(mutuCost + serviceCost) : '-';

      return [
        String(idx + 1),
        u.display || u.id,
        `Blok ${u.block}`,
        `${u.type} (${u.luas} m²)`,
        formatStatusLabel(u.status),
        u.konsumen && u.konsumen !== '-' ? u.konsumen : '-',
        u.hargaFull || u.harga || '-',
        berkasText,
        progressText,
        datesInfo.length > 0 ? datesInfo.join('\n') : '-',
        tambahanText,
      ];
    });

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [
        [
          'No',
          'Unit',
          'Blok',
          'Tipe / Luas',
          'Status',
          'Nama Konsumen',
          'Harga Jual',
          'Berkas',
          'Progres Fisik',
          'Tanggal Penting',
          'Biaya Mutu/Svc',
        ],
      ],
      body: unitRows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 7.2,
        textColor: [30, 41, 59],
        cellPadding: 1.8,
        valign: 'middle',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 9 },
        1: { fontStyle: 'bold', halign: 'center', cellWidth: 15 },
        2: { halign: 'center', cellWidth: 16 },
        3: { halign: 'center', cellWidth: 22 },
        4: { halign: 'center', fontStyle: 'bold', cellWidth: 26 },
        5: { halign: 'left' },
        6: { halign: 'right', cellWidth: 28 },
        7: { halign: 'center', cellWidth: 15 },
        8: { halign: 'center', cellWidth: 25 },
        9: { halign: 'left', cellWidth: 32, fontSize: 6.8 },
        10: { halign: 'right', cellWidth: 26 },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 4) {
          const raw = String(data.cell.raw || '');
          if (raw === 'TERSEDIA') {
            data.cell.styles.fillColor = [209, 250, 229];
            data.cell.styles.textColor = [6, 95, 70];
          } else if (raw === 'BOOKING') {
            data.cell.styles.fillColor = [254, 243, 199];
            data.cell.styles.textColor = [146, 64, 14];
          } else if (raw === 'PROSES BANGUN') {
            data.cell.styles.fillColor = [224, 242, 254];
            data.cell.styles.textColor = [7, 89, 133];
          } else if (raw === 'REALISASI') {
            data.cell.styles.fillColor = [228, 228, 231];
            data.cell.styles.textColor = [39, 39, 42];
          }
        }
      },
    });

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  // 4. DETAILED APPENDIX FOR ACTIVE / BOOKED UNITS (8-Stage Progress, Custom Mutu & Service Mutu)
  const unitsWithActivity = report.sortedUnits.filter((u) => u.status !== 'tersedia');
  if (includeDetailedAppendix && unitsWithActivity.length > 0) {
    if (currentY > pageHeight - 45) {
      doc.addPage();
      currentY = 18;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(
      '4. LAMPIRAN RINCIAN TAHAPAN KONSTRUKSI, PERSETUJUAN MUTU & SERVICE KONSUMEN',
      margin,
      currentY
    );
    currentY += 3;

    const detailRows = unitsWithActivity.map((u, idx) => {
      // Completed stages list
      const completedStageNames: string[] = [];
      const pendingStageNames: string[] = [];

      BUILD_STAGES.forEach((stage) => {
        const stData = u.buildProgress?.[stage.id];
        if (stData?.done) {
          completedStageNames.push(stage.label);
        } else {
          pendingStageNames.push(stage.label);
        }
      });

      // Persetujuan Mutu details
      const approvedMutuItems = (u.persetujuan?.mutuItems || []).filter((m) => m.checked);
      const persetujuanSummary =
        approvedMutuItems.length > 0
          ? `${approvedMutuItems.map((m) => `${m.label} (${formatRupiah(m.biaya)})`).join(', ')} [Status: ${u.persetujuan?.approved ? 'Disetujui & TTD' : 'Draft'}]`
          : u.persetujuan?.approved
          ? 'Standar (Disetujui)'
          : 'Belum ada tambahan mutu';

      // Service Mutu details
      const activeServiceItems = (u.serviceMutu || []).filter((s) => s.checked);
      const serviceSummary =
        activeServiceItems.length > 0
          ? activeServiceItems
              .map((s) => `${s.label} [${s.status} - ${formatRupiah(s.biaya)}]`)
              .join('; ')
          : 'Tidak ada klaim service';

      // Unfinished berkas
      const missingBerkas = (u.berkas || [])
        .filter((b) => !b.done)
        .map((b) => b.name);
      const berkasSummary =
        missingBerkas.length === 0
          ? 'Lengkap (10/10 Berkas)'
          : `Kurang ${missingBerkas.length}: ${missingBerkas.slice(0, 3).join(', ')}${missingBerkas.length > 3 ? '...' : ''}`;

      return [
        String(idx + 1),
        `${u.display}\n(${formatStatusLabel(u.status)})`,
        u.konsumen || '-',
        `${u.progress || 0}%\nSelesai: ${completedStageNames.length}/8 Tahap`,
        completedStageNames.length > 0 ? completedStageNames.join(', ') : 'Belum dimulai',
        berkasSummary,
        persetujuanSummary,
        serviceSummary,
      ];
    });

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [
        [
          'No',
          'Unit & Status',
          'Konsumen',
          'Progres',
          'Tahap Konstruksi Selesai',
          'Status Berkas KPR',
          'Persetujuan Tambah Mutu',
          'Klaim / Service Mutu',
        ],
      ],
      body: detailRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [30, 41, 59],
        cellPadding: 2,
        valign: 'top',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { fontStyle: 'bold', halign: 'center', cellWidth: 24 },
        2: { fontStyle: 'bold', cellWidth: 28 },
        3: { halign: 'center', cellWidth: 22 },
        4: { cellWidth: 45 },
        5: { cellWidth: 42 },
        6: { cellWidth: 50 },
        7: { cellWidth: 45 },
      },
    });
  }

  // Add Page Footers with Page Numbering and Timestamp across all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Dokumen Laporan Offline Griya Indah Secawan • Dicetak: ${report.generatedAt}`,
      margin,
      pageHeight - 5.5
    );
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - margin, pageHeight - 5.5, {
      align: 'right',
    });
  }

  const dateStamp = new Date().toISOString().slice(0, 10);
  const statusSlug = filterStatus === 'ALL' ? 'Semua_Unit' : filterStatus.toUpperCase();
  const fileName = `Laporan_GIS_${statusSlug}_${dateStamp}.pdf`;

  doc.save(fileName);
  return fileName;
}
