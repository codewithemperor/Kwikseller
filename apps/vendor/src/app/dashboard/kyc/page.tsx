"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Upload,
  Camera,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  User,
  Building2,
  Clock,
  ChevronRight,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { AppButton, AppModal, FieldSelect, Skeleton, VendorPageHeader } from "@kwikseller/ui";
import { kwikToast } from "@kwikseller/utils";
import { usersApi, uploadApi } from "@kwikseller/api-client";
import { formatDate } from "@/lib/vendor-format";

// ==================== Types ====================

type KycStatus = "NOT_STARTED" | "IN_REVIEW" | "VERIFIED" | "REJECTED";
type BusinessType = "individual" | "sole_proprietor" | "registered_business";
type IdType = "NIN" | "PASSPORT" | "DRIVERS_LICENSE";

type FilePreview = {
  file: File | null;
  previewUrl: string;
  name: string;
};

type KycSubmission = {
  businessType: BusinessType;
  fullName: string;
  dateOfBirth: string;
  phoneNumber: string;
  idType: IdType;
  idFront: FilePreview | null;
  idBack: FilePreview | null;
  businessRegistration: FilePreview | null;
  utilityBill: FilePreview | null;
  taxIdNumber: string;
  selfie: FilePreview | null;
  submittedAt?: string;
  rejectionReason?: string;
};

type SectionStatus = {
  businessType: boolean;
  personalInfo: boolean;
  idDocument: boolean;
  businessDocs: boolean;
  faceVerification: boolean;
};

// ==================== Constants ====================

const KYC_STORAGE_KEY = "kwikseller_vendor_kyc_submission";

const BUSINESS_TYPES: { value: BusinessType; label: string; description: string }[] = [
  { value: "individual", label: "Individual", description: "Personal account for individual sellers" },
  { value: "sole_proprietor", label: "Sole Proprietorship", description: "Unregistered business under your name" },
  { value: "registered_business", label: "Registered Business", description: "Registered company or LLC" },
];

const ID_TYPES: { value: IdType; label: string }[] = [
  { value: "NIN", label: "National ID (NIN)" },
  { value: "PASSPORT", label: "Passport" },
  { value: "DRIVERS_LICENSE", label: "Driver's License" },
];

const ACCEPTED_FILE_TYPES = "image/jpeg,image/png,image/webp";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ==================== LocalStorage helpers ====================

function loadKycSubmission(): KycSubmission | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KYC_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveKycSubmission(data: KycSubmission) {
  if (typeof window === "undefined") return;
  // Don't store preview URLs to localStorage (they're data URLs and too large)
  const toStore = { ...data };
  if (toStore.idFront) toStore.idFront = { ...toStore.idFront, previewUrl: "" };
  if (toStore.idBack) toStore.idBack = { ...toStore.idBack, previewUrl: "" };
  if (toStore.businessRegistration) toStore.businessRegistration = { ...toStore.businessRegistration, previewUrl: "" };
  if (toStore.utilityBill) toStore.utilityBill = { ...toStore.utilityBill, previewUrl: "" };
  if (toStore.selfie) toStore.selfie = { ...toStore.selfie, previewUrl: "" };
  localStorage.setItem(KYC_STORAGE_KEY, JSON.stringify(toStore));
}

// ==================== File helpers ====================

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

// ==================== Status helpers ====================

function getStatusText(status: KycStatus) {
  switch (status) {
    case "NOT_STARTED":
      return "Not Started";
    case "IN_REVIEW":
      return "In Review";
    case "VERIFIED":
      return "Verified";
    case "REJECTED":
      return "Rejected";
  }
}

function getStatusIcon(status: KycStatus) {
  switch (status) {
    case "VERIFIED":
      return <CheckCircle className="h-5 w-5" />;
    case "REJECTED":
      return <XCircle className="h-5 w-5" />;
    case "IN_REVIEW":
      return <Clock className="h-5 w-5" />;
    default:
      return <ShieldCheck className="h-5 w-5" />;
  }
}

function getStatusColor(status: KycStatus): string {
  switch (status) {
    case "NOT_STARTED":
      return "text-muted-foreground";
    case "IN_REVIEW":
      return "text-amber-600 dark:text-amber-400";
    case "VERIFIED":
      return "text-green-600 dark:text-green-400";
    case "REJECTED":
      return "text-red-600 dark:text-red-400";
  }
}

// ==================== Empty file preview ====================

const emptyFilePreview: FilePreview = { file: null, previewUrl: "", name: "" };

// ==================== Main Component ====================

export default function KycPage() {
  // KYC status from API
  const [kycStatus, setKycStatus] = useState<KycStatus>("NOT_STARTED");
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [lastSubmittedAt, setLastSubmittedAt] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState<string>("");

  // Form state
  const [businessType, setBusinessType] = useState<BusinessType>("individual");
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [idType, setIdType] = useState<IdType>("NIN");
  const [idFront, setIdFront] = useState<FilePreview>(emptyFilePreview);
  const [idBack, setIdBack] = useState<FilePreview>(emptyFilePreview);
  const [businessRegistration, setBusinessRegistration] = useState<FilePreview>(emptyFilePreview);
  const [utilityBill, setUtilityBill] = useState<FilePreview>(emptyFilePreview);
  const [taxIdNumber, setTaxIdNumber] = useState("");
  const [selfie, setSelfie] = useState<FilePreview>(emptyFilePreview);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);

  // Drag state for dropzones
  const [dragOver, setDragOver] = useState<string | null>(null);

  // Load KYC status and previous submission on mount
  useEffect(() => {
    async function fetchStatus() {
      try {
        const response = await usersApi.getKycStatus();
        const data = response.data as any;
        if (data?.kycStatus) {
          setKycStatus(data.kycStatus);
        }
        if (data?.submittedAt) {
          setLastSubmittedAt(data.submittedAt);
        }
        if (data?.rejectionReason) {
          setRejectionReason(data.rejectionReason);
        }
      } catch {
        // Try localStorage fallback
        const saved = loadKycSubmission();
        if (saved?.submittedAt) {
          setKycStatus("IN_REVIEW");
          setLastSubmittedAt(saved.submittedAt);
        }
      } finally {
        setIsLoadingStatus(false);
      }
    }
    fetchStatus();
  }, []);

  // Calculate section completion status
  const sectionStatus: SectionStatus = {
    businessType: true,
    personalInfo: fullName.trim().length > 0 && dateOfBirth.length > 0 && phoneNumber.trim().length > 0,
    idDocument: idFront.previewUrl.length > 0 && (idType !== "PASSPORT" ? idBack.previewUrl.length > 0 : true),
    businessDocs: businessType === "individual"
      ? true
      : businessRegistration.previewUrl.length > 0 && utilityBill.previewUrl.length > 0 && taxIdNumber.trim().length > 0,
    faceVerification: true, // optional
  };

  const completedCount = Object.values(sectionStatus).filter(Boolean).length;
  const totalCount = Object.keys(sectionStatus).length;

  // File upload handler
  const handleFileSelect = useCallback(
    async (field: string, file: File | null) => {
      if (!file) return;
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        kwikToast.error("Only JPG, PNG, or WebP images are accepted");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        kwikToast.error("File size must be under 5MB");
        return;
      }
      try {
        const previewUrl = await readFileAsDataUrl(file);
        const preview: FilePreview = { file, previewUrl, name: file.name };
        switch (field) {
          case "idFront":
            setIdFront(preview);
            break;
          case "idBack":
            setIdBack(preview);
            break;
          case "businessRegistration":
            setBusinessRegistration(preview);
            break;
          case "utilityBill":
            setUtilityBill(preview);
            break;
          case "selfie":
            setSelfie(preview);
            break;
        }
      } catch {
        kwikToast.error("Failed to read file");
      }
    },
    []
  );

  // Drag handlers
  const handleDragOver = (e: React.DragEvent, field: string) => {
    e.preventDefault();
    setDragOver(field);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
  };

  const handleDrop = (e: React.DragEvent, field: string) => {
    e.preventDefault();
    setDragOver(null);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(field, file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(field, file);
    e.target.value = "";
  };

  // Upload file to get URL
  const uploadFile = async (preview: FilePreview, fieldName: string): Promise<string | null> => {
    if (!preview.file) return preview.previewUrl || null;
    setIsUploading(fieldName);
    try {
      const response = await uploadApi.productImage(preview.file);
      const data = response.data as any;
      return data?.url ?? data?.imageUrl ?? preview.previewUrl;
    } catch {
      kwikToast.error(`Failed to upload ${fieldName.replace(/([A-Z])/g, " $1").toLowerCase()}`);
      return preview.previewUrl || null;
    } finally {
      setIsUploading(null);
    }
  };

  // Submit handler
  const handleSubmit = async () => {
    // Validate required fields
    if (!fullName.trim() || !dateOfBirth || !phoneNumber.trim()) {
      kwikToast.error("Please fill in all personal information fields");
      return;
    }
    if (!idFront.file && !idFront.previewUrl) {
      kwikToast.error("Please upload the front of your ID document");
      return;
    }
    if (idType !== "PASSPORT" && !idBack.file && !idBack.previewUrl) {
      kwikToast.error("Please upload the back of your ID document");
      return;
    }
    if (businessType !== "individual") {
      if (!businessRegistration.file && !businessRegistration.previewUrl) {
        kwikToast.error("Please upload your business registration certificate");
        return;
      }
      if (!utilityBill.file && !utilityBill.previewUrl) {
        kwikToast.error("Please upload a utility bill or bank statement");
        return;
      }
      if (!taxIdNumber.trim()) {
        kwikToast.error("Please enter your tax identification number");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Upload files first
      const frontUrl = await uploadFile(idFront, "idFront");
      const backUrl = idType !== "PASSPORT" ? await uploadFile(idBack, "idBack") : null;

      // Submit to API
      await usersApi.submitKyc({
        type: idType as "NIN" | "BVN" | "PASSPORT" | "CAC",
        documentUrl: frontUrl ?? "",
      });

      // Save to localStorage as well
      const submission: KycSubmission = {
        businessType,
        fullName,
        dateOfBirth,
        phoneNumber,
        idType,
        idFront: { ...idFront, previewUrl: frontUrl ?? idFront.previewUrl },
        idBack: { ...idBack, previewUrl: backUrl ?? idBack.previewUrl },
        businessRegistration,
        utilityBill,
        taxIdNumber,
        selfie,
        submittedAt: new Date().toISOString(),
      };
      saveKycSubmission(submission);

      setKycStatus("IN_REVIEW");
      setLastSubmittedAt(new Date().toISOString());
      setRejectionReason("");
      setConfirmModalOpen(false);
      kwikToast.success("KYC submitted for review");
    } catch {
      // Fallback to localStorage
      const submission: KycSubmission = {
        businessType,
        fullName,
        dateOfBirth,
        phoneNumber,
        idType,
        idFront,
        idBack,
        businessRegistration,
        utilityBill,
        taxIdNumber,
        selfie,
        submittedAt: new Date().toISOString(),
      };
      saveKycSubmission(submission);

      setKycStatus("IN_REVIEW");
      setLastSubmittedAt(new Date().toISOString());
      setRejectionReason("");
      setConfirmModalOpen(false);
      kwikToast.success("KYC submitted for review");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show uploaded / in review state — no form editing
  const isLocked = kycStatus === "IN_REVIEW" || kycStatus === "VERIFIED";

  // ==================== Loading skeleton ====================
  if (isLoadingStatus) {
    return (
      <div className="space-y-8">
        <section>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-72" />
        </section>
        <section>
          <div className="border-b border-border pb-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="mt-3 h-4 w-64" />
          </div>
          <div className="space-y-8 pt-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-5 w-36" />
                <div className="mt-4 space-y-3">
                  <Skeleton className="h-11 w-full" />
                  <Skeleton className="h-11 w-full" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* ==================== Section 1: Page Header ==================== */}
      <VendorPageHeader
        title="Identity Verification"
        description="Complete your KYC to unlock higher selling limits and a verified badge on your store."
        actions={
          <span className={`flex items-center gap-1.5 text-sm font-medium ${getStatusColor(kycStatus)}`}>
            {getStatusIcon(kycStatus)}
            {getStatusText(kycStatus)}
          </span>
        }
      />

      {/* ==================== Section 2: Status Banner ==================== */}
      <section>
        <div className="border-b border-border pb-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground/50" strokeWidth={1.5} />
            <div className="space-y-1">
              <p className="text-sm text-foreground">
                {kycStatus === "NOT_STARTED" && (
                  <>Verification is <span className="font-medium">required</span> to access all platform features.</>
                )}
                {kycStatus === "IN_REVIEW" && (
                  <>Your documents are being reviewed. This usually takes <span className="font-medium">1–3 business days</span>.</>
                )}
                {kycStatus === "VERIFIED" && (
                  <>Your identity has been verified. You now have access to all platform features.</>
                )}
                {kycStatus === "REJECTED" && (
                  <>Your previous submission was rejected. Please review the feedback and resubmit with corrections.</>
                )}
              </p>
              <p className="text-xs text-muted-foreground/50">
                Benefits: Higher transaction limits, verified trust badge on
                your store, priority support, and access to withdrawal features.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== Section 3: Rejection Feedback ==================== */}
      {kycStatus === "REJECTED" && rejectionReason && (
        <section>
          <div className="flex items-start gap-3 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500 dark:text-red-400" strokeWidth={1.5} />
            <div className="space-y-1">
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                Rejection Reason
              </p>
              <p className="text-xs text-red-600 dark:text-red-400">{rejectionReason}</p>
              {lastSubmittedAt && (
                <p className="text-xs text-red-400">
                  Last submitted: {formatDate(lastSubmittedAt)}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ==================== Section 4: Progress Indicator ==================== */}
      {!isLocked && (
        <section>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground">
              Progress
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-default-100">
              <div
                className="h-1.5 rounded-full bg-foreground transition-all"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
            <span className="text-xs tabular-nums text-muted-foreground">
              {completedCount}/{totalCount} complete
            </span>
          </div>
        </section>
      )}

      {/* ==================== Section 5: Verification Form ==================== */}
      {isLocked ? (
        <section>
          <div className="flex flex-col items-center justify-center py-16">
            {kycStatus === "VERIFIED" ? (
              <>
                <CheckCircle className="h-12 w-12 text-green-400" strokeWidth={1.5} />
                <h2 className="mt-4 text-lg font-medium text-foreground">
                  Verification Complete
                </h2>
                <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
                  Your identity has been verified. You now have full access to
                  all platform features.
                </p>
              </>
            ) : (
              <>
                <Clock className="h-12 w-12 text-amber-400" strokeWidth={1.5} />
                <h2 className="mt-4 text-lg font-medium text-foreground">
                  Under Review
                </h2>
                <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
                  Your documents are being reviewed. You&apos;ll receive a
                  notification once verification is complete.
                </p>
                {lastSubmittedAt && (
                  <p className="mt-3 text-xs text-muted-foreground/50">
                    Submitted on {formatDate(lastSubmittedAt)}
                  </p>
                )}
              </>
            )}
          </div>
        </section>
      ) : (
        <section>
          <div className="space-y-8 pt-2">
            {/* ========= Section A: Business Type Selection ========= */}
            <div className="border-t border-border pt-8">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-4 w-4 text-muted-foreground/50" strokeWidth={1.5} />
                <h2 className="text-lg font-semibold text-foreground">
                  Business Type
                </h2>
                {sectionStatus.businessType && (
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {BUSINESS_TYPES.map((bt) => (
                  <button
                    key={bt.value}
                    type="button"
                    onClick={() => setBusinessType(bt.value)}
                    className={`flex flex-col items-start gap-1 rounded-md border p-4 text-left transition ${
                      businessType === bt.value
                        ? "border-foreground bg-default-100"
                        : "border-border hover:border-accent"
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${
                        businessType === bt.value
                          ? "text-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {bt.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {bt.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* ========= Section B: Personal Information ========= */}
            <div className="border-t border-border pt-8">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-4 w-4 text-muted-foreground/50" strokeWidth={1.5} />
                <h2 className="text-lg font-semibold text-foreground">
                  Personal Information
                </h2>
                {sectionStatus.personalInfo && (
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="kyc-fullname"
                    className="block text-xs font-semibold text-muted mb-1.5"
                  >
                    Full Name (as per ID)
                  </label>
                  <input
                    id="kyc-fullname"
                    type="text"
                    placeholder="Enter your full legal name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none ring-0 transition placeholder:text-muted-foreground focus:border-border focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
                <div>
                  <label
                    htmlFor="kyc-dob"
                    className="block text-xs font-semibold text-muted mb-1.5"
                  >
                    Date of Birth
                  </label>
                  <input
                    id="kyc-dob"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none ring-0 transition placeholder:text-muted-foreground focus:border-border focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label
                    htmlFor="kyc-phone"
                    className="block text-xs font-semibold text-muted mb-1.5"
                  >
                    Phone Number
                  </label>
                  <input
                    id="kyc-phone"
                    type="tel"
                    placeholder="+234 800 000 0000"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none ring-0 transition placeholder:text-muted-foreground focus:border-border focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>
            </div>

            {/* ========= Section C: ID Document Upload ========= */}
            <div className="border-t border-border pt-8">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-4 w-4 text-muted-foreground/50" strokeWidth={1.5} />
                <h2 className="text-lg font-semibold text-foreground">
                  ID Document
                </h2>
                {sectionStatus.idDocument && (
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                )}
              </div>
              <div className="space-y-4">
                {/* ID Type selector */}
                <div>
                  <label
                    htmlFor="kyc-idtype"
                    className="block text-xs font-semibold text-muted mb-1.5"
                  >
                    Document Type
                  </label>
                  <FieldSelect
                    id="kyc-idtype"
                    value={idType}
                    onChange={(e) => {
                      setIdType(e.target.value as IdType);
                      // Clear back image when switching to passport
                      if (e.target.value === "PASSPORT") {
                        setIdBack(emptyFilePreview);
                      }
                    }}
                    wrapperClassName="mt-1"
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none ring-0 transition focus:border-border focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[240px]"
                  >
                    {ID_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </FieldSelect>
                </div>

                {/* Front image upload */}
                <div>
                  <p className="text-xs font-semibold text-muted mb-1.5">
                    Front of Document
                  </p>
                  {idFront.previewUrl ? (
                    <div className="group relative inline-block">
                      <div className="overflow-hidden rounded-md border border-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={idFront.previewUrl}
                          alt="ID front"
                          className="h-40 w-auto object-cover"
                        />
                      </div>
                      <div className="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => setIdFront(emptyFilePreview)}
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-600 dark:text-red-400 dark:hover:text-red-400"
                          aria-label="Remove front image"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground/50">
                        {idFront.name} · {formatFileSize(idFront.file?.size ?? 0)}
                      </p>
                    </div>
                  ) : (
                    <label
                      className={`flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed transition ${
                        dragOver === "idFront"
                          ? "border-accent bg-default-100"
                          : "border-border hover:border-accent"
                      }`}
                      onDragOver={(e) => handleDragOver(e, "idFront")}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, "idFront")}
                    >
                      <Upload className="h-6 w-6 text-muted-foreground/50" strokeWidth={1.5} />
                      <div className="text-center">
                        <p className="text-xs font-medium text-muted-foreground">
                          Drag &amp; drop or click to upload
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground/50">
                          JPG, PNG, or WebP · Max 5MB
                        </p>
                      </div>
                      <input
                        type="file"
                        accept={ACCEPTED_FILE_TYPES}
                        onChange={(e) => handleFileInput(e, "idFront")}
                        className="sr-only"
                      />
                    </label>
                  )}
                </div>

                {/* Back image upload (hidden for Passport) */}
                {idType !== "PASSPORT" && (
                  <div>
                    <p className="text-xs font-semibold text-muted mb-1.5">
                      Back of Document
                    </p>
                    {idBack.previewUrl ? (
                      <div className="group relative inline-block">
                        <div className="overflow-hidden rounded-md border border-border">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={idBack.previewUrl}
                            alt="ID back"
                            className="h-40 w-auto object-cover"
                          />
                        </div>
                        <div className="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => setIdBack(emptyFilePreview)}
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-600 dark:text-red-400 dark:hover:text-red-400"
                            aria-label="Remove back image"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="mt-1.5 text-xs text-muted-foreground/50">
                          {idBack.name} · {formatFileSize(idBack.file?.size ?? 0)}
                        </p>
                      </div>
                    ) : (
                      <label
                        className={`flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed transition ${
                          dragOver === "idBack"
                            ? "border-accent bg-default-100"
                            : "border-border hover:border-accent"
                        }`}
                        onDragOver={(e) => handleDragOver(e, "idBack")}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, "idBack")}
                      >
                        <Upload className="h-6 w-6 text-muted-foreground/50" strokeWidth={1.5} />
                        <div className="text-center">
                          <p className="text-xs font-medium text-muted-foreground">
                            Drag &amp; drop or click to upload
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground/50">
                            JPG, PNG, or WebP · Max 5MB
                          </p>
                        </div>
                        <input
                          type="file"
                          accept={ACCEPTED_FILE_TYPES}
                          onChange={(e) => handleFileInput(e, "idBack")}
                          className="sr-only"
                        />
                      </label>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ========= Section D: Business Documents (conditional) ========= */}
            {businessType !== "individual" && (
              <div className="border-t border-border pt-8">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="h-4 w-4 text-muted-foreground/50" strokeWidth={1.5} />
                  <h2 className="text-lg font-semibold text-foreground">
                    Business Documents
                  </h2>
                  {sectionStatus.businessDocs && (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  )}
                </div>
                <div className="space-y-4">
                  {/* Business Registration Certificate */}
                  <div>
                    <p className="text-xs font-semibold text-muted mb-1.5">
                      Business Registration Certificate
                    </p>
                    {businessRegistration.previewUrl ? (
                      <div className="group relative inline-block">
                        <div className="overflow-hidden rounded-md border border-border">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={businessRegistration.previewUrl}
                            alt="Business registration"
                            className="h-40 w-auto object-cover"
                          />
                        </div>
                        <div className="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => setBusinessRegistration(emptyFilePreview)}
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-600 dark:text-red-400 dark:hover:text-red-400"
                            aria-label="Remove business registration"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="mt-1.5 text-xs text-muted-foreground/50">
                          {businessRegistration.name} · {formatFileSize(businessRegistration.file?.size ?? 0)}
                        </p>
                      </div>
                    ) : (
                      <label
                        className={`flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed transition ${
                          dragOver === "businessRegistration"
                            ? "border-accent bg-default-100"
                            : "border-border hover:border-accent"
                        }`}
                        onDragOver={(e) => handleDragOver(e, "businessRegistration")}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, "businessRegistration")}
                      >
                        <Upload className="h-6 w-6 text-muted-foreground/50" strokeWidth={1.5} />
                        <div className="text-center">
                          <p className="text-xs font-medium text-muted-foreground">
                            Upload CAC registration or equivalent
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground/50">
                            JPG, PNG, or WebP · Max 5MB
                          </p>
                        </div>
                        <input
                          type="file"
                          accept={ACCEPTED_FILE_TYPES}
                          onChange={(e) => handleFileInput(e, "businessRegistration")}
                          className="sr-only"
                        />
                      </label>
                    )}
                  </div>

                  {/* Utility Bill / Bank Statement */}
                  <div>
                    <p className="text-xs font-semibold text-muted mb-1.5">
                      Utility Bill or Bank Statement (Address Proof)
                    </p>
                    {utilityBill.previewUrl ? (
                      <div className="group relative inline-block">
                        <div className="overflow-hidden rounded-md border border-border">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={utilityBill.previewUrl}
                            alt="Utility bill"
                            className="h-40 w-auto object-cover"
                          />
                        </div>
                        <div className="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => setUtilityBill(emptyFilePreview)}
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-600 dark:text-red-400 dark:hover:text-red-400"
                            aria-label="Remove utility bill"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="mt-1.5 text-xs text-muted-foreground/50">
                          {utilityBill.name} · {formatFileSize(utilityBill.file?.size ?? 0)}
                        </p>
                      </div>
                    ) : (
                      <label
                        className={`flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed transition ${
                          dragOver === "utilityBill"
                            ? "border-accent bg-default-100"
                            : "border-border hover:border-accent"
                        }`}
                        onDragOver={(e) => handleDragOver(e, "utilityBill")}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, "utilityBill")}
                      >
                        <Upload className="h-6 w-6 text-muted-foreground/50" strokeWidth={1.5} />
                        <div className="text-center">
                          <p className="text-xs font-medium text-muted-foreground">
                            Upload recent utility bill or bank statement
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground/50">
                            JPG, PNG, or WebP · Max 5MB
                          </p>
                        </div>
                        <input
                          type="file"
                          accept={ACCEPTED_FILE_TYPES}
                          onChange={(e) => handleFileInput(e, "utilityBill")}
                          className="sr-only"
                        />
                      </label>
                    )}
                  </div>

                  {/* Tax Identification Number */}
                  <div className="max-w-sm">
                    <label
                      htmlFor="kyc-taxid"
                      className="block text-xs font-semibold text-muted mb-1.5"
                    >
                      Tax Identification Number (TIN)
                    </label>
                    <input
                      id="kyc-taxid"
                      type="text"
                      placeholder="Enter your TIN"
                      value={taxIdNumber}
                      onChange={(e) => setTaxIdNumber(e.target.value)}
                      className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none ring-0 transition placeholder:text-muted-foreground focus:border-border focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ========= Section E: Face Verification (Optional) ========= */}
            <div className="border-t border-border pt-8">
              <div className="flex items-center gap-2 mb-4">
                <Camera className="h-4 w-4 text-muted-foreground/50" strokeWidth={1.5} />
                <h2 className="text-lg font-semibold text-foreground">
                  Face Verification
                </h2>
                <span className="text-xs font-medium text-muted-foreground/50">
                  Optional
                </span>
                {sectionStatus.faceVerification && (
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Take a clear selfie with good lighting and a neutral expression.
                This helps verify your identity faster.
              </p>
              {selfie.previewUrl ? (
                <div className="group relative inline-block">
                  <div className="overflow-hidden rounded-md border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selfie.previewUrl}
                      alt="Selfie"
                      className="h-48 w-auto object-cover"
                    />
                  </div>
                  <div className="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => setSelfie(emptyFilePreview)}
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-600 dark:text-red-400 dark:hover:text-red-400"
                      aria-label="Remove selfie"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground/50">
                    {selfie.name} · {formatFileSize(selfie.file?.size ?? 0)}
                  </p>
                </div>
              ) : (
                <label
                  className={`flex h-48 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed transition ${
                    dragOver === "selfie"
                      ? "border-accent bg-default-100"
                      : "border-border hover:border-accent"
                  } sm:w-48`}
                  onDragOver={(e) => handleDragOver(e, "selfie")}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, "selfie")}
                >
                  <Camera className="h-8 w-8 text-muted-foreground/50" strokeWidth={1.5} />
                  <div className="text-center">
                    <p className="text-xs font-medium text-muted-foreground">
                      Upload selfie
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground/50">
                      JPG, PNG, or WebP · Max 5MB
                    </p>
                  </div>
                  <input
                    type="file"
                    accept={ACCEPTED_FILE_TYPES}
                    onChange={(e) => handleFileInput(e, "selfie")}
                    className="sr-only"
                  />
                </label>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ==================== Section 6: Submission Area ==================== */}
      {!isLocked && (
        <section className="border-t border-border pt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" strokeWidth={1.5} />
                <span>
                  Estimated review time:{" "}
                  <span className="font-medium text-foreground">
                    1–3 business days
                  </span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground/50">
                Your submission cannot be edited once submitted.
              </p>
            </div>
            <AppButton
              variant="primary"
              size="md"
              onClick={() => setConfirmModalOpen(true)}
              disabled={
                !sectionStatus.personalInfo ||
                !sectionStatus.idDocument ||
                !sectionStatus.businessDocs ||
                isUploading !== null
              }
              isLoading={isSubmitting}
              loadingLabel="Submitting…"
              className="min-w-[180px] sm:ml-auto"
            >
              Submit for Review
              <ChevronRight className="h-4 w-4" />
            </AppButton>
          </div>
        </section>
      )}

      {/* ==================== Confirm Submission Modal ==================== */}
      <AppModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Submit for Review"
        footer={
          <div className="flex w-full items-center justify-end gap-2">
            <AppButton
              variant="secondary"
              onClick={() => setConfirmModalOpen(false)}
              disabled={isSubmitting}
            >
              Go Back
            </AppButton>
            <AppButton
              variant="primary"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              loadingLabel="Submitting…"
              disabled={isSubmitting}
            >
              Confirm Submission
            </AppButton>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Summary of what will be submitted */}
          <div className="border-b border-border pb-4">
            <h3 className="text-sm font-medium text-foreground">
              Submission Summary
            </h3>
            <div className="mt-3 space-y-2">
              {[
                {
                  label: "Business Type",
                  value: BUSINESS_TYPES.find((b) => b.value === businessType)?.label ?? "—",
                },
                { label: "Full Name", value: fullName || "—" },
                { label: "Date of Birth", value: dateOfBirth || "—" },
                { label: "Phone", value: phoneNumber || "—" },
                {
                  label: "ID Document",
                  value: `${ID_TYPES.find((t) => t.value === idType)?.label ?? "—"}${idFront.previewUrl ? " ✓" : ""}`,
                },
                ...(businessType !== "individual"
                  ? [
                      {
                        label: "Business Registration",
                        value: businessRegistration.previewUrl ? "Uploaded" : "—",
                      },
                      {
                        label: "Address Proof",
                        value: utilityBill.previewUrl ? "Uploaded" : "—",
                      },
                      { label: "TIN", value: taxIdNumber || "—" },
                    ]
                  : []),
                {
                  label: "Selfie",
                  value: selfie.previewUrl ? "Uploaded" : "Skipped",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium text-foreground">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" strokeWidth={1.5} />
            <p className="text-xs text-amber-800 dark:text-amber-200">
              Once submitted, your documents cannot be edited. If rejected, you
              will need to resubmit with corrections. Please double-check
              everything before proceeding.
            </p>
          </div>
        </div>
      </AppModal>
    </motion.div>
  );
}
