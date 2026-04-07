"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, Bike, Phone, Car, Truck, AlertCircle } from "lucide-react";
import { Button, Spinner } from "@heroui/react";
import { cn, TextInput, PasswordInput, OTPVerification } from "@kwikseller/ui";
import { kwikToast, useAuth } from "@kwikseller/utils";
import {
  riderRegisterSchema,
  type RiderRegisterFormData,
  type VehicleType,
} from "@kwikseller/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RegisterRiderConfig {
  name: string;
  logo?: React.ReactNode;
  description: string;
  themeColor: string;
  redirectPath: string;
  loginPath: string;
  onboardingPath?: string;
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

// Vehicle options for UI display
const vehicleOptions: {
  value: VehicleType;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    value: "BIKE",
    label: "Bicycle",
    icon: <Bike className="w-5 h-5" />,
    description: "Perfect for short distances",
  },
  {
    value: "MOTORCYCLE",
    label: "Motorcycle",
    icon: <Bike className="w-5 h-5" />,
    description: "Fast & efficient for cities",
  },
  {
    value: "CAR",
    label: "Car",
    icon: <Car className="w-5 h-5" />,
    description: "For larger deliveries",
  },
  {
    value: "TRUCK",
    label: "Truck/Van",
    icon: <Truck className="w-5 h-5" />,
    description: "Heavy-duty deliveries",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function RegisterPage({ portal, className }: RegisterPageProps) {
  const router = useRouter();
  const { register: registerUser, verifyOTP, resendOTP, isLoading } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const { control, handleSubmit, watch, setValue } =
    useForm<RiderRegisterFormData>({
      resolver: zodResolver(riderRegisterSchema),
      defaultValues: {
        email: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
        phone: "",
        role: "RIDER",
        vehicleType: undefined,
        plateNumber: "",
      },
    });

  const selectedVehicle = watch("vehicleType");
  const onboardingPath = portal.onboardingPath || "/onboarding";

  const redirectToApp = React.useCallback(() => {
    // After registration, riders need to complete onboarding
    setTimeout(() => router.push(onboardingPath), 400);
  }, [router, onboardingPath]);

  // ── Registration submit ────────────────────────────────────────────────────

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
        vehicleType: data.vehicleType,
        plateNumber: data.plateNumber,
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

  const handleVerifyOTP = async (otp: string) => {
    const result = await verifyOTP(userEmail, otp);

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
      {portal.logo ?? <Bike className="w-7 h-7" />}
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

  // ── Registration form ──────────────────────────────────────────────────────

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
          <div className="flex flex-col items-center gap-3 mb-6">
            {portalIcon}
            <h1 className="text-2xl font-semibold">Become a Rider</h1>
            <p className="text-sm text-muted-foreground text-center">
              {portal.description}
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
              label="Phone number"
              placeholder="+234 801 234 5678"
              startContent={<Phone className="w-4 h-4 text-muted-foreground" />}
              isRequired
              isDisabled={busy}
            />

            {/* Vehicle Type Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Vehicle Type <span className="text-danger">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {vehicleOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setValue("vehicleType", option.value, {
                        shouldValidate: true,
                      })
                    }
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all",
                      selectedVehicle === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50",
                    )}
                    disabled={busy}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        selectedVehicle === option.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {option.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{option.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <TextInput
              name="plateNumber"
              control={control}
              label="Plate Number"
              placeholder="ABC 123 XY"
              isRequired
              isDisabled={busy}
            />

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
              className="mt-2 font-semibold rounded-xl bg-orange-600 hover:bg-orange-700"
            >
              {({ isPending }) =>
                isPending ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" />
                    Creating account…
                  </span>
                ) : (
                  "Create Rider Account"
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
