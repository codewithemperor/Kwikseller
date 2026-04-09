"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Mail,
  Lock,
  Store,
  Phone,
  Building2,
  AlertCircle,
} from "lucide-react";
import { Button, Spinner } from "@heroui/react";
import { cn, TextInput, PasswordInput, OTPVerification } from "@kwikseller/ui";
import { kwikToast, useAuth } from "@kwikseller/utils";
import { registerSchema, type RegisterFormData } from "@kwikseller/types";

export interface VendorRegisterConfig {
  name: string;
  logo?: React.ReactNode;
  description: string;
  themeColor?: "blue" | "green" | "purple" | "orange" | "default";
  redirectPath: string;
  loginPath: string;
}

interface RegisterPageProps {
  config: VendorRegisterConfig;
  className?: string;
}

const themeMap: Record<string, string> = {
  blue: "bg-blue-600",
  green: "bg-green-600",
  purple: "bg-purple-600",
  orange: "bg-orange-600",
  default: "bg-primary",
};

export function RegisterPage({ config, className }: RegisterPageProps) {
  const router = useRouter();
  const { register: registerUser, verifyOTP, resendOTP, isLoading } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const { control, handleSubmit } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phone: "",
      role: "VENDOR",
      storeName: "",
    },
  });

  const redirectToApp = React.useCallback(() => {
    setTimeout(() => {
      router.push(config.redirectPath);
    }, 400);
  }, [router, config.redirectPath]);

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
        role: "VENDOR",
        storeName: data.storeName,
        storeCategory: "other",
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
    const result = await verifyOTP(userEmail, otp, "VENDOR");

    if (!result.success) {
      throw new Error(result.error || "Verification failed");
    }

    kwikToast.success("Email verified successfully!");
    setShowOTP(false);

    if (result.sessionCreated) {
      kwikToast.success(`Welcome to ${config.name}!`);
      redirectToApp();
    } else {
      kwikToast.info("Account verified! Please sign in to continue.");
      router.push(`${config.loginPath}?registered=true`);
    }
  };

  const handleResendOTP = async () => {
    const result = await resendOTP(userEmail, "VENDOR");
    if (!result.success) {
      throw new Error(result.error || "Failed to resend code");
    }
    kwikToast.success("Verification code sent!");
  };

  const iconColor = themeMap[config.themeColor || "orange"];
  const busy = isSubmitting || isLoading;

  const portalIcon = (
    <div
      className={cn(
        "flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg",
        iconColor,
      )}
    >
      {config.logo ?? <Store className="h-7 w-7" />}
    </div>
  );

  if (showOTP) {
    return (
      <div className={cn("w-full", className)}>
        <div className="mb-4 flex flex-col items-center gap-3">{portalIcon}</div>
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

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-8 flex flex-col items-center gap-3">
        {portalIcon}
        <h1 className="text-2xl font-semibold">Create your vendor account</h1>
        <p className="text-center text-sm text-muted-foreground">
          Start selling on Africa&apos;s largest marketplace
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

        <TextInput
          name="storeName"
          control={control}
          label="Store name"
          placeholder="My Awesome Store"
          startContent={<Building2 className="h-4 w-4 text-muted-foreground" />}
          isRequired
          isDisabled={busy}
        />

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
              "Create Vendor Account"
            )
          }
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href={config.loginPath}
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
