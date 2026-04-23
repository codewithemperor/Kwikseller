"use client";

import React from "react";
import {
  Modal,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner,
} from "@heroui/react";
import { AlertTriangle } from "lucide-react";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  isLoading?: boolean;
  variant?: "danger" | "warning";
}

export function ConfirmDialog({
  isOpen,
  onOpenChange,
  title = "Confirm Action",
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  isLoading = false,
  variant = "danger",
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalDialog>
        <ModalHeader className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              variant === "danger"
                ? "bg-danger/10 text-danger"
                : "bg-warning/10 text-warning"
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
          </div>
          {title}
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-default-600">{message}</p>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            onPress={() => onOpenChange(false)}
            isDisabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            onPress={() => {
              onConfirm();
              onOpenChange(false);
            }}
            isDisabled={isLoading}
            isPending={isLoading}
            className={variant === "warning" ? "bg-warning text-warning-foreground" : ""}
          >
            {({ isPending }) =>
              isPending ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" />
                  {confirmLabel}...
                </span>
              ) : (
                confirmLabel
              )
            }
          </Button>
        </ModalFooter>
      </ModalDialog>
    </Modal>
  );
}
