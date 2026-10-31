import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UnitData, SiteplanConfig } from '../types';
import {
  BASELINE_UNITS,
  createInitialUnitData,
  getInitialUnitsList,
  sortUnitsAlphanumeric,
} from '../data/initialUnits';

const UNITS_COLLECTION = 'units';
const CONFIG_COLLECTION = 'siteplan_config';
const CONFIG_DOC_ID = 'main';
const DELETED_UNITS_STORAGE_KEY = 'gis_deleted_unit_ids';

const OBSOLETE_UNIT_IDS = new Set([
  'B04B',
  'B29',
  'B15B',
  'B15C',
  'B15D',
  'C15B',
  'D16',
  'D18',
  'D19',
]);

function getDeletedUnitIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_UNITS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed);
      }
    }
  } catch (e) {
    console.warn('Gagal membaca daftar unit terhapus dari localStorage:', e);
  }
  return new Set();
}

function saveDeletedUnitIds(ids: Set<string>): void {
  try {
    localStorage.setItem(DELETED_UNITS_STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch (e) {
    console.warn('Gagal menyimpan daftar unit terhapus ke localStorage:', e);
  }
}

const deletedUnitIds = getDeletedUnitIds();
let hasMigratedBaseline = false;

/**
 * Strip undefined values recursively so Firestore writeBatch/setDoc never throws
 * "Unsupported field value: undefined"
 */
function sanitizeForFirestore<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Real-time listener for all units.
 * If Firestore is empty on first boot, it seeds the baseline units.
 * Once loaded, any unit deleted by the user stays deleted and is never re-added.
 */
export function subscribeToUnits(
  onUpdate: (units: UnitData[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const unitsRef = collection(db, UNITS_COLLECTION);

  const unsubscribe = onSnapshot(
    unitsRef,
    async (snapshot) => {
      if (snapshot.empty && !hasMigratedBaseline) {
        hasMigratedBaseline = true;
        console.log('Koleksi units di Firestore masih kosong. Melakukan inisialisasi seeding...');
        const initial = getInitialUnitsList().filter((u) => !deletedUnitIds.has(u.id));
        onUpdate(sortUnitsAlphanumeric(initial));
        try {
          await seedInitialUnits(initial);
        } catch (err) {
          console.error('Error saat seeding awal:', err);
          handleFirestoreError(err, OperationType.WRITE, UNITS_COLLECTION);
          if (onError) onError(err);
        }
        return;
      }

      const existingMap = new Map<string, UnitData>();
      let hasObsolete = false;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as UnitData;
        const unitId = docSnap.id;
        if (OBSOLETE_UNIT_IDS.has(unitId) || deletedUnitIds.has(unitId)) {
          hasObsolete = true;
        } else {
          existingMap.set(unitId, {
            ...data,
            id: unitId,
          });
        }
      });

      // Only run baseline migration once on initial app load
      if (!hasMigratedBaseline) {
        hasMigratedBaseline = true;

        const a13 = existingMap.get('A13');
        const d10 = existingMap.get('D10');
        const needsCoordCalibration =
          (a13 && Math.abs(a13.x - 93.1) > 0.1) ||
          (d10 && Math.abs(d10.x - 73.8) > 0.1);

        if (hasObsolete || needsCoordCalibration) {
          try {
            const batch = writeBatch(db);

            snapshot.forEach((docSnap) => {
              if (OBSOLETE_UNIT_IDS.has(docSnap.id) || deletedUnitIds.has(docSnap.id)) {
                batch.delete(doc(db, UNITS_COLLECTION, docSnap.id));
              }
            });

            if (needsCoordCalibration) {
              BASELINE_UNITS.forEach((base) => {
                if (deletedUnitIds.has(base.id)) return;
                const existing = existingMap.get(base.id);
                if (existing) {
                  const updatedUnit = sanitizeForFirestore({
                    ...existing,
                    id: base.id,
                    display: base.display,
                    block: base.block,
                    x: base.x,
                    y: base.y,
                    updatedAt: new Date().toISOString(),
                  });
                  existingMap.set(base.id, updatedUnit);
                  batch.set(doc(db, UNITS_COLLECTION, base.id), updatedUnit, { merge: true });
                }
              });
            }

            await batch.commit();
          } catch (err) {
            console.error('Error saat migrasi & kalibrasi unit otomatis:', err);
          }
        }
      }

      // Immediately update UI with the current Firestore units
      const sorted = sortUnitsAlphanumeric(Array.from(existingMap.values()));
      onUpdate(sorted);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, UNITS_COLLECTION);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
}

/**
 * Seed initial baseline units into Firestore in chunks of 500 (batch limit)
 */
export async function seedInitialUnits(units: UnitData[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    units.forEach((unit) => {
      const docRef = doc(db, UNITS_COLLECTION, unit.id);
      batch.set(
        docRef,
        sanitizeForFirestore({
          ...unit,
          updatedAt: new Date().toISOString(),
        })
      );
    });
    await batch.commit();
    console.log(`Berhasil seeding ${units.length} unit ke Firebase.`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, UNITS_COLLECTION);
    throw error;
  }
}

/**
 * Save or update a single unit in Firestore in real-time
 */
export async function saveUnitToFirestore(unit: UnitData): Promise<void> {
  const path = `${UNITS_COLLECTION}/${unit.id}`;
  try {
    if (deletedUnitIds.has(unit.id)) {
      deletedUnitIds.delete(unit.id);
      saveDeletedUnitIds(deletedUnitIds);
    }
    const docRef = doc(db, UNITS_COLLECTION, unit.id);
    await setDoc(
      docRef,
      sanitizeForFirestore({
        ...unit,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Batch update multiple units (e.g. after Auto-Sort, Renumber, or Position adjustments)
 */
export async function batchUpdateUnits(units: UnitData[]): Promise<void> {
  try {
    const batchSize = 450;
    for (let i = 0; i < units.length; i += batchSize) {
      const chunk = units.slice(i, i + batchSize);
      const batch = writeBatch(db);
      chunk.forEach((unit) => {
        const docRef = doc(db, UNITS_COLLECTION, unit.id);
        batch.set(
          docRef,
          sanitizeForFirestore({
            ...unit,
            updatedAt: new Date().toISOString(),
          }),
          { merge: true }
        );
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, UNITS_COLLECTION);
    throw error;
  }
}

/**
 * Delete a unit from Firestore and record its deletion so it is not re-seeded
 */
export async function deleteUnitFromFirestore(unitId: string): Promise<void> {
  const path = `${UNITS_COLLECTION}/${unitId}`;
  deletedUnitIds.add(unitId);
  saveDeletedUnitIds(deletedUnitIds);

  try {
    const docRef = doc(db, UNITS_COLLECTION, unitId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

/**
 * Real-time listener for siteplan global configuration (background image, scale, etc.)
 */
export function subscribeToSiteplanConfig(
  onUpdate: (config: SiteplanConfig | null) => void,
  onError?: (err: unknown) => void
): () => void {
  const docRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);

  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as SiteplanConfig);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `${CONFIG_COLLECTION}/${CONFIG_DOC_ID}`);
      if (onError) onError(error);
    }
  );
}

/**
 * Save siteplan configuration to Firestore
 */
export async function saveSiteplanConfig(config: Partial<SiteplanConfig>): Promise<void> {
  const path = `${CONFIG_COLLECTION}/${CONFIG_DOC_ID}`;
  try {
    const docRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
    await setDoc(
      docRef,
      sanitizeForFirestore({
        id: CONFIG_DOC_ID,
        ...config,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}
