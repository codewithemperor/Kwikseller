import {
  RegisterPage as RegisterPageComponent,
  RegisterRiderConfig,
} from "@/components/auth";

const riderPortal: RegisterRiderConfig = {
  name: "KWIKSELLER",
  description: "Start earning by delivering packages in your area",
  themeColor: "orange",
  redirectPath: "/dashboard",
  loginPath: "/login",
};

export default function RegisterPage() {
  return <RegisterPageComponent portal={riderPortal} />;
}
