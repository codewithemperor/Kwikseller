"use client";

import React from "react";
import { Button, Spinner } from "@heroui/react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SubmitButtonProps {
  /** Whether the form submission is in progress */
  isPending: boolean;
  /** Whether the button should be non-interactive */
  isDisabled: boolean;
  /** Button label in idle state */
  label?: string;
  /** Button label while isPending is true */
  pendingLabel?: string;
  /** Optional extra Tailwind classes forwarded to the button */
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SubmitButton
//
// A reusable form submit button with a built-in loading state.
//
// Key design decisions:
//   • type="submit" — lets the native form handle submission.
//   • NO onPress prop — HeroUI's onPress intercepts the click and prevents
//     the browser from firing the form's submit event, so we omit it entirely.
//   • isPending forwarded to HeroUI — drives the render-prop child so the
//     Spinner and label swap automatically.
// ─────────────────────────────────────────────────────────────────────────────

export function SubmitButton({
  isPending,
  isDisabled,
  label = "Submit",
  pendingLabel = "Please wait…",
  className,
}: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      variant="primary"
      fullWidth
      size="lg"
      isPending={isPending}
      isDisabled={isDisabled}
      className={`font-semibold rounded-xl ${className ?? ""}`.trim()}
    >
      {({ isPending: pending }) =>
        pending ? (
          <span className="flex items-center gap-2">
            <Spinner color="current" size="sm" />
            {pendingLabel}
          </span>
        ) : (
          label
        )
      }
    </Button>
  );
}
