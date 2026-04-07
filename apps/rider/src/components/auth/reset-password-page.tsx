"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Bike, CheckCircle, ArrowLeft, Check } from "lucide-react";
import { InputOTP } from "@heroui/react";
import { cn, PasswordInput, SubmitButton } from "@kwikseller/ui";
import { kwikToast, useAuth, usePendingResetEmail } from "@kwikseller/utils";
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "@kwikseller/types";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ResetPasswordPageProps {
  loginPath: string;
  forgotPasswordPath?: string;
  appName?: string;
  themeColor?: "blue" | "green" | "purple" | "orange" | "default";
}

// ─────────────────────────────────────────────────────────────────────────────
// Theme map
// ─────────────────────────────────────────────────────────────────────────────

const themeMap: Record<
  NonNullable<ResetPasswordPageProps["themeColor"]>,
  string
> = {
  blue: "bg-blue-600",
  green: "bg-green-600",
  purple: "bg-purple-600",
  orange: "bg-orange-600",
  default: "bg-primary",
};

// ─────────────────────────────────────────────────────────────────────────────
// Password validation rules — each returns true when satisfied
// ─────────────────────────────────────────────────────────────────────────────

const passwordRules = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (v: string) => v.length >= 8,
  },
  {
    id: "upper",
    label: "One uppercase letter (A–Z)",
    test: (v: string) => /[A-Z]/.test(v),
  },
  {
    id: "lower",
    label: "One lowercase letter (a–z)",
    test: (v: string) => /[a-z]/.test(v),
  },
  {
    id: "number",
    label: "One number (0–9)",
    test: (v: string) => /[0-9]/.test(v),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PasswordChecklist
// ─────────────────────────────────────────────────────────────────────────────

interface PasswordChecklistProps {
  password: string;
  confirmPassword: string;
}

function PasswordChecklist({
  password,
  confirmPassword,
}: PasswordChecklistProps) {
  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  return (
    <ul className="space-y-1.5 mt-1">
      {passwordRules.map((rule) => {
        const passed = rule.test(password);
        return (
          <li
            key={rule.id}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors duration-200",
              passed
                ? "text-emerald-500 dark:text-emerald-400"
                : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-all duration-200",
                passed
                  ? "bg-emerald-500/15 dark:bg-emerald-500/20"
                  : "bg-muted",
              )}
            >
              <Check
                className={cn(
                  "w-2.5 h-2.5 transition-opacity duration-200",
                  passed ? "opacity-100" : "opacity-0",
                )}
              />
            </span>
            {rule.label}
          </li>
        );
      })}

      {/* Passwords match indicator */}
      <li
        className={cn(
          "flex items-center gap-2 text-xs transition-colors duration-200",
          passwordsMatch
            ? "text-emerald-500 dark:text-emerald-400"
            : "text-muted-foreground",
        )}
      >
        <span
          className={cn(
            "flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-all duration-200",
            passwordsMatch
              ? "bg-emerald-500/15 dark:bg-emerald-500/20"
              : "bg-muted",
          )}
        >
          <Check
            className={cn(
              "w-2.5 h-2.5 transition-opacity duration-200",
              passwordsMatch ? "opacity-100" : "opacity-0",
            )}
          />
        </span>
        Passwords match
      </li>
    </ul>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ResetPasswordPage (with Zustand email storage)
// ─────────────────────────────────────────────────────────────────────────────

export function ResetPasswordPage({
  loginPath,
  forgotPasswordPath = "/forgot-password",
  appName = "KWIKSELLER",
  themeColor = "orange",
}: ResetPasswordPageProps) {
  const router = useRouter();
  const { resetPassword, isLoading } = useAuth();
  const { pendingResetEmail, clearPendingResetEmail } = usePendingResetEmail();

  const [isSuccess, setIsSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { isSubmitting, isValid },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: "", otp: "", password: "", confirmPassword: "" },
    mode: "onChange",
  });

  // Get email from Zustand (memory) on mount
  useEffect(() => {
    if (pendingResetEmail) {
      setUserEmail(pendingResetEmail);
      setValue("email", pendingResetEmail, { shouldValidate: true });
    } else {
      // No email in store - redirect back to forgot password
      kwikToast.error("Please start the password reset process from the beginning.");
      router.replace(forgotPasswordPath);
    }
  }, [pendingResetEmail, setValue, router, forgotPasswordPath]);

  // Handle OTP changes
  const handleOtpChange = (value: string) => {
    setValue("otp", value, { shouldValidate: true });
  };

  // Watch passwords for the checklist
  const watchedPassword = useWatch({
    control,
    name: "password",
    defaultValue: "",
  });
  const watchedConfirm = useWatch({
    control,
    name: "confirmPassword",
    defaultValue: "",
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!userEmail) {
      kwikToast.error("Email is missing — please restart the flow.");
      router.push(forgotPasswordPath);
      return;
    }

    try {
      const result = await resetPassword({
        email: userEmail,
        otp: data.otp,
        newPassword: data.password,
      });

      if (result.success) {
        // Clear the stored email from memory
        clearPendingResetEmail();
        
        setIsSuccess(true);
        kwikToast.success(result.message || "Password reset successfully!");
        setTimeout(() => router.push(loginPath), 2000);
      } else {
        kwikToast.error(result.error || "Failed to reset password");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to reset password";
      kwikToast.error(message);
    }
  };

  const iconColor = themeMap[themeColor];
  const busy = isSubmitting || isLoading;
  const canSubmit = isValid && !busy;

  // Loading state while checking for email
  if (!userEmail && !isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-muted animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Success screen
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="relative w-full max-w-md">
          <div className="rounded-2xl border border-border/60 bg-card text-card-foreground shadow-xl dark:shadow-2xl dark:shadow-black/40 p-10 flex flex-col items-center gap-5 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold">All done!</h1>
              <p className="text-sm text-muted-foreground">
                Your password has been reset. Redirecting to login…
              </p>
            </div>
            <Link
              href={loginPath}
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Go to login now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Reset form
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      {/* Decorative blobs */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        aria-hidden
      >
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-border/60 bg-card text-card-foreground shadow-xl dark:shadow-2xl dark:shadow-black/40 p-8">
          {/* Header */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <div
              className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg",
                iconColor,
              )}
            >
              <Bike className="w-7 h-7" />
            </div>
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                Reset your password
              </h1>
              <p className="text-sm text-muted-foreground">
                Enter the code we sent to{" "}
                {userEmail ? (
                  <span className="font-medium text-foreground">
                    {userEmail}
                  </span>
                ) : (
                  "your email"
                )}
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
            noValidate
          >
            {/* OTP Input */}
            <div className="flex flex-col items-center gap-2">
              <label className="self-start text-sm font-medium">
                Verification code
              </label>
              <InputOTP
                maxLength={6}
                value={control._formValues?.otp || ""}
                onChange={handleOtpChange}
                isDisabled={busy}
              >
                <InputOTP.Group className="gap-2">
                  <InputOTP.Slot index={0} className="text-xl font-semibold" />
                  <InputOTP.Slot index={1} className="text-xl font-semibold" />
                  <InputOTP.Slot index={2} className="text-xl font-semibold" />
                </InputOTP.Group>
                <InputOTP.Separator />
                <InputOTP.Group className="gap-2">
                  <InputOTP.Slot index={3} className="text-xl font-semibold" />
                  <InputOTP.Slot index={4} className="text-xl font-semibold" />
                  <InputOTP.Slot index={5} className="text-xl font-semibold" />
                </InputOTP.Group>
              </InputOTP>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* Password fields + live checklist */}
            <div className="space-y-2">
              <PasswordInput
                name="password"
                control={control}
                label="New password"
                placeholder="Create a new password"
                startContent={
                  <Lock className="w-4 h-4 text-muted-foreground" />
                }
                isRequired
                isDisabled={busy}
              />
              <PasswordInput
                name="confirmPassword"
                control={control}
                label="Confirm password"
                placeholder="Type it again"
                startContent={
                  <Lock className="w-4 h-4 text-muted-foreground" />
                }
                isRequired
                isDisabled={busy}
              />

              <PasswordChecklist
                password={watchedPassword}
                confirmPassword={watchedConfirm}
              />
            </div>

            {/* Submit Button */}
            <SubmitButton
              isPending={busy}
              isDisabled={!canSubmit}
              label="Reset Password"
              pendingLabel="Resetting…"
            />

            <Link
              href={loginPath}
              className="text-sm text-center text-muted-foreground flex items-center justify-center gap-2 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} {appName} &middot; All rights
          reserved
        </p>
      </div>
    </div>
  );
}
