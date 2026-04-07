import { AdminLoginPage } from "@/components/auth";

export default function LoginPage() {
  return (
    <AdminLoginPage
      config={{
        name: "Admin Panel",
        description: "Sign in to access the admin dashboard",
        redirectPath: "/admin",
      }}
    />
  );
}
