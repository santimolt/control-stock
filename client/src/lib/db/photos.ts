import type { Photo, PhotoInput } from '@/types/photo';
import { getDB } from './index';
import { generateUUID } from '@/lib/utils/cn';
import { processImage } from '@/lib/utils/image-compression';
import { PhotoError } from '@/types/photo';

/**
 * Add a new photo to the database
 * Automatically compresses image and creates thumbnail
 */
export async function addPhoto(input: PhotoInput): Promise<Photo> {
  const db = await getDB();
  
  try {
    // Process the image (compress + thumbnail)
    const { compressed, thumbnail, originalSize, mimeType } = await processImage(input.file);
    
    const photo: Photo = {
      id: generateUUID(),
      productId: input.productId,
      blob: compressed.blob,
      thumbnail: thumbnail.blob,
      mimeType,
      size: originalSize,
      compressedSize: compressed.blob.size,
      width: compressed.width,
      height: compressed.height,
      createdAt: new Date(),
    };
    
    await db.add('photos', photo);
    return photo;
  } catch (error) {
    // Check for quota exceeded error
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      throw new PhotoError(
        'STORAGE_QUOTA_EXCEEDED',
        'No hay suficiente espacio de almacenamiento. Elimina algunas fotos.'
      );
    }
    throw error;
  }
}

/**
 * Get all photos for a product
 * Returns photos sorted by creation date (newest first)
 */
export async function getPhotosByProductId(productId: string): Promise<Photo[]> {
  const db = await getDB();
  const photos = await db.getAllFromIndex('photos', 'by-product', productId);
  
  // Sort by creation date (newest first)
  return photos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Get a single photo by ID
 */
export async function getPhotoById(id: string): Promise<Photo | undefined> {
  const db = await getDB();
  return db.get('photos', id);
}

/**
 * Delete a photo by ID
 */
export async function deletePhoto(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('photos', id);
}

/**
 * Delete all photos for a product (cascade delete)
 */
export async function deletePhotosByProductId(productId: string): Promise<void> {
  const db = await getDB();
  const photos = await getPhotosByProductId(productId);
  
  // Delete all photos in a transaction for atomicity
  const tx = db.transaction('photos', 'readwrite');
  const promises = photos.map(photo => tx.store.delete(photo.id));
  promises.push(tx.done);
  
  await Promise.all(promises);
}

/**
 * Get photo count for a product
 */
export async function getPhotoCount(productId: string): Promise<number> {
  const db = await getDB();
  return db.countFromIndex('photos', 'by-product', productId);
}

/**
 * Get total storage size used by photos for a product (in bytes)
 */
export async function getPhotosStorageSize(productId: string): Promise<number> {
  const photos = await getPhotosByProductId(productId);
  return photos.reduce((total, photo) => {
    return total + photo.blob.size + photo.thumbnail.size;
  }, 0);
}

/**
 * Get all photos across all products
 * Useful for debugging or storage management
 */
export async function getAllPhotos(): Promise<Photo[]> {
  const db = await getDB();
  return db.getAll('photos');
}

/**
 * Clear all photos (useful for testing)
 */
export async function clearAllPhotos(): Promise<void> {
  const db = await getDB();
  await db.clear('photos');
}

/**
 * Create blob URL from photo for display
 * Remember to revoke the URL when done using URL.revokeObjectURL()
 */
export function createPhotoURL(photo: Photo, useThumbnail: boolean = false): string {
  const blob = useThumbnail ? photo.thumbnail : photo.blob;
  return URL.createObjectURL(blob);
}

/**
 * Batch add multiple photos for a product
 * Returns array of created photos
 */
export async function addPhotos(productId: string, files: File[]): Promise<Photo[]> {
  const photos: Photo[] = [];
  
  // Process photos sequentially to avoid overwhelming the browser
  // and to provide better progress tracking
  for (const file of files) {
    try {
      const photo = await addPhoto({ productId, file });
      photos.push(photo);
    } catch (error) {
      console.error('Error adding photo:', error);
      // Continue with other photos even if one fails
    }
  }
  
  return photos;
}
