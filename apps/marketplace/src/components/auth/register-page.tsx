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

export interface RegisterPortalConfig {
  name: string;
  logo?: React.ReactNode;
  description: string;
  themeColor: string;
  redirectPath: string;
  loginPath: string;
  defaultRole?: "BUYER" | "VENDOR";
  showRoleSelector?: boolean;
  vendorRegisterUrl?: string;
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

  const handleRoleSelect = (role: "BUYER" | "VENDOR") => {
    if (role === "VENDOR" && portal.vendorRegisterUrl) {
      window.location.href = portal.vendorRegisterUrl;
      return;
    }

    setSelectedRole(role);
    setValue("role", role);
    setStep(2);
  };

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

  const handleVerifyOTP = async (otp: string) => {
    const result = await verifyOTP(userEmail, otp, selectedRole);

    if (!result.success) {
      throw new Error(result.error || "Verification failed");
    }

    kwikToast.success("Email verified successfully!");
    setShowOTP(false);

    if (result.sessionCreated) {
      kwikToast.success(`Welcome to ${portal.name}!`);
      redirectToApp();
    } else {
      kwikToast.info("Account verified! Please sign in to continue.");
      router.push(`${portal.loginPath}?registered=true`);
    }
  };

  const handleResendOTP = async () => {
    const result = await resendOTP(userEmail, selectedRole);
    if (!result.success) {
      throw new Error(result.error || "Failed to resend code");
    }
    kwikToast.success("Verification code sent!");
  };

  const iconColor = themeMap[portal.themeColor] || themeMap.default;
  const busy = isSubmitting || isLoading;

  const portalIcon = (
    <div
      className={cn(
        "flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg",
        iconColor,
      )}
    >
      {portal.logo ?? <Store className="h-7 w-7" />}
    </div>
  );

  if (showOTP) {
    return (
      <div className={cn("w-full max-w-md", className)}>
        <div className="rounded-2xl border border-border/60 bg-card p-8 text-card-foreground shadow-xl dark:shadow-2xl dark:shadow-black/40">
          <div className="mb-4 flex flex-col items-center gap-3">{portalIcon}</div>
          <OTPVerification
            email={userEmail}
            onVerify={handleVerifyOTP}
            onResend={handleResendOTP}
            onBack={() => setShowOTP(false)}
            isLoading={isLoading}
          />
        </div>
      </div>
    );
  }

  if (step === 1 && portal.showRoleSelector) {
    return (
      <div className={cn("w-full max-w-lg", className)}>
        <div className="rounded-2xl border border-border/60 bg-card p-8 text-card-foreground shadow-xl dark:shadow-2xl dark:shadow-black/40">
          <div className="mb-8 flex flex-col items-center gap-3">
            {portalIcon}
            <h1 className="text-2xl font-semibold">Join {portal.name}</h1>
            <p className="text-sm text-muted-foreground">
              Choose how you want to use the platform
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <button
              type="button"
              onClick={() => handleRoleSelect("BUYER")}
              className="w-full rounded-xl border p-6 text-left transition-colors hover:border-primary hover:bg-primary/5"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">I want to shop</h3>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Browse products, track orders, and earn KwikCoins rewards
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect("VENDOR")}
              className="w-full rounded-xl border p-6 text-left transition-colors hover:border-primary hover:bg-primary/5"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Building2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">I want to sell</h3>
                    <Chip size="sm" variant="soft" color="success">
                      Popular
                    </Chip>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Create your store, list products, and grow your business
                  </p>
                </div>
              </div>
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href={portal.loginPath}
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full max-w-md", className)}>
      <div className="rounded-2xl border border-border/60 bg-card p-8 text-card-foreground shadow-xl dark:shadow-2xl dark:shadow-black/40">
        <div className="mb-8 flex flex-col items-center gap-3">
          {portalIcon}
          <h1 className="text-2xl font-semibold">
            Create your {selectedRole === "VENDOR" ? "vendor" : "buyer"} account
          </h1>
          <p className="text-center text-sm text-muted-foreground">
            {selectedRole === "VENDOR"
              ? "Start selling on Africa's largest marketplace"
              : "Join millions of shoppers across Africa"}
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
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
            startContent={<Mail className="h-4 w-4 text-muted-foreground" />}
            isRequired
            isDisabled={busy}
          />

          <TextInput
            name="phone"
            control={control}
            type="tel"
            label="Phone (optional)"
            placeholder="+234 801 234 5678"
            startContent={<Phone className="h-4 w-4 text-muted-foreground" />}
            isDisabled={busy}
          />

          {selectedRole === "VENDOR" && (
            <TextInput
              name="storeName"
              control={control}
              label="Store name"
              placeholder="My Awesome Store"
              startContent={<Building2 className="h-4 w-4 text-muted-foreground" />}
              isRequired
              isDisabled={busy}
            />
          )}

          <PasswordInput
            name="password"
            control={control}
            label="Password"
            placeholder="Create a password"
            startContent={<Lock className="h-4 w-4 text-muted-foreground" />}
            isRequired
            isDisabled={busy}
          />

          <PasswordInput
            name="confirmPassword"
            control={control}
            label="Confirm password"
            placeholder="Confirm your password"
            startContent={<Lock className="h-4 w-4 text-muted-foreground" />}
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
            className="mt-2 rounded-xl font-semibold"
          >
            {({ isPending }) =>
              isPending ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" />
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )
            }
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href={portal.loginPath}
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
