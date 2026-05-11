import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#07111f]">
      <section className="border-b border-neutral-200 dark:border-white/10">
        <div className="container mx-auto px-4 py-10">
          <h1 className="font-heading text-4xl font-semibold tracking-tight text-kwik-dark dark:text-white">
            Privacy policy
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-kwik-muted dark:text-white/60">
            How Kwikseller handles buyer, vendor, delivery, payment, and account data in the current commerce build.
          </p>
        </div>
      </section>
      <section className="container mx-auto grid gap-6 px-4 py-8 lg:grid-cols-3">
        {[
          ["Account data", "We use account details for authentication, email verification, order ownership, and support."],
          ["Checkout data", "Shipping address, city, state, local government, delivery instructions, coupon code, and payment reference are stored for order processing."],
          ["Payment data", "Paystack handles card/payment collection. Kwikseller stores payment references, status, amount, and gateway responses for audit."],
          ["Vendor operations", "Vendor stores, catalog updates, inventory changes, Pool offers, and order actions are logged for accountability."],
          ["Admin audit", "Admin changes to delivery rates, orders, payments, refunds, and catalog governance are tracked."],
          ["Cookies", "Local storage and cookies may keep session tokens, cart convenience state, and interface preferences."],
        ].map(([title, text]) => (
          <article key={title} id={title === "Cookies" ? "cookies" : undefined} className="border border-neutral-200 p-5 dark:border-white/10">
            <h2 className="text-base font-semibold text-kwik-dark dark:text-white">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-kwik-muted dark:text-white/60">{text}</p>
          </article>
        ))}
      </section>
      <div className="container mx-auto px-4 pb-10">
        <Link href="/terms" className="text-sm font-semibold text-kwik-orange">
          Read terms
        </Link>
      </div>
    </main>
  );
}
