"use client";

import React from "react";
import { X } from "lucide-react";
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContainer,
  ModalDialog,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { cn } from "../lib/utils";

export type AppModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

export function AppModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: AppModalProps) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <ModalBackdrop className="bg-[#071a2f]/55 backdrop-blur-sm" />
      <ModalContainer className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
        <ModalDialog
          className={cn(
            "max-h-[92dvh] w-full overflow-hidden rounded-t-3xl border border-border bg-background text-foreground shadow-2xl sm:max-w-xl sm:rounded-2xl",
            className,
          )}
        >
          {(title || description) && (
            <ModalHeader className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div className="min-w-0">
                {title && <h2 className="font-heading text-lg font-semibold">{title}</h2>}
                {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
              </div>
              <button
                type="button"
                aria-label="Close modal"
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-surface hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </ModalHeader>
          )}
          <ModalBody className="max-h-[calc(92dvh-140px)] overflow-y-auto px-5 py-5">
            {children}
          </ModalBody>
          {footer && <ModalFooter className="border-t border-border px-5 py-4">{footer}</ModalFooter>}
        </ModalDialog>
      </ModalContainer>
    </Modal>
  );
}
