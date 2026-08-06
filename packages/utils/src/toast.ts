'use client';

// packages/utils/src/toast.ts
// Central toast helper — import { kwikToast } from '@kwikseller/utils'
// so all apps use consistent messages and options.
//
// NOTE: This module is marked `'use client'` because it imports from
// `@heroui/react`, which re-exports the `client-only` package. Importing
// it from a Server Component (e.g. through the `@kwikseller/utils`
// barrel) would otherwise throw:
//   `'client-only' cannot be imported from a Server Component module`.
// The `'use client'` directive tells Next.js to only bundle this module
// (and its `@heroui/react` dependency) for the client. The functions
// below are only ever called from event handlers in client components,
// so the HeroUI toast queue is always available at call time.

import { toast } from "@heroui/react";

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

  success(title: string, description?: string) {
    return toast.success(title, { description, timeout: 4000 });
  },

  error(title: string, description?: string) {
    return toast.danger(title, { description, timeout: 6000 });
  },

  warning(title: string, description?: string) {
    return toast.warning(title, { description, timeout: 5000 });
  },

  info(title: string, description?: string) {
    return toast(title, { variant: "accent", description, timeout: 4000 });
  },
};
