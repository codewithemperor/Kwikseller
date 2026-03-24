import {
  RegisterPage as RegisterPageComponent,
  RegisterPortalConfig,
} from "@/components/auth";

const marketplacePortal: RegisterPortalConfig = {
  name: "KWIKSELLER",
  description: "Join Africa's largest marketplace",
  themeColor: "blue",
  redirectPath: "/",
  loginPath: "/login",
  defaultRole: "BUYER",
  showRoleSelector: true,
};

export default function RegisterPage() {
  return <RegisterPageComponent portal={marketplacePortal} />;
}
