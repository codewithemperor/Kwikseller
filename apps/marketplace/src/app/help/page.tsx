"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api-client";
import {
  ArrowLeft,
  HelpCircle,
  ChevronDown,
  Search,
  ShoppingBag,
  CreditCard,
  Truck,
  RotateCcw,
  User,
  Store,
  Send,
  Mail,
  Phone,
  MessageCircle,
  CheckCircle2,
  Loader2,
  Package,
  LifeBuoy,
  Sparkles,
  Clock,
  AlertCircle,
  Ticket,
} from "lucide-react";
import { kwikToast } from "@/lib/toast";
import { AccountLayout } from "@/components/layout/account-layout";
import { PageLoading } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { useFAQ, type FAQCategory } from "@/lib/api-hooks";
import { useSubmitTicket } from "@/lib/order-api";
import { cn } from "@/lib/utils";

// ─── Static config ──────────────────────────────────────────────────────

type Tab = "ALL" | FAQCategory;

const TABS: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
  { key: "ALL", label: "All", icon: Sparkles, description: "Browse every FAQ" },
  { key: "ORDERS", label: "Orders", icon: ShoppingBag, description: "Tracking, modifications, splits" },
  { key: "PAYMENTS", label: "Payments", icon: CreditCard, description: "Methods, charges, refunds" },
  { key: "DELIVERY", label: "Delivery", icon: Truck, description: "Options, coverage, agents" },
  { key: "RETURNS", label: "Returns", icon: RotateCcw, description: "Policy, process, shipping" },
  { key: "ACCOUNT", label: "Account", icon: User, description: "KwikCoins, tiers, addresses" },
  { key: "VENDOR", label: "Vendor", icon: Store, description: "Selling, payouts, commission" },
];

const TAB_ICON: Record<Tab, React.ComponentType<{ className?: string }>> = {
  ALL: Sparkles,
  ORDERS: ShoppingBag,
  PAYMENTS: CreditCard,
  DELIVERY: Truck,
  RETURNS: RotateCcw,
  ACCOUNT: User,
  VENDOR: Store,
};

const TICKET_CATEGORIES = [
  { value: "ORDERS", label: "Order issue" },
  { value: "PAYMENTS", label: "Payment issue" },
  { value: "DELIVERY", label: "Delivery issue" },
  { value: "RETURNS", label: "Return / refund" },
  { value: "ACCOUNT", label: "Account issue" },
  { value: "VENDOR", label: "Vendor issue" },
  { value: "GENERAL", label: "General enquiry" },
];

// ─── Quick-help category card ───────────────────────────────────────────

function QuickHelpCard({ tab, onSelect }: { tab: typeof TABS[number]; onSelect: (t: Tab) => void }) {
  const Icon = tab.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(tab.key)}
      className="group flex items-start gap-3 rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-4 text-left transition hover:border-kwik-orange/40 hover:shadow-sm"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-kwik-orange/10 text-kwik-orange transition group-hover:bg-kwik-orange/15">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-kwik-dark">{tab.label}</p>
        <p className="mt-0.5 text-xs text-kwik-muted">{tab.description}</p>
      </div>
    </button>
  );
}

// ─── FAQ accordion item ─────────────────────────────────────────────────

function FAQAccordion({ items }: { items: { id: string; question: string; answer: string; category: string }[] }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const isOpen = open === item.id;
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.25) }}
            className={cn(
              "overflow-hidden rounded-2xl border bg-kwik-bg-surface transition-colors",
              isOpen ? "border-kwik-orange/40" : "border-kwik-border-light",
            )}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : item.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span className={cn("inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold",
                  isOpen ? "bg-kwik-orange text-white" : "bg-kwik-bg-page text-kwik-muted")}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-semibold text-kwik-dark">{item.question}</span>
              </span>
              <ChevronDown className={cn("h-4 w-4 shrink-0 text-kwik-muted transition-transform", isOpen && "rotate-180 text-kwik-orange")} />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <p className="px-4 pb-4 pl-[52px] text-sm text-kwik-muted">{item.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Contact form ───────────────────────────────────────────────────────

function ContactForm() {
  const router = useRouter();
  const submit = useSubmitTicket();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("ORDERS");
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState<null | { id: string; subject: string }>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      kwikToast.error("Please fill in the subject and message");
      return;
    }
    submit.mutate(
      {
        subject: subject.trim(),
        category,
        message: message.trim(),
        orderId: orderId.trim() || undefined,
        email: email.trim() || undefined,
      },
      {
        onSuccess: (data) => {
          setSubmitted({ id: data.id, subject: data.subject });
          setSubject("");
          setMessage("");
          setOrderId("");
          setEmail("");
          kwikToast.success("Support ticket submitted — we'll reply within 24h");
        },
        onError: () => {
          kwikToast.error("Couldn't submit ticket. Please try again.");
        },
      },
    );
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-kwik-green/30 bg-kwik-green/5 p-6 text-center"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-kwik-green text-white">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h3 className="mt-3 font-heading text-lg font-bold text-kwik-dark">Ticket submitted</h3>
        <p className="mt-1 text-sm text-kwik-muted">
          Your ticket <span className="font-mono font-semibold text-kwik-dark">{submitted.id}</span> has been received.
          We&rsquo;ll email you a response within 24 hours.
        </p>
        <p className="mt-2 text-xs text-kwik-gray-light">Subject: {submitted.subject}</p>
        <button
          type="button"
          onClick={() => setSubmitted(null)}
          className="mt-4 inline-flex h-10 items-center justify-center rounded-xl border border-kwik-border-light bg-kwik-bg-surface px-5 text-sm font-semibold text-kwik-dark transition hover:bg-kwik-bg-page"
        >
          Submit another ticket
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Subject */}
        <div className="sm:col-span-2">
          <label htmlFor="subject" className="block text-xs font-semibold uppercase tracking-wide text-kwik-gray-light">
            Subject <span className="text-kwik-red">*</span>
          </label>
          <input
            id="subject"
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief summary of your issue"
            className="mt-1.5 h-11 w-full rounded-xl border border-kwik-border-light bg-kwik-bg-page px-3.5 text-sm text-kwik-dark placeholder:text-kwik-gray-light focus:border-kwik-orange focus:outline-none focus:ring-2 focus:ring-kwik-orange/20"
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-xs font-semibold uppercase tracking-wide text-kwik-gray-light">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1.5 h-11 w-full rounded-xl border border-kwik-border-light bg-kwik-bg-page px-3.5 text-sm text-kwik-dark focus:border-kwik-orange focus:outline-none focus:ring-2 focus:ring-kwik-orange/20"
          >
            {TICKET_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Order ID */}
        <div>
          <label htmlFor="orderId" className="block text-xs font-semibold uppercase tracking-wide text-kwik-gray-light">
            Order number <span className="font-normal text-kwik-gray-light">(optional)</span>
          </label>
          <input
            id="orderId"
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="e.g. KS-1001"
            className="mt-1.5 h-11 w-full rounded-xl border border-kwik-border-light bg-kwik-bg-page px-3.5 text-sm text-kwik-dark placeholder:text-kwik-gray-light focus:border-kwik-orange focus:outline-none focus:ring-2 focus:ring-kwik-orange/20"
          />
        </div>

        {/* Email */}
        <div className="sm:col-span-2">
          <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wide text-kwik-gray-light">
            Email <span className="font-normal text-kwik-gray-light">(optional — for guest users)</span>
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="mt-1.5 h-11 w-full rounded-xl border border-kwik-border-light bg-kwik-bg-page px-3.5 text-sm text-kwik-dark placeholder:text-kwik-gray-light focus:border-kwik-orange focus:outline-none focus:ring-2 focus:ring-kwik-orange/20"
          />
        </div>

        {/* Message */}
        <div className="sm:col-span-2">
          <label htmlFor="message" className="block text-xs font-semibold uppercase tracking-wide text-kwik-gray-light">
            Message <span className="text-kwik-red">*</span>
          </label>
          <textarea
            id="message"
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your issue in detail. Include steps to reproduce if applicable."
            className="mt-1.5 w-full rounded-xl border border-kwik-border-light bg-kwik-bg-page px-3.5 py-3 text-sm text-kwik-dark placeholder:text-kwik-gray-light focus:border-kwik-orange focus:outline-none focus:ring-2 focus:ring-kwik-orange/20"
          />
          <p className="mt-1 text-xs text-kwik-gray-light">{message.length} characters</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-kwik-muted">
          Average response time: <span className="font-semibold text-kwik-dark">under 24 hours</span>
        </p>
        <button
          type="submit"
          disabled={submit.isPending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-kwik-orange px-6 text-sm font-semibold text-white transition hover:bg-kwik-orange-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submit.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" /> Submit ticket
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// ─── Order lookup mini-widget ───────────────────────────────────────────

function OrderLookup() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const v = value.trim();
    if (!v) {
      kwikToast.error("Enter an order number");
      return;
    }
    router.push(`/orders/${encodeURIComponent(v)}`);
  }

  return (
    <form onSubmit={handleLookup} className="rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <Package className="h-5 w-5 text-kwik-orange" />
        <h3 className="font-heading text-sm font-semibold text-kwik-dark">Look up an order</h3>
      </div>
      <p className="mt-1 text-xs text-kwik-muted">
        Enter your order number to jump straight to its detail page.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="KS-1001"
          className="h-11 flex-1 rounded-xl border border-kwik-border-light bg-kwik-bg-page px-3.5 text-sm text-kwik-dark placeholder:text-kwik-gray-light focus:border-kwik-orange focus:outline-none focus:ring-2 focus:ring-kwik-orange/20"
        />
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-kwik-border-light bg-kwik-bg-page px-4 text-sm font-semibold text-kwik-dark transition hover:border-kwik-orange/40 hover:bg-kwik-bg-surface"
        >
          Go
        </button>
      </div>
    </form>
  );
}

// ─── My tickets list ─────────────────────────────────────────────────────

interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  message: string;
  orderId?: string;
  email?: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  createdAt: string;
}

function statusBadge(status: string) {
  switch (status) {
    case "OPEN":
      return "bg-kwik-orange/10 text-kwik-orange";
    case "IN_PROGRESS":
      return "bg-kwik-amber/10 text-kwik-amber";
    case "RESOLVED":
      return "bg-kwik-green/10 text-kwik-green";
    case "CLOSED":
      return "bg-kwik-bg-page text-kwik-muted";
    default:
      return "bg-kwik-bg-page text-kwik-muted";
  }
}

function statusIcon(status: string) {
  switch (status) {
    case "OPEN":
      return AlertCircle;
    case "IN_PROGRESS":
      return Clock;
    case "RESOLVED":
      return CheckCircle2;
    case "CLOSED":
      return Package;
    default:
      return AlertCircle;
  }
}

function MyTicketsList() {
  const { data: tickets, isLoading, refetch } = useQuery<SupportTicket[]>({
    queryKey: ["support-tickets"],
    queryFn: async () => {
      const res = await api.get<SupportTicket[]>("support/tickets");
      return res.data || [];
    },
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-kwik-muted">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading tickets…
      </div>
    );
  }

  if (!tickets || tickets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-kwik-border-light bg-kwik-bg-page/50 p-6 text-center">
        <Ticket className="mx-auto h-8 w-8 text-kwik-muted" />
        <p className="mt-2 text-sm font-medium text-kwik-dark">No tickets yet</p>
        <p className="mt-1 text-xs text-kwik-muted">
          When you submit a support ticket, it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tickets.map((ticket, i) => {
        const StatusIcon = statusIcon(ticket.status);
        return (
          <motion.div
            key={ticket.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.2) }}
            className="flex items-start gap-3 rounded-xl border border-kwik-border-light bg-kwik-bg-surface p-3 transition hover:border-kwik-orange/30"
          >
            <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", statusBadge(ticket.status))}>
              <StatusIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-kwik-dark">{ticket.subject}</p>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", statusBadge(ticket.status))}>
                  {ticket.status.replace(/_/g, " ")}
                </span>
              </div>
              <p className="mt-0.5 line-clamp-1 text-xs text-kwik-muted">{ticket.message}</p>
              <div className="mt-1 flex items-center gap-3 text-[10px] text-kwik-gray-light">
                <span className="font-mono">{ticket.id}</span>
                {ticket.orderId && (
                  <span className="inline-flex items-center gap-0.5">
                    <Package className="h-3 w-3" /> {ticket.orderId}
                  </span>
                )}
                <span>{new Date(ticket.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────

function HelpPageInner() {
  const [tab, setTab] = useState<Tab>("ALL");
  const [query, setQuery] = useState("");
  const { data: faq, isLoading, isError, refetch } = useFAQ(tab);

  // Client-side filter by search query (in addition to category filter from API).
  const filtered = useMemo(() => {
    if (!faq) return [];
    if (!query.trim()) return faq;
    const q = query.toLowerCase();
    return faq.filter(
      (f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q),
    );
  }, [faq, query]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-kwik-muted transition hover:text-kwik-dark"
      >
        <ArrowLeft className="h-4 w-4" /> Back to shop
      </Link>

      {/* Hero header */}
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 overflow-hidden rounded-3xl border border-kwik-border-light bg-gradient-to-br from-kwik-orange/10 via-kwik-bg-surface to-kwik-amber/5 p-6 sm:p-8"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-kwik-orange/15 px-2.5 py-1 text-xs font-semibold text-kwik-orange">
              <LifeBuoy className="h-3.5 w-3.5" />
              Help & Support
            </div>
            <h1 className="mt-3 font-heading text-2xl font-bold text-kwik-dark sm:text-3xl">
              How can we help?
            </h1>
            <p className="mt-2 max-w-xl text-sm text-kwik-muted">
              Find quick answers in our FAQ, track an order, or reach out to our support team —
              we typically respond in under 24 hours.
            </p>
          </div>
          {/* Search */}
          <div className="sm:w-[320px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-kwik-muted" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the help center…"
                className="h-11 w-full rounded-xl border border-kwik-border-light bg-kwik-bg-surface pl-9 pr-3 text-sm text-kwik-dark placeholder:text-kwik-gray-light focus:border-kwik-orange focus:outline-none focus:ring-2 focus:ring-kwik-orange/20"
              />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Quick-help category grid */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TABS.filter((t) => t.key !== "ALL").map((t) => (
          <QuickHelpCard key={t.key} tab={t} onSelect={setTab} />
        ))}
      </div>

      {/* Two-column layout: FAQ + side rail */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* FAQ */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div className="sticky top-16 z-10 -mx-4 bg-kwik-bg-page/95 px-4 py-2 backdrop-blur sm:mx-0 sm:rounded-xl sm:px-3">
            <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {TABS.map((t) => {
                const Icon = TAB_ICON[t.key];
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => {
                      setTab(t.key);
                      setQuery("");
                    }}
                    aria-pressed={active}
                    className={cn(
                      "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-colors",
                      active
                        ? "bg-kwik-orange text-white shadow-sm shadow-kwik-orange/30"
                        : "border border-kwik-border-light bg-kwik-bg-surface text-kwik-muted hover:border-kwik-orange/30 hover:text-kwik-dark",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loading */}
          {isLoading && <PageLoading label="Loading FAQs…" />}

          {/* Error */}
          {isError && (
            <EmptyState
              variant="error"
              title="Couldn't load FAQs"
              description="Please try again in a moment."
              action={
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-kwik-orange px-5 text-sm font-semibold text-white transition hover:bg-kwik-orange-hover"
                >
                  Retry
                </button>
              }
            />
          )}

          {/* FAQ list */}
          {!isLoading && !isError && filtered.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs text-kwik-muted">
                {filtered.length} {filtered.length === 1 ? "question" : "questions"}
                {query && <> matching “{query}”</>}
              </p>
              <FAQAccordion items={filtered} />
            </div>
          )}

          {/* Empty */}
          {!isLoading && !isError && filtered.length === 0 && (
            <EmptyState
              variant="default"
              icon={<HelpCircle className="h-8 w-8" />}
              title={query ? "No matching questions" : "No FAQs in this category yet"}
              description={
                query
                  ? "Try a different search term, or browse another category."
                  : "Check back soon — we're adding more FAQs every week."
              }
              action={
                <button
                  type="button"
                  onClick={() => {
                    setTab("ALL");
                    setQuery("");
                  }}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-kwik-orange px-5 text-sm font-semibold text-white transition hover:bg-kwik-orange-hover"
                >
                  View all FAQs
                </button>
              }
            />
          )}
        </div>

        {/* Side rail: contact + order lookup */}
        <aside className="space-y-5">
          {/* Contact channels */}
          <div className="rounded-2xl border border-kwik-border-light bg-kwik-bg-surface p-5">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-kwik-orange" />
              <h3 className="font-heading text-sm font-semibold text-kwik-dark">Reach us directly</h3>
            </div>
            <div className="mt-3 space-y-2">
              <a
                href="mailto:support@kwikseller.com"
                className="flex items-center gap-3 rounded-xl border border-kwik-border-light bg-kwik-bg-page p-3 transition hover:border-kwik-orange/40"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-kwik-orange/10 text-kwik-orange">
                  <Mail className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-kwik-muted">Email</p>
                  <p className="truncate text-sm font-semibold text-kwik-dark">support@kwikseller.com</p>
                </div>
              </a>
              <a
                href="tel:+2347009459453"
                className="flex items-center gap-3 rounded-xl border border-kwik-border-light bg-kwik-bg-page p-3 transition hover:border-kwik-orange/40"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-kwik-orange/10 text-kwik-orange">
                  <Phone className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-kwik-muted">Phone (9am–6pm WAT)</p>
                  <p className="truncate text-sm font-semibold text-kwik-dark">+234 700 945 9453</p>
                </div>
              </a>
              <a
                href="https://wa.me/2347009459453"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-xl border border-kwik-border-light bg-kwik-bg-page p-3 transition hover:border-kwik-orange/40"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-kwik-green/10 text-kwik-green">
                  <MessageCircle className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-kwik-muted">WhatsApp</p>
                  <p className="truncate text-sm font-semibold text-kwik-dark">Chat with us</p>
                </div>
              </a>
            </div>
          </div>

          {/* Order lookup */}
          <OrderLookup />
        </aside>
      </div>

      {/* My tickets section */}
      <section className="mt-8">
        <div className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-kwik-orange" />
          <h2 className="font-heading text-lg font-bold text-kwik-dark">My support tickets</h2>
        </div>
        <p className="mt-1 text-sm text-kwik-muted">
          Track the status of your submitted tickets below.
        </p>
        <div className="mt-4">
          <MyTicketsList />
        </div>
      </section>

      {/* Contact form section */}
      <section className="mt-8">
        <div className="flex items-center gap-2">
          <Send className="h-5 w-5 text-kwik-orange" />
          <h2 className="font-heading text-lg font-bold text-kwik-dark">Submit a support ticket</h2>
        </div>
        <p className="mt-1 text-sm text-kwik-muted">
          Can&rsquo;t find what you&rsquo;re looking for? Send us a message and our team will get back to you.
        </p>
        <div className="mt-4">
          <ContactForm />
        </div>
      </section>
    </div>
  );
}

export default function HelpPage() {
  return (
    <AccountLayout>
      <HelpPageInner />
    </AccountLayout>
  );
}
