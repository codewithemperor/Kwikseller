"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Bike,
  User,
  Car,
  FileText,
  Banknote,
  Check,
  ChevronLeft,
  ChevronRight,
  Upload,
  Loader2,
  Truck,
} from "lucide-react";
import { Button, ProgressBar } from "@heroui/react";
import { cn, TextInput, SelectInput } from "@kwikseller/ui";
import { kwikToast, useAuth } from "@kwikseller/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Types & Schemas
// ─────────────────────────────────────────────────────────────────────────────

const personalInfoSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  address: z.string().min(10, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
});

const vehicleInfoSchema = z.object({
  vehicleType: z.string().min(1, "Please select vehicle type"),
  vehicleBrand: z.string().min(1, "Vehicle brand is required"),
  vehicleModel: z.string().min(1, "Vehicle model is required"),
  vehicleYear: z.string().regex(/^\d{4}$/, "Enter a valid year"),
  vehicleColor: z.string().min(1, "Vehicle color is required"),
  plateNumber: z.string().min(1, "Plate number is required"),
});

const documentsSchema = z.object({
  nin: z.string().length(11, "NIN must be 11 digits"),
  licenseNumber: z.string().min(1, "License number is required"),
  licenseExpiry: z.string().min(1, "License expiry date is required"),
  // Document uploads would be handled separately
});

const bankDetailsSchema = z.object({
  bankCode: z.string().min(1, "Please select a bank"),
  bankName: z.string().min(1, "Bank name is required"),
  accountNumber: z.string().length(10, "Account number must be 10 digits"),
  accountName: z.string().min(2, "Account name is required"),
});

type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;
type VehicleInfoFormData = z.infer<typeof vehicleInfoSchema>;
type DocumentsFormData = z.infer<typeof documentsSchema>;
type BankDetailsFormData = z.infer<typeof bankDetailsSchema>;

const TOTAL_STEPS = 4;

const VEHICLE_TYPES = [
  { value: "BIKE", label: "Bicycle" },
  { value: "MOTORCYCLE", label: "Motorcycle / Okada" },
  { value: "SCOOTER", label: "Scooter" },
  { value: "CAR", label: "Car" },
  { value: "VAN", label: "Van" },
  { value: "TRUCK", label: "Truck / Keke" },
];

const VEHICLE_COLORS = [
  { value: "black", label: "Black" },
  { value: "white", label: "White" },
  { value: "red", label: "Red" },
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "yellow", label: "Yellow" },
  { value: "silver", label: "Silver" },
  { value: "grey", label: "Grey" },
  { value: "brown", label: "Brown" },
  { value: "other", label: "Other" },
];

const NIGERIAN_STATES = [
  { value: "Lagos", label: "Lagos" },
  { value: "Abuja", label: "Abuja (FCT)" },
  { value: "Rivers", label: "Rivers" },
  { value: "Kano", label: "Kano" },
  { value: "Oyo", label: "Oyo" },
  { value: "Kaduna", label: "Kaduna" },
  { value: "Delta", label: "Delta" },
  { value: "Anambra", label: "Anambra" },
  { value: "Imo", label: "Imo" },
  { value: "Ogun", label: "Ogun" },
  { value: "Other", label: "Other" },
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

function PersonalInfoStep({ control, isSubmitting }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-3">
          <User className="w-6 h-6 text-orange-600 dark:text-orange-400" />
        </div>
        <h2 className="text-xl font-semibold">Personal Information</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Tell us about yourself
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TextInput
          name="firstName"
          control={control}
          label="First Name"
          placeholder="John"
          isRequired
          isDisabled={isSubmitting}
        />
        <TextInput
          name="lastName"
          control={control}
          label="Last Name"
          placeholder="Doe"
          isRequired
          isDisabled={isSubmitting}
        />
      </div>

      <TextInput
        name="phone"
        control={control}
        label="Phone Number"
        placeholder="+234 801 234 5678"
        isRequired
        isDisabled={isSubmitting}
      />

      <TextInput
        name="address"
        control={control}
        label="Address"
        placeholder="Enter your full address"
        isRequired
        isDisabled={isSubmitting}
      />

      <div className="grid grid-cols-2 gap-4">
        <TextInput
          name="city"
          control={control}
          label="City"
          placeholder="Lagos"
          isRequired
          isDisabled={isSubmitting}
        />
        <SelectInput
          name="state"
          control={control}
          label="State"
          placeholder="Select state"
          options={NIGERIAN_STATES}
          isRequired
          isDisabled={isSubmitting}
        />
      </div>
    </div>
  );
}

function VehicleInfoStep({ control, isSubmitting }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-3">
          <Car className="w-6 h-6 text-orange-600 dark:text-orange-400" />
        </div>
        <h2 className="text-xl font-semibold">Vehicle Information</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Details about your delivery vehicle
        </p>
      </div>

      <SelectInput
        name="vehicleType"
        control={control}
        label="Vehicle Type"
        placeholder="Select vehicle type"
        options={VEHICLE_TYPES}
        isRequired
        isDisabled={isSubmitting}
      />

      <div className="grid grid-cols-2 gap-4">
        <TextInput
          name="vehicleBrand"
          control={control}
          label="Vehicle Brand"
          placeholder="e.g., Honda, Toyota"
          isRequired
          isDisabled={isSubmitting}
        />
        <TextInput
          name="vehicleModel"
          control={control}
          label="Vehicle Model"
          placeholder="e.g., Accord, Camry"
          isRequired
          isDisabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TextInput
          name="vehicleYear"
          control={control}
          label="Year"
          placeholder="e.g., 2020"
          isRequired
          isDisabled={isSubmitting}
        />
        <SelectInput
          name="vehicleColor"
          control={control}
          label="Color"
          placeholder="Select color"
          options={VEHICLE_COLORS}
          isRequired
          isDisabled={isSubmitting}
        />
      </div>

      <TextInput
        name="plateNumber"
        control={control}
        label="Plate Number"
        placeholder="e.g., ABC 123 XY"
        isRequired
        isDisabled={isSubmitting}
      />
    </div>
  );
}

function DocumentsStep({ control, isSubmitting }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-3">
          <FileText className="w-6 h-6 text-orange-600 dark:text-orange-400" />
        </div>
        <h2 className="text-xl font-semibold">Documents</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload your verification documents
        </p>
      </div>

      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Required:</strong> NIN, Driver&apos;s License. <br />
          <strong>Recommended:</strong> Vehicle Registration, Insurance.
        </p>
      </div>

      <TextInput
        name="nin"
        control={control}
        label="NIN (National Identity Number)"
        placeholder="11-digit NIN"
        description="Your National Identity Number for verification"
        isRequired
        isDisabled={isSubmitting}
      />

      <TextInput
        name="licenseNumber"
        control={control}
        label="Driver's License Number"
        placeholder="Enter your license number"
        isRequired
        isDisabled={isSubmitting}
      />

      <TextInput
        name="licenseExpiry"
        control={control}
        label="License Expiry Date"
        type="date"
        isRequired
        isDisabled={isSubmitting}
      />

      {/* Document upload section */}
      <div className="border-t border-border pt-4 mt-4">
        <p className="text-sm font-medium mb-3">
          Upload Documents (Optional but recommended)
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center hover:border-orange-500 cursor-pointer transition-colors">
            <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Vehicle Registration
            </p>
          </div>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center hover:border-orange-500 cursor-pointer transition-colors">
            <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Vehicle Insurance</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BankDetailsStep({ control, isSubmitting }: StepProps) {
  const selectedBankCode = useWatch({ control, name: "bankCode" });
  const selectedBank = NIGERIAN_BANKS.find((b) => b.value === selectedBankCode);

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-3">
          <Banknote className="w-6 h-6 text-orange-600 dark:text-orange-400" />
        </div>
        <h2 className="text-xl font-semibold">Bank Details</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Where should we send your earnings?
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

      <input
        type="hidden"
        {...control.register("bankName")}
        value={selectedBank?.label || ""}
      />

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
          Your earnings from deliveries will be sent to this account. Make sure
          the account name matches your registered name.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

interface RiderOnboardingProps {
  redirectPath?: string;
}

export function RiderOnboarding({
  redirectPath = "/dashboard",
}: RiderOnboardingProps) {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Forms for each step
  const personalInfoForm = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: user?.profile?.firstName || "",
      lastName: user?.profile?.lastName || "",
      phone: user?.phone || "",
      address: "",
      city: "",
      state: "",
    },
  });

  const vehicleInfoForm = useForm<VehicleInfoFormData>({
    resolver: zodResolver(vehicleInfoSchema),
    defaultValues: {
      vehicleType: user?.rider?.vehicleType || "",
      vehicleBrand: "",
      vehicleModel: "",
      vehicleYear: "",
      vehicleColor: "",
      plateNumber: "",
    },
  });

  const documentsForm = useForm<DocumentsFormData>({
    resolver: zodResolver(documentsSchema),
    defaultValues: {
      nin: "",
      licenseNumber: "",
      licenseExpiry: "",
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

  const ProgressBar = (currentStep / TOTAL_STEPS) * 100;

  const handleNext = async () => {
    let isValid = false;

    if (currentStep === 1) {
      isValid = await personalInfoForm.trigger();
    } else if (currentStep === 2) {
      isValid = await vehicleInfoForm.trigger();
    } else if (currentStep === 3) {
      isValid = await documentsForm.trigger();
    }

    if (currentStep < TOTAL_STEPS && (currentStep === 4 || isValid)) {
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
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Update user rider info
      updateUser({
        rider: {
          ...user?.rider!,
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
            Your information has been submitted for verification. You can start
            accepting delivery requests once verified.
          </p>
          <p className="text-sm text-muted-foreground">
            Redirecting to dashboard...
          </p>
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
            <Bike className="w-8 h-8 text-orange-600" />
            <span className="text-2xl font-bold">Rider Onboarding</span>
          </div>
          <p className="text-muted-foreground">
            Complete your rider profile to start delivering
          </p>
        </div>

        {/* ProgressBar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span>
              Step {currentStep} of {TOTAL_STEPS}
            </span>
            <span>{Math.round(ProgressBar)}% complete</span>
          </div>
          <ProgressBar
            value={ProgressBar}
            className="h-2"
            classNames={{
              indicator: "bg-orange-600",
            }}
          />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mb-8">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={cn(
                "flex flex-col items-center gap-1 text-xs",
                currentStep >= step
                  ? "text-orange-600"
                  : "text-muted-foreground",
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  currentStep > step
                    ? "bg-orange-600 text-white"
                    : currentStep === step
                      ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 border-2 border-orange-600"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {currentStep > step ? <Check className="w-4 h-4" /> : step}
              </div>
              <span className="hidden sm:inline">
                {step === 1
                  ? "Personal"
                  : step === 2
                    ? "Vehicle"
                    : step === 3
                      ? "Docs"
                      : "Bank"}
              </span>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
          {currentStep === 1 && (
            <PersonalInfoStep
              control={personalInfoForm.control}
              isSubmitting={isSubmitting}
            />
          )}
          {currentStep === 2 && (
            <VehicleInfoStep
              control={vehicleInfoForm.control}
              isSubmitting={isSubmitting}
            />
          )}
          {currentStep === 3 && (
            <DocumentsStep
              control={documentsForm.control}
              isSubmitting={isSubmitting}
            />
          )}
          {currentStep === 4 && (
            <BankDetailsStep
              control={bankDetailsForm.control}
              isSubmitting={isSubmitting}
            />
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
