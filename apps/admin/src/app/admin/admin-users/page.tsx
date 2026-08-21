"use client";

import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@heroui/react";
import { RefreshCw, ShieldCheck, UserCog } from "lucide-react";
import { AppButton } from "@/lib/ui";
import { PageHeader } from "@/components/ui";
import { adminUsersApi, type AdminUser } from "@/lib/api";
import {
  ADMIN_ROLE_LABELS,
  ADMIN_ROLE_OPTIONS,
  ADMIN_ROLE_PERMISSIONS,
} from "@/lib/admin-permissions";

function unwrap<T>(value: unknown): T {
  if (value && typeof value === "object" && "data" in value) {
    return (value as { data: T }).data;
  }
  return value as T;
}

function displayName(user: AdminUser) {
  const name = [user.profile?.firstName, user.profile?.lastName]
    .filter(Boolean)
    .join(" ");
  return name || user.email;
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const response = await adminUsersApi.list();
      return unwrap<AdminUser[]>(response.data);
    },
  });

  const users = data ?? [];

  const updateMutation = useMutation({
    mutationFn: ({
      user,
      adminRole,
      isActive,
    }: {
      user: AdminUser;
      adminRole: NonNullable<AdminUser["adminRole"]>;
      isActive: boolean;
    }) =>
      adminUsersApi.update(user.id, {
        role: adminRole,
        permissions: ADMIN_ROLE_PERMISSIONS[adminRole],
        isActive,
      }),
    onSuccess: () => {
      toast.success("Admin role updated");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: Error) => toast.danger(error.message || "Update failed"),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Users"
        description="Manage admin roles, permissions, and active access for the Kwikseller admin portal."
        breadcrumbs={[{ label: "Admin Users" }]}
        actions={
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-foreground hover:bg-surface"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <div className="border border-border bg-background p-4">
          <p className="text-xs font-semibold uppercase text-muted">Admins</p>
          <p className="mt-2 text-3xl font-semibold">{users.length}</p>
        </div>
        <div className="border border-border bg-background p-4">
          <p className="text-xs font-semibold uppercase text-muted">Active</p>
          <p className="mt-2 text-3xl font-semibold">
            {users.filter((user) => user.isActive).length}
          </p>
        </div>
        <div className="border border-border bg-background p-4">
          <p className="text-xs font-semibold uppercase text-muted">Super Admins</p>
          <p className="mt-2 text-3xl font-semibold">
            {users.filter((user) => user.role === "SUPER_ADMIN").length}
          </p>
        </div>
      </section>

      <section className="overflow-hidden border border-border bg-background">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-heading text-base font-semibold">Role assignments</h2>
        </div>

        {isLoading ? (
          <div className="p-6 text-sm text-muted">Loading admin users...</div>
        ) : users.length === 0 ? (
          <div className="p-6 text-sm text-muted">No admin users found.</div>
        ) : (
          <div className="divide-y divide-border">
            {users.map((user) => {
              const adminRole = user.adminRole ?? "CONTENT";
              const isSuperAdmin = user.role === "SUPER_ADMIN";

              return (
                <div
                  key={user.id}
                  className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_220px_160px_140px]"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <UserCog className="h-4 w-4 text-accent" />
                      <p className="truncate font-medium">{displayName(user)}</p>
                    </div>
                    <p className="mt-1 truncate text-sm text-muted">{user.email}</p>
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent-soft-foreground">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {ADMIN_ROLE_LABELS[adminRole]}
                    </div>
                  </div>

                  <label className="block">
                    <span className="text-xs font-semibold text-muted">Role</span>
                    <select
                      value={adminRole}
                      disabled={isSuperAdmin || updateMutation.isPending}
                      onChange={(event) =>
                        updateMutation.mutate({
                          user,
                          adminRole: event.target.value as NonNullable<AdminUser["adminRole"]>,
                          isActive: user.isActive,
                        })
                      }
                      className="mt-1 h-10 w-full rounded-md border border-border bg-field-background px-3 text-sm disabled:opacity-60"
                    >
                      {ADMIN_ROLE_OPTIONS.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div>
                    <p className="text-xs font-semibold text-muted">Status</p>
                    <p className="mt-2 text-sm font-medium">
                      {user.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>

                  <AppButton
                    type="button"
                    variant={user.isActive ? "secondary" : "primary"}
                    size="sm"
                    disabled={isSuperAdmin || updateMutation.isPending}
                    onClick={() =>
                      updateMutation.mutate({
                        user,
                        adminRole,
                        isActive: !user.isActive,
                      })
                    }
                  >
                    {user.isActive ? "Deactivate" : "Activate"}
                  </AppButton>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

