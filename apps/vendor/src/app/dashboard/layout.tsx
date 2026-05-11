import { VendorWorkspaceShell } from "@/components/vendor-workspace-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <VendorWorkspaceShell>{children}</VendorWorkspaceShell>;
}
