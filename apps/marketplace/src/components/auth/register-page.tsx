'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Mail, Lock, Eye, EyeOff, Store, User, Phone, Building2, ChevronRight } from 'lucide-react';
import { cn } from '@kwikseller/ui/utils';
import { Button } from '@kwikseller/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@kwikseller/ui/card';
import { Badge } from '@kwikseller/ui/badge';
import { useAuth } from '@kwikseller/utils';
import { toast } from 'sonner';

// Register schema
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  phone: z.string().optional(),
  role: z.enum(['BUYER', 'VENDOR']),
  // Vendor-specific fields
  storeName: z.string().optional(),
  storeCategory: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
}).refine((data) => {
  if (data.role === 'VENDOR') {
    return !!data.storeName && data.storeName.length >= 3;
  }
  return true;
}, {
  message: 'Store name is required for vendors',
  path: ['storeName'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

// Portal config
export interface RegisterPortalConfig {
  name: string;
  logo?: React.ReactNode;
  description: string;
  themeColor: string;
  redirectPath: string;
  loginPath: string;
  defaultRole?: 'BUYER' | 'VENDOR';
  showRoleSelector?: boolean;
}

interface RegisterPageProps {
  portal: RegisterPortalConfig;
  className?: string;
}

export function RegisterPage({ portal, className }: RegisterPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register: registerUser, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<'BUYER' | 'VENDOR'>(
    (searchParams.get('role') as 'BUYER' | 'VENDOR') || portal.defaultRole || 'BUYER'
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: selectedRole,
    },
  });

  const role = watch('role');

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    
    try {
      const result = await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role,
      });
      
      toast.success(result.message || 'Registration successful! Please check your email to verify your account.');
      router.push(portal.loginPath + '?registered=true');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(message);
      toast.error(message);
    }
  };

  const handleRoleSelect = (role: 'BUYER' | 'VENDOR') => {
    setSelectedRole(role);
    setValue('role', role);
    setStep(2);
  };

  // Step 1: Role selection
  if (step === 1 && portal.showRoleSelector) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4', className)}>
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
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
            </div>
            <CardTitle className="text-2xl font-bold">Join {portal.name}</CardTitle>
            <CardDescription>Choose how you want to use the platform</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <button
              onClick={() => handleRoleSelect('BUYER')}
              className="w-full p-6 text-left border rounded-xl hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">I want to shop</h3>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Browse products, track orders, and earn KwikCoins rewards
                  </p>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => handleRoleSelect('VENDOR')}
              className="w-full p-6 text-left border rounded-xl hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">I want to sell</h3>
                    <Badge variant="secondary" className="text-xs">Popular</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create your store, list products, and grow your business
                  </p>
                </div>
              </div>
            </button>
          </CardContent>
          
          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href={portal.loginPath} className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Step 2: Registration form
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
          <CardTitle className="text-2xl font-bold">
            Create your {selectedRole === 'VENDOR' ? 'vendor' : 'buyer'} account
          </CardTitle>
          <CardDescription>
            {selectedRole === 'VENDOR' 
              ? 'Start selling on Africa\'s largest marketplace'
              : 'Join millions of shoppers across Africa'}
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}
            
            {/* Name fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  {...register('firstName')}
                  disabled={isSubmitting || isLoading}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-500">{errors.firstName.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  {...register('lastName')}
                  disabled={isSubmitting || isLoading}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-500">{errors.lastName.message}</p>
                )}
              </div>
            </div>
            
            {/* Email */}
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
            
            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+234 801 234 5678"
                  className="pl-10"
                  {...register('phone')}
                  disabled={isSubmitting || isLoading}
                />
              </div>
            </div>
            
            {/* Vendor-specific: Store name */}
            {role === 'VENDOR' && (
              <div className="space-y-2">
                <Label htmlFor="storeName">Store name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="storeName"
                    placeholder="My Awesome Store"
                    className="pl-10"
                    {...register('storeName')}
                    disabled={isSubmitting || isLoading}
                  />
                </div>
                {errors.storeName && (
                  <p className="text-sm text-red-500">{errors.storeName.message}</p>
                )}
              </div>
            )}
            
            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
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
            
            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  className="pl-10"
                  {...register('confirmPassword')}
                  disabled={isSubmitting || isLoading}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>
            
            {/* Hidden role field */}
            <input type="hidden" {...register('role')} />
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || isLoading}
            >
              {(isSubmitting || isLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
            
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{' '}
              <Link href={portal.loginPath} className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
