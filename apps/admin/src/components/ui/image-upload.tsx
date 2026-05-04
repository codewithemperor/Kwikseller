"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "@heroui/react";
import { cn } from "@/lib/utils";

export interface ImageUploadValue {
  id: string;
  url: string;
  file?: File;
}

export interface ImageUploadProps {
  images: ImageUploadValue[];
  onChange: (images: ImageUploadValue[]) => void;
  maxImages?: number;
  className?: string;
  isDisabled?: boolean;
}

export function ImageUpload({
  images,
  onChange,
  maxImages = 10,
  className,
  isDisabled = false,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const nextPreviewUrls = new Set(
      images.filter((image) => image.file).map((image) => image.url),
    );

    for (const url of previewUrlsRef.current) {
      if (!nextPreviewUrls.has(url)) {
        URL.revokeObjectURL(url);
      }
    }

    previewUrlsRef.current = nextPreviewUrls;
  }, [images]);

  useEffect(() => {
    return () => {
      for (const url of previewUrlsRef.current) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  const queueFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remaining = maxImages - images.length;

      if (remaining <= 0) {
        toast.danger(`Maximum ${maxImages} images allowed`);
        return;
      }

      const nextImages: ImageUploadValue[] = [];

      for (const file of fileArray.slice(0, remaining)) {
        if (!file.type.startsWith("image/")) {
          toast.danger(`${file.name} is not an image`);
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          toast.danger(`${file.name} is too large (max 5MB)`);
          continue;
        }

        nextImages.push({
          id:
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `${Date.now()}-${file.name}`,
          url: URL.createObjectURL(file),
          file,
        });
      }

      if (nextImages.length > 0) {
        onChange([...images, ...nextImages]);
      }
    },
    [images, maxImages, onChange],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!isDisabled) setIsDragging(true);
    },
    [isDisabled],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (!isDisabled && e.dataTransfer.files.length > 0) {
        queueFiles(e.dataTransfer.files);
      }
    },
    [isDisabled, queueFiles],
  );

  const handleRemove = useCallback(
    (index: number) => onChange(images.filter((_, i) => i !== index)),
    [images, onChange],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        queueFiles(e.target.files);
        e.target.value = "";
      }
    },
    [queueFiles],
  );

  return (
    <div className={cn("space-y-3", className)}>
      <div
        className={cn(
          "relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors",
          isDragging
            ? "border-accent bg-accent/5"
            : "border-default-300 hover:border-accent/50 hover:bg-accent/5",
          isDisabled && "cursor-not-allowed opacity-50",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isDisabled && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!isDisabled) fileInputRef.current?.click();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
          disabled={isDisabled}
        />
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
          <svg
            className="h-5 w-5 text-accent"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 16V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v0" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">
            Drop images here or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            PNG, JPG, WEBP up to 5MB (max {maxImages}). Files upload when you
            save.
          </p>
        </div>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="group relative aspect-square overflow-hidden rounded-lg border bg-default-100"
            >
              <img
                src={image.url}
                alt={`Upload ${index + 1}`}
                className="h-full w-full object-cover"
              />
              {!isDisabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(index);
                  }}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-danger text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  Ã—
                </button>
              )}
              {index === 0 && (
                <span className="absolute bottom-1 left-1 rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">
                  Main
                </span>
              )}
              {image.file && (
                <span className="absolute bottom-1 right-1 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  New
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
