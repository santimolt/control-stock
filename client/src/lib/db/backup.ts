import { DB_VERSION } from '@/types/database';
import type { Product } from '@/types/product';
import type { Movement } from '@/types/movement';
import type { Photo } from '@/types/photo';
import { getAllProducts } from './index';
import { getAllMovements } from './movements';
import { getAllPhotos } from './photos';
import { getDB } from './index';

// =============================================================================
// Types
// =============================================================================

export interface SerializedProduct extends Omit<Product, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}

export interface SerializedMovement extends Omit<Movement, 'createdAt'> {
  createdAt: string;
}

export interface SerializedPhoto
  extends Omit<Photo, 'blob' | 'thumbnail' | 'createdAt'> {
  blobBase64: string;
  thumbnailBase64: string;
  createdAt: string;
}

export interface BackupFile {
  dbVersion: number;
  createdAt: string;
  products: SerializedProduct[];
  movements: SerializedMovement[];
  photos: SerializedPhoto[];
}

// =============================================================================
// Internal helpers
// =============================================================================

function dateToString(date: Date): string {
  return date.toISOString();
}

function stringToDate(value: string): Date {
  return new Date(value);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  return arrayBufferToBase64(arrayBuffer);
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const buffer = base64ToArrayBuffer(base64);
  return new Blob([buffer], { type: mimeType });
}

// =============================================================================
// Export
// =============================================================================

export async function exportDatabase(): Promise<BackupFile> {
  const [products, movements, photos] = await Promise.all([
    getAllProducts(),
    getAllMovements(),
    getAllPhotos(),
  ]);

  const serializedProducts: SerializedProduct[] = products.map((p) => ({
    ...p,
    createdAt: dateToString(p.createdAt),
    updatedAt: dateToString(p.updatedAt),
  }));

  const serializedMovements: SerializedMovement[] = movements.map((m) => ({
    ...m,
    createdAt: dateToString(m.createdAt),
  }));

  const serializedPhotos: SerializedPhoto[] = [];
  for (const photo of photos) {
    const blobBase64 = await blobToBase64(photo.blob);
    const thumbnailBase64 = await blobToBase64(photo.thumbnail);

    serializedPhotos.push({
      id: photo.id,
      productId: photo.productId,
      mimeType: photo.mimeType,
      size: photo.size,
      compressedSize: photo.compressedSize,
      width: photo.width,
      height: photo.height,
      createdAt: dateToString(photo.createdAt),
      blobBase64,
      thumbnailBase64,
    });
  }

  return {
    dbVersion: DB_VERSION,
    createdAt: new Date().toISOString(),
    products: serializedProducts,
    movements: serializedMovements,
    photos: serializedPhotos,
  };
}

export function downloadBackupFile(backup: BackupFile): void {
  const json = JSON.stringify(backup);
  const blob = new Blob([json], { type: 'application/json' });

  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const fileName = `control-stock-backup-${now.getFullYear()}${pad(
    now.getMonth() + 1,
  )}${pad(now.getDate())}-${pad(now.getHours())}${pad(
    now.getMinutes(),
  )}${pad(now.getSeconds())}.json`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// =============================================================================
// Import
// =============================================================================

export async function readBackupFile(file: File): Promise<BackupFile> {
  if (!file.name.toLowerCase().endsWith('.json')) {
    throw new Error('El archivo de backup debe ser un .json');
  }

  const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error('El archivo de backup es demasiado grande (límite 50MB).');
  }

  const text = await file.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('El archivo no contiene un JSON válido.');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('El archivo de backup tiene un formato incorrecto.');
  }

  const data = parsed as Partial<BackupFile>;

  if (typeof data.dbVersion !== 'number') {
    throw new Error('El archivo de backup no tiene un dbVersion válido.');
  }

  if (!Array.isArray(data.products) || !Array.isArray(data.movements) || !Array.isArray(data.photos)) {
    throw new Error('El archivo de backup no contiene las secciones esperadas.');
  }

  return {
    dbVersion: data.dbVersion,
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
    products: data.products as SerializedProduct[],
    movements: data.movements as SerializedMovement[],
    photos: data.photos as SerializedPhoto[],
  };
}

export async function importDatabase(backup: BackupFile): Promise<void> {
  if (backup.dbVersion > DB_VERSION) {
    throw new Error(
      'El backup pertenece a una versión más nueva de la app. Actualiza la aplicación antes de importar.',
    );
  }

  const db = await getDB();

  const tx = db.transaction(['products', 'movements', 'photos'], 'readwrite');
  const productsStore = tx.objectStore('products');
  const movementsStore = tx.objectStore('movements');
  const photosStore = tx.objectStore('photos');

  await Promise.all([
    productsStore.clear(),
    movementsStore.clear(),
    photosStore.clear(),
  ]);

  for (const p of backup.products) {
    const product: Product = {
      ...p,
      createdAt: stringToDate(p.createdAt),
      updatedAt: stringToDate(p.updatedAt),
    };
    await productsStore.put(product);
  }

  for (const m of backup.movements) {
    const movement: Movement = {
      ...m,
      createdAt: stringToDate(m.createdAt),
    };
    await movementsStore.put(movement);
  }

  for (const sp of backup.photos) {
    const blob = base64ToBlob(sp.blobBase64, sp.mimeType);
    const thumbnail = base64ToBlob(sp.thumbnailBase64, sp.mimeType);

    const photo: Photo = {
      id: sp.id,
      productId: sp.productId,
      blob,
      thumbnail,
      mimeType: sp.mimeType,
      size: sp.size,
      compressedSize: sp.compressedSize,
      width: sp.width,
      height: sp.height,
      createdAt: stringToDate(sp.createdAt),
    };

    await photosStore.put(photo);
  }

  await tx.done;
}


