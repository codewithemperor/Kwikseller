"use client";

import React, { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Mail,
  Lock,
  User,
  Phone,
  Building2,
  ChevronRight,
  AlertCircle,
  Check,
  X,
} from "lucide-react";
import { Button, Spinner, Chip, Checkbox } from "@heroui/react";
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

/* ─── Password Strength Indicator ──────────────────────────── */

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
  checks: { label: string; passed: boolean }[];
} {
  const checks = [
    { label: "At least 8 characters", passed: password.length >= 8 },
    { label: "Uppercase letter", passed: /[A-Z]/.test(password) },
    { label: "Lowercase letter", passed: /[a-z]/.test(password) },
    { label: "Number", passed: /\d/.test(password) },
    { label: "Special character", passed: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const passedCount = checks.filter((c) => c.passed).length;

  if (passedCount <= 1) return { score: 1, label: "Weak", color: "bg-red-500", checks };
  if (passedCount <= 2) return { score: 2, label: "Fair", color: "bg-amber-500", checks };
  if (passedCount <= 3) return { score: 3, label: "Good", color: "bg-kwik-orange", checks };
  return { score: 4, label: "Strong", color: "bg-emerald-500", checks };
}

function PasswordStrengthBar({ password }: { password: string }) {
  const { score, label, color, checks } = useMemo(
    () => getPasswordStrength(password),
    [password],
  );

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-kwik-gray">Password strength</span>
        <span className={`text-xs font-semibold ${
          score <= 1 ? "text-red-500" :
          score <= 2 ? "text-amber-500" :
          score <= 3 ? "text-kwik-orange" :
          "text-emerald-500"
        }`}>
          {label}
        </span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              level <= score ? color : "bg-kwik-border"
            }`}
          />
        ))}
      </div>
      <div className="space-y-1">
        {checks.map((check) => (
          <div key={check.label} className="flex items-center gap-1.5">
            {check.passed ? (
              <Check className="h-3 w-3 text-emerald-500" />
            ) : (
              <X className="h-3 w-3 text-kwik-muted" />
            )}
            <span className={`text-[11px] ${check.passed ? "text-kwik-dark-medium" : "text-kwik-muted"}`}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

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
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");

  const { control, handleSubmit, setValue, watch } = useForm<RegisterFormData>({
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

  // Watch password for strength indicator
  const currentPassword = watch("password") || "";
  if (currentPassword !== passwordValue) {
    setPasswordValue(currentPassword);
  }

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

    if (!agreedToTerms) {
      setError("You must agree to the Terms & Conditions and Privacy Policy.");
      kwikToast.error("Please accept the terms and conditions.");
      return;
    }

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

  const busy = isSubmitting || isLoading;

  if (showOTP) {
    return (
      <div className={cn("w-full", className)}>
        <OTPVerification
          email={userEmail}
          onVerify={handleVerifyOTP}
          onResend={handleResendOTP}
          onBack={() => setShowOTP(false)}
          isLoading={isLoading}
        />
      </div>
    );
  }

  if (step === 1 && portal.showRoleSelector) {
    return (
      <div className={cn("w-full", className)}>
        <div className="mb-8 text-center">
          <h1 className="mb-1 text-2xl font-bold text-kwik-dark">Join {portal.name}</h1>
          <p className="text-sm text-kwik-gray-light">
            Choose how you want to use the platform
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => handleRoleSelect("BUYER")}
            className="w-full rounded-xl border border-kwik-border p-6 text-left transition-colors hover:border-kwik-orange hover:bg-kwik-orange-tint"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-kwik-orange/10">
                <User className="h-6 w-6 text-kwik-orange" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-kwik-dark">I want to shop</h3>
                  <ChevronRight className="h-5 w-5 text-kwik-muted" />
                </div>
                <p className="mt-1 text-sm text-kwik-gray-light">
                  Browse products, track orders, and earn KwikCoins rewards
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleRoleSelect("VENDOR")}
            className="w-full rounded-xl border border-kwik-border p-6 text-left transition-colors hover:border-kwik-orange hover:bg-kwik-orange-tint"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-kwik-orange/10">
                <Building2 className="h-6 w-6 text-kwik-orange" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-kwik-dark">I want to sell</h3>
                  <Chip size="sm" variant="soft" color="warning">
                    Popular
                  </Chip>
                </div>
                <p className="mt-1 text-sm text-kwik-gray-light">
                  Create your store, list products, and grow your business
                </p>
              </div>
            </div>
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-kwik-gray-light">
          Already have an account?{" "}
          <Link
            href={portal.loginPath}
            className="font-medium text-kwik-orange hover:text-kwik-orange-hover hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-8 space-y-1 text-center">
        <h1 className="text-2xl font-bold text-kwik-dark">
          Create your {selectedRole === "VENDOR" ? "vendor" : "buyer"} account
        </h1>
        <p className="text-center text-sm text-kwik-gray-light">
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
          startContent={<Mail className="h-4 w-4 text-kwik-muted" />}
          isRequired
          isDisabled={busy}
        />

        <TextInput
          name="phone"
          control={control}
          type="tel"
          label="Phone (optional)"
          placeholder="+234 801 234 5678"
          startContent={<Phone className="h-4 w-4 text-kwik-muted" />}
          isDisabled={busy}
        />

        {selectedRole === "VENDOR" && (
          <TextInput
            name="storeName"
            control={control}
            label="Store name"
            placeholder="My Awesome Store"
            startContent={<Building2 className="h-4 w-4 text-kwik-muted" />}
            isRequired
            isDisabled={busy}
          />
        )}

        <div className="space-y-2">
          <PasswordInput
            name="password"
            control={control}
            label="Password"
            placeholder="Create a password"
            startContent={<Lock className="h-4 w-4 text-kwik-muted" />}
            isRequired
            isDisabled={busy}
          />
          <PasswordStrengthBar password={passwordValue} />
        </div>

        <PasswordInput
          name="confirmPassword"
          control={control}
          label="Confirm password"
          placeholder="Confirm your password"
          startContent={<Lock className="h-4 w-4 text-kwik-muted" />}
          isRequired
          isDisabled={busy}
        />

        {/* Terms & conditions */}
        <div className="flex items-start gap-2.5">
          <Checkbox
            size="sm"
            isSelected={agreedToTerms}
            onValueChange={setAgreedToTerms}
            classNames={{
              wrapper: "rounded-md border-kwik-border mt-0.5",
            }}
          />
          <span className="text-xs leading-relaxed text-kwik-gray">
            I agree to the{" "}
            <Link href="/terms" className="text-kwik-orange hover:text-kwik-orange-hover hover:underline">
              Terms & Conditions
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-kwik-orange hover:text-kwik-orange-hover hover:underline">
              Privacy Policy
            </Link>
          </span>
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          size="lg"
          isPending={busy}
          isDisabled={busy}
          onPress={() => {}}
          className="mt-2 rounded-xl bg-kwik-orange font-semibold text-white hover:bg-kwik-orange-hover"
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

        <p className="text-center text-sm text-kwik-gray-light">
          Already have an account?{" "}
          <Link
            href={portal.loginPath}
            className="font-medium text-kwik-orange hover:text-kwik-orange-hover hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
