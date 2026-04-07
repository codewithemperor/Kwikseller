import { ForgotPasswordPage } from "@/components/auth";

export default function ForgotPasswordRoute() {
  return (
    <ForgotPasswordPage
      loginPath="/login"
      resetPath="/reset-password"
      appName="KWIKSELLER Vendor"
      themeColor="orange"
    />
  );
}
