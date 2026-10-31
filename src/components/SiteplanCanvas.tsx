import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Pencil,
  Crosshair,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  Upload,
  Image as ImageIcon,
  Trash2,
  Maximize2,
  Layers,
  MapPin,
  Eye,
} from 'lucide-react';
import { UnitData, UnitStatus, SiteplanConfig } from '../types';
import {
  DEFAULT_SITEPLAN_IMAGE,
  DEFAULT_SITEPLAN_VIDEO,
  LEGACY_SITEPLAN_VIDEO,
  DEFAULT_SITEPLAN_TYPE,
} from '../data/defaultSiteplan';

interface SiteplanCanvasProps {
  units: UnitData[];
  selectedUnit: UnitData | null;
  onSelectUnit: (unit: UnitData) => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  pointScale: number;
  onChangePointScale: (newScale: number) => void;
  onUpdateUnitPosition: (unitId: string, x: number, y: number) => void;
  onQuickEditUnit: (unit: UnitData) => void;
  onDeleteUnit?: (unitId: string) => void;
  siteplanConfig: SiteplanConfig | null;
  onUpdateConfig: (config: Partial<SiteplanConfig>) => void;
  onShowNotification: (msg: string) => void;
  activeFilterBlock?: string;
  activeFilterStatus: string;
  searchQuery: string;
}

export const STATUS_COLORS: Record<
  UnitStatus,
  { bg: string; text: string; border: string; label: string; badgeBg: string }
> = {
  tersedia: {
    bg: '#10b981', // emerald-500
    text: '#ffffff',
    border: 'rgba(255, 255, 255, 0.95)',
    label: 'TERSEDIA',
    badgeBg: 'bg-emerald-500',
  },
  booking: {
    bg: '#f59e0b', // amber-500
    text: '#111827',
    border: 'rgba(255, 255, 255, 0.95)',
    label: 'TERBOOKING',
    badgeBg: 'bg-amber-400',
  },
  bangun: {
    bg: '#0284c7', // sky-600
    text: '#ffffff',
    border: 'rgba(255, 255, 255, 0.95)',
    label: 'TERBANGUN',
    badgeBg: 'bg-sky-500',
  },
  realisasi: {
    bg: '#64748b', // slate-500
    text: '#ffffff',
    border: 'rgba(255, 255, 255, 0.85)',
    label: 'REALISASI',
    badgeBg: 'bg-zinc-400',
  },
};

export const SiteplanCanvas: React.FC<SiteplanCanvasProps> = ({
  units,
  selectedUnit,
  onSelectUnit,
  isEditMode,
  onToggleEditMode,
  pointScale,
  onChangePointScale,
  onUpdateUnitPosition,
  onQuickEditUnit,
  onDeleteUnit,
  siteplanConfig,
  onUpdateConfig,
  onShowNotification,
  activeFilterBlock = 'ALL',
  activeFilterStatus,
  searchQuery,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Content dimensions relative to container
  const [contentBounds, setContentBounds] = useState({ w: 0, h: 0, x: 0, y: 0 });

  // Canvas Viewport Pan & Zoom
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Dragging unit state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [hasMovedDrag, setHasMovedDrag] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Precision Nudge unit
  const [calibratingUnit, setCalibratingUnit] = useState<UnitData | null>(null);
  const [nudgeStep, setNudgeStep] = useState<number>(0.2); // 0.1% or 0.5% or 0.2%

  // Keep calibratingUnit synced or cleared if deleted
  useEffect(() => {
    if (calibratingUnit) {
      const stillExists = units.find((u) => u.id === calibratingUnit.id);
      if (!stillExists) {
        setCalibratingUnit(null);
      } else if (stillExists.display !== calibratingUnit.display) {
        setCalibratingUnit(stillExists);
      }
    }
  }, [units, calibratingUnit]);

  // Background media (default is the uploaded siteplan video)
  const isLegacyDefault =
    siteplanConfig?.bgUrl === DEFAULT_SITEPLAN_IMAGE ||
    siteplanConfig?.bgUrl === LEGACY_SITEPLAN_VIDEO;
  const bgType =
    !siteplanConfig?.bgUrl || isLegacyDefault
      ? DEFAULT_SITEPLAN_TYPE
      : siteplanConfig.bgType || DEFAULT_SITEPLAN_TYPE;
  const bgUrl =
    !siteplanConfig?.bgUrl || isLegacyDefault ? DEFAULT_SITEPLAN_VIDEO : siteplanConfig.bgUrl;
  const isCustomBg = Boolean(
    siteplanConfig?.bgUrl &&
      siteplanConfig.bgUrl !== DEFAULT_SITEPLAN_VIDEO &&
      siteplanConfig.bgUrl !== LEGACY_SITEPLAN_VIDEO &&
      siteplanConfig.bgUrl !== DEFAULT_SITEPLAN_IMAGE
  );
  const [isDragOverBg, setIsDragOverBg] = useState(false);

  // Calculate container aspect ratio and letterboxed content dimensions
  const updateContentBounds = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    let naturalW = 720;
    let naturalH = 1280;

    if (bgType === 'video' && videoRef.current && videoRef.current.videoWidth) {
      naturalW = videoRef.current.videoWidth;
      naturalH = videoRef.current.videoHeight;
    } else if (imgRef.current && imgRef.current.naturalWidth) {
      naturalW = imgRef.current.naturalWidth;
      naturalH = imgRef.current.naturalHeight;
    }

    const { clientWidth: cw, clientHeight: ch } = container;
    const scale = Math.min(cw / naturalW, ch / naturalH);
    const w = naturalW * scale;
    const h = naturalH * scale;
    const x = (cw - w) / 2;
    const y = (ch - h) / 2;

    setContentBounds({ w, h, x, y });
  }, [bgType]);

  useEffect(() => {
    updateContentBounds();
    const timer = setTimeout(updateContentBounds, 60);
    window.addEventListener('resize', updateContentBounds);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateContentBounds);
    };
  }, [updateContentBounds]);

  // Convert mouse/touch page coordinates to percentage (0 - 100%) inside the content bounds
  const getPercentCoords = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container || contentBounds.w === 0 || contentBounds.h === 0) return null;

      const rect = container.getBoundingClientRect();
      // Account for pan and zoom
      const containerX = clientX - rect.left - panOffset.x;
      const containerY = clientY - rect.top - panOffset.y;

      // Adjust for zoom around center
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const unzoomedX = (containerX - centerX) / zoomLevel + centerX;
      const unzoomedY = (containerY - centerY) / zoomLevel + centerY;

      const pctX = ((unzoomedX - contentBounds.x) / contentBounds.w) * 100;
      const pctY = ((unzoomedY - contentBounds.y) / contentBounds.h) * 100;

      return {
        x: Number(Math.max(0, Math.min(100, pctX)).toFixed(2)),
        y: Number(Math.max(0, Math.min(100, pctY)).toFixed(2)),
      };
    },
    [contentBounds, panOffset, zoomLevel]
  );

  // Handle Dragging
  const handlePointerMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (draggingId && isEditMode && dragStartPos) {
        let cx: number;
        let cy: number;
        if ('touches' in e) {
          if (e.touches.length === 0) return;
          cx = e.touches[0].clientX;
          cy = e.touches[0].clientY;
        } else {
          cx = e.clientX;
          cy = e.clientY;
        }

        if (Math.hypot(cx - dragStartPos.x, cy - dragStartPos.y) > 4) {
          setHasMovedDrag(true);
        }

        const coords = getPercentCoords(cx, cy);
        if (coords) {
          onUpdateUnitPosition(draggingId, coords.x, coords.y);
          if (calibratingUnit && calibratingUnit.id === draggingId) {
            setCalibratingUnit((prev) => (prev ? { ...prev, x: coords.x, y: coords.y } : null));
          }
        }
      } else if (isPanning) {
        let cx: number;
        let cy: number;
        if ('touches' in e) {
          if (e.touches.length === 0) return;
          cx = e.touches[0].clientX;
          cy = e.touches[0].clientY;
        } else {
          cx = e.clientX;
          cy = e.clientY;
        }
        setPanOffset({
          x: cx - panStartRef.current.x,
          y: cy - panStartRef.current.y,
        });
      }
    },
    [draggingId, isEditMode, dragStartPos, getPercentCoords, onUpdateUnitPosition, isPanning, calibratingUnit]
  );

  const handlePointerUp = useCallback(() => {
    if (draggingId) {
      if (isEditMode && !hasMovedDrag) {
        const u = units.find((item) => item.id === draggingId);
        if (u) {
          setCalibratingUnit(u);
        }
      }
      setDraggingId(null);
      setDragStartPos(null);
      setTimeout(() => setHasMovedDrag(false), 80);
    }
    setIsPanning(false);
  }, [draggingId, isEditMode, hasMovedDrag, units]);

  useEffect(() => {
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  // Background file upload handler
  const handleBackgroundFile = (file: File) => {
    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|avi)$/i.test(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      onUpdateConfig({
        bgType: isVideo ? 'video' : 'image',
        bgFileName: file.name,
        bgUrl: result,
      });
      onShowNotification(`Latar belakang diganti: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const handleResetBackground = () => {
    onUpdateConfig({
      bgType: DEFAULT_SITEPLAN_TYPE,
      bgFileName: undefined,
      bgUrl: DEFAULT_SITEPLAN_VIDEO,
    });
    onShowNotification('Latar belakang direset ke video siteplan default');
  };

  // Precision nudge handler for calibrating
  const handleNudge = (dx: number, dy: number) => {
    if (!calibratingUnit) return;
    const newX = Number(Math.max(0, Math.min(100, calibratingUnit.x + dx)).toFixed(2));
    const newY = Number(Math.max(0, Math.min(100, calibratingUnit.y + dy)).toFixed(2));
    const updated = { ...calibratingUnit, x: newX, y: newY };
    setCalibratingUnit(updated);
    onUpdateUnitPosition(calibratingUnit.id, newX, newY);
  };

  // Zoom handlers (triggered via Volume Up / Volume Down keys)
  const handleZoomIn = useCallback(() => {
    setZoomLevel((z) => Math.min(3.5, Number((z * 1.25).toFixed(2))));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((z) => {
      const next = Math.max(1, Number((z * 0.8).toFixed(2)));
      if (next <= 1) {
        setPanOffset({ x: 0, y: 0 });
      }
      return next;
    });
  }, []);

  const handleResetZoomPan = useCallback(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // Listen to Volume Up / Volume Down keys for zooming canvas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (
        e.key === 'AudioVolumeUp' ||
        e.key === 'VolumeUp' ||
        e.code === 'AudioVolumeUp' ||
        e.code === 'VolumeUp' ||
        e.key === '+' ||
        e.key === '='
      ) {
        e.preventDefault();
        handleZoomIn();
      } else if (
        e.key === 'AudioVolumeDown' ||
        e.key === 'VolumeDown' ||
        e.code === 'AudioVolumeDown' ||
        e.code === 'VolumeDown' ||
        e.key === '-' ||
        e.key === '_'
      ) {
        e.preventDefault();
        handleZoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomIn, handleZoomOut]);

  // Filtering units
  const filteredUnits = units.filter((unit) => {
    if (activeFilterBlock !== 'ALL' && unit.block !== activeFilterBlock) return false;
    if (activeFilterStatus !== 'ALL' && unit.status !== activeFilterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchDisplay = unit.display.toLowerCase().includes(q);
      const matchId = unit.id.toLowerCase().includes(q);
      const matchBuyer = unit.konsumen?.toLowerCase().includes(q);
      const matchType = unit.type.toLowerCase().includes(q);
      if (!matchDisplay && !matchId && !matchBuyer && !matchType) return false;
    }
    return true;
  });

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#0a0a0c] overflow-hidden select-none touch-none flex items-center justify-center cursor-default"
      onMouseDown={(e) => {
        // Start canvas panning if clicking background
        if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'IMG' || (e.target as HTMLElement).tagName === 'VIDEO') {
          if (zoomLevel > 1) {
            setIsPanning(true);
            panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
          }
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOverBg(true);
      }}
      onDragLeave={() => setIsDragOverBg(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOverBg(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleBackgroundFile(file);
      }}
    >
      {/* Drag & Drop Overlay */}
      {isDragOverBg && (
        <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center pointer-events-none text-white">
          <div className="w-16 h-16 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center mb-3">
            <Upload className="w-8 h-8 text-white" />
          </div>
          <p className="text-[14px] font-bold">Lepaskan file gambar atau video denah di sini</p>
          <p className="text-[12px] text-white/60 mt-1">Mendukung format JPG, PNG, GIF, MP4, WebM</p>
        </div>
      )}

      {/* Scaled & Panned Content Layer */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          transformOrigin: 'center center',
          transition: isPanning || draggingId ? 'none' : 'transform 0.15s ease-out',
        }}
      >
        {/* Siteplan Background Asset */}
        {bgType === 'video' ? (
          <video
            ref={videoRef}
            src={bgUrl}
            autoPlay
            loop
            muted
            playsInline
            onLoadedMetadata={updateContentBounds}
            onLoadedData={updateContentBounds}
            className="w-full h-full object-contain pointer-events-auto"
          />
        ) : (
          <img
            ref={imgRef}
            src={bgUrl}
            alt="Siteplan Griya Indah Secawan"
            onLoad={updateContentBounds}
            draggable={false}
            className="w-full h-full object-contain pointer-events-auto shadow-2xl"
          />
        )}

        {/* Pinpoint Container calibrated exactly onto the siteplan drawing */}
        {contentBounds.w > 0 && (
          <div
            className="absolute pointer-events-auto"
            style={{
              left: contentBounds.x,
              top: contentBounds.y,
              width: contentBounds.w,
              height: contentBounds.h,
            }}
          >
            {filteredUnits.map((unit) => {
              const isHovered = hoveredId === unit.id;
              const isDragging = draggingId === unit.id;
              const isSelected = selectedUnit?.id === unit.id;
              const isCalibrating = calibratingUnit?.id === unit.id;
              const statusCfg = STATUS_COLORS[unit.status] || STATUS_COLORS.tersedia;

              // Tampilkan nomor unit rumah secara ringkas (contoh: "01" dari "A.01" atau "04B" dari "B.04B")
              const badgeText = unit.display.includes('.')
                ? unit.display.split('.').slice(1).join('.')
                : unit.display.replace(/^[A-D]/i, '');

              const scaleFactor = contentBounds.w > 0 ? contentBounds.w / 500 : 1;
              const baseW = Math.max(13, Math.round(18 * scaleFactor * pointScale));
              const baseH = Math.max(10, Math.round(12.5 * scaleFactor * pointScale));
              const fontSz = Math.max(6, Number((7.5 * scaleFactor * pointScale).toFixed(1)));

              // Active styling
              let bg = statusCfg.bg;
              let textColor = statusCfg.text;
              let border = `1px solid ${statusCfg.border}`;
              let shadow = '0 1px 3px rgba(0, 0, 0, 0.4)';
              let scaleVal = isDragging ? 1.35 : isCalibrating ? 1.28 : isHovered ? 1.25 : 1;

              if (isDragging) {
                bg = '#facc15'; // yellow-400
                textColor = '#000000';
                border = '2px solid #000000';
                shadow = '0 0 0 4px rgba(250, 204, 21, 0.8), 0 4px 14px rgba(0,0,0,0.5)';
              } else if (isCalibrating) {
                bg = '#facc15';
                textColor = '#000000';
                border = '1.5px solid #ffffff';
                shadow = '0 0 0 3px rgba(250, 204, 21, 0.9), 0 3px 10px rgba(0,0,0,0.4)';
              } else if (isEditMode) {
                border = '1.5px solid rgba(250, 204, 21, 0.95)';
                shadow = '0 0 0 2px rgba(250, 204, 21, 0.5), 0 2px 4px rgba(0,0,0,0.3)';
              } else if (isHovered || isSelected) {
                shadow = '0 0 0 2.5px rgba(255, 255, 255, 0.9), 0 3px 8px rgba(0,0,0,0.4)';
              }

              return (
                <button
                  key={unit.id}
                  onMouseEnter={() => !isEditMode && setHoveredId(unit.id)}
                  onMouseLeave={() => !isEditMode && setHoveredId(null)}
                  onMouseDown={(e) => {
                    if (isEditMode) {
                      e.preventDefault();
                      setDraggingId(unit.id);
                      setDragStartPos({ x: e.clientX, y: e.clientY });
                      setHasMovedDrag(false);
                      setCalibratingUnit(unit);
                    }
                  }}
                  onTouchStart={(e) => {
                    if (isEditMode && e.touches.length > 0) {
                      const t = e.touches[0];
                      setDraggingId(unit.id);
                      setDragStartPos({ x: t.clientX, y: t.clientY });
                      setHasMovedDrag(false);
                      setCalibratingUnit(unit);
                    }
                  }}
                  onClick={() => {
                    if (isEditMode) {
                      setCalibratingUnit(unit);
                      return;
                    }
                    onSelectUnit(unit);
                  }}
                  className={`absolute outline-none flex items-center justify-center transition-transform ${
                    isEditMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                  }`}
                  style={{
                    left: `${unit.x}%`,
                    top: `${unit.y}%`,
                    transform: `translate(-50%, -50%) scale(${scaleVal})`,
                    minWidth: `${baseW}px`,
                    height: `${baseH}px`,
                    padding: '0 2px',
                    backgroundColor: bg,
                    border,
                    borderRadius: '9999px',
                    boxShadow: shadow,
                    zIndex: isDragging ? 100 : isCalibrating ? 80 : isHovered ? 60 : 20,
                  }}
                  title={`${unit.display} - ${statusCfg.label} - ${unit.type}`}
                >
                  <span
                    className="font-mono font-extrabold tracking-tight"
                    style={{
                      fontSize: `${fontSz}px`,
                      color: textColor,
                      lineHeight: 1,
                      textShadow: unit.status === 'booking' || isDragging ? 'none' : '0 1px 1px rgba(0,0,0,0.5)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {badgeText}
                  </span>

                  {/* Tooltip on Hover */}
                  {!isEditMode && isHovered && (
                    <div
                      className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-[32px] px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-black/90 text-white border border-white/20 whitespace-nowrap shadow-lg flex items-center gap-1.5"
                      style={{ zIndex: 120 }}
                    >
                      <span className={`w-2 h-2 rounded-full ${statusCfg.badgeBg}`} />
                      <span>{unit.display}</span>
                      <span className="text-white/60">•</span>
                      <span>{statusCfg.label}</span>
                      <span className="text-white/60">•</span>
                      <span>{unit.type}</span>
                    </div>
                  )}

                  {/* Floating badge for active calibration */}
                  {isEditMode && isCalibrating && (
                    <div
                      className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-[26px] px-2 py-0.5 rounded-full text-[9px] font-black bg-yellow-400 text-black border border-black/30 shadow-md whitespace-nowrap"
                      style={{ zIndex: 130 }}
                    >
                      {unit.display} ({unit.x.toFixed(1)}%, {unit.y.toFixed(1)}%)
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Precision Nudge & Calibration Overlay (When a unit is selected in Edit Mode) */}
      {isEditMode && calibratingUnit && (
        <div className="absolute bottom-14 sm:bottom-16 left-3 z-40 bg-[#16161a]/95 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 shadow-2xl text-white max-w-[320px]">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-[13px] font-bold text-white">Mengepaskan {calibratingUnit.display}</span>
            </div>
            <button
              onClick={() => setCalibratingUnit(null)}
              className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-[11px] text-white/60 mb-2">
            Posisikan tepat di atas kotak kavling denah:
          </div>

          {/* D-Pad Arrow Buttons */}
          <div className="flex items-center justify-between gap-3 bg-black/40 p-2.5 rounded-xl border border-white/10 mb-2.5">
            <div className="grid grid-cols-3 gap-1 w-[90px] h-[90px]">
              <div />
              <button
                onClick={() => handleNudge(0, -nudgeStep)}
                className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 active:scale-95 flex items-center justify-center text-white"
                title="Geser ke Atas"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <div />

              <button
                onClick={() => handleNudge(-nudgeStep, 0)}
                className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 active:scale-95 flex items-center justify-center text-white"
                title="Geser ke Kiri"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="w-7 h-7 rounded-lg bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center text-[9px] font-bold text-yellow-300">
                ±{nudgeStep}%
              </div>
              <button
                onClick={() => handleNudge(nudgeStep, 0)}
                className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 active:scale-95 flex items-center justify-center text-white"
                title="Geser ke Kanan"
              >
                <ArrowRight className="w-4 h-4" />
              </button>

              <div />
              <button
                onClick={() => handleNudge(0, nudgeStep)}
                className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 active:scale-95 flex items-center justify-center text-white"
                title="Geser ke Bawah"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
              <div />
            </div>

            {/* Coordinates & Step Settings */}
            <div className="flex-1 space-y-2 text-[11px]">
              <div className="bg-black/60 px-2.5 py-1.5 rounded-lg border border-white/10 font-mono">
                <div>X: <span className="font-bold text-yellow-400">{calibratingUnit.x.toFixed(2)}%</span></div>
                <div>Y: <span className="font-bold text-yellow-400">{calibratingUnit.y.toFixed(2)}%</span></div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setNudgeStep(0.1)}
                  className={`flex-1 py-1 rounded text-[10px] font-semibold border ${
                    nudgeStep === 0.1 ? 'bg-yellow-400 text-black border-yellow-300' : 'bg-white/10 border-white/10 text-white/70'
                  }`}
                >
                  Halus (0.1%)
                </button>
                <button
                  onClick={() => setNudgeStep(0.5)}
                  className={`flex-1 py-1 rounded text-[10px] font-semibold border ${
                    nudgeStep === 0.5 ? 'bg-yellow-400 text-black border-yellow-300' : 'bg-white/10 border-white/10 text-white/70'
                  }`}
                >
                  Cepat (0.5%)
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onQuickEditUnit(calibratingUnit)}
              className="flex-1 h-8 rounded-lg bg-white/15 hover:bg-white/25 border border-white/15 text-[11px] font-semibold flex items-center justify-center gap-1 text-white"
            >
              <Pencil className="w-3 h-3" /> Edit Unit
            </button>
            {onDeleteUnit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const targetId = calibratingUnit.id;
                  setCalibratingUnit(null);
                  onDeleteUnit(targetId);
                }}
                className="h-8 px-2.5 rounded-lg bg-red-500/20 hover:bg-red-500/35 active:scale-95 border border-red-500/30 text-[11px] font-semibold text-red-300 flex items-center justify-center gap-1 cursor-pointer transition"
                title={`Hapus Unit ${calibratingUnit.display}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>
            )}
            <button
              onClick={() => {
                setCalibratingUnit(null);
                onShowNotification(`Posisi ${calibratingUnit.display} tersimpan`);
              }}
              className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" /> Selesai
            </button>
          </div>
        </div>
      )}

      {/* Floating Canvas Controls (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-40 flex flex-col items-end gap-2 pointer-events-none">
        {(zoomLevel > 1 || panOffset.x !== 0 || panOffset.y !== 0) && (
          <div className="pointer-events-auto flex items-center gap-1.5 bg-[#121216]/80 backdrop-blur-md p-1 rounded-full border border-white/15 shadow-xl">
            <button
              onClick={handleResetZoomPan}
              className="h-7 px-2.5 rounded-full bg-yellow-400 text-black text-[10px] font-bold flex items-center gap-1 transition"
              title="Reset Zoom & Pan"
            >
              <RotateCcw className="w-3 h-3" /> {zoomLevel}x
            </button>
          </div>
        )}

        {/* Custom Background Reset Button (if custom bg uploaded) */}
        {isCustomBg && (
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              onClick={handleResetBackground}
              className="h-8 px-3 rounded-full bg-red-500/20 border border-red-500/40 text-red-200 text-[11px] font-medium flex items-center gap-1.5 hover:bg-red-500/30 transition shadow-lg"
            >
              <RotateCcw className="w-3 h-3" /> Reset Denah Asli
            </button>
          </div>
        )}
      </div>

      {/* Edit Mode Instruction Banner */}
      {isEditMode && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-full bg-yellow-400 text-black text-[12px] font-bold shadow-2xl flex items-center gap-2 pointer-events-none animate-pulse">
          <Crosshair className="w-4 h-4" />
          <span>Mode Mengepaskan Titik Aktif • Tarik titik atau klik titik untuk D-Pad presisi</span>
        </div>
      )}
    </div>
  );
};
