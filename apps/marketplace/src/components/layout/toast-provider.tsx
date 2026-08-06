'use client'

import React from "react";
import { Toast } from "@heroui/react";

/**
 * ToastProvider — client-only wrapper around HeroUI's Toast.Provider.
 *
 * `@heroui/react` re-exports `client-only`, so importing `Toast` directly
 * inside a Server Component (like `app/layout.tsx`) throws:
 *   `'client-only' cannot be imported from a Server Component module`.
 * This file is marked `'use client'` so the import is safe.
 */
export function ToastProvider({ children }: { children?: React.ReactNode }) {
  return (
    <Toast.Provider placement="top end" maxVisibleToasts={3}>
      {children}
    </Toast.Provider>
  );
}

export default ToastProvider;
