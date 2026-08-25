"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ArrowLeft } from "lucide-react";
import { TextInput } from "@/components/ui/form-inputs";
import { AppButton } from "@/components/ui/app-button";
import { kwikToast } from "@/lib/toast";
import { useAuth } from "@/lib/auth-context";
import { usePendingResetEmail } from "@/stores/auth-store";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/types";

interface ForgotPasswordPageProps {
  loginPath: string;
  resetPath?: string;
  appName?: string;
  themeColor?: "blue" | "green" | "purple" | "orange" | "default";
}

export function ForgotPasswordPage({
  loginPath,
  resetPath = "/reset-password",
}: ForgotPasswordPageProps) {
  const router = useRouter();
  const { forgotPassword, isLoading } = useAuth();
  const { setPendingResetEmail } = usePendingResetEmail();

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      const result = await forgotPassword(data.email, "BUYER");

      if (result.success) {
        setPendingResetEmail(data.email);
        kwikToast.success(
          result.message || "Verification code sent to your email!",
        );
        router.push(resetPath);
      } else {
        kwikToast.error(result.error || "Failed to send verification code");
      }
    } catch {
      kwikToast.error("Failed to send verification code. Please try again.");
    }
  };

  const busy = isSubmitting || isLoading;

  return (
    <div className="w-full">
      <div className="mb-8 space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Forgot password?
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a verification code
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="auth-form flex flex-col gap-4"
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
          isDisabled={busy}
        />

        <AppButton
          type="submit"
          fullWidth
          size="lg"
          isLoading={busy}
          disabled={busy}
          loadingLabel="Sending code..."
          className="mt-2"
        >
          Send Verification Code
        </AppButton>

        <Link
          href={loginPath}
          className="flex items-center justify-center gap-2 text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </form>
    </div>
  );
}
