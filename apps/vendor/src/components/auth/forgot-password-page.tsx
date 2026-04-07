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
  appName = "KWIKSELLER",
  themeColor = "orange",
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
      const result = await forgotPassword(data.email);

      if (result.success) {
        // Store email in Zustand (memory only - NOT localStorage or URL)
        setPendingResetEmail(data.email);
        
        kwikToast.success(
          result.message || "Verification code sent to your email!",
        );
        // Redirect to reset page WITHOUT email in URL
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        aria-hidden
      >
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-border/60 bg-card text-card-foreground shadow-xl dark:shadow-2xl dark:shadow-black/40 p-8">
          <div className="flex flex-col items-center gap-3 mb-8">
            <div
              className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg",
                iconColor,
              )}
            >
              <Store className="w-7 h-7" />
            </div>
            <div className="text-center space-y-1">
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
              startContent={<Mail className="w-4 h-4 text-muted-foreground" />}
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
                    Sending code&hellip;
                  </span>
                ) : (
                  "Send Verification Code"
                )
              }
            </Button>

            <Link
              href={loginPath}
              className="text-sm text-center text-muted-foreground flex items-center justify-center gap-2 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} {appName} &middot; All rights
          reserved
        </p>
      </div>
    </div>
  );
}
