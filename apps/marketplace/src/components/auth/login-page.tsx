'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Mail, Lock, Eye, EyeOff, Store } from 'lucide-react';
import {
  cn,
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@kwikseller/ui';
import { useAuth } from '@kwikseller/utils';
import { toast } from 'sonner';

// Login schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// Portal config for branding
export interface PortalConfig {
  name: string;
  logo?: React.ReactNode;
  description: string;
  themeColor: string;
  redirectPath: string;
  showRegisterLink?: boolean;
  registerPath?: string;
}

interface LoginPageProps {
  portal: PortalConfig;
  className?: string;
}

export function LoginPage({ portal, className }: LoginPageProps) {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    
    try {
      await login(data);
      toast.success('Welcome back!');
      router.push(portal.redirectPath);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(message);
      toast.error(message);
    }
  };

  return (
    <div className={cn('min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4', className)}>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            {portal.logo || (
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center text-white',
                portal.themeColor === 'blue' && 'bg-blue-600',
                portal.themeColor === 'green' && 'bg-green-600',
                portal.themeColor === 'purple' && 'bg-purple-600',
                portal.themeColor === 'orange' && 'bg-orange-600',
                !portal.themeColor && 'bg-primary'
              )}>
                <Store className="w-6 h-6" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to {portal.name}</CardTitle>
          <CardDescription>{portal.description}</CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  {...register('email')}
                  disabled={isSubmitting || isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="pl-10 pr-10"
                  {...register('password')}
                  disabled={isSubmitting || isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || isLoading}
            >
              {(isSubmitting || isLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
            
            {portal.showRegisterLink && portal.registerPath && (
              <p className="text-sm text-center text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href={portal.registerPath} className="text-primary hover:underline font-medium">
                  Create one
                </Link>
              </p>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
