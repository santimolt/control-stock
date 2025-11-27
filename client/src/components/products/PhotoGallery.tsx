import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { Photo } from '@/types/photo';
import { formatFileSize } from '@/types/photo';

interface PhotoWithURL extends Photo {
  url: string;
  thumbnailUrl: string;
}

interface PhotoGalleryProps {
  photos: PhotoWithURL[];
  loading?: boolean;
  onDelete?: (id: string) => Promise<void>;
  readonly?: boolean;
}

export function PhotoGallery({
  photos,
  loading = false,
  onDelete,
  readonly = false,
}: PhotoGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Handle keyboard navigation in lightbox
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxOpen(false);
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, currentPhotoIndex, photos.length]);

  const openLightbox = useCallback((index: number) => {
    setCurrentPhotoIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const handleNext = useCallback(() => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const handlePrevious = useCallback(() => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const handleDelete = useCallback(async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    if (!onDelete || readonly) return;

    if (!confirm('¿Estás seguro de eliminar esta foto?')) return;

    try {
      setDeleting(id);
      await onDelete(id);
      
      // If we're in lightbox and deleted the current photo, adjust index
      if (lightboxOpen && photos[currentPhotoIndex]?.id === id) {
        if (photos.length <= 1) {
          setLightboxOpen(false);
        } else if (currentPhotoIndex >= photos.length - 1) {
          setCurrentPhotoIndex(photos.length - 2);
        }
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
    } finally {
      setDeleting(null);
    }
  }, [onDelete, readonly, lightboxOpen, currentPhotoIndex, photos]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-gray-200 rounded-lg animate-pulse"
            aria-label="Cargando foto"
          />
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-600">No hay fotos aún</p>
        <p className="text-xs text-gray-500">Sube algunas fotos para comenzar</p>
      </div>
    );
  }

  const currentPhoto = photos[currentPhotoIndex];

  return (
    <>
      {/* Gallery Grid */}
      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
        </p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="relative aspect-square group cursor-pointer rounded-lg overflow-hidden bg-gray-100"
              onClick={() => openLightbox(index)}
              role="button"
              tabIndex={0}
              aria-label={`Ver foto ${index + 1} de ${photos.length}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openLightbox(index);
                }
              }}
            >
              <img
                src={photo.thumbnailUrl}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                loading="lazy"
              />
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                  />
                </svg>
              </div>

              {/* Delete button */}
              {!readonly && onDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                  onClick={(e) => handleDelete(photo.id, e)}
                  disabled={deleting === photo.id}
                  aria-label="Eliminar foto"
                >
                  {deleting === photo.id ? (
                    <span className="text-xs">...</span>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl w-full p-0 bg-black/95">
          <div className="relative">
            {/* Close button */}
            <Button
              variant="ghost"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
              onClick={closeLightbox}
              aria-label="Cerrar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>

            {/* Image */}
            {currentPhoto && (
              <div className="flex flex-col items-center p-8">
                <img
                  src={currentPhoto.url}
                  alt={`Foto ${currentPhotoIndex + 1} de ${photos.length}`}
                  className="max-h-[70vh] w-auto object-contain rounded"
                />

                {/* Image info */}
                <div className="mt-4 text-white text-sm text-center space-y-1">
                  <p>
                    Foto {currentPhotoIndex + 1} de {photos.length}
                  </p>
                  <p className="text-gray-400">
                    {currentPhoto.width} × {currentPhoto.height} px • {formatFileSize(currentPhoto.compressedSize)}
                  </p>
                </div>

                {/* Navigation buttons */}
                <div className="flex gap-4 mt-6">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={photos.length <= 1}
                    className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                    aria-label="Foto anterior"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Anterior
                  </Button>

                  {!readonly && onDelete && (
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(currentPhoto.id)}
                      disabled={deleting === currentPhoto.id}
                      aria-label="Eliminar esta foto"
                    >
                      {deleting === currentPhoto.id ? 'Eliminando...' : 'Eliminar'}
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={handleNext}
                    disabled={photos.length <= 1}
                    className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                    aria-label="Siguiente foto"
                  >
                    Siguiente
                    <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
