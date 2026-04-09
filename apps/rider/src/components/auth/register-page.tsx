"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, Bike, Phone, AlertCircle } from "lucide-react";
import { Button, Spinner } from "@heroui/react";
import { cn, TextInput, PasswordInput, OTPVerification } from "@kwikseller/ui";
import { kwikToast, useAuth } from "@kwikseller/utils";
import {
  riderRegisterSchema,
  type RiderRegisterFormData,
} from "@kwikseller/types";

export interface RegisterRiderConfig {
  name: string;
  logo?: React.ReactNode;
  description: string;
  themeColor: string;
  redirectPath: string;
  loginPath: string;
}

interface RegisterPageProps {
  portal: RegisterRiderConfig;
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
  const { register: registerUser, verifyOTP, resendOTP, isLoading } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const { control, handleSubmit } = useForm<RiderRegisterFormData>({
    resolver: zodResolver(riderRegisterSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phone: "",
      role: "RIDER",
    },
  });

  const redirectToApp = React.useCallback(() => {
    setTimeout(() => router.push(portal.redirectPath), 400);
  }, [router, portal.redirectPath]);

  const onSubmit = async (data: RiderRegisterFormData) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: "RIDER",
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
    const result = await verifyOTP(userEmail, otp, "RIDER");

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
    const result = await resendOTP(userEmail, "RIDER");
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
      {portal.logo ?? <Bike className="h-7 w-7" />}
    </div>
  );

  if (showOTP) {
    return (
      <div className={cn("w-full", className)}>
        <div className="mb-4 flex flex-col items-center gap-3">
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
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-6 flex flex-col items-center gap-3">
        {portalIcon}
        <h1 className="text-2xl font-semibold">Become a Rider</h1>
        <p className="text-center text-sm text-muted-foreground">
          {portal.description}
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
          label="Phone number"
          placeholder="+234 801 234 5678"
          startContent={<Phone className="h-4 w-4 text-muted-foreground" />}
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
          className="mt-2 rounded-xl bg-orange-600 font-semibold hover:bg-orange-700"
        >
          {({ isPending }) =>
            isPending ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" />
                Creating account...
              </span>
            ) : (
              "Create Rider Account"
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
  );
}
