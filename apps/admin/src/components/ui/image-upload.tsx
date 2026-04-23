"use client";

import React, { useCallback, useState, useRef } from "react";
import { Spinner } from "@heroui/react";
import { cn } from "@/lib/utils";
import { uploadApi } from "@/lib/api";
import { toast } from "sonner";

export interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
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
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remaining = maxImages - images.length;
      if (remaining <= 0) { toast.error(`Maximum ${maxImages} images allowed`); return; }
      const filesToUpload = fileArray.slice(0, remaining);
      setIsUploading(true);
      try {
        const newUrls: string[] = [];
        for (const file of filesToUpload) {
          if (!file.type.startsWith("image/")) { toast.error(`${file.name} is not an image`); continue; }
          if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} is too large (max 5MB)`); continue; }
          try { const res = await uploadApi.upload(file); newUrls.push(res.data.url); } catch { toast.error(`Failed to upload ${file.name}`); }
        }
        if (newUrls.length > 0) { onChange([...images, ...newUrls]); toast.success(`${newUrls.length} image(s) uploaded`); }
      } finally { setIsUploading(false); }
    },
    [images, maxImages, onChange],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); if (!isDisabled) setIsDragging(true); }, [isDisabled]);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); if (!isDisabled && e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files); }, [isDisabled, uploadFiles]);
  const handleRemove = useCallback((index: number) => onChange(images.filter((_, i) => i !== index)), [images, onChange]);
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files.length > 0) { uploadFiles(e.target.files); e.target.value = ""; } }, [uploadFiles]);

  return (
    <div className={cn("space-y-3", className)}>
      <div className={cn("relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors", isDragging ? "border-accent bg-accent/5" : "border-default-300 hover:border-accent/50 hover:bg-accent/5", isDisabled && "cursor-not-allowed opacity-50")} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => !isDisabled && fileInputRef.current?.click()} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (!isDisabled) fileInputRef.current?.click(); } }}>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} disabled={isDisabled} />
        {isUploading ? (
          <div className="flex flex-col items-center gap-2"><Spinner size="lg" color="warning" /><p className="text-sm text-muted-foreground">Uploading...</p></div>
        ) : (
          <>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10"><svg className="h-5 w-5 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="12 16V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v0" /></svg></div>
            <div className="text-center"><p className="text-sm font-medium">Drop images here or click to browse</p><p className="text-xs text-muted-foreground">PNG, JPG, WEBP up to 5MB (max {maxImages})</p></div>
          </>
        )}
      </div>
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {images.map((url, index) => (
            <div key={index} className="group relative aspect-square overflow-hidden rounded-lg border bg-default-100">
              <img src={url} alt={`Upload ${index + 1}`} className="h-full w-full object-cover" />
              {!isDisabled && (<button type="button" onClick={(e) => { e.stopPropagation(); handleRemove(index); }} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-danger text-white opacity-0 transition-opacity group-hover:opacity-100">×</button>)}
              {index === 0 && <span className="absolute bottom-1 left-1 rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">Main</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
