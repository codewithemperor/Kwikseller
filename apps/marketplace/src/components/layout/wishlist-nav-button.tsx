"use client";

import { useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@heroui/react";
import { useWishlistStore } from "@/stores";

interface WishlistNavButtonProps {
  onNavigateStart?: () => void;
}

export function WishlistNavButton({ onNavigateStart }: WishlistNavButtonProps) {
  const router = useRouter();
  const wishlistCount = useWishlistStore((state) => state.itemCount);
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Button
      isIconOnly
      variant="ghost"
      size="sm"
      onPress={() => {
        onNavigateStart?.();
        router.push("/wishlist");
      }}
      aria-label="Wishlist"
      className="relative text-kwik-gray-light"
    >
      <Heart className="h-4 w-4" />
      {mounted && wishlistCount > 0 ? (
        <motion.span
          key={wishlistCount}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-kwik-red text-[10px] font-bold text-white shadow-sm"
        >
          {wishlistCount > 9 ? "9+" : wishlistCount}
        </motion.span>
      ) : null}
    </Button>
  );
}
