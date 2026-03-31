'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, Store, User, Phone, Building2, ChevronRight } from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardFooter,
  Chip,
  Spinner,
} from '@heroui/react';
import { cn, TextInput, PasswordInput } from '@kwikseller/ui';
import { useAuth } from '@kwikseller/utils';
import { toast } from 'sonner';
import { registerSchema, type RegisterFormData } from '@kwikseller/types';

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
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<'BUYER' | 'VENDOR'>(
    (searchParams.get('role') as 'BUYER' | 'VENDOR') || portal.defaultRole || 'BUYER'
  );

  const {
    control,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: selectedRole,
    },
  });

  const handleRoleSelect = (role: 'BUYER' | 'VENDOR') => {
    setSelectedRole(role);
    setValue('role', role);
    setStep(2);
  };

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

  // Step 1: Role selection
  if (step === 1 && portal.showRoleSelector) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center p-4', className)}>
        <Card className="w-full max-w-lg p-6">
          <CardHeader className="flex-col items-center gap-2 pb-4">
            <div className="flex justify-center mb-2">
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
            <h1 className="text-2xl font-bold">Join {portal.name}</h1>
            <p className="text-sm text-default-500">Choose how you want to use the platform</p>
          </CardHeader>
          
          <div className="flex flex-col gap-4 py-4">
            <button
              onClick={() => handleRoleSelect('BUYER')}
              className="w-full p-6 text-left border rounded-xl hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">I want to shop</h3>
                    <ChevronRight className="w-5 h-5 text-default-400" />
                  </div>
                  <p className="text-sm text-default-500 mt-1">
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
                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">I want to sell</h3>
                    <Chip size="sm" variant="soft" color="success">Popular</Chip>
                  </div>
                  <p className="text-sm text-default-500 mt-1">
                    Create your store, list products, and grow your business
                  </p>
                </div>
              </div>
            </button>
          </div>
          
          <CardFooter className="justify-center px-0">
            <p className="text-sm text-default-500">
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
    <div className={cn('min-h-screen flex items-center justify-center p-4', className)}>
      <Card className="w-full max-w-md p-6">
        <CardHeader className="flex-col items-center gap-2 pb-4">
          <div className="flex justify-center mb-2">
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
          <h1 className="text-2xl font-bold">
            Create your {selectedRole === 'VENDOR' ? 'vendor' : 'buyer'} account
          </h1>
          <p className="text-sm text-default-500">
            {selectedRole === 'VENDOR' 
              ? 'Start selling on Africa\'s largest marketplace'
              : 'Join millions of shoppers across Africa'}
          </p>
        </CardHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {error && (
            <div className="p-3 text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg">
              {error}
            </div>
          )}
          
          {/* Name fields */}
          <div className="grid grid-cols-2 gap-4">
            <TextInput
              name="firstName"
              control={control}
              label="First name"
              placeholder="John"
              isRequired
              isDisabled={isSubmitting || isLoading}
            />
            
            <TextInput
              name="lastName"
              control={control}
              label="Last name"
              placeholder="Doe"
              isRequired
              isDisabled={isSubmitting || isLoading}
            />
          </div>
          
          {/* Email */}
          <TextInput
            name="email"
            control={control}
            type="email"
            label="Email"
            placeholder="you@example.com"
            startContent={<Mail className="w-4 h-4 text-default-400" />}
            isRequired
            isDisabled={isSubmitting || isLoading}
          />
          
          {/* Phone */}
          <TextInput
            name="phone"
            control={control}
            type="tel"
            label="Phone (optional)"
            placeholder="+234 801 234 5678"
            startContent={<Phone className="w-4 h-4 text-default-400" />}
            isDisabled={isSubmitting || isLoading}
          />
          
          {/* Vendor-specific: Store name */}
          {selectedRole === 'VENDOR' && (
            <TextInput
              name="storeName"
              control={control}
              label="Store name"
              placeholder="My Awesome Store"
              startContent={<Building2 className="w-4 h-4 text-default-400" />}
              isRequired
              isDisabled={isSubmitting || isLoading}
            />
          )}
          
          {/* Password */}
          <PasswordInput
            name="password"
            control={control}
            label="Password"
            placeholder="Create a password"
            startContent={<Lock className="w-4 h-4 text-default-400" />}
            isRequired
            isDisabled={isSubmitting || isLoading}
          />
          
          {/* Confirm Password */}
          <PasswordInput
            name="confirmPassword"
            control={control}
            label="Confirm password"
            placeholder="Confirm your password"
            startContent={<Lock className="w-4 h-4 text-default-400" />}
            isRequired
            isDisabled={isSubmitting || isLoading}
          />
          
          {/* Hidden role field - controlled via setValue */}
          <input type="hidden" value={selectedRole} />
          
          <CardFooter className="flex flex-col gap-4 px-0 pt-4">
            <Button
              type="submit"
              className="w-full h-12 font-medium"
              isDisabled={isSubmitting || isLoading}
            >
              {(isSubmitting || isLoading) && <Spinner size="sm" className="mr-2" />}
              Create Account
            </Button>
            
            <p className="text-sm text-center text-default-500">
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
