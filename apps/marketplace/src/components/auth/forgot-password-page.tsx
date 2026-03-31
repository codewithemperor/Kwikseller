'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardFooter,
  Spinner,
} from '@heroui/react';
import { TextInput } from '@kwikseller/ui';
import { authApi } from '@kwikseller/api-client';
import { toast } from 'sonner';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@kwikseller/types';

interface ForgotPasswordPageProps {
  loginPath: string;
  appName?: string;
}

export function ForgotPasswordPage({
  loginPath,
  appName = 'KWIKSELLER',
}: ForgotPasswordPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);

    try {
      await authApi.forgotPassword(data.email);

      setIsSuccess(true);
      toast.success('Reset link sent! Check your email.');
    } catch {
      toast.error('Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6">
          <CardHeader className="flex-col items-center gap-2 pb-4">
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
            </div>
            <h1 className="text-2xl font-bold">Check your email</h1>
            <p className="text-sm text-default-500 text-center">
              We&apos;ve sent a password reset link to your email address. The
              link will expire in 1 hour.
            </p>
          </CardHeader>

          <div className="text-center text-sm text-default-500 py-4">
            <p>Didn&apos;t receive the email? Check your spam folder or</p>
            <button
              onClick={() => setIsSuccess(false)}
              className="text-primary hover:underline"
            >
              try another email address
            </button>
          </div>

          <CardFooter className="justify-center px-0">
            <Link
              href={loginPath}
              className="text-sm text-primary hover:underline"
            >
              <span className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </span>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <CardHeader className="flex-col items-center gap-2 pb-4">
          <h1 className="text-2xl font-bold">Forgot your password?</h1>
          <p className="text-sm text-default-500 text-center">
            Enter your email address and we&apos;ll send you a link to reset
            your password.
          </p>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <TextInput
            name="email"
            control={control}
            type="email"
            label="Email"
            placeholder="you@example.com"
            startContent={<Mail className="w-4 h-4 text-default-400" />}
            isRequired
            isDisabled={isLoading || isSubmitting}
          />

          <CardFooter className="flex flex-col gap-4 px-0 pt-4">
            <Button
              type="submit"
              className="w-full h-12 font-medium"
              isDisabled={isLoading || isSubmitting}
            >
              {(isLoading || isSubmitting) && <Spinner size="sm" className="mr-2" />}
              Send Reset Link
            </Button>

            <Link
              href={loginPath}
              className="text-sm text-primary hover:underline"
            >
              <span className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </span>
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
