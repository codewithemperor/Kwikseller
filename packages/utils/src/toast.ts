// packages/ui/src/lib/toast.ts
// Central toast helper — import { kwikToast } from '@kwikseller/ui'
// so all apps use consistent messages and options.

// packages/utils/src/toast.ts
import { toast } from '@heroui/react';

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
    return toast(title, { variant: 'accent', description, timeout: 4000 });
  },
};