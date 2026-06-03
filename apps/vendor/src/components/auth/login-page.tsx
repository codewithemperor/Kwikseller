"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, AlertCircle } from "lucide-react";
import { cn, TextInput, PasswordInput, OTPVerification, AppButton, BrandedAuthHeader } from "@kwikseller/ui";
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
    text.includes("email not verified") ||
    text.includes("email_not_verified")
  );
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

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);

    try {
      const result = await login({ ...data, role: "VENDOR" });

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
    const result = await verifyOTP(userEmail, otp, "VENDOR");

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
    const result = await resendOTP(userEmail, "VENDOR");
    if (!result.success) {
      throw new Error(result.error || "Failed to resend code");
    }
    kwikToast.success("Verification code sent!");
  };

  if (showOTP) {
    return (
      <div className={cn("w-full", className)}>
        <BrandedAuthHeader
          title="Verify vendor email"
          description="Enter the code sent to your email to finish securing your vendor account."
          logoSrc="/icon.png"
          logoDarkSrc="/icon-dark.png"
          logoClassName="h-8"
        />
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
      <BrandedAuthHeader
        title="Welcome back, seller"
        description={portal.description}
        logoSrc="/icon.png"
        logoDarkSrc="/icon-dark.png"
        logoClassName="h-8"
      />

      {serverError && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
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
          startContent={<Mail className="h-4 w-4 text-muted-foreground" />}
          isRequired
          isDisabled={isSubmitting || isLoading}
        />

        <div className="flex flex-col gap-1.5">
          <PasswordInput
            name="password"
            control={control}
            label="Password"
            placeholder="Enter your password"
            startContent={<Lock className="h-4 w-4 text-muted-foreground" />}
            isRequired
            isDisabled={isSubmitting || isLoading}
          />
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-accent underline-offset-4 transition-colors hover:text-accent/80 hover:underline"
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
          className="mt-2 rounded-xl font-semibold"
        >
          Sign in to {portal.name}
        </AppButton>

        {portal.showRegisterLink && portal.registerPath && (
          <p className="pt-1 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href={portal.registerPath}
              className="font-medium text-accent underline-offset-4 hover:underline"
            >
              Create one
            </Link>
          </p>
        )}
      </form>
    </div>
  );
}
