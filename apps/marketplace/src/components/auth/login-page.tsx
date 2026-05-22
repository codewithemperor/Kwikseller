"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, AlertCircle, ShoppingBag, ShieldCheck } from "lucide-react";
import { Checkbox } from "@heroui/react";
import { AppButton, cn, TextInput, PasswordInput, OTPVerification } from "@kwikseller/ui";
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

function isEmailNotVerified(result: {
  success: boolean;
  code?: string;
  requiresOTP?: boolean;
  error?: string;
  message?: string;
}): boolean {
  if (result.code === "EMAIL_NOT_VERIFIED" || result.requiresOTP) {
    return true;
  }

  const text = `${result.error ?? ""} ${result.message ?? ""}`.toLowerCase();
  return (
    text.includes("email not verified") || text.includes("email_not_verified")
  );
}

export function LoginPage({ portal, className }: LoginPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, verifyOTP, resendOTP, isLoading } = useAuth();

  const [serverError, setServerError] = React.useState<string | null>(null);
  const [showOTP, setShowOTP] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const redirectToApp = React.useCallback(() => {
    const rawRedirect = searchParams.get("redirect");
    const safeRedirect =
      rawRedirect && rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
        ? rawRedirect
        : portal.redirectPath;
    setTimeout(() => router.push(safeRedirect), 400);
  }, [router, searchParams, portal.redirectPath]);

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);

    try {
      const result = await login({ ...data, role: "BUYER" });

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

        const message = result.error || result.message || "Login failed";
        setServerError(message);
        kwikToast.error(message);
        return;
      }

      kwikToast.success(`Welcome back to ${portal.name}!`);
      redirectToApp();
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? "Login failed";
      setServerError(message);
      kwikToast.error(message);
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    const result = await verifyOTP(userEmail, otp, "BUYER");

    if (!result.success) {
      throw new Error(result.error || "Verification failed");
    }

    kwikToast.success("Email verified successfully!");
    setShowOTP(false);

    if (result.sessionCreated) {
      kwikToast.success(`Welcome back to ${portal.name}!`);
      redirectToApp();
    } else {
      kwikToast.info("Verification complete - please sign in.");
    }
  };

  const handleResendOTP = async () => {
    const result = await resendOTP(userEmail, "BUYER");
    if (!result.success) {
      throw new Error(result.error || "Failed to resend code");
    }
    kwikToast.success("Verification code sent!");
  };

  if (showOTP) {
    return (
      <div className={cn("w-full", className)}>
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
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-8">
        <div className="mb-5 inline-flex h-12 w-12 items-center justify-center bg-[#071a2f] text-white">
          <ShoppingBag className="h-6 w-6" />
        </div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-kwik-dark dark:text-white">
          Welcome back to Kwikseller
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-kwik-gray-light dark:text-white/60">{portal.description}</p>
      </div>

      {serverError && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-sm text-destructive dark:border-destructive/30 dark:bg-destructive/15">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
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
          startContent={<Mail className="h-4 w-4 text-kwik-muted" />}
          isRequired
          isDisabled={isSubmitting || isLoading}
        />

        <div className="flex flex-col gap-1.5">
          <PasswordInput
            name="password"
            control={control}
            label="Password"
            placeholder="Enter your password"
            startContent={<Lock className="h-4 w-4 text-kwik-muted" />}
            isRequired
            isDisabled={isSubmitting || isLoading}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                size="sm"
                isSelected={rememberMe}
                onValueChange={setRememberMe}
                classNames={{
                  wrapper: "rounded-md border-kwik-border",
                }}
              >
                <span className="text-xs text-kwik-gray">Remember me</span>
              </Checkbox>
            </div>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-kwik-orange underline-offset-4 transition-colors hover:text-kwik-orange-hover hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <AppButton
          type="submit"
          fullWidth
          size="lg"
          isLoading={isSubmitting || isLoading}
          loadingLabel="Signing in..."
          className="mt-2 rounded-xl"
        >
          Sign in to {portal.name}
        </AppButton>

        {/* Divider */}
        <div className="flex items-start gap-2 border border-kwik-border bg-white p-3 text-xs leading-5 text-kwik-muted dark:border-white/10 dark:bg-white/5 dark:text-white/60">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-kwik-orange" />
          Your cart, delivery details, and order history stay tied to this verified account.
        </div>

        {portal.showRegisterLink && portal.registerPath && (
          <p className="pt-1 text-center text-sm text-kwik-gray-light">
            Don&apos;t have an account?{" "}
            <Link
              href={portal.registerPath}
              className="font-medium text-kwik-orange underline-offset-4 hover:text-kwik-orange-hover hover:underline"
            >
              Create one
            </Link>
          </p>
        )}
      </form>
    </div>
  );
}
