"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, Store, AlertCircle } from "lucide-react";
import { Button, Spinner } from "@heroui/react";
import { cn, TextInput, PasswordInput } from "@kwikseller/ui";
import { kwikToast } from "@kwikseller/utils";
import { useAuth } from "@kwikseller/utils";
import { loginSchema, type LoginFormData } from "@kwikseller/types";

// ── Portal config ─────────────────────────────────────────────
export interface PortalConfig {
  name: string;
  logo?: React.ReactNode;
  description: string;
  themeColor?: "blue" | "green" | "purple" | "orange" | "default";
  redirectPath: string;
  showRegisterLink?: boolean;
  registerPath?: string;
}

interface LoginPageProps {
  portal: PortalConfig;
  className?: string;
}

const themeMap: Record<NonNullable<PortalConfig["themeColor"]>, string> = {
  blue: "bg-blue-600",
  green: "bg-green-600",
  purple: "bg-purple-600",
  orange: "bg-orange-600",
  default: "bg-primary",
};

// ── Component ─────────────────────────────────────────────────
export function LoginPage({ portal, className }: LoginPageProps) {
  const router = useRouter();
  const { login } = useAuth();

  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // ── Submit ─────────────────────────────────────────────────
  // toast.promise drives the button's isPending state via isSubmitting.
  // No manual loading state needed — RHF's isSubmitting is the source of truth.
  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);

    await kwikToast.promise(
      login(data).then(() => {
        // navigate after the promise resolves so the success toast shows first
        setTimeout(() => router.push(portal.redirectPath), 800);
      }),
      {
        loading: "Signing you in…",
        success: `Welcome back to ${portal.name}!`,
        error: (err) => {
          const msg =
            err instanceof Error
              ? err.message
              : "Login failed. Please try again.";
          setServerError(msg);
          return msg;
        },
      },
    );
  };

  const iconColor = themeMap[portal.themeColor ?? "default"];

  return (
    <div
      className={cn(
        "min-h-screen flex items-center justify-center p-4 bg-background",
        className,
      )}
    >
      {/* ── Ambient background orbs ──────────────────────── */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        aria-hidden
      >
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* ── Card ─────────────────────────────────────────── */}
        <div
          className={cn(
            "rounded-2xl border border-border/60",
            "bg-card text-card-foreground",
            "shadow-xl dark:shadow-2xl dark:shadow-black/40",
            "p-8",
          )}
        >
          {/* ── Header ─────────────────────────────────────── */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <div
              className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center",
                "text-white shadow-lg",
                iconColor,
              )}
            >
              {portal.logo ?? <Store className="w-7 h-7" />}
            </div>

            <div className="text-center space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                Welcome back
              </h1>
              <p className="text-sm text-muted-foreground">
                {portal.description}
              </p>
            </div>
          </div>

          {/* ── Server error banner ─────────────────────────── */}
          {serverError && (
            <div
              role="alert"
              className={cn(
                "flex items-start gap-2.5 mb-5 p-3.5 rounded-xl text-sm",
                "bg-destructive/10 border border-destructive/20 text-destructive",
                "dark:bg-destructive/15 dark:border-destructive/30",
              )}
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* ── Form ─────────────────────────────────────────── */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
            noValidate
          >
            {/* Email — FieldError renders inline below the field */}
            <TextInput
              name="email"
              control={control}
              type="email"
              label="Email address"
              placeholder="you@example.com"
              startContent={<Mail className="w-4 h-4 text-muted-foreground" />}
              isRequired
              isDisabled={isSubmitting}
            />

            {/* Password — eye toggle is built into PasswordInput */}
            <div className="flex flex-col gap-1.5">
              <PasswordInput
                name="password"
                control={control}
                label="Password"
                placeholder="Enter your password"
                startContent={
                  <Lock className="w-4 h-4 text-muted-foreground" />
                }
                isRequired
                isDisabled={isSubmitting}
              />
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className={cn(
                    "text-xs font-medium text-primary",
                    "underline-offset-4 hover:underline transition-colors",
                    "hover:text-primary/80",
                  )}
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* ── Submit button ─────────────────────────────── */}
            {/* isPending drives HeroUI's built-in loading style  */}
            {/* isSubmitting from RHF keeps them in sync          */}
            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              isPending={isSubmitting}
              isDisabled={isSubmitting}
              onPress={() => {}} // handled by form's onSubmit
              className="mt-2 font-semibold rounded-xl"
            >
              {({ isPending }) =>
                isPending ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" />
                    Signing in…
                  </span>
                ) : (
                  `Sign in to ${portal.name}`
                )
              }
            </Button>

            {/* Register link */}
            {portal.showRegisterLink && portal.registerPath && (
              <p className="text-sm text-center text-muted-foreground pt-1">
                Don&apos;t have an account?{" "}
                <Link
                  href={portal.registerPath}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Create one
                </Link>
              </p>
            )}
          </form>
        </div>

        {/* ── Footer ───────────────────────────────────────── */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Kwikseller · All rights reserved
        </p>
      </div>
    </div>
  );
}
