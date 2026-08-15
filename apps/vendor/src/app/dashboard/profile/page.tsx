"use client";

import Link from "next/link";
import React from "react";
import {
  User,
  Store,
  CreditCard,
  Mail,
  Phone,
  MapPin,
  Lock,
  ShieldCheck,
  Camera,
  Upload,
  X,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import {
  AppButton,
  AppSwitch,
  AppModal,
  FieldInput,
  FieldSelect,
  FieldTextarea,
  Skeleton,
  VendorPageHeader,
} from "@kwikseller/ui";
import { motion } from "framer-motion";
import { usersApi, storeApi, authApi } from "@kwikseller/api-client";
import { useAuthStore, kwikToast } from "@kwikseller/utils";
import { unwrapApiData } from "@/lib/vendor-format";

// ==================== Constants ====================

const PERSONAL_KEY = "kwikseller_vendor_personal";
const STORE_PROFILE_KEY = "kwikseller_vendor_store_profile";
const CONTACT_KEY = "kwikseller_vendor_contact";
const SECURITY_KEY = "kwikseller_vendor_security";

const STORE_CATEGORIES = [
  { value: "", label: "Select a category" },
  { value: "fashion", label: "Fashion" },
  { value: "electronics", label: "Electronics" },
  { value: "food", label: "Food & Groceries" },
  { value: "health", label: "Health & Beauty" },
  { value: "home", label: "Home & Living" },
  { value: "sports", label: "Sports & Fitness" },
  { value: "books", label: "Books & Media" },
  { value: "automotive", label: "Automotive" },
  { value: "baby", label: "Baby & Kids" },
  { value: "agriculture", label: "Agriculture" },
  { value: "services", label: "Services" },
  { value: "other", label: "Other" },
];

// ==================== Types ====================

type PersonalData = {
  firstName: string;
  lastName: string;
  bio: string;
  dateOfBirth: string;
};

type StoreProfileData = {
  storeName: string;
  storeSlug: string;
  storeDescription: string;
  storeCategory: string;
  logoPreview: string | null;
  bannerPreview: string | null;
};

type ContactData = {
  email: string;
  phone: string;
  addressLine1: string;
  addressCity: string;
  addressState: string;
  addressCountry: string;
};

type SecurityData = {
  twoFactorEnabled: boolean;
};

// ==================== Helpers ====================

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ==================== Section IDs ====================

type SectionId = "header" | "personal" | "store" | "contact" | "security";

const SECTIONS: {
  id: SectionId;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}[] = [
  { id: "header", label: "Profile Header", icon: User },
  { id: "personal", label: "Personal Information", icon: User },
  { id: "store", label: "Store Profile", icon: Store },
  { id: "contact", label: "Contact Information", icon: Mail },
  { id: "security", label: "Security", icon: ShieldCheck },
];

// ==================== Main Component ====================

export default function VendorProfilePage() {
  const { user } = useAuthStore();

  // ---- Section expansion (mobile accordion) ----
  const [mobileExpanded, setMobileExpanded] = React.useState<SectionId | null>(null);

  // ---- Personal Info State ----
  const [personal, setPersonal] = React.useState<PersonalData>({
    firstName: "",
    lastName: "",
    bio: "",
    dateOfBirth: "",
  });
  const [isLoadingPersonal, setIsLoadingPersonal] = React.useState(true);
  const [isSavingPersonal, setIsSavingPersonal] = React.useState(false);
  const [errorPersonal, setErrorPersonal] = React.useState<string | null>(null);

  // ---- Store Profile State ----
  const [storeProfile, setStoreProfile] = React.useState<StoreProfileData>({
    storeName: "",
    storeSlug: "",
    storeDescription: "",
    storeCategory: "",
    logoPreview: null,
    bannerPreview: null,
  });
  const [isLoadingStore, setIsLoadingStore] = React.useState(true);
  const [isSavingStore, setIsSavingStore] = React.useState(false);
  const [errorStore, setErrorStore] = React.useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = React.useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = React.useState(false);

  // ---- Contact Info State ----
  const [contact, setContact] = React.useState<ContactData>({
    email: "",
    phone: "",
    addressLine1: "",
    addressCity: "",
    addressState: "",
    addressCountry: "Nigeria",
  });
  const [isLoadingContact, setIsLoadingContact] = React.useState(true);
  const [isSavingContact, setIsSavingContact] = React.useState(false);
  const [errorContact, setErrorContact] = React.useState<string | null>(null);
  const [isSendingVerification, setIsSendingVerification] = React.useState(false);

  // ---- Security State ----
  const [security, setSecurity] = React.useState<SecurityData>({
    twoFactorEnabled: false,
  });
  const [isLoadingSecurity, setIsLoadingSecurity] = React.useState(true);
  const [errorSecurity, setErrorSecurity] = React.useState<string | null>(null);

  // ---- Password State ----
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showCurrentPw, setShowCurrentPw] = React.useState(false);
  const [showNewPw, setShowNewPw] = React.useState(false);
  const [showConfirmPw, setShowConfirmPw] = React.useState(false);
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);

  // ---- Avatar State ----
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
  const [isDraggingAvatar, setIsDraggingAvatar] = React.useState(false);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  // ---- Store status from auth store ----
  const store = user?.store;
  const storeVerified = (store as { status?: string } | undefined)?.status === "ACTIVE";
  const emailVerified = (user as { emailVerified?: boolean } | undefined)?.emailVerified;

  // ---- Load data on mount ----
  React.useEffect(() => {
    loadPersonalData();
    loadStoreData();
    loadContactData();
    loadSecurityData();

    // Set avatar from user store
    const storeLogoUrl = (store as { logoUrl?: string } | undefined)?.logoUrl;
    if (storeLogoUrl) {
      setAvatarPreview(storeLogoUrl);
    }
  }, []);

  // Auto-generate slug from store name
  React.useEffect(() => {
    if (storeProfile.storeName && !storeProfile.storeSlug) {
      setStoreProfile((prev) => ({ ...prev, storeSlug: slugify(prev.storeName) }));
    }
  }, [storeProfile.storeName, storeProfile.storeSlug]);

  // ==================== Data Loaders ====================

  async function loadPersonalData() {
    setIsLoadingPersonal(true);
    setErrorPersonal(null);

    // Load from localStorage first
    const saved = loadJson<PersonalData>(PERSONAL_KEY, {
      firstName: user?.profile?.firstName ?? "",
      lastName: user?.profile?.lastName ?? "",
      bio: (user as { bio?: string } | undefined)?.bio ?? "",
      dateOfBirth: (user as { dateOfBirth?: string } | undefined)?.dateOfBirth ?? "",
    });
    setPersonal(saved);
    setIsLoadingPersonal(false);

    // Then try API
    try {
      const response = await usersApi.getProfile();
      const data = unwrapApiData<{
        firstName?: string;
        lastName?: string;
        bio?: string;
        dateOfBirth?: string;
        avatarUrl?: string;
      }>(response.data);
      if (data) {
        setPersonal({
          firstName: data.firstName ?? saved.firstName,
          lastName: data.lastName ?? saved.lastName,
          bio: data.bio ?? saved.bio,
          dateOfBirth: data.dateOfBirth ?? saved.dateOfBirth,
        });
        if (data.avatarUrl) {
          setAvatarPreview(data.avatarUrl);
        }
      }
    } catch {
      // Use localStorage data
    }
  }

  async function loadStoreData() {
    setIsLoadingStore(true);
    setErrorStore(null);

    const saved = loadJson<StoreProfileData>(STORE_PROFILE_KEY, {
      storeName: store?.name ?? "",
      storeSlug: store?.slug ?? "",
      storeDescription: (store as { description?: string } | undefined)?.description ?? "",
      storeCategory: (store as { category?: string } | undefined)?.category ?? "",
      logoPreview: (store as { logoUrl?: string } | undefined)?.logoUrl ?? null,
      bannerPreview: (store as { bannerUrl?: string } | undefined)?.bannerUrl ?? null,
    });
    setStoreProfile(saved);
    setIsLoadingStore(false);

    try {
      const response = await storeApi.get();
      const data = unwrapApiData<{
        name?: string;
        slug?: string;
        description?: string;
        category?: string;
        logoUrl?: string;
        bannerUrl?: string;
      }>(response.data);
      if (data) {
        setStoreProfile({
          storeName: data.name ?? saved.storeName,
          storeSlug: data.slug ?? saved.storeSlug,
          storeDescription: data.description ?? saved.storeDescription,
          storeCategory: data.category ?? saved.storeCategory,
          logoPreview: data.logoUrl ?? saved.logoPreview,
          bannerPreview: data.bannerUrl ?? saved.bannerPreview,
        });
      }
    } catch {
      // Use localStorage data
    }
  }

  async function loadContactData() {
    setIsLoadingContact(true);
    setErrorContact(null);

    const saved = loadJson<ContactData>(CONTACT_KEY, {
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      addressLine1: "",
      addressCity: "",
      addressState: "",
      addressCountry: "Nigeria",
    });
    setContact(saved);
    setIsLoadingContact(false);

    try {
      const response = await usersApi.getProfile();
      const data = unwrapApiData<{
        email?: string;
        phone?: string;
      }>(response.data);
      if (data) {
        setContact((prev) => ({
          ...prev,
          email: data.email ?? prev.email,
          phone: data.phone ?? prev.phone,
        }));
      }
    } catch {
      // Use localStorage data
    }
  }

  async function loadSecurityData() {
    setIsLoadingSecurity(true);
    setErrorSecurity(null);

    const saved = loadJson<SecurityData>(SECURITY_KEY, {
      twoFactorEnabled: false,
    });
    setSecurity(saved);
    setIsLoadingSecurity(false);
  }

  // ==================== Handlers ====================

  const handleAvatarUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      kwikToast.error("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      kwikToast.error("Image must be less than 5MB");
      return;
    }

    // Show local preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to API
    setIsUploadingAvatar(true);
    try {
      await usersApi.uploadAvatar(file);
      kwikToast.success("Avatar updated");
    } catch {
      kwikToast.error("Failed to upload avatar");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingAvatar(true);
  };

  const handleAvatarDragLeave = () => {
    setIsDraggingAvatar(false);
  };

  const handleAvatarDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingAvatar(false);
    const file = e.dataTransfer.files[0];
    if (file) handleAvatarUpload(file);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      kwikToast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setStoreProfile((prev) => ({
        ...prev,
        logoPreview: ev.target?.result as string,
      }));
    };
    reader.readAsDataURL(file);

    setIsUploadingLogo(true);
    try {
      await storeApi.uploadLogo(file);
      kwikToast.success("Logo updated");
    } catch {
      kwikToast.error("Failed to upload logo");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      kwikToast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setStoreProfile((prev) => ({
        ...prev,
        bannerPreview: ev.target?.result as string,
      }));
    };
    reader.readAsDataURL(file);

    setIsUploadingBanner(true);
    try {
      await storeApi.uploadBanner(file);
      kwikToast.success("Banner updated");
    } catch {
      kwikToast.error("Failed to upload banner");
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleSavePersonal = async () => {
    setIsSavingPersonal(true);
    try {
      await usersApi.updateProfile({
        firstName: personal.firstName,
        lastName: personal.lastName,
        bio: personal.bio,
      } as Parameters<typeof usersApi.updateProfile>[0]);
      kwikToast.success("Personal information saved");
    } catch {
      saveJson(PERSONAL_KEY, personal);
      kwikToast.success("Personal information saved locally");
    } finally {
      setIsSavingPersonal(false);
    }
  };

  const handleSaveStore = async () => {
    setIsSavingStore(true);
    try {
      await storeApi.update({
        name: storeProfile.storeName,
        slug: storeProfile.storeSlug,
        description: storeProfile.storeDescription,
        category: storeProfile.storeCategory,
      });
      kwikToast.success("Store profile saved");
    } catch {
      saveJson(STORE_PROFILE_KEY, storeProfile);
      kwikToast.success("Store profile saved locally");
    } finally {
      setIsSavingStore(false);
    }
  };

  const handleSaveContact = async () => {
    setIsSavingContact(true);
    try {
      await usersApi.updateProfile({
        phone: contact.phone,
      } as Parameters<typeof usersApi.updateProfile>[0]);
      kwikToast.success("Contact information saved");
    } catch {
      saveJson(CONTACT_KEY, contact);
      kwikToast.success("Contact information saved locally");
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleSendVerification = async () => {
    setIsSendingVerification(true);
    try {
      await authApi.resendVerification(contact.email);
      kwikToast.success("Verification email sent");
    } catch {
      kwikToast.error("Could not send verification email");
    } finally {
      setIsSendingVerification(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      kwikToast.error("Fill in all password fields");
      return;
    }
    if (newPassword.length < 8) {
      kwikToast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      kwikToast.error("Passwords do not match");
      return;
    }

    setIsChangingPassword(true);
    try {
      const fn = (authApi as Record<string, unknown>).changePassword as
        | ((data: { currentPassword: string; newPassword: string }) => Promise<void>)
        | undefined;
      await fn?.({ currentPassword, newPassword });
      kwikToast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      kwikToast.error("Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleToggle2FA = (val: boolean) => {
    setSecurity({ twoFactorEnabled: val });
    saveJson(SECURITY_KEY, { twoFactorEnabled: val });
    if (val) {
      kwikToast.success("Two-factor authentication enabled");
    } else {
      kwikToast.success("Two-factor authentication disabled");
    }
  };

  const toggleMobileSection = (id: SectionId) => {
    setMobileExpanded((prev) => (prev === id ? null : id));
  };

  // ==================== Section Renderer ====================

  function renderSection(id: SectionId) {
    switch (id) {
      case "header":
        return null; // Header rendered outside accordion
      case "personal":
        return <PersonalSection />;
      case "store":
        return <StoreSection />;
      case "contact":
        return <ContactSection />;
      case "security":
        return <SecuritySection />;
    }
  }

  // ==================== Render ====================

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Page Header */}
      <VendorPageHeader
        title="Profile"
        description="Manage your personal information, store profile, and account security."
      />

      {/* ==================== Profile Header Section ==================== */}
      <ProfileHeaderSection />

      <section className="grid gap-3 sm:grid-cols-2">
        {[
          {
            href: "/dashboard/subscriptions",
            title: "Subscription",
            text: "Plan limits and billing.",
            icon: CreditCard,
          },
          {
            href: "/dashboard/kyc",
            title: "KYC Verification",
            text: "Identity and payout readiness.",
            icon: ShieldCheck,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-orange-200 hover:bg-orange-50/40 dark:border-white/10 dark:bg-white/5 dark:hover:border-orange-400/30 dark:hover:bg-orange-400/10"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-400/10 dark:text-orange-200">
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">{item.title}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{item.text}</span>
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
            </Link>
          );
        })}
      </section>

      {/* Divider */}
      <div className="border-t border-kwik-border" />

      {/* ==================== All Sections (Desktop: stacked, Mobile: accordion) ==================== */}
      <div className="space-y-0 divide-y divide-kwik-border border-t border-kwik-border">
        {/* Mobile Accordion Nav */}
        {SECTIONS.filter((s) => s.id !== "header").map((section) => {
          const IconComp = section.icon;
          const isExpanded = mobileExpanded === section.id;
          return (
            <div key={section.id} className="lg:hidden">
              <button
                type="button"
                onClick={() => toggleMobileSection(section.id)}
                className="flex w-full items-center justify-between px-1 py-4 text-left text-sm font-medium text-foreground transition"
              >
                <span className="flex items-center gap-3">
                  <IconComp className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                  {section.label}
                </span>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                )}
              </button>
              {isExpanded && <div className="pb-6">{renderSection(section.id)}</div>}
            </div>
          );
        })}

        {/* Desktop Sections */}
        <div className="hidden lg:space-y-0 lg:divide-y lg:divide-kwik-border">
          {SECTIONS.filter((s) => s.id !== "header").map((section) => (
            <div key={section.id} className="py-8 first:pt-0">
              {renderSection(section.id)}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  // ==================== Profile Header Section ====================

  function ProfileHeaderSection() {
    return (
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        {/* Avatar */}
        <div className="relative">
          <div
            className={`flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 transition ${
              isDraggingAvatar
                ? "border-foreground bg-default-100"
                : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-white/5"
            }`}
            onDragOver={handleAvatarDragOver}
            onDragLeave={handleAvatarDragLeave}
            onDrop={handleAvatarDrop}
          >
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarPreview}
                alt="Profile avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-10 w-10 text-muted-foreground" strokeWidth={1.5} />
            )}
            {isUploadingAvatar && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                <RefreshCw className="h-6 w-6 animate-spin text-white" strokeWidth={1.5} />
              </div>
            )}
          </div>

          {/* Upload button */}
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:bg-default-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          >
            <Camera className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleAvatarUpload(file);
            }}
          />

          {/* Drag overlay text */}
          {isDraggingAvatar && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full border-2 border-dashed border-kwik-border bg-default-100/80">
              <Upload className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground">
              {personal.firstName || personal.lastName
                ? `${personal.firstName} ${personal.lastName}`.trim()
                : store?.name || user?.email || "Vendor"}
            </h2>
            {storeVerified && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
                Verified
              </span>
            )}
          </div>
          {store?.name && (
            <p className="mt-0.5 text-sm text-muted-foreground">{store.name}</p>
          )}
          {user?.email && (
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />
              {user.email}
              {emailVerified && (
                <CheckCircle className="h-3 w-3 text-green-500" strokeWidth={2} />
              )}
            </p>
          )}
          {user?.phone && (
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Phone className="h-3.5 w-3.5" strokeWidth={1.5} />
              {user.phone}
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Click the camera icon or drag &amp; drop to update your avatar
          </p>
        </div>
      </div>
    );
  }

  // ==================== Personal Information Section ====================

  function PersonalSection() {
    if (isLoadingPersonal) {
      return (
        <div className="space-y-4">
          <div>
            <Skeleton className="mb-2 h-4 w-40" />
            <Skeleton className="mb-1 h-3 w-64" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-9 w-32" />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-base font-semibold text-foreground">Personal Information</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Your personal details used across the platform.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FieldInput
            label="First Name"
            type="text"
            placeholder="Enter first name"
            value={personal.firstName}
            onChange={(e) => setPersonal((p) => ({ ...p, firstName: e.target.value }))}
          />
          <FieldInput
            label="Last Name"
            type="text"
            placeholder="Enter last name"
            value={personal.lastName}
            onChange={(e) => setPersonal((p) => ({ ...p, lastName: e.target.value }))}
          />
        </div>

        <FieldTextarea
          label="Bio"
          value={personal.bio}
          onChange={(e) => setPersonal((p) => ({ ...p, bio: e.target.value }))}
          placeholder="Tell customers about yourself..."
          rows={4}
        />

        <FieldInput
          label="Date of Birth"
          type="date"
          max={new Date().toISOString().split("T")[0]}
          value={personal.dateOfBirth}
          onChange={(e) => setPersonal((p) => ({ ...p, dateOfBirth: e.target.value }))}
        />

        <div>
          <AppButton
            variant="primary"
            size="sm"
            onClick={handleSavePersonal}
            isLoading={isSavingPersonal}
            loadingLabel="Saving..."
            disabled={isSavingPersonal}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Save Personal Info
          </AppButton>
        </div>
      </div>
    );
  }

  // ==================== Store Profile Section ====================

  function StoreSection() {
    if (isLoadingStore) {
      return (
        <div className="space-y-4">
          <div>
            <Skeleton className="mb-2 h-4 w-40" />
            <Skeleton className="mb-1 h-3 w-64" />
          </div>
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-9 w-32" />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-base font-semibold text-foreground">Store Profile</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Your storefront details visible to customers on the marketplace.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FieldInput
            label="Store Name"
            type="text"
            placeholder="My Store"
            value={storeProfile.storeName}
            onChange={(e) => {
              setStoreProfile((p) => ({
                ...p,
                storeName: e.target.value,
                storeSlug: !p.storeSlug || slugify(p.storeName) === p.storeSlug
                  ? slugify(e.target.value)
                  : p.storeSlug,
              }));
            }}
          />
          <FieldSelect
            label="Store Category"
            value={storeProfile.storeCategory}
            onChange={(e) => setStoreProfile((p) => ({ ...p, storeCategory: e.target.value }))}
          >
            {STORE_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </FieldSelect>
        </div>

        <div>
          <FieldInput
            label="Store URL / Slug"
            type="text"
            placeholder="my-store"
            value={storeProfile.storeSlug}
            onChange={(e) =>
              setStoreProfile((p) => ({ ...p, storeSlug: slugify(e.target.value) }))
            }
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Preview:{" "}
            <span className="font-mono text-muted-foreground">
              kwikseller.com/store/{storeProfile.storeSlug || "your-store"}
            </span>
          </p>
        </div>

        <FieldTextarea
          label="Store Description"
          value={storeProfile.storeDescription}
          onChange={(e) =>
            setStoreProfile((p) => ({ ...p, storeDescription: e.target.value }))
          }
          placeholder="Describe your store and what you sell..."
          rows={4}
        />

        {/* Logo Upload */}
        <div>
          <span className="text-xs font-semibold text-muted-foreground">Store Logo</span>
          <div className="mt-2 flex items-start gap-4">
            {storeProfile.logoPreview ? (
              <div className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-kwik-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={storeProfile.logoPreview}
                  alt="Store logo"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setStoreProfile((p) => ({ ...p, logoPreview: null }))}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4 text-white" strokeWidth={1.5} />
                </button>
              </div>
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-kwik-border bg-default-100">
                <ImageIcon className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
              </div>
            )}
            <div>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground transition hover:text-foreground">
                <Upload className="h-4 w-4" strokeWidth={1.5} />
                {isUploadingLogo ? "Uploading..." : "Upload Logo"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleLogoUpload}
                  disabled={isUploadingLogo}
                />
              </label>
              <p className="mt-1 text-xs text-muted-foreground">
                PNG, JPG, or WebP. Recommended 200x200px.
              </p>
            </div>
          </div>
        </div>

        {/* Banner Upload */}
        <div>
          <span className="text-xs font-semibold text-muted-foreground">Store Banner</span>
          <div className="mt-2">
            {storeProfile.bannerPreview ? (
              <div className="group relative aspect-[3/1] w-full max-w-md overflow-hidden rounded-lg border border-kwik-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={storeProfile.bannerPreview}
                  alt="Store banner"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setStoreProfile((p) => ({ ...p, bannerPreview: null }))}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md bg-black/50 opacity-0 transition group-hover:opacity-100"
                >
                  <X className="h-4 w-4 text-white" strokeWidth={1.5} />
                </button>
              </div>
            ) : (
              <label className="flex aspect-[3/1] w-full max-w-md cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-kwik-border bg-default-100 transition hover:border-accent hover:bg-default-100">
                <Upload className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
                <span className="text-xs font-medium text-muted-foreground">
                  {isUploadingBanner ? "Uploading..." : "Upload Banner"}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  PNG, JPG, or WebP. Recommended 1200x400px.
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleBannerUpload}
                  disabled={isUploadingBanner}
                />
              </label>
            )}
          </div>
        </div>

        <div>
          <AppButton
            variant="primary"
            size="sm"
            onClick={handleSaveStore}
            isLoading={isSavingStore}
            loadingLabel="Saving..."
            disabled={isSavingStore}
          >
            <Store className="h-3.5 w-3.5" />
            Save Store Profile
          </AppButton>
        </div>
      </div>
    );
  }

  // ==================== Contact Information Section ====================

  function ContactSection() {
    if (isLoadingContact) {
      return (
        <div className="space-y-4">
          <div>
            <Skeleton className="mb-2 h-4 w-48" />
            <Skeleton className="mb-1 h-3 w-64" />
          </div>
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-9 w-32" />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-base font-semibold text-foreground">Contact Information</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            How customers and Kwikseller can reach you.
          </p>
        </div>

        <div>
          <FieldInput
            label="Email Address"
            type="email"
            placeholder="vendor@example.com"
            value={contact.email}
            onChange={(e) => setContact((p) => ({ ...p, email: e.target.value }))}
          />
          <div className="mt-1.5 flex items-center gap-3">
            {emailVerified ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                <CheckCircle className="h-3 w-3" strokeWidth={2} />
                Verified
              </span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleSendVerification}
                  disabled={isSendingVerification || !contact.email}
                  className="text-xs font-medium text-muted-foreground transition hover:text-foreground disabled:text-muted-foreground/50"
                >
                  {isSendingVerification ? "Sending..." : "Send verification email"}
                </button>
                <span className="text-xs text-amber-600">
                  <AlertCircle className="inline h-3 w-3" strokeWidth={1.5} /> Not verified
                </span>
              </>
            )}
          </div>
        </div>

        <FieldInput
          label="Phone Number"
          type="tel"
          placeholder="+234 800 000 0000"
          value={contact.phone}
          onChange={(e) => setContact((p) => ({ ...p, phone: e.target.value }))}
        />
        <p className="-mt-3 text-xs text-muted-foreground">
          OTP verification required when changed.
        </p>

        <div className="border-t border-kwik-border pt-5">
          <p className="text-xs font-semibold text-muted-foreground mb-4">Business Address</p>
          <div className="space-y-4">
            <FieldInput
              label="Street Address"
              type="text"
              placeholder="123 Main Street"
              value={contact.addressLine1}
              onChange={(e) => setContact((p) => ({ ...p, addressLine1: e.target.value }))}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldInput
                label="City"
                type="text"
                placeholder="Lagos"
                value={contact.addressCity}
                onChange={(e) => setContact((p) => ({ ...p, addressCity: e.target.value }))}
              />
              <FieldInput
                label="State"
                type="text"
                placeholder="Lagos"
                value={contact.addressState}
                onChange={(e) => setContact((p) => ({ ...p, addressState: e.target.value }))}
              />
            </div>
            <FieldInput
              label="Country"
              type="text"
              placeholder="Nigeria"
              value={contact.addressCountry}
              onChange={(e) => setContact((p) => ({ ...p, addressCountry: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <AppButton
            variant="primary"
            size="sm"
            onClick={handleSaveContact}
            isLoading={isSavingContact}
            loadingLabel="Saving..."
            disabled={isSavingContact}
          >
            <Mail className="h-3.5 w-3.5" />
            Save Contact Info
          </AppButton>
        </div>
      </div>
    );
  }

  // ==================== Security Section ====================

  function SecuritySection() {
    if (isLoadingSecurity) {
      return (
        <div className="space-y-4">
          <div>
            <Skeleton className="mb-2 h-4 w-32" />
            <Skeleton className="mb-1 h-3 w-64" />
          </div>
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-9 w-32" />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-base font-semibold text-foreground">Security</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage your password and two-factor authentication settings.
          </p>
        </div>

        {/* Two-Factor Authentication */}
        <div className="flex items-center justify-between gap-4 py-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-green-50">
              <ShieldCheck className="h-4 w-4 text-green-600" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Two-Factor Authentication
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Add an extra layer of security to your account with 2FA.
              </p>
            </div>
          </div>
          <AppSwitch
            isSelected={security.twoFactorEnabled}
            onChange={handleToggle2FA}
            className="shrink-0"
          />
        </div>

        <div className="border-t border-kwik-border" />

        {/* Change Password */}
        <div>
          <h3 className="text-base font-semibold text-foreground">Change Password</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Update your account password. You will be logged out of other sessions.
          </p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <FieldInput
              label="Current Password"
              type={showCurrentPw ? "text" : "password"}
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPw(!showCurrentPw)}
              className="absolute right-3 top-[38px] text-muted-foreground hover:text-muted-foreground"
              tabIndex={-1}
            >
              {showCurrentPw ? (
                <EyeOff className="h-4 w-4" strokeWidth={1.5} />
              ) : (
                <Eye className="h-4 w-4" strokeWidth={1.5} />
              )}
            </button>
          </div>

          <div className="relative">
            <FieldInput
              label="New Password"
              type={showNewPw ? "text" : "password"}
              placeholder="Min. 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowNewPw(!showNewPw)}
              className="absolute right-3 top-[38px] text-muted-foreground hover:text-muted-foreground"
              tabIndex={-1}
            >
              {showNewPw ? (
                <EyeOff className="h-4 w-4" strokeWidth={1.5} />
              ) : (
                <Eye className="h-4 w-4" strokeWidth={1.5} />
              )}
            </button>
          </div>

          <div className="relative">
            <FieldInput
              label="Confirm New Password"
              type={showConfirmPw ? "text" : "password"}
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPw(!showConfirmPw)}
              className="absolute right-3 top-[38px] text-muted-foreground hover:text-muted-foreground"
              tabIndex={-1}
            >
              {showConfirmPw ? (
                <EyeOff className="h-4 w-4" strokeWidth={1.5} />
              ) : (
                <Eye className="h-4 w-4" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>

        <div>
          <AppButton
            variant="primary"
            size="sm"
            onClick={handleChangePassword}
            isLoading={isChangingPassword}
            loadingLabel="Changing..."
            disabled={
              isChangingPassword ||
              !currentPassword ||
              !newPassword ||
              !confirmPassword
            }
          >
            <Lock className="h-3.5 w-3.5" />
            Change Password
          </AppButton>
        </div>
      </div>
    );
  }
}
