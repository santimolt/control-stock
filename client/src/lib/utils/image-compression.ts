import {
  MAX_FILE_SIZE,
  MAX_IMAGE_DIMENSION,
  MAX_THUMBNAIL_DIMENSION,
  IMAGE_QUALITY,
  THUMBNAIL_QUALITY,
  SUPPORTED_IMAGE_TYPES,
  PhotoError,
  type CompressedImage,
  type SupportedImageType,
} from '@/types/photo';

/**
 * Validate image file before processing
 * Checks file size and type
 */
export function validateImageFile(file: File): void {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new PhotoError(
      'FILE_TOO_LARGE',
      `El archivo es muy grande. Máximo ${MAX_FILE_SIZE / 1024 / 1024}MB`
    );
  }

  // Check file type
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type as SupportedImageType)) {
    throw new PhotoError(
      'INVALID_FILE_TYPE',
      `Tipo de archivo no soportado. Solo: JPEG, PNG, WebP`
    );
  }
}

/**
 * Load image from file
 * Returns an HTMLImageElement with the loaded image
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new PhotoError('INVALID_IMAGE', 'No se pudo cargar la imagen'));
    };

    img.src = url;
  });
}

/**
 * Compress and resize image using canvas
 */
function compressImageToBlob(
  img: HTMLImageElement,
  maxDimension: number,
  quality: number,
  mimeType: string
): Promise<CompressedImage> {
  return new Promise((resolve, reject) => {
    try {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;
      
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      // Draw image on canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new PhotoError('COMPRESSION_FAILED', 'No se pudo crear el contexto del canvas');
      }

      // Enable image smoothing for better quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw the image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new PhotoError('COMPRESSION_FAILED', 'No se pudo comprimir la imagen'));
            return;
          }
          resolve({ blob, width, height });
        },
        mimeType,
        quality
      );
    } catch (error) {
      reject(new PhotoError('COMPRESSION_FAILED', 'Error al comprimir la imagen'));
    }
  });
}

/**
 * Compress full-size image
 * Max dimension: 1920px, Quality: 85%
 */
export async function compressImage(file: File): Promise<CompressedImage> {
  validateImageFile(file);
  
  const img = await loadImage(file);
  
  // Use JPEG for compression unless it's PNG or WebP
  let mimeType = file.type;
  if (!['image/png', 'image/webp'].includes(file.type)) {
    mimeType = 'image/jpeg';
  }
  
  return compressImageToBlob(img, MAX_IMAGE_DIMENSION, IMAGE_QUALITY, mimeType);
}

/**
 * Create thumbnail from image
 * Max dimension: 400px, Quality: 80%
 */
export async function createThumbnail(file: File): Promise<CompressedImage> {
  const img = await loadImage(file);
  
  // Always use JPEG for thumbnails for consistency
  return compressImageToBlob(img, MAX_THUMBNAIL_DIMENSION, THUMBNAIL_QUALITY, 'image/jpeg');
}

/**
 * Get image dimensions from file without fully loading
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new PhotoError('INVALID_IMAGE', 'No se pudo leer las dimensiones de la imagen'));
    };

    img.src = url;
  });
}

/**
 * Process image file: validate, compress, and create thumbnail
 * Returns both full-size compressed image and thumbnail
 */
export async function processImage(file: File): Promise<{
  compressed: CompressedImage;
  thumbnail: CompressedImage;
  originalSize: number;
  mimeType: string;
}> {
  validateImageFile(file);

  // Process both in parallel for better performance
  const [compressed, thumbnail] = await Promise.all([
    compressImage(file),
    createThumbnail(file),
  ]);

  return {
    compressed,
    thumbnail,
    originalSize: file.size,
    mimeType: file.type,
  };
}
