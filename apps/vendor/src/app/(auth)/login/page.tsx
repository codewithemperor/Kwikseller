import { LoginPage, type PortalConfig } from "@/components/auth";

const vendorPortal: PortalConfig = {
  name: "KWIKSELLER Vendor",
  description: "Manage your online store",
  themeColor: "orange",
  redirectPath: "/dashboard",
  showRegisterLink: true,
  registerPath: "/register",
};

export default function LoginRoute() {
  return <LoginPage portal={vendorPortal} />;
}
