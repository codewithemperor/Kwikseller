"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Mail,
  Lock,
  Store,
  User,
  Phone,
  Building2,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Button, Spinner, Chip } from "@heroui/react";
import { cn, TextInput, PasswordInput, OTPVerification } from "@kwikseller/ui";
import { kwikToast, useAuth } from "@kwikseller/utils";
import { registerSchema, type RegisterFormData } from "@kwikseller/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RegisterPortalConfig {
  name: string;
  logo?: React.ReactNode;
  description: string;
  themeColor: string;
  redirectPath: string;
  loginPath: string;
  defaultRole?: "BUYER" | "VENDOR";
  showRoleSelector?: boolean;
}

interface RegisterPageProps {
  portal: RegisterPortalConfig;
  className?: string;
}

const themeMap: Record<string, string> = {
  blue: "bg-blue-600",
  green: "bg-green-600",
  purple: "bg-purple-600",
  orange: "bg-orange-600",
  default: "bg-primary",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function RegisterPage({ portal, className }: RegisterPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register: registerUser, verifyOTP, resendOTP, isLoading } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<"BUYER" | "VENDOR">(
    (searchParams.get("role") as "BUYER" | "VENDOR") ||
      portal.defaultRole ||
      "BUYER",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const { control, handleSubmit, setValue } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phone: "",
      role: selectedRole,
    },
  });

  const redirectToApp = React.useCallback(() => {
    setTimeout(() => router.push(portal.redirectPath), 400);
  }, [router, portal.redirectPath]);

  // ── Role selection ─────────────────────────────────────────────────────────

  const handleRoleSelect = (role: "BUYER" | "VENDOR") => {
    setSelectedRole(role);
    setValue("role", role);
    setStep(2);
  };

  // ── Registration submit ────────────────────────────────────────────────────

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role as "BUYER" | "VENDOR" | "RIDER",
      });

      // Registration succeeded — move to OTP screen
      setUserEmail(data.email);
      setShowOTP(true);
      kwikToast.info(
        result.message || "Please check your email for the verification code.",
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again.";
      setError(message);
      kwikToast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── OTP handlers ───────────────────────────────────────────────────────────
  //
  // We use the auth context's verifyOTP (same as LoginPage) so session storage
  // is handled in one place. The server returns tokens after email verification,
  // so sessionCreated will be true — we redirect straight to the app, never
  // back to the login page.

  const handleVerifyOTP = async (otp: string) => {
    const result = await verifyOTP(userEmail, otp);

    if (!result.success) {
      // Throw so OTPVerification displays the inline error
      throw new Error(result.error || "Verification failed");
    }

    kwikToast.success("Email verified successfully!");
    setShowOTP(false);

    if (result.sessionCreated) {
      // Session is in Zustand — go straight to the app, no login step
      kwikToast.success(`Welcome to ${portal.name}!`);
      redirectToApp();
    } else {
      // Server verified but issued no tokens (shouldn't happen with your API,
      // but handled safely — ask them to log in rather than silently failing)
      kwikToast.info("Account verified! Please sign in to continue.");
      router.push(`${portal.loginPath}?registered=true`);
    }
  };

  const handleResendOTP = async () => {
    const result = await resendOTP(userEmail);
    if (!result.success)
      throw new Error(result.error || "Failed to resend code");
    kwikToast.success("Verification code sent!");
  };

  // ── Shared UI ──────────────────────────────────────────────────────────────

  const iconColor = themeMap[portal.themeColor] || themeMap.default;
  const busy = isSubmitting || isLoading;

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

  // ── OTP screen (shown immediately after successful registration) ───────────

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
              onBack={() => setShowOTP(false)}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Step 1: Role selector ──────────────────────────────────────────────────

  if (step === 1 && portal.showRoleSelector) {
    return (
      <div
        className={cn(
          "min-h-screen flex items-center justify-center p-4 bg-background",
          className,
        )}
      >
        {ambientOrbs}
        <div className="relative w-full max-w-lg">
          <div className="rounded-2xl border border-border/60 bg-card text-card-foreground shadow-xl dark:shadow-2xl dark:shadow-black/40 p-8">
            <div className="flex flex-col items-center gap-3 mb-8">
              {portalIcon}
              <h1 className="text-2xl font-semibold">Join {portal.name}</h1>
              <p className="text-sm text-muted-foreground">
                Choose how you want to use the platform
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <button
                onClick={() => handleRoleSelect("BUYER")}
                className="w-full p-6 text-left border rounded-xl hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">I want to shop</h3>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Browse products, track orders, and earn KwikCoins rewards
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleRoleSelect("VENDOR")}
                className="w-full p-6 text-left border rounded-xl hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">I want to sell</h3>
                      <Chip size="sm" variant="soft" color="success">
                        Popular
                      </Chip>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create your store, list products, and grow your business
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <p className="text-sm text-center text-muted-foreground mt-6">
              Already have an account?{" "}
              <Link
                href={portal.loginPath}
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: Registration form ──────────────────────────────────────────────

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
            <h1 className="text-2xl font-semibold">
              Create your {selectedRole === "VENDOR" ? "vendor" : "buyer"}{" "}
              account
            </h1>
            <p className="text-sm text-muted-foreground text-center">
              {selectedRole === "VENDOR"
                ? "Start selling on Africa's largest marketplace"
                : "Join millions of shoppers across Africa"}
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 mb-5 p-3.5 rounded-xl text-sm bg-destructive/10 border border-destructive/20 text-destructive">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
            noValidate
          >
            <div className="grid grid-cols-2 gap-4">
              <TextInput
                name="firstName"
                control={control}
                label="First name"
                placeholder="John"
                isRequired
                isDisabled={busy}
              />
              <TextInput
                name="lastName"
                control={control}
                label="Last name"
                placeholder="Doe"
                isRequired
                isDisabled={busy}
              />
            </div>

            <TextInput
              name="email"
              control={control}
              type="email"
              label="Email"
              placeholder="you@example.com"
              startContent={<Mail className="w-4 h-4 text-muted-foreground" />}
              isRequired
              isDisabled={busy}
            />

            <TextInput
              name="phone"
              control={control}
              type="tel"
              label="Phone (optional)"
              placeholder="+234 801 234 5678"
              startContent={<Phone className="w-4 h-4 text-muted-foreground" />}
              isDisabled={busy}
            />

            {selectedRole === "VENDOR" && (
              <TextInput
                name="storeName"
                control={control}
                label="Store name"
                placeholder="My Awesome Store"
                startContent={
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                }
                isRequired
                isDisabled={busy}
              />
            )}

            <PasswordInput
              name="password"
              control={control}
              label="Password"
              placeholder="Create a password"
              startContent={<Lock className="w-4 h-4 text-muted-foreground" />}
              isRequired
              isDisabled={busy}
            />

            <PasswordInput
              name="confirmPassword"
              control={control}
              label="Confirm password"
              placeholder="Confirm your password"
              startContent={<Lock className="w-4 h-4 text-muted-foreground" />}
              isRequired
              isDisabled={busy}
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              isPending={busy}
              isDisabled={busy}
              onPress={() => {}}
              className="mt-2 font-semibold rounded-xl"
            >
              {({ isPending }) =>
                isPending ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" />
                    Creating account…
                  </span>
                ) : (
                  "Create Account"
                )
              }
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link
                href={portal.loginPath}
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {portal.name} · All rights reserved
        </p>
      </div>
    </div>
  );
}
