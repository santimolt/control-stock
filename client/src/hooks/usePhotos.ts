import { useState, useEffect, useCallback, useRef } from 'react';
import type { Photo } from '@/types/photo';
import * as photosDB from '@/lib/db/photos';

interface PhotoWithURL extends Photo {
  url: string;
  thumbnailUrl: string;
}

interface UsePhotosReturn {
  photos: PhotoWithURL[];
  loading: boolean;
  error: string | null;
  uploadProgress: number | null;
  addPhoto: (file: File) => Promise<void>;
  addPhotos: (files: File[]) => Promise<void>;
  deletePhoto: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Custom hook for managing photos for a specific product
 * Automatically loads photos and manages blob URLs
 */
export function usePhotos(productId: string | undefined): UsePhotosReturn {
  const [photos, setPhotos] = useState<PhotoWithURL[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  
  // Keep track of created URLs for cleanup
  const urlsRef = useRef<Set<string>>(new Set());

  // Cleanup function to revoke all blob URLs
  const cleanupURLs = useCallback(() => {
    urlsRef.current.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        // Ignore errors during cleanup
      }
    });
    urlsRef.current.clear();
  }, []);

  // Convert Photo to PhotoWithURL by creating blob URLs
  const createPhotoWithURL = useCallback((photo: Photo): PhotoWithURL => {
    const url = photosDB.createPhotoURL(photo, false);
    const thumbnailUrl = photosDB.createPhotoURL(photo, true);
    
    // Track URLs for cleanup
    urlsRef.current.add(url);
    urlsRef.current.add(thumbnailUrl);
    
    return {
      ...photo,
      url,
      thumbnailUrl,
    };
  }, []);

  // Load photos for the product
  const loadPhotos = useCallback(async () => {
    if (!productId) {
      setPhotos([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Cleanup old URLs before loading new ones
      cleanupURLs();
      
      const loadedPhotos = await photosDB.getPhotosByProductId(productId);
      const photosWithURLs = loadedPhotos.map(createPhotoWithURL);
      
      setPhotos(photosWithURLs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error cargando fotos';
      setError(errorMessage);
      console.error('Error loading photos:', err);
    } finally {
      setLoading(false);
    }
  }, [productId, cleanupURLs, createPhotoWithURL]);

  // Load photos on mount and when productId changes
  useEffect(() => {
    loadPhotos();
    
    // Cleanup URLs when component unmounts or productId changes
    return () => {
      cleanupURLs();
    };
  }, [loadPhotos, cleanupURLs]);

  // Add a single photo
  const addPhoto = useCallback(async (file: File): Promise<void> => {
    if (!productId) {
      throw new Error('No product ID provided');
    }

    try {
      setError(null);
      setUploadProgress(0);
      
      const photo = await photosDB.addPhoto({ productId, file });
      const photoWithURL = createPhotoWithURL(photo);
      
      // Add to the beginning of the array (newest first)
      setPhotos(prev => [photoWithURL, ...prev]);
      setUploadProgress(100);
      
      // Clear progress after a short delay
      setTimeout(() => setUploadProgress(null), 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error subiendo foto';
      setError(errorMessage);
      setUploadProgress(null);
      console.error('Error adding photo:', err);
      throw err;
    }
  }, [productId, createPhotoWithURL]);

  // Add multiple photos
  const addMultiplePhotos = useCallback(async (files: File[]): Promise<void> => {
    if (!productId) {
      throw new Error('No product ID provided');
    }

    if (files.length === 0) return;

    try {
      setError(null);
      setUploadProgress(0);
      
      const newPhotos: PhotoWithURL[] = [];
      
      // Process photos one by one to track progress
      for (let i = 0; i < files.length; i++) {
        try {
          const photo = await photosDB.addPhoto({ productId, file: files[i] });
          const photoWithURL = createPhotoWithURL(photo);
          newPhotos.push(photoWithURL);
          
          // Update progress
          setUploadProgress(Math.round(((i + 1) / files.length) * 100));
        } catch (err) {
          console.error(`Error uploading photo ${i + 1}:`, err);
          // Continue with other photos
        }
      }
      
      // Add all new photos to the beginning
      if (newPhotos.length > 0) {
        setPhotos(prev => [...newPhotos, ...prev]);
      }
      
      // Clear progress after a short delay
      setTimeout(() => setUploadProgress(null), 1000);
      
      // Show error if not all photos were uploaded
      if (newPhotos.length < files.length) {
        setError(`Solo se pudieron subir ${newPhotos.length} de ${files.length} fotos`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error subiendo fotos';
      setError(errorMessage);
      setUploadProgress(null);
      console.error('Error adding photos:', err);
      throw err;
    }
  }, [productId, createPhotoWithURL]);

  // Delete a photo
  const deletePhoto = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      
      // Find the photo to revoke its URLs
      const photo = photos.find(p => p.id === id);
      if (photo) {
        URL.revokeObjectURL(photo.url);
        URL.revokeObjectURL(photo.thumbnailUrl);
        urlsRef.current.delete(photo.url);
        urlsRef.current.delete(photo.thumbnailUrl);
      }
      
      await photosDB.deletePhoto(id);
      setPhotos(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error eliminando foto';
      setError(errorMessage);
      console.error('Error deleting photo:', err);
      throw err;
    }
  }, [photos]);

  return {
    photos,
    loading,
    error,
    uploadProgress,
    addPhoto,
    addPhotos: addMultiplePhotos,
    deletePhoto,
    refresh: loadPhotos,
  };
}
