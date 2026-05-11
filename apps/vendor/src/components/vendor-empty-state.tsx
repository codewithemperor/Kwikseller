import { PackageOpen } from "lucide-react";

export function VendorEmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="border border-dashed border-border p-10 text-center">
      <PackageOpen className="mx-auto h-10 w-10 text-muted-foreground/60" />
      <h2 className="mt-4 font-heading text-lg font-semibold text-foreground">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
