import { ResetPasswordPage } from "@/components/auth";

export default function ResetPasswordRoute() {
  return (
    <ResetPasswordPage
      loginPath="/login"
      forgotPasswordPath="/forgot-password"
      appName="KWIKSELLER Vendor"
      themeColor="orange"
    />
  );
}
