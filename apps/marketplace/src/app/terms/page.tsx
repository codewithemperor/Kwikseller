import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#07111f]">
      <section className="border-b border-neutral-200 dark:border-white/10">
        <div className="container mx-auto px-4 py-10">
          <h1 className="font-heading text-4xl font-semibold tracking-tight text-kwik-dark dark:text-white">
            Terms and buyer protection
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-kwik-muted dark:text-white/60">
            These starter terms keep the current commerce phase clear while legal copy is finalized.
          </p>
        </div>
      </section>
      <section className="container mx-auto grid gap-6 px-4 py-8 lg:grid-cols-3">
        {[
          ["Checkout", "Cart totals, delivery fees, coupons, and Paystack payment amounts are recalculated server-side before an order is created."],
          ["Delivery", "Rider automation is paused. Admin operations manually assign dispatch and tracking after payment for physical orders."],
          ["Digital access", "Digital-only products do not require a shipping address and should be fulfilled through active digital delivery assets."],
          ["Pool commerce", "Pool resale and group-buy items may follow additional availability, campaign, or opt-in rules."],
          ["Refunds", "Refund requests are reviewed by admin based on payment state, fulfillment state, and vendor order progress."],
          ["Account security", "Users must keep login credentials secure and complete email verification when prompted."],
        ].map(([title, text]) => (
          <article key={title} className="border border-neutral-200 p-5 dark:border-white/10">
            <h2 className="text-base font-semibold text-kwik-dark dark:text-white">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-kwik-muted dark:text-white/60">{text}</p>
          </article>
        ))}
      </section>
      <div className="container mx-auto px-4 pb-10">
        <Link href="/privacy" className="text-sm font-semibold text-kwik-orange">
          Read privacy policy
        </Link>
      </div>
    </main>
  );
}
