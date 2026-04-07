import { AdminGuestRoute } from "@/components/auth";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuestRoute redirectPath="/admin">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Main Content */}
      <div className="min-h-screen">{children}</div>
    </AdminGuestRoute>
  );
}
