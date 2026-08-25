'use client';

// Central toast helper — import { kwikToast } from '@/lib/toast'
// so all apps use consistent messages and options.
//
// NOTE: This module is marked `'use client'` because it imports from
// `@heroui/react`, which re-exports the `client-only` package. Importing
// it from a Server Component would otherwise throw:
//   `'client-only' cannot be imported from a Server Component module`.
// The `'use client'` directive tells Next.js to only bundle this module
// (and its `@heroui/react` dependency) for the client. The functions
// below are only ever called from event handlers in client components,
// so the HeroUI toast queue is always available at call time.

import { toast } from "@heroui/react";

const TOAST_TIMEOUT = {
  success: 2800,
  info: 2800,
  warning: 3400,
  error: 4200,
} as const;

export const kwikToast = {
  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: Error) => string);
    },
  ) {
    return toast.promise(promise, messages);
  },

  loading(title: string, description?: string) {
    return toast(title, {
      description,
      isLoading: true,
      timeout: 0,
      variant: "accent",
    });
  },

  close(id: string) {
    toast.close(id);
  },

  success(title: string, description?: string) {
    return toast.success(title, { description, timeout: TOAST_TIMEOUT.success });
  },

  error(title: string, description?: string) {
    return toast.danger(title, { description, timeout: TOAST_TIMEOUT.error });
  },

  warning(title: string, description?: string) {
    return toast.warning(title, { description, timeout: TOAST_TIMEOUT.warning });
  },

  info(title: string, description?: string) {
    return toast(title, {
      variant: "accent",
      description,
      timeout: TOAST_TIMEOUT.info,
    });
  },
};
