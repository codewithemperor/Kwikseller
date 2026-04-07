import { ResetPasswordPage as ResetPasswordPageComponent } from '@/components/auth';

export default function ResetPasswordPage() {
  return (
    <ResetPasswordPageComponent
      loginPath="/login"
      forgotPasswordPath="/forgot-password"
      appName="KWIKSELLER Rider"
      themeColor="orange"
    />
  );
}
