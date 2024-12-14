// components/photo-upload-dialog.tsx
"use client"

import React, { useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { useToast } from "../app/hooks/use-toast";
import { MapPin, CheckCircle, XCircle, X, Upload, Loader2 } from 'lucide-react';
import exifr from 'exifr';
import imageCompression from 'browser-image-compression';

interface PhotoUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete?: () => void;
}

interface PreviewFile {
  file: File;
  url: string;
  hasGPS: boolean;
  metadata?: {
    latitude?: number;
    longitude?: number;
    dateTaken?: string;
  };
}

export function PhotoUploadDialog({ open, onOpenChange, onUploadComplete }: PhotoUploadDialogProps) {
  const { toast } = useToast();
  const [previews, setPreviews] = React.useState<PreviewFile[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const checkGPSData = async (file: File): Promise<PreviewFile> => {
    return new Promise(async (resolve) => {
      try {
        // Parse EXIF data
        const exifData = await exifr.parse(file, {
          gps: true,
          exif: true,
        });
        console.log('EXIF data:', exifData);

        let hasGPS = false;
        let latitude = undefined;
        let longitude = undefined;
        let dateTaken = undefined;

        if (exifData) {
          // GPS coordinates are already converted to decimal degrees by exifr
          if (exifData.latitude !== undefined && exifData.longitude !== undefined) {
            hasGPS = true;
            latitude = exifData.latitude;
            longitude = exifData.longitude;
          }

          // Get date taken
          if (exifData.DateTimeOriginal) {
            dateTaken = exifData.DateTimeOriginal;
          }
        }

        resolve({
          file,
          url: URL.createObjectURL(file),
          hasGPS,
          metadata: {
            latitude,
            longitude,
            dateTaken
          }
        });
      } catch (error) {
        console.error('Error extracting EXIF:', error);
        resolve({
          file,
          url: URL.createObjectURL(file),
          hasGPS: false
        });
      }
    });
  };

  const handleFiles = async (files: FileList) => {
    const validFiles: File[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File",
          description: `${file.name} is not an image file`,
          variant: "destructive"
        });
        continue;
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds 10MB limit`,
          variant: "destructive"
        });
        continue;
      }

      validFiles.push(file);
    }

    // Check GPS data for all valid files
    const previewPromises = validFiles.map(checkGPSData);
    const newPreviews = await Promise.all(previewPromises);
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const items = e.dataTransfer.items;
    const files: File[] = [];
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }
    
    handleFiles(files as unknown as FileList);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadFiles = async () => {
    if (previews.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      for (let i = 0; i < previews.length; i++) {
        const preview = previews[i];
        const compressedFile = await imageCompression(preview.file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true
        });

        const formData = new FormData();
        formData.append('file', compressedFile);
        formData.append('metadata', JSON.stringify({
          title: preview.file.name.split('.')[0],
          description: '',
          ...preview.metadata
        }));

        const response = await fetch('/api/photos/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) throw new Error(`Failed to upload ${preview.file.name}`);
        
        setUploadProgress((i + 1) / previews.length * 100);
      }

      toast({
        title: "Success",
        description: `${previews.length} photo${previews.length > 1 ? 's' : ''} uploaded successfully`
      });

      onUploadComplete?.();
      onOpenChange(false);
      resetFiles();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload photos",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetFiles = () => {
    previews.forEach(preview => URL.revokeObjectURL(preview.url));
    setPreviews([]);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  React.useEffect(() => {
    return () => {
      previews.forEach(preview => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Photos</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop Zone */}
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-8 transition-colors
              ${isDragging ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-primary/50'}
              ${isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            `}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">
                Drag and drop photos here, or click to select
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Maximum 10MB per file
              </p>
            </div>
          </div>

          {/* Preview Grid */}
          {previews.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {previews.map((preview, index) => (
                <div key={preview.url} className="relative aspect-video rounded-lg overflow-hidden group">
                  <img 
                    src={preview.url} 
                    alt={`Preview ${index + 1}`}
                    className="object-cover w-full h-full"
                  />
                  {/* GPS Status Indicator */}
                  <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-black/50 text-white text-xs flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {preview.hasGPS ? (
                      <>
                        <CheckCircle className="h-3 w-3 text-green-400" />
                        <span className="text-green-400">GPS</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 text-red-400" />
                        <span className="text-red-400">No GPS</span>
                      </>
                    )}
                  </div>
                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white 
                             opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-sm text-center text-muted-foreground">
                Uploading {previews.length} photo{previews.length > 1 ? 's' : ''}...
              </p>
            </div>
          )}

          {/* Actions */}
          {previews.length > 0 && (
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={uploadFiles}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload {previews.length} Photo{previews.length > 1 ? 's' : ''}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={resetFiles}
                disabled={isUploading}
              >
                Clear All
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}