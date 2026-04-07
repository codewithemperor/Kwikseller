"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, Shield, AlertCircle, Crown, UserCog } from "lucide-react";
import { Button, Spinner } from "@heroui/react";
import { cn, TextInput, PasswordInput, OTPVerification } from "@kwikseller/ui";
import { kwikToast, useAuth } from "@kwikseller/utils";
import { loginSchema, type LoginFormData } from "@kwikseller/types";

export interface AdminLoginConfig {
  name?: string;
  description?: string;
  redirectPath?: string;
}

interface AdminLoginPageProps {
  config?: AdminLoginConfig;
  className?: string;
}

/**
 * Returns true for every signal the server can use to indicate
 * "email not verified — show OTP screen".
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

/**
 * AdminLoginPage - Login page for Admin app
 * 
 * Features:
 * - Purple theme (#7C3AED)
 * - NO "Forgot password" link (admins cannot reset password this way)
 * - NO "Create account" link (no public registration)
 * - Shows role badge after login (Super Admin vs Admin)
 */
export function AdminLoginPage({ 
  config, 
  className 
}: AdminLoginPageProps) {
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

  const redirectPath = config?.redirectPath ?? "/admin";

  const redirectToApp = React.useCallback(() => {
    setTimeout(() => router.push(redirectPath), 400);
  }, [router, redirectPath]);

  // Login submit
  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      const result = await login(data);

      if (!result.success) {
        if (isEmailNotVerified(result)) {
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

      kwikToast.success(`Welcome to ${config?.name ?? "Admin Panel"}!`);
      redirectToApp();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Login failed";
      setServerError(msg);
      kwikToast.error(msg);
    }
  };

  // OTP handlers
  const handleVerifyOTP = async (otp: string) => {
    const result = await verifyOTP(userEmail, otp);

    if (!result.success) {
      throw new Error(result.error || "Verification failed");
    }

    kwikToast.success("Email verified successfully!");
    setShowOTP(false);

    if (result.sessionCreated) {
      kwikToast.success(`Welcome to ${config?.name ?? "Admin Panel"}!`);
      redirectToApp();
    } else {
      kwikToast.info("Verification complete — please sign in.");
    }
  };

  const handleResendOTP = async () => {
    const result = await resendOTP(userEmail);
    if (!result.success)
      throw new Error(result.error || "Failed to resend code");
    kwikToast.success("Verification code sent!");
  };

  const ambientOrbs = (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden
    >
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-400/5 blur-3xl" />
    </div>
  );

  const portalIcon = (
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br from-violet-600 to-purple-700">
      <Shield className="w-8 h-8" />
    </div>
  );

  // OTP screen
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

  // Login screen
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
          {/* Header */}
          <div className="flex flex-col items-center gap-3 mb-8">
            {portalIcon}
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {config?.name ?? "Admin Panel"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {config?.description ?? "Sign in to access the admin dashboard"}
              </p>
            </div>
          </div>

          {/* Info Banner - No forgot password for admins */}
          <div className="mb-6 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <div className="flex items-start gap-2.5">
              <Shield className="w-4 h-4 mt-0.5 text-violet-600 shrink-0" />
              <div className="text-sm text-violet-700 dark:text-violet-300">
                <p className="font-medium">Admin Access Only</p>
                <p className="text-xs mt-0.5 opacity-80">
                  Password reset is disabled for admin accounts. Contact Super Admin for assistance.
                </p>
              </div>
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
              placeholder="admin@example.com"
              startContent={<Mail className="w-4 h-4 text-muted-foreground" />}
              isRequired
              isDisabled={isSubmitting || isLoading}
            />

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

            {/* Note: No "Forgot password" link for admins */}

            <Button
              type="submit"
              variant="solid"
              fullWidth
              size="lg"
              isPending={isSubmitting || isLoading}
              isDisabled={isSubmitting || isLoading}
              onPress={() => {}}
              className="mt-2 font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800"
            >
              {({ isPending }) =>
                isPending ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" />
                    Signing in…
                  </span>
                ) : (
                  "Sign in to Admin Panel"
                )
              }
            </Button>

            {/* Note: No "Create account" link - admins are created by SUPER_ADMIN only */}
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center space-y-2">
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-violet-500" />
              Super Admin
            </span>
            <span className="flex items-center gap-1.5">
              <UserCog className="w-3.5 h-3.5 text-violet-500" />
              Sub Admin
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} KWIKSELLER · All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
}
