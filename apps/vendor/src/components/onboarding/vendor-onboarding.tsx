"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Store, 
  Building2, 
  FileText, 
  Banknote, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  Upload,
  Loader2,
} from "lucide-react";
import { Button, Progress } from "@heroui/react";
import { cn, TextInput, SelectInput } from "@kwikseller/ui";
import { kwikToast, useAuth, useVendorNeedsOnboarding } from "@kwikseller/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Types & Schemas
// ─────────────────────────────────────────────────────────────────────────────

const storeInfoSchema = z.object({
  storeName: z.string().min(2, "Store name must be at least 2 characters"),
  storeCategory: z.string().min(1, "Please select a category"),
  storeDescription: z.string().min(10, "Description must be at least 10 characters").max(500),
});

const kycSchema = z.object({
  cacNumber: z.string().optional(),
  bvn: z.string().length(11, "BVN must be 11 digits").optional().or(z.literal("")),
  tin: z.string().optional(),
});

const bankDetailsSchema = z.object({
  bankCode: z.string().min(1, "Please select a bank"),
  bankName: z.string().min(1, "Bank name is required"),
  accountNumber: z.string().length(10, "Account number must be 10 digits"),
  accountName: z.string().min(2, "Account name is required"),
});

type StoreInfoFormData = z.infer<typeof storeInfoSchema>;
type KycFormData = z.infer<typeof kycSchema>;
type BankDetailsFormData = z.infer<typeof bankDetailsSchema>;

const TOTAL_STEPS = 3;

const STORE_CATEGORIES = [
  { value: "electronics", label: "Electronics & Gadgets" },
  { value: "fashion", label: "Fashion & Apparel" },
  { value: "home-garden", label: "Home & Garden" },
  { value: "beauty", label: "Beauty & Personal Care" },
  { value: "sports", label: "Sports & Outdoors" },
  { value: "toys", label: "Toys & Games" },
  { value: "books", label: "Books & Stationery" },
  { value: "automotive", label: "Automotive" },
  { value: "food", label: "Food & Groceries" },
  { value: "health", label: "Health & Wellness" },
  { value: "other", label: "Other" },
];

const NIGERIAN_BANKS = [
  { value: "044", label: "Access Bank" },
  { value: "014", label: "Afribank" },
  { value: "023", label: "Citibank" },
  { value: "063", label: "Diamond Bank" },
  { value: "050", label: "Ecobank" },
  { value: "040", label: "Equitorial Trust Bank" },
  { value: "011", label: "First Bank of Nigeria" },
  { value: "214", label: "First City Monument Bank" },
  { value: "058", label: "Guaranty Trust Bank" },
  { value: "069", label: "Intercontinental Bank" },
  { value: "056", label: "Oceanic Bank" },
  { value: "082", label: "Bank Phb" },
  { value: "076", label: "Skye Bank" },
  { value: "084", label: "Spring Bank" },
  { value: "221", label: "Stanbic IBTC Bank" },
  { value: "068", label: "Standard Chartered Bank" },
  { value: "232", label: "Sterling Bank" },
  { value: "033", label: "United Bank for Africa" },
  { value: "032", label: "Union Bank of Nigeria" },
  { value: "035", label: "Wema Bank" },
  { value: "057", label: "Zenith Bank" },
  { value: "000", label: "Moniepoint MFB" },
  { value: "001", label: "OPay" },
  { value: "002", label: "PalmPay" },
  { value: "003", label: "Kuda Bank" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Step Components
// ─────────────────────────────────────────────────────────────────────────────

interface StepProps {
  control: any;
  isSubmitting: boolean;
}

function StoreInfoStep({ control, isSubmitting }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-3">
          <Building2 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
        </div>
        <h2 className="text-xl font-semibold">Store Information</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Tell us about your store
        </p>
      </div>

      <TextInput
        name="storeName"
        control={control}
        label="Store Name"
        placeholder="Your awesome store name"
        isRequired
        isDisabled={isSubmitting}
      />

      <SelectInput
        name="storeCategory"
        control={control}
        label="Store Category"
        placeholder="Select a category"
        options={STORE_CATEGORIES}
        isRequired
        isDisabled={isSubmitting}
      />

      <TextInput
        name="storeDescription"
        control={control}
        label="Store Description"
        placeholder="Describe what you sell..."
        isRequired
        isDisabled={isSubmitting}
      />
    </div>
  );
}

function KycDocumentsStep({ control, isSubmitting }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-3">
          <FileText className="w-6 h-6 text-orange-600 dark:text-orange-400" />
        </div>
        <h2 className="text-xl font-semibold">KYC Documents</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Provide your business verification details
        </p>
      </div>

      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Note:</strong> These details help verify your business. You can skip some fields if not applicable, 
          but providing them increases your store credibility.
        </p>
      </div>

      <TextInput
        name="cacNumber"
        control={control}
        label="CAC Registration Number"
        placeholder="e.g., RC1234567"
        description="Corporate Affairs Commission registration number (for registered businesses)"
        isDisabled={isSubmitting}
      />

      <TextInput
        name="bvn"
        control={control}
        label="BVN"
        placeholder="11-digit Bank Verification Number"
        description="Your Bank Verification Number for identity verification"
        isDisabled={isSubmitting}
      />

      <TextInput
        name="tin"
        control={control}
        label="TIN"
        placeholder="Tax Identification Number"
        description="Your Tax Identification Number (optional but recommended)"
        isDisabled={isSubmitting}
      />
    </div>
  );
}

function BankDetailsStep({ control, isSubmitting }: StepProps) {
  const selectedBankCode = useWatch({ control, name: "bankCode" });
  
  const selectedBank = NIGERIAN_BANKS.find(b => b.value === selectedBankCode);

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-3">
          <Banknote className="w-6 h-6 text-orange-600 dark:text-orange-400" />
        </div>
        <h2 className="text-xl font-semibold">Bank Details</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Where should we send your payouts?
        </p>
      </div>

      <SelectInput
        name="bankCode"
        control={control}
        label="Bank"
        placeholder="Select your bank"
        options={NIGERIAN_BANKS}
        isRequired
        isDisabled={isSubmitting}
      />

      <input type="hidden" {...control.register("bankName")} value={selectedBank?.label || ""} />

      <TextInput
        name="accountNumber"
        control={control}
        label="Account Number"
        placeholder="10-digit account number"
        isRequired
        isDisabled={isSubmitting}
      />

      <TextInput
        name="accountName"
        control={control}
        label="Account Name"
        placeholder="Account holder's name"
        isRequired
        isDisabled={isSubmitting}
      />

      <div className="p-4 bg-muted/50 rounded-lg mt-4">
        <p className="text-xs text-muted-foreground">
          By providing your bank details, you agree that payouts will be sent to this account. 
          Make sure the account name matches your registered business name or personal name.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

interface VendorOnboardingProps {
  redirectPath?: string;
}

export function VendorOnboarding({ redirectPath = "/dashboard" }: VendorOnboardingProps) {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Form for each step
  const storeInfoForm = useForm<StoreInfoFormData>({
    resolver: zodResolver(storeInfoSchema),
    defaultValues: {
      storeName: user?.store?.name || "",
      storeCategory: "",
      storeDescription: "",
    },
  });

  const kycForm = useForm<KycFormData>({
    resolver: zodResolver(kycSchema),
    defaultValues: {
      cacNumber: "",
      bvn: "",
      tin: "",
    },
  });

  const bankDetailsForm = useForm<BankDetailsFormData>({
    resolver: zodResolver(bankDetailsSchema),
    defaultValues: {
      bankCode: "",
      bankName: "",
      accountNumber: "",
      accountName: "",
    },
  });

  const progress = (currentStep / TOTAL_STEPS) * 100;

  const handleNext = async () => {
    if (currentStep === 1) {
      const isValid = await storeInfoForm.trigger();
      if (!isValid) return;
    } else if (currentStep === 2) {
      const isValid = await kycForm.trigger();
      if (!isValid) return;
    }

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    const isValid = await bankDetailsForm.trigger();
    if (!isValid) return;

    setIsSubmitting(true);

    try {
      // TODO: Submit to API
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update user store info
      updateUser({
        store: {
          ...user?.store!,
          onboardingComplete: true,
          onboardingStep: "COMPLETED",
          verificationStatus: "PENDING_REVIEW",
        },
      });

      setIsComplete(true);
      kwikToast.success("Onboarding submitted successfully!");
      
      setTimeout(() => {
        router.push(redirectPath);
      }, 2000);
    } catch (error) {
      kwikToast.error("Failed to submit onboarding. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success screen
  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">Onboarding Complete!</h1>
          <p className="text-muted-foreground mb-6">
            Your information has been submitted for verification. You&apos;ll be notified once your store is verified.
          </p>
          <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Store className="w-8 h-8 text-orange-600" />
            <span className="text-2xl font-bold">Vendor Onboarding</span>
          </div>
          <p className="text-muted-foreground">
            Complete your vendor profile to start selling
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span>Step {currentStep} of {TOTAL_STEPS}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress 
            value={progress} 
            className="h-2"
            classNames={{
              indicator: "bg-orange-600",
            }}
          />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mb-8">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={cn(
                "flex items-center gap-2 text-sm",
                currentStep >= step ? "text-orange-600" : "text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  currentStep > step
                    ? "bg-orange-600 text-white"
                    : currentStep === step
                    ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 border-2 border-orange-600"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {currentStep > step ? <Check className="w-4 h-4" /> : step}
              </div>
              <span className="hidden sm:inline">
                {step === 1 ? "Store Info" : step === 2 ? "KYC" : "Bank"}
              </span>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
          {currentStep === 1 && (
            <StoreInfoStep control={storeInfoForm.control} isSubmitting={isSubmitting} />
          )}
          {currentStep === 2 && (
            <KycDocumentsStep control={kycForm.control} isSubmitting={isSubmitting} />
          )}
          {currentStep === 3 && (
            <BankDetailsStep control={bankDetailsForm.control} isSubmitting={isSubmitting} />
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="flat"
              onPress={handleBack}
              isDisabled={currentStep === 1 || isSubmitting}
              startContent={<ChevronLeft className="w-4 h-4" />}
            >
              Back
            </Button>

            {currentStep < TOTAL_STEPS ? (
              <Button
                color="primary"
                onPress={handleNext}
                isDisabled={isSubmitting}
                endContent={<ChevronRight className="w-4 h-4" />}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Continue
              </Button>
            ) : (
              <Button
                color="primary"
                onPress={handleSubmit}
                isLoading={isSubmitting}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isSubmitting ? "Submitting..." : "Complete Onboarding"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
