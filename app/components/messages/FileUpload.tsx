'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Paperclip, X, File, AlertCircle, Check } from 'lucide-react';
import { useUploadAttachment } from '@/hooks/useMessaging';
import type { FileUploadProgress } from '@/types/messaging';

interface FileUploadProps {
  messageId: string;
  onUploadComplete?: () => void;
  onUploadError?: (error: string) => void;
}

const ALLOWED_FILE_TYPES = {
  // EA files
  'application/octet-stream': ['.ex4', '.ex5', '.mq4', '.mq5'],
  // Documents
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  // Images
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function FileUpload({ messageId, onUploadComplete, onUploadError }: FileUploadProps) {
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadMutation = useUploadAttachment();

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 50MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB)`;
    }

    // Check file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isAllowed = Object.values(ALLOWED_FILE_TYPES)
      .flat()
      .some(ext => ext === extension);

    if (!isAllowed) {
      return `File type ${extension} is not supported. Allowed: ${Object.values(ALLOWED_FILE_TYPES).flat().join(', ')}`;
    }

    return null;
  };

  const handleUpload = useCallback(async (file: File) => {
    setError(null);

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      onUploadError?.(validationError);
      return;
    }

    // Set initial progress
    setUploadProgress({
      file,
      progress: 0,
      status: 'uploading',
    });

    try {
      // Upload the file
      await uploadMutation.mutateAsync({
        messageId,
        file,
      });

      setUploadProgress({
        file,
        progress: 100,
        status: 'success',
      });

      onUploadComplete?.();

      // Clear after 2 seconds
      setTimeout(() => {
        setUploadProgress(null);
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to upload file';
      setError(errorMessage);
      setUploadProgress({
        file,
        progress: 0,
        status: 'error',
        error: errorMessage,
      });
      onUploadError?.(errorMessage);
    }
  }, [messageId, uploadMutation, onUploadComplete, onUploadError]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleUpload(acceptedFiles[0]);
    }
  }, [handleUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: MAX_FILE_SIZE,
    accept: ALLOWED_FILE_TYPES,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleCancel = () => {
    setUploadProgress(null);
    setError(null);
  };

  if (uploadProgress) {
    return (
      <div className="p-4 border rounded-lg bg-background">
        <div className="flex items-start gap-3">
          <File className="h-5 w-5 text-muted-foreground mt-1" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{uploadProgress.file.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(uploadProgress.file.size)}
            </p>
            
            {uploadProgress.status === 'uploading' && (
              <div className="mt-2">
                <Progress value={uploadProgress.progress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Uploading... {uploadProgress.progress}%
                </p>
              </div>
            )}

            {uploadProgress.status === 'success' && (
              <div className="flex items-center gap-2 mt-2 text-green-600 dark:text-green-400">
                <Check className="h-4 w-4" />
                <p className="text-xs">Upload complete!</p>
              </div>
            )}

            {uploadProgress.status === 'error' && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {uploadProgress.error}
                </AlertDescription>
              </Alert>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50'
        }`}
        data-testid="file-upload-dropzone"
      >
        <input {...getInputProps()} />
        <Paperclip className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm font-medium">
          {isDragActive ? 'Drop file here...' : 'Drag & drop or click to upload'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Max 50MB • EAs (.ex4, .ex5, .mq4, .mq5), PDFs, Images
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
