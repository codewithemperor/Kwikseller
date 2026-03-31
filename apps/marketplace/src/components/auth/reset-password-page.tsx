'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, CheckCircle } from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardFooter,
  Spinner,
} from '@heroui/react';
import { PasswordInput } from '@kwikseller/ui';
import { authApi } from '@kwikseller/api-client';
import { toast } from 'sonner';
import { resetPasswordSchema, type ResetPasswordFormData } from '@kwikseller/types';

interface ResetPasswordPageProps {
  loginPath: string;
}

export function ResetPasswordPage({ loginPath }: ResetPasswordPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      toast.error('Invalid reset link');
      router.push(loginPath);
    } else {
      setToken(tokenParam);
    }
  }, [searchParams, router, loginPath]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error('Invalid reset token');
      return;
    }

    setIsLoading(true);

    try {
      await authApi.resetPassword(token, data.password);

      setIsSuccess(true);
      toast.success('Password reset successful!');

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push(loginPath);
      }, 3000);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to reset password',
      );
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
            <h1 className="text-2xl font-bold">Password reset successful!</h1>
            <p className="text-sm text-default-500 text-center">
              Your password has been reset. You will be redirected to login
              shortly.
            </p>
          </CardHeader>

          <CardFooter className="justify-center px-0">
            <Link href={loginPath} className="text-primary hover:underline">
              Go to login now
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
          <h1 className="text-2xl font-bold">Reset your password</h1>
          <p className="text-sm text-default-500 text-center">
            Enter a new password for your account
          </p>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <PasswordInput
              name="password"
              control={control}
              label="New Password"
              placeholder="Enter new password"
              startContent={<Lock className="w-4 h-4 text-default-400" />}
              isRequired
              isDisabled={isLoading || isSubmitting}
            />
            <ul className="text-xs text-default-500 space-y-1 ml-1">
              <li>• At least 8 characters</li>
              <li>• At least one uppercase and lowercase letter</li>
              <li>• At least one number</li>
            </ul>
          </div>

          <PasswordInput
            name="confirmPassword"
            control={control}
            label="Confirm Password"
            placeholder="Confirm new password"
            startContent={<Lock className="w-4 h-4 text-default-400" />}
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
              Reset Password
            </Button>

            <Link
              href={loginPath}
              className="text-sm text-primary hover:underline"
            >
              Back to login
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
