/**
 * Notification API hooks (React Query).
 *
 * Replaces the previous Zustand mock-store bell implementation with real
 * API calls against `/api/v1/notifications` (the customer-facing controller
 * added in `apps/api/src/modules/notifications/user-notifications.controller.ts`).
 *
 * Hooks:
 *   useNotifications()                  — paginated list + unread source, polls every 30s
 *   useMarkNotificationAsRead()         — mutation, marks one as read
 *   useMarkAllNotificationsAsRead()     — mutation, marks all as read
 *
 * All hooks auto-disable when the user is not authenticated (passing
 * `isAuthenticated: false`) so we never trigger a guaranteed 401.
 */
"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { api } from "@/services/api-client";

// ─── Types ─────────────────────────────────────────────────────────────────

/** A single notification row from the backend. */
export interface Notification {
  id: string;
  userId: string;
  /** Free-form string — e.g. ORDER, NEW_ORDER, QUOTE, ESCROW, PAYMENT, KYC_STATUS. */
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  /** Parsed JSON payload (orderRef, orderId, amount, etc.) or null. */
  data: Record<string, unknown> | null;
  createdAt: string;
}

interface NotificationListResponse {
  data: Notification[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Query keys ────────────────────────────────────────────────────────────

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (page: number, limit: number) =>
    ["notifications", "list", { page, limit }] as const,
};

// ─── Hooks ─────────────────────────────────────────────────────────────────

/**
 * Fetches the authenticated user's notifications. Polls every 30 seconds.
 *
 * Pass `isAuthenticated: false` to disable the query (e.g. when the user
 * is logged out) — this prevents a guaranteed 401.
 */
export function useNotifications(
  options: {
    isAuthenticated?: boolean;
    page?: number;
    limit?: number;
  } = {},
) {
  const { isAuthenticated = true, page = 1, limit = 20 } = options;
  return useQuery<NotificationListResponse>({
    queryKey: notificationKeys.list(page, limit),
    queryFn: async () => {
      const res = await api.get<Notification[]>("notifications", {
        params: { page, limit },
      });
      // The api-client may either:
      //   (a) return the raw controller shape { data, meta } (when the
      //       ResponseInterceptor doesn't wrap it), or
      //   (b) wrap it into { success, data, meta }.
      // Handle both defensively.
      const raw = res as unknown as Partial<NotificationListResponse> & {
        data?: Notification[];
        meta?: NotificationListResponse["meta"];
      };
      const list = Array.isArray(raw?.data) ? raw.data : [];
      const meta =
        raw?.meta ?? { page, limit, total: list.length, totalPages: 1 };
      return { data: list, meta };
    },
    enabled: isAuthenticated,
    placeholderData: keepPreviousData,
    refetchInterval: 30_000, // poll every 30s
    staleTime: 15_000,
  });
}

/**
 * Mutation: mark a single notification as read.
 *
 * Optimistically updates the cached list so the bell feels instant.
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await api.patch<{ success: boolean; updated: boolean }>(
        `notifications/${notificationId}/read`,
      );
      return res;
    },
    onMutate: async (notificationId: string) => {
      // Optimistic update: flip isRead on the cached list. The badge derives
      // its count from this same list, so no second unread-count cache exists.
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });
      queryClient.setQueriesData<NotificationListResponse>(
        { queryKey: ["notifications", "list"], exact: false },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((n) =>
              n.id === notificationId ? { ...n, isRead: true } : n,
            ),
          };
        },
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * Mutation: mark ALL notifications as read.
 *
 * Optimistically marks the cached list as read so the badge updates from the
 * same query response used by the dropdown.
 */
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<{ success: boolean; updated: number }>(
        "notifications/read-all",
      );
      return res;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });
      queryClient.setQueriesData<NotificationListResponse>(
        { queryKey: ["notifications", "list"], exact: false },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((n) => ({ ...n, isRead: true })),
          };
        },
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Format an ISO timestamp as a relative "time ago" string
 * (e.g. "Just now", "5m ago", "3h ago", "2d ago", or a localized date).
 */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(
    new Date(iso),
  );
}
