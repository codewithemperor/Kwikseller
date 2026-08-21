"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, Shield, AlertCircle, Crown, UserCog } from "lucide-react";
import { cn, TextInput, PasswordInput, OTPVerification, AppButton, BrandedAuthHeader } from "@/lib/ui";
import { kwikToast, useAuth } from "@/lib/utils";
import { loginSchema, type LoginFormData } from "@/lib/types";

export interface AdminLoginConfig {
  name?: string;
  description?: string;
  redirectPath?: string;
}

interface AdminLoginPageProps {
  config?: AdminLoginConfig;
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

export function AdminLoginPage({ config, className }: AdminLoginPageProps) {
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

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);

    try {
      const result = await login({ ...data, role: "ADMIN" });

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

      kwikToast.success(`Welcome to ${config?.name ?? "Admin Panel"}!`);
      redirectToApp();
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? "Login failed";
      setServerError(message);
      kwikToast.error(message);
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    const result = await verifyOTP(userEmail, otp, "ADMIN");

    if (!result.success) {
      throw new Error(result.error || "Verification failed");
    }

    kwikToast.success("Email verified successfully!");
    setShowOTP(false);

    if (result.sessionCreated) {
      kwikToast.success(`Welcome to ${config?.name ?? "Admin Panel"}!`);
      redirectToApp();
    } else {
      kwikToast.info("Verification complete - please sign in.");
    }
  };

  const handleResendOTP = async () => {
    const result = await resendOTP(userEmail, "ADMIN");
    if (!result.success) {
      throw new Error(result.error || "Failed to resend code");
    }
    kwikToast.success("Verification code sent!");
  };

  if (showOTP) {
    return (
      <div className={cn("w-full", className)}>
        <BrandedAuthHeader
          title="Verify admin email"
          description="Enter the verification code sent to this admin email."
          badge="Admin access"
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
      <div className="mb-8 flex flex-col items-center gap-3">
        <BrandedAuthHeader
          title={config?.name ?? "Kwikseller Admin"}
          description={config?.description ?? "Sign in with your admin email. Super Admin and every admin role use this same page."}
          badge="Admin portal"
          className="mb-0 w-full"
        />
      </div>

      <div className="mb-6 rounded-xl border border-accent/20 bg-accent-soft p-3">
        <div className="flex items-start gap-2.5">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-accent-soft-foreground" />
          <div className="text-sm text-accent-soft-foreground">
            <p className="font-medium">Admin access only</p>
            <p className="mt-0.5 text-xs opacity-80">
              Role permissions are applied after login. Contact Super Admin for access changes.
            </p>
          </div>
        </div>
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
          placeholder="admin@example.com"
          startContent={<Mail className="h-4 w-4 text-muted-foreground" />}
          isRequired
          isDisabled={isSubmitting || isLoading}
        />

        <PasswordInput
          name="password"
          control={control}
          label="Password"
          placeholder="Enter your password"
          startContent={<Lock className="h-4 w-4 text-muted-foreground" />}
          isRequired
          isDisabled={isSubmitting || isLoading}
        />

        <AppButton
          type="submit"
          fullWidth
          size="lg"
          isLoading={isSubmitting || isLoading}
          loadingLabel="Signing in..."
          className="mt-2 rounded-xl"
        >
          Sign in to Admin
        </AppButton>
      </form>

      <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Crown className="h-3.5 w-3.5 text-accent" />
          Super Admin
        </span>
        <span className="flex items-center gap-1.5">
          <UserCog className="h-3.5 w-3.5 text-accent" />
          Admin Roles
        </span>
      </div>
    </div>
  );
}

