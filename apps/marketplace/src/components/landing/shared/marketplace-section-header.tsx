import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function MarketplaceSectionHeader({
  title,
  href = "#",
  actionLabel = "View More",
}: {
  title: string;
  href?: string;
  actionLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between rounded-[20px] bg-kwik-orange px-4 py-3 text-white sm:px-5">
      <h2 className="text-lg font-semibold sm:text-xl">{title}</h2>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-sm font-medium text-white/95 transition-opacity hover:opacity-80"
      >
        {actionLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
