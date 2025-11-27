export interface Photo {
  id: string;              // UUID v4
  productId: string;       // Reference to product
  blob: Blob;              // Full-size compressed image
  thumbnail: Blob;         // Thumbnail for gallery grid
  mimeType: string;        // e.g., 'image/jpeg', 'image/png'
  size: number;            // Original file size in bytes
  compressedSize: number;  // Size after compression
  width: number;           // Original image width
  height: number;          // Original image height
  createdAt: Date;
}

export interface PhotoInput {
  productId: string;
  file: File;
}

export interface CompressedImage {
  blob: Blob;
  width: number;
  height: number;
}

// Constants for image processing
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_IMAGE_DIMENSION = 1920; // px
export const MAX_THUMBNAIL_DIMENSION = 400; // px
export const IMAGE_QUALITY = 0.85; // 85%
export const THUMBNAIL_QUALITY = 0.80; // 80%

// Supported image MIME types
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

export type SupportedImageType = typeof SUPPORTED_IMAGE_TYPES[number];

// Validation error types
export type PhotoValidationError = 
  | 'FILE_TOO_LARGE'
  | 'INVALID_FILE_TYPE'
  | 'INVALID_IMAGE'
  | 'COMPRESSION_FAILED'
  | 'STORAGE_QUOTA_EXCEEDED';

export class PhotoError extends Error {
  type: PhotoValidationError;
  
  constructor(type: PhotoValidationError, message: string) {
    super(message);
    this.name = 'PhotoError';
    this.type = type;
  }
}

// Helper to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Helper to check if file type is supported
export function isSupportedImageType(mimeType: string): mimeType is SupportedImageType {
  return SUPPORTED_IMAGE_TYPES.includes(mimeType as SupportedImageType);
}
