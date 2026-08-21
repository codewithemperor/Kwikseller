'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { GripVertical, ImageIcon, Loader2, X } from 'lucide-react';
import { cn } from '../lib/utils';

export interface ImageUploadValue {
  id: string;
  url: string;
  file?: File;
  isMain?: boolean;
}

export interface ImageUploadProps {
  images: ImageUploadValue[];
  onChange: (images: ImageUploadValue[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
  accept?: string;
  isDisabled?: boolean;
  onUpload?: (file: File) => Promise<string>;
  enableReorder?: boolean;
  layout?: 'grid' | 'stack';
  className?: string;
}

export function ImageUpload({
  images,
  onChange,
  maxImages = 10,
  maxSizeMB = 5,
  accept = 'image/*',
  isDisabled = false,
  onUpload,
  enableReorder = false,
  layout = 'grid',
  className,
}: ImageUploadProps) {
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set());
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const remaining = maxImages - images.length;
      const files = acceptedFiles.slice(0, remaining);
      const newImages: ImageUploadValue[] = [];

      for (const file of files) {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const localUrl = URL.createObjectURL(file);
        const image: ImageUploadValue = {
          id,
          url: localUrl,
          file,
          isMain: images.length + newImages.length === 0,
        };

        if (onUpload) {
          setUploadingIds((prev) => new Set(prev).add(id));
          try {
            const remoteUrl = await onUpload(file);
            image.url = remoteUrl;
          } catch {
            // keep local URL on upload failure
          } finally {
            setUploadingIds((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
          }
        }

        newImages.push(image);
      }

      onChange([...images, ...newImages]);
    },
    [images, maxImages, onUpload, onChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { [accept]: [] },
    maxSize: maxSizeMB * 1024 * 1024,
    disabled: isDisabled || images.length >= maxImages,
    multiple: maxImages - images.length > 1,
  });

  const removeImage = (id: string) => {
    onChange(images.filter((img) => img.id !== id));
  };

  const setMain = (id: string) => {
    onChange(images.map((img) => ({ ...img, isMain: img.id === id })));
  };

  const handleDragStart = (idx: number) => setDragIndex(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === idx) return;
    const reordered = [...images];
    const [moved] = reordered.splice(dragIndex, 1);
    if (moved) {
      reordered.splice(idx, 0, moved);
      onChange(reordered);
      setDragIndex(idx);
    }
  };
  const handleDragEnd = () => setDragIndex(null);

  const canAddMore = images.length < maxImages;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Dropzone */}
      {canAddMore && !isDisabled && (
        <div
          {...getRootProps()}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors',
            isDragActive
              ? 'border-accent bg-accent/5'
              : 'border-kwik-border hover:border-accent hover:bg-accent/5',
          )}
        >
          <input {...getInputProps()} />
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium text-foreground">
            {isDragActive ? 'Drop images here' : 'Drag & drop images, or click to browse'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Max {maxImages} images, up to {maxSizeMB}MB each
          </p>
        </div>
      )}

      {/* Preview grid / stack */}
      {images.length > 0 && (
        <div
          className={cn(
            layout === 'grid'
              ? 'grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5'
              : 'flex flex-col gap-3',
          )}
        >
          {images.map((image, idx) => (
            <div
              key={image.id}
              draggable={enableReorder}
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => enableReorder && handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={cn(
                'group relative aspect-square overflow-hidden rounded-xl border border-kwik-border bg-default-100',
                enableReorder && 'cursor-move',
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={`Upload ${idx + 1}`}
                className="h-full w-full object-cover"
              />

              {/* Main badge */}
              {image.isMain && (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                  Main
                </span>
              )}

              {/* Drag handle */}
              {enableReorder && (
                <span className="absolute left-1.5 top-1.5 cursor-move text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <GripVertical className="h-4 w-4" />
                </span>
              )}

              {/* Loading overlay */}
              {uploadingIds.has(image.id) && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                  <Loader2 className="h-6 w-6 animate-spin text-accent" />
                </div>
              )}

              {/* Hover actions */}
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/70 opacity-0 transition-opacity group-hover:opacity-100">
                {!image.isMain && (
                  <button
                    type="button"
                    onClick={() => setMain(image.id)}
                    className="rounded-md bg-accent px-2 py-1 text-[10px] font-semibold text-accent-foreground"
                  >
                    Set main
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(image.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-danger text-white"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageUpload;
