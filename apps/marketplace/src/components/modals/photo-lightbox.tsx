"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppImage } from "@/components/ui/app-image";

interface PhotoLightboxProps {
  src: string | null;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PhotoLightbox({ src, alt, isOpen, onClose }: PhotoLightboxProps) {
  return (
    <AnimatePresence>
      {isOpen && src && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Review photo"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Close photo"
          >
            <span className="text-xl">×</span>
          </button>
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            className="relative max-h-[85vh] max-w-[85vw] overflow-hidden rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <AppImage
              src={src}
              alt={alt}
              className="max-h-[85vh] max-w-[85vw] object-contain"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
