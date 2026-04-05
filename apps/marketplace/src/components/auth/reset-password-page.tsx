"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Store, CheckCircle, ArrowLeft, Check } from "lucide-react";
import { Button, Spinner, InputOTP } from "@heroui/react";
import { cn, PasswordInput } from "@kwikseller/ui";
import { kwikToast, useAuth } from "@kwikseller/utils";
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "@kwikseller/types";

interface ResetPasswordPageProps {
  loginPath: string;
  appName?: string;
  themeColor?: "blue" | "green" | "purple" | "orange" | "default";
}

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

// Password validation rules — each returns true when satisfied
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

interface PasswordStrengthProps {
  password: string;
  confirmPassword: string;
}

function PasswordChecklist({
  password,
  confirmPassword,
}: PasswordStrengthProps) {
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

export function ResetPasswordPage({
  loginPath,
  appName = "KWIKSELLER",
  themeColor = "default",
}: ResetPasswordPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword, isLoading } = useAuth();

  const [isSuccess, setIsSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [otpValue, setOtpValue] = useState("");

  useEffect(() => {
    const email = searchParams.get("email");
    if (email) setUserEmail(decodeURIComponent(email));
  }, [searchParams]);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: "", otp: "", password: "", confirmPassword: "" },
    mode: "onChange",
  });

  // Watch passwords live for the checklist
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
      return;
    }
    if (otpValue.length !== 6) {
      kwikToast.error("Please enter the complete 6-digit code.");
      return;
    }

    try {
      const result = await resetPassword({
        email: userEmail,
        otp: otpValue,
        newPassword: data.password,
      });

      if (result.success) {
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

  // ── Success screen ─────────────────────────────────────────────────────────

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

  // ── Reset form ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
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
              <Store className="w-7 h-7" />
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
            {/* OTP — HeroUI InputOTP */}
            <div className="flex flex-col items-center gap-2">
              <label className="self-start text-sm font-medium">
                Verification code
              </label>
              <InputOTP
                maxLength={6}
                value={otpValue}
                onChange={setOtpValue}
                isDisabled={busy}
                classNames={{
                  base: "gap-2",
                  input: "text-xl font-semibold",
                }}
              >
                <InputOTP.Group>
                  <InputOTP.Slot index={0} />
                  <InputOTP.Slot index={1} />
                  <InputOTP.Slot index={2} />
                </InputOTP.Group>
                <InputOTP.Separator />
                <InputOTP.Group>
                  <InputOTP.Slot index={3} />
                  <InputOTP.Slot index={4} />
                  <InputOTP.Slot index={5} />
                </InputOTP.Group>
              </InputOTP>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* New password */}
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

              {/* Live password checklist */}
              <PasswordChecklist
                password={watchedPassword}
                confirmPassword={watchedConfirm}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              isPending={busy}
              isDisabled={busy || otpValue.length !== 6}
              onPress={() => {}}
              className="font-semibold rounded-xl"
            >
              {({ isPending }) =>
                isPending ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" />
                    Resetting…
                  </span>
                ) : (
                  "Reset Password"
                )
              }
            </Button>

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
