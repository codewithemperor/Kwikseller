import {
  RegisterPage as RegisterPageComponent,
  type VendorRegisterConfig,
} from "@/components/auth";

const vendorConfig: VendorRegisterConfig = {
  name: "KWIKSELLER Vendor",
  description: "Start selling on Africa's largest marketplace",
  themeColor: "orange",
  redirectPath: "/dashboard",
  loginPath: "/login",
};

export default function RegisterPage() {
  return <RegisterPageComponent config={vendorConfig} />;
}
