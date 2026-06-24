"use client";
import React from "react";
import {
  MessageSquare,
  Search,
  Send,
  Paperclip,
  Phone,
  MoreHorizontal,
  ArrowLeft,
  X,
} from "lucide-react";
import { Skeleton, VendorPageHeader } from "@kwikseller/ui";
import { formatDate } from "@/lib/vendor-format";
import { motion } from "framer-motion";

// ==================== Types ====================

type Message = {
  id: string;
  text: string;
  sender: "vendor" | "customer";
  timestamp: string;
};

type Conversation = {
  id: string;
  customerName: string;
  initials: string;
  avatarColor: string;
  orderContext: string | null;
  orderId: string | null;
  lastMessage: string;
  lastTimestamp: string;
  unread: boolean;
  messages: Message[];
  isTyping: boolean;
};

type FilterTab = "all" | "unread" | "orders" | "support";

// ==================== Helpers ====================

const MESSAGES_KEY = "kwikseller_vendor_messages";

const AVATAR_COLORS = [
  "bg-gray-900",
  "bg-gray-700",
  "bg-gray-500",
  "bg-amber-600",
  "bg-green-700",
  "bg-red-700",
];

function generateId() {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

function getDateSeparator(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / 86400000
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return formatDate(dateStr);
}

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-NG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ==================== Demo Data ====================

function createDemoConversations(): Conversation[] {
  const now = new Date();
  const minutesAgo = (m: number) =>
    new Date(now.getTime() - m * 60000).toISOString();
  const hoursAgo = (h: number) =>
    new Date(now.getTime() - h * 3600000).toISOString();
  const daysAgo = (d: number) =>
    new Date(now.getTime() - d * 86400000).toISOString();

  return [
    {
      id: "conv_1",
      customerName: "Adebayo Johnson",
      initials: "AJ",
      avatarColor: AVATAR_COLORS[0],
      orderContext: "Order #ORD-1847",
      orderId: "ORD-1847",
      lastMessage: "Please, when will my order arrive? I need it urgently.",
      lastTimestamp: minutesAgo(5),
      unread: true,
      isTyping: false,
      messages: [
        {
          id: generateId(),
          text: "Hello! I placed an order for wireless earbuds 2 days ago.",
          sender: "customer",
          timestamp: hoursAgo(3),
        },
        {
          id: generateId(),
          text: "Hi Adebayo! Let me check your order status right away.",
          sender: "vendor",
          timestamp: hoursAgo(2),
        },
        {
          id: generateId(),
          text: "Your order has been prepared and is out for delivery. The rider should reach you within 2 hours.",
          sender: "vendor",
          timestamp: hoursAgo(2),
        },
        {
          id: generateId(),
          text: "Please, when will my order arrive? I need it urgently.",
          sender: "customer",
          timestamp: minutesAgo(5),
        },
      ],
    },
    {
      id: "conv_2",
      customerName: "Chidinma Okafor",
      initials: "CO",
      avatarColor: AVATAR_COLORS[1],
      orderContext: "Order #ORD-1923",
      orderId: "ORD-1923",
      lastMessage: "Thank you for the quick response. I appreciate it.",
      lastTimestamp: minutesAgo(32),
      unread: true,
      isTyping: false,
      messages: [
        {
          id: generateId(),
          text: "Hi, I received the wrong color for the dress I ordered.",
          sender: "customer",
          timestamp: hoursAgo(5),
        },
        {
          id: generateId(),
          text: "I am sorry about that. Could you send a photo of what you received?",
          sender: "vendor",
          timestamp: hoursAgo(4),
        },
        {
          id: generateId(),
          text: "I have attached the photo. I ordered the navy blue one.",
          sender: "customer",
          timestamp: hoursAgo(3),
        },
        {
          id: generateId(),
          text: "We apologize for the mix-up. We will send the correct color immediately at no extra charge. You can keep the other one.",
          sender: "vendor",
          timestamp: minutesAgo(35),
        },
        {
          id: generateId(),
          text: "Thank you for the quick response. I appreciate it.",
          sender: "customer",
          timestamp: minutesAgo(32),
        },
      ],
    },
    {
      id: "conv_3",
      customerName: "Emeka Nwankwo",
      initials: "EN",
      avatarColor: AVATAR_COLORS[2],
      orderContext: null,
      orderId: null,
      lastMessage: "Do you have this product available in size XL?",
      lastTimestamp: hoursAgo(2),
      unread: true,
      isTyping: false,
      messages: [
        {
          id: generateId(),
          text: "Hello, I saw your sneakers on the store. Do you have this product available in size XL?",
          sender: "customer",
          timestamp: hoursAgo(2),
        },
      ],
    },
    {
      id: "conv_4",
      customerName: "Fatima Bello",
      initials: "FB",
      avatarColor: AVATAR_COLORS[3],
      orderContext: "Order #ORD-1756",
      orderId: "ORD-1756",
      lastMessage: "The quality is excellent! Will order again soon.",
      lastTimestamp: daysAgo(1),
      unread: false,
      isTyping: false,
      messages: [
        {
          id: generateId(),
          text: "Good morning! I just received my order and wanted to say thank you.",
          sender: "customer",
          timestamp: daysAgo(1),
        },
        {
          id: generateId(),
          text: "The quality is excellent! Will order again soon.",
          sender: "customer",
          timestamp: daysAgo(1),
        },
        {
          id: generateId(),
          text: "Thank you so much Fatima! We look forward to serving you again.",
          sender: "vendor",
          timestamp: daysAgo(1),
        },
      ],
    },
    {
      id: "conv_5",
      customerName: "Ibrahim Yusuf",
      initials: "IY",
      avatarColor: AVATAR_COLORS[4],
      orderContext: null,
      orderId: null,
      lastMessage: "What is your return policy for electronics?",
      lastTimestamp: daysAgo(2),
      unread: false,
      isTyping: false,
      messages: [
        {
          id: generateId(),
          text: "What is your return policy for electronics?",
          sender: "customer",
          timestamp: daysAgo(2),
        },
        {
          id: generateId(),
          text: "Hi Ibrahim! We offer a 7-day return window for all electronics. The product must be in its original packaging and unused. Would you like more details?",
          sender: "vendor",
          timestamp: daysAgo(2),
        },
        {
          id: generateId(),
          text: "That works. Thanks for the info.",
          sender: "customer",
          timestamp: daysAgo(2),
        },
      ],
    },
    {
      id: "conv_6",
      customerName: "Blessing Adeyemi",
      initials: "BA",
      avatarColor: AVATAR_COLORS[5],
      orderContext: "Order #ORD-1604",
      orderId: "ORD-1604",
      lastMessage: "Can you confirm if the payment went through?",
      lastTimestamp: daysAgo(3),
      unread: false,
      isTyping: false,
      messages: [
        {
          id: generateId(),
          text: "Hello, I tried paying for my order but the app crashed.",
          sender: "customer",
          timestamp: daysAgo(3),
        },
        {
          id: generateId(),
          text: "Can you confirm if the payment went through?",
          sender: "customer",
          timestamp: daysAgo(3),
        },
        {
          id: generateId(),
          text: "Let me check your order now. Please share the order number.",
          sender: "vendor",
          timestamp: daysAgo(3),
        },
        {
          id: generateId(),
          text: "It is ORD-1604.",
          sender: "customer",
          timestamp: daysAgo(3),
        },
        {
          id: generateId(),
          text: "I can see your payment was successful. Your order is confirmed and being prepared.",
          sender: "vendor",
          timestamp: daysAgo(3),
        },
      ],
    },
  ];
}

function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveConversations(conversations: Conversation[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(conversations));
}

// ==================== Main Component ====================

export default function MessagesPage() {
  const [conversations, setConversations] =
    React.useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterTab, setFilterTab] = React.useState<FilterTab>("all");
  const [inputText, setInputText] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [showMobileChat, setShowMobileChat] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Load conversations on mount
  React.useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const { notificationsApi } = await import("@kwikseller/api-client");
        const response = await notificationsApi.list({ type: "message" });
        if (response?.data && Array.isArray(response.data) && response.data.length > 0) {
          // API returned data - transform into conversation format if possible
          const apiConvos = response.data.map((n: Record<string, unknown>) => ({
            id: (n.id as string) || generateId(),
            customerName: (n.title as string) || "Customer",
            initials: ((n.title as string) || "C")
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase(),
            avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
            orderContext: null,
            orderId: null,
            lastMessage: (n.message as string) || "",
            lastTimestamp: (n.createdAt as string) || new Date().toISOString(),
            unread: !(n.isRead as boolean),
            isTyping: false,
            messages: [
              {
                id: generateId(),
                text: (n.message as string) || "",
                sender: "customer" as const,
                timestamp: (n.createdAt as string) || new Date().toISOString(),
              },
            ],
          }));
          setConversations(apiConvos);
        } else {
          // Fallback to demo data
          const saved = loadConversations();
          setConversations(saved || createDemoConversations());
        }
      } catch {
        // API failed - use localStorage or demo data
        const saved = loadConversations();
        setConversations(saved || createDemoConversations());
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Persist conversations when they change
  React.useEffect(() => {
    if (conversations.length > 0 && !isLoading) {
      saveConversations(conversations);
    }
  }, [conversations, isLoading]);

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    if (selectedId && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedId, conversations]);

  // Derived state
  const unreadCount = conversations.filter((c) => c.unread).length;

  const filteredConversations = React.useMemo(() => {
    return conversations.filter((c) => {
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !c.customerName.toLowerCase().includes(q) &&
          !c.lastMessage.toLowerCase().includes(q) &&
          !(c.orderContext && c.orderContext.toLowerCase().includes(q))
        ) {
          return false;
        }
      }
      // Tab filter
      if (filterTab === "unread" && !c.unread) return false;
      if (filterTab === "orders" && !c.orderContext) return false;
      if (filterTab === "support" && c.orderContext) return false;
      return true;
    });
  }, [conversations, searchQuery, filterTab]);

  const selectedConversation = conversations.find((c) => c.id === selectedId) || null;

  // ==================== Handlers ====================

  const handleSelectConversation = (id: string) => {
    setSelectedId(id);
    setShowMobileChat(true);
    // Mark as read
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: false } : c))
    );
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
  };

  const handleSendMessage = () => {
    if (!inputText.trim() || !selectedId) return;

    const newMessage: Message = {
      id: generateId(),
      text: inputText.trim(),
      sender: "vendor",
      timestamp: new Date().toISOString(),
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedId
          ? {
              ...c,
              lastMessage: newMessage.text,
              lastTimestamp: newMessage.timestamp,
              messages: [...c.messages, newMessage],
            }
          : c
      )
    );

    setInputText("");
    inputRef.current?.focus();

    // Simulate customer typing and reply after a delay
    setTimeout(() => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedId ? { ...c, isTyping: true } : c
        )
      );
    }, 1500);

    setTimeout(() => {
      const replies = [
        "Thank you for the update!",
        "Okay, I understand now.",
        "That makes sense. Thank you.",
        "Appreciate your quick response.",
        "Noted. I will wait for the update.",
        "Great, thanks for letting me know.",
      ];
      const reply: Message = {
        id: generateId(),
        text: replies[Math.floor(Math.random() * replies.length)],
        sender: "customer",
        timestamp: new Date().toISOString(),
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedId
            ? {
                ...c,
                isTyping: false,
                lastMessage: reply.text,
                lastTimestamp: reply.timestamp,
                messages: [...c.messages, reply],
              }
            : c
        )
      );
    }, 4000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ==================== Render Helpers ====================

  const renderConversationItem = (conv: Conversation) => {
    const isActive = selectedId === conv.id;
    return (
      <button
        key={conv.id}
        type="button"
        onClick={() => handleSelectConversation(conv.id)}
        className={`w-full text-left transition-colors ${
          isActive
            ? "border-l-2 border-gray-900 bg-default-100"
            : "border-l-2 border-transparent hover:bg-default-100"
        }`}
      >
        <div className="flex items-start gap-3 px-4 py-3">
          {/* Avatar */}
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${conv.avatarColor}`}
          >
            {conv.initials}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium text-foreground">
                {conv.customerName}
              </p>
              <div className="flex shrink-0 items-center gap-1.5">
                {conv.unread && (
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                )}
                <span className="text-xs text-muted-foreground">
                  {getRelativeTime(conv.lastTimestamp)}
                </span>
              </div>
            </div>
            {conv.orderContext && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {conv.orderContext}
              </p>
            )}
            <p
              className={`mt-0.5 truncate text-xs ${
                conv.unread
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {conv.lastMessage}
            </p>
          </div>
        </div>
      </button>
    );
  };

  const renderMessagesList = () => {
    if (!selectedConversation) return null;

    const msgs = selectedConversation.messages;
    let lastSeparator = "";

    return msgs.map((msg) => {
      const separator = getDateSeparator(msg.timestamp);
      const showSeparator = separator !== lastSeparator;
      lastSeparator = separator;

      return (
        <React.Fragment key={msg.id}>
          {showSeparator && (
            <div className="flex items-center justify-center py-3">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {separator}
              </span>
            </div>
          )}
          <div
            className={`flex ${
              msg.sender === "vendor" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[75%] rounded-lg px-3 py-2 sm:max-w-[65%] ${
                msg.sender === "vendor"
                  ? "bg-gray-900 text-white"
                  : "bg-default-100 text-foreground"
              }`}
            >
              <p className="text-sm leading-relaxed">{msg.text}</p>
              <p
                className={`mt-1 text-right text-[10px] ${
                  msg.sender === "vendor"
                    ? "text-muted-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {formatMessageTime(msg.timestamp)}
              </p>
            </div>
          </div>
        </React.Fragment>
      );
    });
  };

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "unread", label: "Unread" },
    { key: "orders", label: "Orders" },
    { key: "support", label: "Support" },
  ];

  // ==================== Main Render ====================

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row"
    >
      {/* ==================== Left Panel: Conversation List ==================== */}
      <div
        className={`flex w-full flex-col border-b border-kwik-border lg:w-1/3 lg:flex-none lg:border-b-0 lg:border-r ${
          showMobileChat ? "hidden lg:flex" : "flex"
        }`}
      >
        {/* Header */}
        <div className="border-b border-kwik-border px-4 py-3">
          <VendorPageHeader
            title="Messages"
            actions={
              <>
                {unreadCount > 0 && (
                  <span className="text-xs font-medium text-muted-foreground">
                    {unreadCount} unread
                  </span>
                )}
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-default-100"
                  aria-label="Compose new message"
                >
                  <MessageSquare className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </>
            }
          />
        </div>

        {/* Search */}
        <div className="px-4 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-kwik-border bg-transparent py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-0 border-b border-kwik-border px-4">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilterTab(tab.key)}
              className={`border-b-2 px-3 py-2 text-xs font-medium transition ${
                filterTab === tab.key
                  ? "border-gray-900 text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="divide-y divide-kwik-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <MessageSquare
                className="h-10 w-10 text-muted-foreground/50"
                strokeWidth={1.5}
              />
              <p className="mt-3 text-sm font-medium text-muted-foreground">
                No messages yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {searchQuery
                  ? "No conversations match your search."
                  : "Customer conversations will appear here."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-kwik-border">
              {filteredConversations.map(renderConversationItem)}
            </div>
          )}
        </div>
      </div>

      {/* ==================== Right Panel: Chat Area ==================== */}
      <div
        className={`flex flex-1 flex-col ${
          showMobileChat ? "flex" : "hidden lg:flex"
        }`}
      >
        {selectedConversation ? (
          <>
            {/* Conversation Header */}
            <div className="flex items-center gap-3 border-b border-kwik-border px-4 py-3">
              {/* Mobile back button */}
              <button
                type="button"
                onClick={handleBackToList}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-default-100 lg:hidden"
                aria-label="Back to conversations"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
              </button>

              {/* Avatar */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white ${selectedConversation.avatarColor}`}
              >
                {selectedConversation.initials}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {selectedConversation.customerName}
                </p>
                {selectedConversation.orderContext && (
                  <p className="truncate text-xs text-muted-foreground">
                    Re: {selectedConversation.orderContext}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-default-100"
                  aria-label="Call customer"
                >
                  <Phone className="h-4 w-4" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-default-100"
                  aria-label="More options"
                >
                  <MoreHorizontal
                    className="h-4 w-4"
                    strokeWidth={1.5}
                  />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {renderMessagesList()}

              {/* Typing indicator */}
              {selectedConversation.isTyping && (
                <div className="flex justify-start">
                  <div className="rounded-lg bg-default-100 px-4 py-2.5">
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span>Customer is typing</span>
                      <span className="flex gap-0.5">
                        <span
                          className="inline-block h-1 w-1 animate-bounce rounded-full bg-gray-400"
                          style={{ animationDelay: "0ms" }}
                        />
                        <span
                          className="inline-block h-1 w-1 animate-bounce rounded-full bg-gray-400"
                          style={{ animationDelay: "150ms" }}
                        />
                        <span
                          className="inline-block h-1 w-1 animate-bounce rounded-full bg-gray-400"
                          style={{ animationDelay: "300ms" }}
                        />
                      </span>
                    </p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-kwik-border px-4 py-3">
              <div className="flex items-end gap-2">
                {/* Attachment button */}
                <button
                  type="button"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-kwik-border text-muted-foreground transition hover:border-accent hover:text-foreground"
                  aria-label="Attach file"
                >
                  <Paperclip className="h-4 w-4" strokeWidth={1.5} />
                </button>

                {/* Text input */}
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-w-0 flex-1 rounded-md border border-kwik-border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                />

                {/* Send button */}
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!inputText.trim()}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition ${
                    inputText.trim()
                      ? "bg-gray-900 text-white hover:bg-gray-800"
                      : "bg-default-100 text-muted-foreground"
                  }`}
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* No chat selected state */
          <div className="flex flex-1 flex-col items-center justify-center">
            <MessageSquare
              className="h-12 w-12 text-muted-foreground/50"
              strokeWidth={1.5}
            />
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              Select a conversation to start messaging
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Choose a conversation from the list to view messages.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
