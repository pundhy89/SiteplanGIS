import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UnitData, SiteplanConfig } from './types';
import { getInitialUnitsList, createInitialUnitData, sortUnitsAlphanumeric } from './data/initialUnits';
import {
  subscribeToUnits,
  saveUnitToFirestore,
  batchUpdateUnits,
  deleteUnitFromFirestore,
  subscribeToSiteplanConfig,
  saveSiteplanConfig,
} from './services/unitSync';
import { testConnection } from './firebase';
import { HeaderBar } from './components/HeaderBar';
import { SiteplanCanvas } from './components/SiteplanCanvas';
import { UnitDetailModal } from './components/UnitDetailModal';
import { EditUnitModal } from './components/EditUnitModal';
import { ReportExportModal } from './components/ReportExportModal';
import { LoginScreen } from './components/LoginScreen';

export default function App() {
  // Authentication State (Initial Login Gate: default admin / admin)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('gis_auth_session') === 'true';
  });

  // Main Units State (synced real-time from Firebase)
  const [units, setUnits] = useState<UnitData[]>(() => getInitialUnitsList());
  const [siteplanConfig, setSiteplanConfig] = useState<SiteplanConfig | null>(null);

  // Connection & Sync States
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Active Interactive States
  const [selectedUnit, setSelectedUnit] = useState<UnitData | null>(null);
  const [editingUnit, setEditingUnit] = useState<UnitData | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  // View / Edit / Filter States
  const [isEditMode, setIsEditMode] = useState(false);
  const [pointScale, setPointScale] = useState(1.0);
  const [activeFilterStatus, setActiveFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Debounce ref for drag-and-drop position saving
  const saveTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Show Toast Notification
  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 3200);
  }, []);

  // 1. Initial Connection Test & Real-time Subscriptions
  useEffect(() => {
    testConnection().then((connected) => {
      setIsFirebaseConnected(connected);
      if (connected) {
        showNotification('Terhubung ke Firebase • Sinkronisasi real-time aktif');
      }
    });

    // Real-time Units Subscription
    const unsubUnits = subscribeToUnits(
      (realtimeUnits) => {
        setUnits(realtimeUnits);
        setIsFirebaseConnected(true);
      },
      (err) => {
        console.warn('Subscription error:', err);
      }
    );

    // Real-time Config Subscription
    const unsubConfig = subscribeToSiteplanConfig(
      (config) => {
        if (config) {
          setSiteplanConfig(config);
          if (config.pointScale) setPointScale(config.pointScale);
        }
      },
      (err) => {
        console.warn('Config subscription error:', err);
      }
    );

    return () => {
      unsubUnits();
      unsubConfig();
      // Clear any pending timeouts
      Object.values(saveTimeoutRef.current).forEach(clearTimeout);
    };
  }, [showNotification]);

  // Keep selectedUnit synced with latest real-time data
  useEffect(() => {
    if (selectedUnit) {
      const latest = units.find((u) => u.id === selectedUnit.id);
      if (latest && latest !== selectedUnit) {
        setSelectedUnit(latest);
      }
    }
  }, [units, selectedUnit]);

  // Update Unit Position (Drag-and-drop or Nudge) with instant local feedback and debounced Firestore sync
  const handleUpdateUnitPosition = useCallback(
    (unitId: string, x: number, y: number) => {
      // 1. Optimistic local update for 60fps smoothness
      setUnits((prev) =>
        prev.map((u) => (u.id === unitId ? { ...u, x, y, updatedAt: new Date().toISOString() } : u))
      );

      // 2. Debounced save to Firestore
      if (saveTimeoutRef.current[unitId]) {
        clearTimeout(saveTimeoutRef.current[unitId]);
      }

      setIsSyncing(true);
      saveTimeoutRef.current[unitId] = setTimeout(async () => {
        try {
          const currentUnit = units.find((u) => u.id === unitId);
          if (currentUnit) {
            await saveUnitToFirestore({
              ...currentUnit,
              x,
              y,
              updatedAt: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error('Gagal menyimpan posisi ke Firestore:', error);
          showNotification('Gagal menyimpan posisi unit ke cloud');
        } finally {
          setIsSyncing(false);
          delete saveTimeoutRef.current[unitId];
        }
      }, 400);
    },
    [units, showNotification]
  );

  // Save Unit Full Data (Status, Booking, Construction, Service Mutu, Persetujuan)
  const handleSaveUnitData = useCallback(
    async (updatedUnit: UnitData) => {
      setIsSyncing(true);
      // Optimistic local update
      setUnits((prev) => prev.map((u) => (u.id === updatedUnit.id ? updatedUnit : u)));
      if (selectedUnit && selectedUnit.id === updatedUnit.id) {
        setSelectedUnit(updatedUnit);
      }

      try {
        await saveUnitToFirestore(updatedUnit);
        showNotification(`Unit ${updatedUnit.display} berhasil diperbarui di cloud`);
      } catch (err) {
        console.error('Error saat simpan unit:', err);
        showNotification('Gagal memperbarui unit di Firebase');
      } finally {
        setIsSyncing(false);
      }
    },
    [selectedUnit, showNotification]
  );

  // Add New Unit
  const handleAddNewUnit = useCallback(async () => {
    const nextBlock = 'A';
    const existingIds = new Set(units.map((u) => u.id.toUpperCase()));
    let num = units.filter((u) => u.block === nextBlock).length + 1;
    while (existingIds.has(`${nextBlock}${num.toString().padStart(2, '0')}`)) {
      num++;
    }
    const nextNum = num.toString().padStart(2, '0');
    const newId = `${nextBlock}${nextNum}`;
    const newDisplay = `${nextBlock}.${nextNum}`;

    const newUnit = createInitialUnitData(
      {
        id: newId,
        display: newDisplay,
        block: nextBlock,
        x: 50,
        y: 50,
        defaultStatus: 'tersedia',
      },
      units.length
    );

    setIsSyncing(true);
    setUnits((prev) => sortUnitsAlphanumeric([...prev, newUnit]));

    try {
      await saveUnitToFirestore(newUnit);
      showNotification(`Unit baru ${newDisplay} ditambahkan di tengah denah`);
      setEditingUnit(newUnit);
    } catch (err) {
      console.error('Error add unit:', err);
      showNotification('Gagal menambahkan unit baru ke Firebase');
    } finally {
      setIsSyncing(false);
    }
  }, [units, showNotification]);

  // Delete Unit
  const handleDeleteUnit = useCallback(
    async (unitId: string) => {
      // Cancel any pending debounced drag/nudge save for this unit
      if (saveTimeoutRef.current[unitId]) {
        clearTimeout(saveTimeoutRef.current[unitId]);
        delete saveTimeoutRef.current[unitId];
      }

      setIsSyncing(true);
      setUnits((prev) => prev.filter((u) => u.id !== unitId));
      if (selectedUnit && selectedUnit.id === unitId) setSelectedUnit(null);
      if (editingUnit && editingUnit.id === unitId) setEditingUnit(null);

      try {
        await deleteUnitFromFirestore(unitId);
        showNotification(`Unit ${unitId} berhasil dihapus`);
      } catch (err) {
        console.error('Error delete unit:', err);
        showNotification('Gagal menghapus unit dari cloud');
      } finally {
        setIsSyncing(false);
      }
    },
    [selectedUnit, editingUnit, showNotification]
  );

  // Change point scale
  const handleChangePointScale = useCallback(
    async (newScale: number) => {
      const clamped = Math.max(0.6, Math.min(2.0, Number(newScale.toFixed(2))));
      setPointScale(clamped);
      try {
        await saveSiteplanConfig({ pointScale: clamped });
      } catch (err) {
        console.warn('Gagal simpan skala titik:', err);
      }
    },
    []
  );

  // Background trigger
  const handleTriggerUploadBackground = () => {
    const input = document.getElementById('bg-file-input') as HTMLInputElement | null;
    if (input) input.click();
  };

  const handleBackgroundFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|avi)$/i.test(file.name);
    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      const updatedCfg: Partial<SiteplanConfig> = {
        bgType: isVideo ? 'video' : 'image',
        bgFileName: file.name,
        bgUrl: result,
      };
      setSiteplanConfig((prev) => (prev ? { ...prev, ...updatedCfg } : (updatedCfg as SiteplanConfig)));
      try {
        await saveSiteplanConfig(updatedCfg);
        showNotification(`Latar belakang tersimpan ke cloud: ${file.name}`);
      } catch (err) {
        console.error('Gagal simpan latar ke cloud:', err);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLoginSuccess={(user) => {
          sessionStorage.setItem('gis_auth_session', 'true');
          setIsAuthenticated(true);
          showNotification(`Selamat datang, ${user}`);
        }}
      />
    );
  }

  return (
    <div className="w-screen h-screen bg-black text-white overflow-hidden relative select-none">
      {/* Hidden File Input for Background Upload */}
      <input
        id="bg-file-input"
        type="file"
        accept="image/*,video/*,.mp4,.webm,.mov,.gif"
        onChange={handleBackgroundFileInput}
        className="hidden"
      />

      {/* Global Toast Notification */}
      {notification && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full bg-white text-black font-semibold text-[12px] shadow-2xl border border-slate-200 flex items-center gap-2 animate-bounce">
          <span>{notification}</span>
        </div>
      )}

      {/* Interactive Siteplan Canvas (Fullscreen Autofit) */}
      <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
        <SiteplanCanvas
          units={units}
          selectedUnit={selectedUnit}
          onSelectUnit={setSelectedUnit}
          isEditMode={isEditMode}
          onToggleEditMode={() => setIsEditMode(!isEditMode)}
          pointScale={pointScale}
          onChangePointScale={handleChangePointScale}
          onUpdateUnitPosition={handleUpdateUnitPosition}
          onQuickEditUnit={(u) => setEditingUnit(u)}
          onDeleteUnit={handleDeleteUnit}
          siteplanConfig={siteplanConfig}
          onUpdateConfig={async (cfg) => {
            setSiteplanConfig((prev) => (prev ? { ...prev, ...cfg } : (cfg as SiteplanConfig)));
            await saveSiteplanConfig(cfg);
          }}
          onShowNotification={showNotification}
          activeFilterStatus={activeFilterStatus}
          searchQuery={searchQuery}
        />
      </div>

      {/* Floating Buttons & Controls Overlaid on top of background & compact status bottom-left */}
      <HeaderBar
        units={units}
        activeFilterStatus={activeFilterStatus}
        onSelectFilterStatus={setActiveFilterStatus}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isEditMode={isEditMode}
        onToggleEditMode={() => {
          setIsEditMode(!isEditMode);
          showNotification(!isEditMode ? 'Mode Mengepaskan Titik Aktif' : 'Mode Edit Dinonaktifkan');
        }}
        onAddNewUnit={handleAddNewUnit}
        isFirebaseConnected={isFirebaseConnected}
        isSyncing={isSyncing}
        onUploadBackground={handleTriggerUploadBackground}
        pointScale={pointScale}
        onChangePointScale={handleChangePointScale}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onLogout={() => {
          sessionStorage.removeItem('gis_auth_session');
          setIsAuthenticated(false);
          setIsEditMode(false);
        }}
      />

      {/* Aggregated Report & Offline PDF Export Modal */}
      <ReportExportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        units={units}
        initialFilterStatus={activeFilterStatus}
        onShowNotification={showNotification}
      />

      {/* Unit Detail Modal (SPR Booking, Berkas, 8-Stage Progress, Service Mutu, Persetujuan) */}
      <UnitDetailModal
        unit={selectedUnit}
        onClose={() => setSelectedUnit(null)}
        onUpdateUnit={handleSaveUnitData}
        onShowNotification={showNotification}
      />

      {/* Quick Edit Unit Modal */}
      <EditUnitModal
        unit={editingUnit}
        onClose={() => setEditingUnit(null)}
        onSave={handleSaveUnitData}
        onDelete={handleDeleteUnit}
      />
    </div>
  );
}
