"use client";

import React from "react";
import { X } from "lucide-react";
import { Drawer } from "@heroui/react";
import { cn } from "../lib/utils";

export type AppDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  placement?: "left" | "right" | "top" | "bottom";
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

export function AppDrawer({
  isOpen,
  onClose,
  title,
  description,
  placement = "left",
  children,
  footer,
  className,
}: AppDrawerProps) {
  if (!isOpen) return null;

  return (
    <Drawer isOpen={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <Drawer.Backdrop className="bg-[#071a2f]/45 backdrop-blur-sm" />
      <Drawer.Content
        placement={placement}
        className={cn(
          "z-50 flex h-full w-[min(340px,90vw)] flex-col bg-background/95 text-foreground shadow-2xl backdrop-blur-xl",
          className,
        )}
      >
        <Drawer.Dialog className="flex h-full flex-col outline-none">
          <Drawer.Header className="flex h-20 items-center justify-between border-b border-border px-5">
            <div className="min-w-0">
              {title && <Drawer.Heading className="truncate font-heading text-lg font-semibold">{title}</Drawer.Heading>}
              {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
            </div>
            <button
              type="button"
              aria-label="Close drawer"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground transition hover:bg-surface"
            >
              <X className="h-5 w-5" />
            </button>
          </Drawer.Header>
          <Drawer.Body className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</Drawer.Body>
          {footer && <Drawer.Footer className="border-t border-border p-4">{footer}</Drawer.Footer>}
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer>
  );
}
