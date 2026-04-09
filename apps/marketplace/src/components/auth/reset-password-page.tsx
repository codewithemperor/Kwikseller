"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useWatch, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Store, CheckCircle, ArrowLeft, Check } from "lucide-react";
import { InputOTP } from "@heroui/react";
import { cn, PasswordInput, SubmitButton } from "@kwikseller/ui";
import { kwikToast, useAuth, usePendingResetEmail } from "@kwikseller/utils";
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "@kwikseller/types";

interface ResetPasswordPageProps {
  loginPath: string;
  forgotPasswordPath?: string;
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

const passwordRules = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (v: string) => v.length >= 8,
  },
  {
    id: "upper",
    label: "One uppercase letter (A-Z)",
    test: (v: string) => /[A-Z]/.test(v),
  },
  {
    id: "lower",
    label: "One lowercase letter (a-z)",
    test: (v: string) => /[a-z]/.test(v),
  },
  {
    id: "number",
    label: "One number (0-9)",
    test: (v: string) => /[0-9]/.test(v),
  },
];

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
    <ul className="mt-1 space-y-1.5">
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
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-all duration-200",
                passed
                  ? "bg-emerald-500/15 dark:bg-emerald-500/20"
                  : "bg-muted",
              )}
            >
              <Check
                className={cn(
                  "h-2.5 w-2.5 transition-opacity duration-200",
                  passed ? "opacity-100" : "opacity-0",
                )}
              />
            </span>
            {rule.label}
          </li>
        );
      })}

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
            "flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-all duration-200",
            passwordsMatch
              ? "bg-emerald-500/15 dark:bg-emerald-500/20"
              : "bg-muted",
          )}
        >
          <Check
            className={cn(
              "h-2.5 w-2.5 transition-opacity duration-200",
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
  forgotPasswordPath = "/forgot-password",
  themeColor = "default",
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
    resolver: zodResolver(
      resetPasswordSchema,
    ) as Resolver<ResetPasswordFormData>,
    defaultValues: { email: "", otp: "", password: "", confirmPassword: "" },
    mode: "onChange",
  });

  useEffect(() => {
    if (pendingResetEmail) {
      setUserEmail(pendingResetEmail);
      setValue("email", pendingResetEmail, { shouldValidate: true });
    }
  }, [pendingResetEmail, setValue]);

  const handleOtpChange = (value: string) => {
    setValue("otp", value, { shouldValidate: true });
  };

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
      kwikToast.error("Email is missing - please restart the flow.");
      router.push(forgotPasswordPath);
      return;
    }

    try {
      const result = await resetPassword({
        email: userEmail,
        otp: data.otp,
        newPassword: data.password,
        role: "BUYER",
      });

      if (result.success) {
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

  if (!userEmail && !isSuccess) {
    return (
      <div className="flex w-full flex-col items-center gap-4 py-8 text-card-foreground">
        <div className="h-14 w-14 animate-pulse rounded-2xl bg-muted" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex w-full flex-col items-center gap-5 py-8 text-center text-card-foreground">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">All done!</h1>
          <p className="text-sm text-muted-foreground">
            Your password has been reset. Redirecting to login...
          </p>
        </div>
        <Link
          href={loginPath}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Go to login now
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg",
            iconColor,
          )}
        >
          <Store className="h-7 w-7" />
        </div>
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Reset your password
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter the code we sent to{" "}
            {userEmail ? (
              <span className="font-medium text-foreground">{userEmail}</span>
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

        <div className="border-t border-border/50" />

        <div className="space-y-2">
          <PasswordInput
            name="password"
            control={control}
            label="New password"
            placeholder="Create a new password"
            startContent={<Lock className="h-4 w-4 text-muted-foreground" />}
            isRequired
            isDisabled={busy}
          />
          <PasswordInput
            name="confirmPassword"
            control={control}
            label="Confirm password"
            placeholder="Type it again"
            startContent={<Lock className="h-4 w-4 text-muted-foreground" />}
            isRequired
            isDisabled={busy}
          />

          <PasswordChecklist
            password={watchedPassword}
            confirmPassword={watchedConfirm}
          />
        </div>

        <SubmitButton
          isPending={busy}
          isDisabled={!canSubmit}
          label="Reset Password"
          pendingLabel="Resetting..."
        />

        <Link
          href={loginPath}
          className="flex items-center justify-center gap-2 text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </form>
    </div>
  );
}
