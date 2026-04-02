"use client";

import React from "react";
import { Controller, Control, FieldValues, Path } from "react-hook-form";
import {
  TextField,
  Label,
  FieldError,
  Description
} from "@heroui/react";

// ==================== OTP INPUT ====================

interface OTPInputProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  length?: number;
  placeholder?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  className?: string;
  description?: string;
}

export type { OTPInputProps };

export function OTPInput<T extends FieldValues>({
  name,
  control,
  label,
  length = 6,
  isRequired = false,
  isDisabled = false,
  className,
  description,
}: OTPInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <TextField
          className={className}
          isDisabled={isDisabled}
          isRequired={isRequired}
          isInvalid={!!error}
        >
          <Label>{label}</Label>
          <div className="flex gap-2 justify-center">
            {Array.from({ length }).map((_, index) => (
              <input
                key={index}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={field.value?.[index] ?? ""}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  const newValue = (field.value || "").split("");
                  newValue[index] = value;
                  const updated = newValue.join("").slice(0, length);
                  field.onChange(updated);
                }}
                className="w-12 h-14 text-center text-xl font-semibold
                               border border-border rounded-xl 
                               bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 
                               outline-none transition-all
                               disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isDisabled}
              />
            ))}
          </div>
          {description && !error && <Description>{description}</Description>}
          <FieldError>{error?.message}</FieldError>
        </TextField>
      )}
    />
  );
}

// ==================== OTP VERIFICATION MODAL ====================

export interface OTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  email: string;
  type: "email-verification" | "password-reset" | "login-verification";
  isLoading?: boolean;
}

export function OTPModal({
  isOpen,
  onClose,
  onVerify,
  onResend,
  email,
  type,
  isLoading = false,
}: OTPModalProps) {
  const [otp, setOtp] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = React.useState(60);
  const [verifying, setVerifying] = React.useState(false);
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer
  React.useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setOtp("");
      setError(null);
      setResendCooldown(60);
    }
  }, [isOpen]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = otp.split("");
    newOtp[index] = value;
    const updated = newOtp.join("").slice(0, 6);
    setOtp(updated);
    setError(null);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      await onVerify(otp);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    try {
      await onResend();
      setResendCooldown(60);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code");
    }
  };

  if (!isOpen) return null;

  const titles = {
    "email-verification": "Verify Your Email",
    "password-reset": "Verify Your Identity",
    "login-verification": "Verify Your Account",
  };

  const descriptions = {
    "email-verification": "We've sent a verification code to",
    "password-reset": "We've sent a verification code to",
    "login-verification": "Your account needs verification. Code sent to",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-card rounded-2xl shadow-2xl p-8 border border-border">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-8 h-8 text-primary"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold">{titles[type]}</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {descriptions[type]}
          </p>
          <p className="text-sm font-medium text-foreground mt-1">{email}</p>
        </div>

        {/* OTP Input */}
        <div className="flex justify-center gap-2 mb-6">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={otp[index] ?? ""}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={isLoading || verifying}
              className="w-12 h-14 text-center text-xl font-semibold 
                         border border-border rounded-xl 
                         bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 
                         outline-none transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed"
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
            {error}
          </div>
        )}

        {/* Verify button */}
        <button
          onClick={handleVerify}
          disabled={otp.length !== 6 || isLoading || verifying}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold
                     hover:bg-primary/90 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
        >
          {(isLoading || verifying) && (
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {verifying ? "Verifying..." : "Verify Code"}
        </button>

        {/* Resend link */}
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Didn&apos;t receive the code?{" "}
          {resendCooldown > 0 ? (
            <span className="text-muted-foreground">
              Resend in {resendCooldown}s
            </span>
          ) : (
            <button
              onClick={handleResend}
              disabled={isLoading}
              className="text-primary font-medium hover:underline disabled:opacity-50"
            >
              Resend code
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export { OTPInput as OTP };
