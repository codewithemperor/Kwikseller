import {
  RegisterPage as RegisterPageComponent,
  RegisterPortalConfig,
} from "@/components/auth";

// Get vendor registration URL from environment variable
const vendorRegisterUrl = process.env.NEXT_PUBLIC_VENDOR_REGISTER_URL;

const marketplacePortal: RegisterPortalConfig = {
  name: "KWIKSELLER",
  description: "Join Africa's largest marketplace",
  themeColor: "blue",
  redirectPath: "/",
  loginPath: "/login",
  defaultRole: "BUYER",
  showRoleSelector: true,
  // Redirect vendors to the vendor app registration page
  vendorRegisterUrl,
};

export default function RegisterPage() {
  return <RegisterPageComponent portal={marketplacePortal} />;
}
