"use client";

import React from "react";
import {
  InputOTP,
  Form as HeroForm,
  Label,
  Surface,
  Button,
  Spinner,
} from "@heroui/react";
import { AlertCircle } from "lucide-react";
import { maskEmail } from "@/lib/utils";
import { kwikToast } from "@/lib/toast";

const otpSlotClass =
  "h-11 w-10 rounded-lg border border-border bg-background text-base font-semibold text-foreground shadow-none outline-none transition-colors data-[active=true]:border-accent data-[active=true]:ring-2 data-[active=true]:ring-accent/15 data-[invalid=true]:border-danger dark:border-white/12 dark:bg-white/[0.03]";
const otpGroupClass = "gap-2";
const otpSeparatorClass = "mx-0 h-px w-3 bg-border";

export interface OTPVerificationProps {
  email: string;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack: () => void;
  isLoading?: boolean;
}

export function OTPVerification({
  email,
  onVerify,
  onResend,
  onBack,
  isLoading = false,
}: OTPVerificationProps) {
  const [value, setValue] = React.useState("");
  const [isComplete, setIsComplete] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = React.useState(60);

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleComplete = () => {
    setIsComplete(true);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isComplete || value.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onVerify(value);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isLoading || isResending) return;
    const toastId = kwikToast.loading("Resending verification code...");
    setIsResending(true);
    try {
      await onResend();
      setResendCooldown(60);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code");
    } finally {
      kwikToast.close(toastId);
      setIsResending(false);
    }
  };

  return (
    <Surface
      className="flex flex-col gap-4 rounded-2xl pb-6 px-6"
      variant="transparent"
    >
      <div className="flex flex-col gap-1 text-center mb-6">
        <Label className="text-xl font-semibold">Verify Your Email</Label>
        <p className="text-sm text-muted-foreground">
          We&apos;ve sent a verification code to{" "}
          <span className="font-medium text-foreground">
            {maskEmail(email)}
          </span>
        </p>
      </div>

      <HeroForm className="flex w-full flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col items-center gap-2">
          <InputOTP
            maxLength={6}
            value={value}
            onChange={(val: string) => {
              setValue(val);
              setIsComplete(false);
              setError(null);
            }}
            onComplete={handleComplete}
            isDisabled={isLoading || isSubmitting || isResending}
            className="justify-center gap-2"
          >
            <InputOTP.Group className={otpGroupClass}>
              <InputOTP.Slot index={0} className={otpSlotClass} />
              <InputOTP.Slot index={1} className={otpSlotClass} />
              <InputOTP.Slot index={2} className={otpSlotClass} />
            </InputOTP.Group>
            <InputOTP.Separator className={otpSeparatorClass} />
            <InputOTP.Group className={otpGroupClass}>
              <InputOTP.Slot index={3} className={otpSlotClass} />
              <InputOTP.Slot index={4} className={otpSlotClass} />
              <InputOTP.Slot index={5} className={otpSlotClass} />
            </InputOTP.Group>
          </InputOTP>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button
          variant="primary"
          size="lg"
          fullWidth
          isDisabled={!isComplete || isLoading || isSubmitting || isResending}
          isPending={isSubmitting}
          type="submit"
          className="rounded-lg font-semibold shadow-none"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Spinner size="sm" />
              Verifying…
            </span>
          ) : (
            "Verify Code"
          )}
        </Button>
      </HeroForm>

      <div className="flex items-center justify-center gap-2 text-sm">
        <p className="text-muted-foreground">Didn&apos;t receive a code?</p>
        {resendCooldown > 0 ? (
          <span className="text-muted-foreground">
            Resend in {resendCooldown}s
          </span>
        ) : (
          <button
            onClick={handleResend}
            disabled={isLoading || isResending}
            className="inline-flex items-center gap-1.5 bg-transparent font-semibold text-kwik-orange transition hover:text-kwik-orange-hover hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isResending ? (
              <>
                <Spinner color="current" size="sm" />
                Sending...
              </>
            ) : (
              "Resend"
            )}
          </button>
        )}
      </div>

      <button
        onClick={onBack}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Back to login
      </button>
    </Surface>
    // <div className="relative w-full max-w-md">
    // </div>
  );
}
