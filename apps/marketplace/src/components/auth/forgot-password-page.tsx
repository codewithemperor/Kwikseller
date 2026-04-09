"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ArrowLeft, Store } from "lucide-react";
import { Button, Spinner } from "@heroui/react";
import { cn, TextInput } from "@kwikseller/ui";
import { kwikToast, useAuth, usePendingResetEmail } from "@kwikseller/utils";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@kwikseller/types";

interface ForgotPasswordPageProps {
  loginPath: string;
  resetPath?: string;
  appName?: string;
  themeColor?: "blue" | "green" | "purple" | "orange" | "default";
}

const themeMap: Record<
  NonNullable<ForgotPasswordPageProps["themeColor"]>,
  string
> = {
  blue: "bg-blue-600",
  green: "bg-green-600",
  purple: "bg-purple-600",
  orange: "bg-orange-600",
  default: "bg-primary",
};

export function ForgotPasswordPage({
  loginPath,
  resetPath = "/reset-password",
  themeColor = "default",
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

  const iconColor = themeMap[themeColor];
  const busy = isSubmitting || isLoading;

  return (
    <div className="w-full">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg",
            iconColor,
          )}
        >
          <Store className="h-7 w-7" />
        </div>
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Forgot password?
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and we&apos;ll send you a verification code
          </p>
        </div>
      </div>

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
                Sending code...
              </span>
            ) : (
              "Send Verification Code"
            )
          }
        </Button>

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
