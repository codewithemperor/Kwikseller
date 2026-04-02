"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, Store, AlertCircle } from "lucide-react";
import { Button, Spinner } from "@heroui/react";
import { cn, TextInput, PasswordInput, OTPVerification } from "@kwikseller/ui";
import { kwikToast, useAuth } from "@kwikseller/utils";
import { loginSchema, type LoginFormData } from "@kwikseller/types";

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

/**
 * Returns true for every signal the server can use to indicate
 * "email not verified — show OTP screen".
 *
 * We check all three because the api client wrapper may surface
 * the 403 as a thrown error, a resolved { success: false } object,
 * or with different field combinations depending on interceptor config.
 */
function isEmailNotVerified(result: {
  success: boolean;
  code?: string;
  requiresOTP?: boolean;
  error?: string;
  message?: string;
}): boolean {
  if (result.code === "EMAIL_NOT_VERIFIED") return true;
  if (result.requiresOTP === true) return true;
  const text = (
    (result.error ?? "") +
    " " +
    (result.message ?? "")
  ).toLowerCase();
  if (
    text.includes("email not verified") ||
    text.includes("email_not_verified")
  )
    return true;
  return false;
}

export function LoginPage({ portal, className }: LoginPageProps) {
  const router = useRouter();
  const { login, verifyOTP, resendOTP, isLoading } = useAuth();

  const [serverError, setServerError] = React.useState<string | null>(null);
  const [showOTP, setShowOTP] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState("");

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const redirectToApp = React.useCallback(() => {
    setTimeout(() => router.push(portal.redirectPath), 400);
  }, [router, portal.redirectPath]);

  // ── Login submit ───────────────────────────────────────────────────────────

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      const result = await login(data);

      if (!result.success) {
        if (isEmailNotVerified(result)) {
          // Tell the user why we're switching screens
          kwikToast.info(
            result.message ||
              "Email not verified. A verification code has been sent to your email.",
          );
          setUserEmail(result.email ?? data.email);
          setShowOTP(true);
          return;
        }

        const msg = result.error || result.message || "Login failed";
        setServerError(msg);
        kwikToast.error(msg);
        return;
      }

      // success: true — session stored by auth context
      kwikToast.success(`Welcome back to ${portal.name}!`);
      redirectToApp();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Login failed";
      setServerError(msg);
      kwikToast.error(msg);
    }
  };

  // ── OTP handlers ───────────────────────────────────────────────────────────
  //
  // OTPVerification is "dumb" — it only collects digits and calls onVerify(otp).
  // Session storage and routing always happen here, in the page, so the
  // component stays reusable across packages with different post-verify behavior.

  const handleVerifyOTP = async (otp: string) => {
    const result = await verifyOTP(userEmail, otp);

    if (!result.success) {
      // Throw so OTPVerification shows the inline error inside the component
      throw new Error(result.error || "Verification failed");
    }

    kwikToast.success("Email verified successfully!");
    setShowOTP(false);

    if (result.sessionCreated) {
      kwikToast.success(`Welcome back to ${portal.name}!`);
      redirectToApp();
    } else {
      // Verified but server returned no tokens (edge case)
      kwikToast.info("Verification complete — please sign in.");
    }
  };

  const handleResendOTP = async () => {
    const result = await resendOTP(userEmail);
    if (!result.success)
      throw new Error(result.error || "Failed to resend code");
    kwikToast.success("Verification code sent!");
  };

  // ── Shared UI ──────────────────────────────────────────────────────────────

  const iconColor = themeMap[portal.themeColor ?? "default"];

  const ambientOrbs = (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden
    >
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
    </div>
  );

  const portalIcon = (
    <div
      className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg",
        iconColor,
      )}
    >
      {portal.logo ?? <Store className="w-7 h-7" />}
    </div>
  );

  // ── OTP screen ─────────────────────────────────────────────────────────────

  if (showOTP) {
    return (
      <div
        className={cn(
          "min-h-screen flex items-center justify-center p-4 bg-background",
          className,
        )}
      >
        {ambientOrbs}
        <div className="relative w-full max-w-md">
          <div className="rounded-2xl border border-border/60 bg-card text-card-foreground shadow-xl dark:shadow-2xl dark:shadow-black/40 p-8">
            <div className="flex flex-col items-center gap-3 mb-4">
              {portalIcon}
            </div>
            <OTPVerification
              email={userEmail}
              onVerify={handleVerifyOTP}
              onResend={handleResendOTP}
              onBack={() => {
                setShowOTP(false);
                setServerError(null);
              }}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Login screen ───────────────────────────────────────────────────────────

  return (
    <div
      className={cn(
        "min-h-screen flex items-center justify-center p-4 bg-background",
        className,
      )}
    >
      {ambientOrbs}
      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-border/60 bg-card text-card-foreground shadow-xl dark:shadow-2xl dark:shadow-black/40 p-8">
          <div className="flex flex-col items-center gap-3 mb-8">
            {portalIcon}
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                Welcome back
              </h1>
              <p className="text-sm text-muted-foreground">
                {portal.description}
              </p>
            </div>
          </div>

          {serverError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 mb-5 p-3.5 rounded-xl text-sm bg-destructive/10 border border-destructive/20 text-destructive dark:bg-destructive/15 dark:border-destructive/30"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
            noValidate
          >
            <TextInput
              name="email"
              control={control}
              type="email"
              label="Email address"
              placeholder="you@example.com"
              startContent={<Mail className="w-4 h-4 text-muted-foreground" />}
              isRequired
              isDisabled={isSubmitting || isLoading}
            />

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
                isDisabled={isSubmitting || isLoading}
              />
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-primary underline-offset-4 hover:underline transition-colors hover:text-primary/80"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              isPending={isSubmitting || isLoading}
              isDisabled={isSubmitting || isLoading}
              onPress={() => {}}
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

        <p className="mt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Kwikseller · All rights reserved
        </p>
      </div>
    </div>
  );
}
