"use client";

import React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ArrowLeft, Store } from "lucide-react";
import { Button, Spinner } from "@heroui/react";
import { cn, TextInput, OTPModal } from "@kwikseller/ui";
import { kwikToast } from "@kwikseller/utils";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@kwikseller/types";
import { authApi } from "@kwikseller/api-client";

interface ForgotPasswordPageProps {
  loginPath: string;
  appName?: string;
  themeColor?: "blue" | "green" | "purple" | "orange" | "default";
}

const themeMap: Record<NonNullable<ForgotPasswordPageProps["themeColor"]>, string> = {
  blue: "bg-blue-600",
  green: "bg-green-600",
  purple: "bg-purple-600",
  orange: "bg-orange-600",
  default: "bg-primary",
};

export function ForgotPasswordPage({
  loginPath,
  appName = "KWIKSELLER",
  themeColor = "default",
}: ForgotPasswordPageProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showOTPModal, setShowOTPModal] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState("");

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword(data.email);
      setUserEmail(data.email);
      setShowOTPModal(true);
      kwikToast.success("Verification code sent to your email!");
    } catch (error) {
      // Don't reveal if email exists or not
      kwikToast.success("If the email exists, a verification code has been sent.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    // After OTP verification, redirect to reset password with email and OTP
    window.location.href = `/reset-password?email=${encodeURIComponent(userEmail)}&verified=true`;
    setShowOTPModal(false);
  };

  const handleResendOTP = async () => {
    await authApi.forgotPassword(userEmail);
    kwikToast.success("Verification code sent!");
  };

  const iconColor = themeMap[themeColor];

  return (
    <>
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
              <div className="text-center space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">Forgot password?</h1>
                <p className="text-sm text-muted-foreground">
                  Enter your email and we&apos;ll send you a verification code
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
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
                      Sending code…
                    </span>
                  ) : (
                    "Send Verification Code"
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
            © {new Date().getFullYear()} {appName} · All rights reserved
          </p>
        </div>
      </div>

      {/* OTP Modal */}
      <OTPModal
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        onVerify={handleVerifyOTP}
        onResend={handleResendOTP}
        email={userEmail}
        type="password-reset"
        isLoading={isLoading}
      />
    </>
  );
}
