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
import { maskEmail } from "../lib/utils";

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
  const [error, setError] = React.useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = React.useState(60);

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleComplete = (code: string) => {
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
    if (resendCooldown > 0 || isLoading) return;
    try {
      await onResend();
      setResendCooldown(60);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code");
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
            onChange={(val) => {
              setValue(val);
              setIsComplete(false);
              setError(null);
            }}
            onComplete={handleComplete}
            isDisabled={isLoading || isSubmitting}
          >
            <InputOTP.Group>
              <InputOTP.Slot index={0} />
              <InputOTP.Slot index={1} />
              <InputOTP.Slot index={2} />
            </InputOTP.Group>
            <InputOTP.Separator />
            <InputOTP.Group>
              <InputOTP.Slot index={3} />
              <InputOTP.Slot index={4} />
              <InputOTP.Slot index={5} />
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
          isDisabled={!isComplete || isLoading || isSubmitting}
          isPending={isSubmitting}
          type="submit"
          className="font-semibold rounded-xl"
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
            disabled={isLoading}
            className="bg-black font-medium hover:underline disabled:opacity-50"
          >
            <span className="text-primary-500">Resend</span>
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
