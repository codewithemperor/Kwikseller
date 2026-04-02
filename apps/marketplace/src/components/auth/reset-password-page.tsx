"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Store, CheckCircle } from "lucide-react";
import { Button, Spinner } from "@heroui/react";
import { cn, PasswordInput } from "@kwikseller/ui";
import { kwikToast } from "@kwikseller/utils";
import { resetPasswordSchema, type ResetPasswordFormData } from "@kwikseller/types";
import { authApi } from "@kwikseller/api-client";

interface ResetPasswordPageProps {
  loginPath: string;
  appName?: string;
  themeColor?: "blue" | "green" | "purple" | "orange" | "default";
}

const themeMap: Record<NonNullable<ResetPasswordPageProps["themeColor"]>, string> = {
  blue: "bg-blue-600",
  green: "bg-green-600",
  purple: "bg-purple-600",
  orange: "bg-orange-600",
  default: "bg-primary",
};

export function ResetPasswordPage({
  loginPath,
  appName = "KWIKSELLER",
  themeColor = "default",
}: ResetPasswordPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [otp, setOtp] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
      otp: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const email = searchParams.get("email");
    const otpCode = searchParams.get("otp");

    if (email) {
      setUserEmail(email);
    }
    if (otpCode) {
      setOtp(otpCode);
    }
  }, [searchParams]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!userEmail) {
      kwikToast.error("Email is required");
      return;
    }

    setIsLoading(true);

    try {
      await authApi.resetPassword({
        email: userEmail,
        otp: otp || data.otp || "",
        newPassword: data.password,
      });

      setIsSuccess(true);
      kwikToast.success("Password reset successful!");

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push(loginPath);
      }, 3000);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to reset password";
      kwikToast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const iconColor = themeMap[themeColor];

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="relative w-full max-w-md">
          <div className="rounded-2xl border border-border/60 bg-card text-card-foreground shadow-xl dark:shadow-2xl dark:shadow-black/40 p-8">
            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-semibold">Password reset successful!</h1>
              <p className="text-sm text-muted-foreground text-center">
                Your password has been reset. Redirecting to login...
              </p>
            </div>
            <Link
              href={loginPath}
              className="text-primary font-medium underline-offset-4 hover:underline block text-center"
            >
              Go to login now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl border border-border/60 bg-card text-card-foreground shadow-xl dark:shadow-2xl dark:shadow-black/40 p-8">
          {/* Header */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg", iconColor)}>
              <Store className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-semibold">Reset your password</h1>
            <p className="text-sm text-muted-foreground text-center">
              Enter the verification code and your new password
            </p>
            {userEmail && (
              <p className="text-sm font-medium">{userEmail}</p>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            {/* OTP Input */}
            {!otp && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Verification Code</label>
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={searchParams.get("otp") || ""}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full h-14 px-4 text-center text-xl font-semibold tracking-widest border border-border rounded-xl bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  maxLength={6}
                  disabled={isLoading || isSubmitting}
                />
              </div>
            )}

            <div className="space-y-2">
              <PasswordInput
                name="password"
                control={control}
                label="New Password"
                placeholder="Create a new password"
                startContent={<Lock className="w-4 h-4 text-muted-foreground" />}
                isRequired
                isDisabled={isLoading || isSubmitting}
              />
              <ul className="text-xs text-muted-foreground space-y-1 ml-1">
                <li>• At least 8 characters</li>
                <li>• At least one uppercase and lowercase letter</li>
                <li>• At least one number</li>
              </ul>
            </div>

            <PasswordInput
              name="confirmPassword"
              control={control}
              label="Confirm Password"
              placeholder="Confirm your new password"
              startContent={<Lock className="w-4 h-4 text-muted-foreground" />}
              isRequired
              isDisabled={isLoading || isSubmitting}
            />

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
              Back to login
            </Link>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {appName} · All rights reserved
        </p>
      </div>
    </div>
  );
}
