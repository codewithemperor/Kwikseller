"use client";

import React, { useState } from "react";
import { ArrowRight, CheckCircle, Mail } from "lucide-react";
import { Button, Input } from "@heroui/react";
import { kwikToast } from "@kwikseller/utils";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email || !email.includes("@")) {
      kwikToast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setIsSuccess(true);
    setEmail("");
    kwikToast.success("You have been subscribed successfully");

    setTimeout(() => setIsSuccess(false), 4000);
  };

  return (
    <section className="bg-[#f5f5f5] py-8 sm:py-10">
      <div className="container mx-auto px-0 md:px-4 ">
        <div className="mx-auto max-w-4xl rounded-[32px] border border-[#e5e7eb] bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff7ed] text-[#ea580c]">
                <Mail className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-[#111827]">
                Get updates on deals and product drops
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#6b7280]">
                Subscribe for marketplace offers, seller tips and curated
                product recommendations.
              </p>
            </div>

            {isSuccess ? (
              <div className="rounded-2xl bg-[#f9fafb] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#166534] text-white">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#111827]">
                      Subscription confirmed
                    </p>
                    <p className="text-sm text-[#6b7280]">
                      Check your inbox for the welcome message.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSubmitting}
                  className="rounded-2xl"
                />
                <Button
                  type="submit"
                  variant="primary"
                  className="h-12 w-full rounded-xl bg-[#ea580c] font-semibold text-white hover:bg-[#c2410c]"
                  isDisabled={isSubmitting}
                >
                  {isSubmitting ? "Subscribing..." : "Subscribe"}
                  {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
                <p className="text-xs text-[#9ca3af]">
                  No spam. Only useful marketplace updates.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
