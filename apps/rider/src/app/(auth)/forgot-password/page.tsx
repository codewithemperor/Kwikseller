import { ForgotPasswordPage as ForgotPasswordPageComponent } from '@/components/auth';

export default function ForgotPasswordPage() {
  return (
    <ForgotPasswordPageComponent
      loginPath="/login"
      resetPath="/reset-password"
      appName="KWIKSELLER Rider"
      themeColor="orange"
    />
  );
}
