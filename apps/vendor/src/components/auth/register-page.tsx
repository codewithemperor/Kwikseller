"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { type FieldErrors, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, Phone, Building2, AlertCircle } from "lucide-react";
import {
  cn,
  TextInput,
  PasswordInput,
  OTPVerification,
  AppButton,
  BrandedAuthHeader,
} from "@kwikseller/ui";
import { kwikToast, useAuth } from "@kwikseller/utils";
import { registerSchema, type RegisterFormData } from "@kwikseller/types";

const STORE_CATEGORIES = [
  { value: 'fashion', label: 'Fashion & Apparel' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'food', label: 'Food & Beverages' },
  { value: 'health', label: 'Health & Beauty' },
  { value: 'home', label: 'Home & Garden' },
  { value: 'sports', label: 'Sports & Outdoors' },
  { value: 'books', label: 'Books & Media' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'baby', label: 'Baby & Kids' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'services', label: 'Services' },
  { value: 'other', label: 'Other' },
];

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

function collectValidationMessages(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectValidationMessages);
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(collectValidationMessages);
  }
  return [];
}

function getRegisterErrorMessage(error: unknown) {
  const responseData = (error as { response?: { data?: unknown } })?.response?.data;
  const messages = collectValidationMessages(responseData);
  if (messages.length) return messages[0];

  if (error instanceof Error && error.message && error.message !== "Validation error") {
    return error.message;
  }

  return "Registration failed. Please check your details and try again.";
}

function getFirstFormError(errors: FieldErrors<RegisterFormData>) {
  for (const value of Object.values(errors)) {
    if (value?.message && typeof value.message === "string") return value.message;
  }
  return "Please fix the highlighted fields before continuing.";
}

export function RegisterPage({ config, className }: RegisterPageProps) {
  const router = useRouter();
  const { register: registerUser, verifyOTP, resendOTP, isLoading } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const { control, handleSubmit, watch, setValue } = useForm<RegisterFormData>({
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
      storeCategory: "other",
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
        storeCategory: data.storeCategory || "other",
      });

      setUserEmail(data.email);
      setShowOTP(true);
      kwikToast.info(
        result.message || "Please check your email for the verification code.",
      );
    } catch (err) {
      const message = getRegisterErrorMessage(err);
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

  const busy = isSubmitting || isLoading;
  const onInvalid = (errors: FieldErrors<RegisterFormData>) => {
    const message = getFirstFormError(errors);
    setError(message);
    kwikToast.error(message);
  };

  if (showOTP) {
    return (
      <div className={cn("w-full", className)}>
        <BrandedAuthHeader
          title="Verify vendor email"
          description="Enter the verification code sent to your email to activate your vendor account."
          logoSrc="/icon.png"
          logoDarkSrc="/icon-dark.png"
          logoClassName="h-8"
        />
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
      <BrandedAuthHeader
        title="Create your vendor account"
        description="Start with a store profile built for products, inventory, orders, fulfillment, and Pool resale."
        logoSrc="/icon.png"
        logoDarkSrc="/icon-dark.png"
        logoClassName="h-8"
      />

      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit, onInvalid)}
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
          label="Phone"
          placeholder="+234 801 234 5678"
          startContent={<Phone className="h-4 w-4 text-muted-foreground" />}
          isRequired
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

        <div className="space-y-1.5">
          <label
            htmlFor="storeCategory"
            className="block text-sm font-medium text-foreground"
          >
            Store category <span className="text-red-500">*</span>
          </label>
          <select
            id="storeCategory"
            value={watch("storeCategory") || "other"}
            onChange={(e) => setValue("storeCategory", e.target.value)}
            disabled={busy}
            className="flex h-10 w-full rounded-lg border-[1px] border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {STORE_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

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

        <AppButton
          type="submit"
          fullWidth
          size="lg"
          isLoading={busy}
          loadingLabel="Creating account..."
          className="mt-2 rounded-xl font-semibold"
        >
          Create Vendor Account
        </AppButton>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href={config.loginPath}
            className="font-medium text-accent hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
