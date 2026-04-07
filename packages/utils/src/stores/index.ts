/**
 * KWIKSELLER - Stores
 *
 * Zustand-based state management stores
 */

export {
  useAuthStore,
  useUser,
  useAccessToken,
  useHasRole,
  useHasPermission,
  useAuthLoading,
  useAuthInitialized,
  useVendorNeedsOnboarding,
  useRiderNeedsOnboarding,
  useVendorVerificationStatus,
  useRiderVerificationStatus,
  useIsUserVerified,
  useOnboardingStep,
  useIsSuperAdmin,
  usePendingResetEmail,
  type UserStore,
  type UserProfile,
  type AuthTokens,
  type AuthState,
  type UserRole,
  type UserStatus,
  type VerificationStatus,
  type OnboardingStep,
  type LoginCredentials,
  type RegisterData,
} from "./auth-store";
