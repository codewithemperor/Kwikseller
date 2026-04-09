import {
  LoginPage as LoginPageComponent,
  RiderPortalConfig,
} from "@/components/auth";

const riderPortal: RiderPortalConfig = {
  name: "KWIKSELLER Rider",
  description: "Sign in to manage deliveries and track earnings",
  themeColor: "orange",
  redirectPath: "/dashboard",
  showRegisterLink: true,
  registerPath: "/register",
};

export default function LoginPage() {
  return <LoginPageComponent portal={riderPortal} />;
}
