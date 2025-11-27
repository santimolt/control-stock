import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { SUPPORTED_IMAGE_TYPES, MAX_FILE_SIZE, formatFileSize } from '@/types/photo';

interface PhotoUploadProps {
  onUpload?: (files: File[]) => Promise<void>;  // Opcional para modo pending
  onFilesChange?: (files: File[]) => void;       // Para modo pending
  uploading?: boolean;
  uploadProgress?: number | null;
  multiple?: boolean;
  disabled?: boolean;
  mode?: 'upload' | 'pending';  // Modo de operación
  initialFiles?: File[];         // Archivos iniciales para modo pending
}

export function PhotoUpload({
  onUpload,
  onFilesChange,
  uploading = false,
  uploadProgress = null,
  multiple = true,
  disabled = false,
  mode = 'upload',
  initialFiles = [],
}: PhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewFiles, setPreviewFiles] = useState<File[]>(initialFiles);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const uploadInProgressRef = useRef(false);

  // Sincronizar initialFiles cuando cambian desde el padre
  useEffect(() => {
    if (mode === 'pending') {
      setPreviewFiles(initialFiles);
    }
  }, [initialFiles, mode]);

  // Notificar cambios de archivos al padre en modo pending
  useEffect(() => {
    if (mode === 'pending' && onFilesChange) {
      onFilesChange(previewFiles);
    }
  }, [previewFiles, mode, onFilesChange]);

  // Validate files
  const validateFiles = useCallback((files: File[]): { valid: File[]; errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      // Check file type
      if (!SUPPORTED_IMAGE_TYPES.includes(file.type as any)) {
        errors.push(`${file.name}: tipo no soportado`);
        return;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: muy grande (max ${formatFileSize(MAX_FILE_SIZE)})`);
        return;
      }

      valid.push(file);
    });

    return { valid, errors };
  }, []);

  // Handle file selection
  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    // Limitar a 1 foto si multiple es false
    if (!multiple && fileArray.length > 1) {
      setError('Solo se permite subir 1 foto por producto');
      setTimeout(() => setError(null), 5000);
      return;
    }

    const { valid, errors } = validateFiles(fileArray);

    if (errors.length > 0) {
      setError(errors.join(', '));
      setTimeout(() => setError(null), 5000);
    }

    if (valid.length > 0) {
      // Si ya hay una foto y multiple es false, reemplazar
      if (!multiple && previewFiles.length > 0) {
        if (mode === 'pending') {
          setPreviewFiles([valid[0]]);
          setError(null);
        } else {
          // En modo upload, reemplazar la foto existente
          setError(null);
          if (onUpload && !uploadInProgressRef.current) {
            uploadInProgressRef.current = true;
            try {
              await onUpload([valid[0]]);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Error al subir la foto');
            } finally {
              uploadInProgressRef.current = false;
            }
          }
        }
        return;
      }

      if (mode === 'pending') {
        // En modo pending, agregar (o reemplazar si multiple es false)
        if (!multiple) {
          setPreviewFiles([valid[0]]);
        } else {
          setPreviewFiles(prev => [...prev, ...valid]);
        }
        setError(null);
      } else {
        // En modo upload, subir automáticamente sin agregar a preview
        setError(null);
        
        // Subir automáticamente los archivos
        if (onUpload && !uploadInProgressRef.current) {
          uploadInProgressRef.current = true;
          try {
            await onUpload(valid);
            // Reset file input después de subir
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al subir las fotos');
          } finally {
            uploadInProgressRef.current = false;
          }
        }
      }
    }
  }, [validateFiles, mode, onUpload, previewFiles, multiple]);

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    if (disabled || uploading) return;

    const files = e.dataTransfer.files;
    handleFiles(files);
  }, [disabled, uploading, handleFiles]);

  // Handle file input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  }, [handleFiles]);

  // Eliminar archivo individual
  const handleRemoveFile = useCallback((index: number) => {
    setPreviewFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      return newFiles;
    });
  }, []);

  // Handle clear preview
  const handleClear = useCallback(() => {
    setPreviewFiles([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Open file picker
  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-4">
      {/* Drag and drop area - Ocultar si ya hay 1 foto y multiple es false */}
      {!(multiple === false && previewFiles.length >= 1) && (
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'}
            ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}
          `}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={disabled || uploading ? undefined : handleBrowseClick}
        >
        <div className="flex flex-col items-center gap-2">
          <svg
            className="w-12 h-12 text-gray-400"
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
          
          <div>
            <p className="text-sm font-medium text-gray-700">
              {isDragging ? 'Suelta la imagen aquí' : multiple ? 'Arrastra imágenes o haz clic para seleccionar' : 'Arrastra una imagen o haz clic para seleccionar'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              JPEG, PNG, WebP - Máximo {formatFileSize(MAX_FILE_SIZE)} {multiple ? 'por imagen' : ''}
              {!multiple && ' - Solo 1 foto por producto'}
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={SUPPORTED_IMAGE_TYPES.join(',')}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled || uploading || (!multiple && previewFiles.length >= 1)}
          aria-label={multiple ? "Seleccionar imágenes" : "Seleccionar imagen"}
        />
        </div>
      )}

      {/* Preview area */}
      {previewFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {previewFiles.length} {previewFiles.length === 1 ? 'imagen seleccionada' : 'imágenes seleccionadas'}
            </p>
            {mode === 'pending' && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={disabled}
              >
                Limpiar
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {previewFiles.map((file, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group max-h-48">
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-full h-full object-cover"
                  onLoad={(e) => {
                    // Cleanup: revoke URL after image loads
                    URL.revokeObjectURL((e.target as HTMLImageElement).src);
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                  {file.name}
                </div>
                {/* Botón para eliminar individual en modo pending */}
                {mode === 'pending' && (
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    aria-label="Eliminar foto"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload progress */}
      {uploadProgress !== null && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subiendo fotos...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
