import { VendorWorkspaceShell } from "@/components/vendor-workspace-shell";
import { VendorPageProvider } from "@/components/vendor-page-context";
import { QueryProvider } from "@/lib/query-provider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <VendorPageProvider>
        <VendorWorkspaceShell>{children}</VendorWorkspaceShell>
      </VendorPageProvider>
    </QueryProvider>
  );
}
