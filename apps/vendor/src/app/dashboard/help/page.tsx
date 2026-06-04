"use client";
import React from "react";
import Link from "next/link";
import {
  Search,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Rocket,
  MessageSquare,
  FileText,
  PlayCircle,
  ArrowUp,
  BookOpen,
  Store,
  CreditCard,
  Truck,
  Wallet,
  User,
  Settings,
  AlertTriangle,
  Package,
  Tag,
  Clock,
  ShieldCheck,
  MapPin,
  Receipt,
  Banknote,
  Percent,
  Mail,
  Phone,
  Trash2,
  Timer,
  Globe,
  RefreshCw,
  Image,
  Download,
  XCircle,
} from "lucide-react";
import { AppButton, Skeleton } from "@kwikseller/ui";

// ==================== Types ====================

type CategoryId =
  | "getting-started"
  | "selling"
  | "orders-shipping"
  | "payments"
  | "account"
  | "store-settings"
  | "troubleshooting";

type ArticleLink = {
  label: string;
  href?: string;
  articleId?: string;
};

type HelpArticle = {
  id: string;
  category: CategoryId;
  title: string;
  content: string;
  links?: ArticleLink[];
};

type CategoryMeta = {
  id: CategoryId;
  label: string;
};

// ==================== Categories ====================

const CATEGORIES: CategoryMeta[] = [
  { id: "getting-started", label: "Getting Started" },
  { id: "selling", label: "Selling" },
  { id: "orders-shipping", label: "Orders & Shipping" },
  { id: "payments", label: "Payments" },
  { id: "account", label: "Account" },
  { id: "store-settings", label: "Store Settings" },
  { id: "troubleshooting", label: "Troubleshooting" },
];

// ==================== FAQ Data ====================

const ARTICLES: HelpArticle[] = [
  // ===== Getting Started (6 articles) =====
  {
    id: "setup-store",
    category: "getting-started",
    title: "How do I set up my store?",
    content: `Setting up your store on Kwikseller is quick and straightforward. Follow these steps to get your store live:

1. **Complete the Onboarding Flow** — When you first sign up, you will be guided through a 7-step onboarding wizard that covers your store name, category, appearance, payment setup, and more. You can access this at any time from your dashboard.

2. **Choose Your Store Category** — Select the category that best represents your business (Fashion, Electronics, Food, etc.). This helps customers find your products easily.

3. **Customize Your Store** — Pick your brand color, fonts, and upload a logo and banner. A well-branded store builds trust with customers.

4. **Add Your First Products** — List at least a few products so your store looks active when customers visit. Include clear images, descriptions, and competitive pricing.

5. **Set Up Payment** — Link your bank account to receive payments. Kwikseller uses an escrow system to protect both you and your customers.

6. **Verify Your Identity (KYC)** — Complete KYC verification to unlock higher transaction limits and build customer trust.

For a guided walkthrough, visit the onboarding page in your dashboard.`,
    links: [{ label: "Go to Onboarding", href: "/dashboard/onboarding" }],
  },
  {
    id: "what-is-pool",
    category: "getting-started",
    title: "What is the Pool?",
    content: `The Pool is a shared product sourcing system on Kwikseller that allows vendors to sell products without holding physical inventory. Here is how it works:

**How Pool Sourcing Works:**
- Products listed in the Pool are sourced from a centralized inventory managed by Kwikseller.
- As a vendor, you can add Pool products to your store at a price you choose (as long as it is above the minimum sale price).
- When a customer orders a Pool product from your store, the system automatically handles fulfillment from the central inventory.
- You earn the margin between your sale price and the source price.

**Benefits of Pool Sourcing:**
- No upfront inventory cost — start selling immediately.
- Wide product catalog without warehousing.
- Lower risk since you only pay when a sale is made.
- Easy to test new product categories before committing to stock.

**Setting Up Pool Sourcing:**
1. Navigate to Pool Sourcing in your dashboard sidebar.
2. Browse available Pool products.
3. Add products to your store with your desired markup.
4. Set your margins to ensure profitability after platform fees.

The Pool is a great way to grow your catalog and test new markets without financial risk.`,
    links: [{ label: "Go to Pool Sourcing", href: "/dashboard/pool" }],
  },
  {
    id: "subscriptions-work",
    category: "getting-started",
    title: "How do subscriptions work?",
    content: `Kwikseller offers flexible subscription plans that scale with your business. Each plan unlocks different features and limits.

**Available Plans:**
- **Starter (Free)** — Up to 10 products, 50 orders/month, basic analytics, email support.
- **Growth** — Up to 100 products, 500 orders/month, advanced analytics, priority support.
- **Pro** — Unlimited products and orders, full analytics suite, dedicated support.

**How Subscriptions Work:**
- Plans are billed monthly. Your billing cycle starts on the day you subscribe.
- You can upgrade or downgrade at any time. Upgrades take effect immediately with prorated billing. Downgrades take effect at the end of your current billing cycle.
- You can cancel at any time. Your plan remains active until the end of the billing period, then you revert to the Free Starter plan.
- All your data (products, orders, customer info) is preserved even if you downgrade.

**Managing Your Subscription:**
Visit the Subscriptions page in your dashboard to view your current plan, change plans, view billing history, or cancel your subscription.`,
    links: [{ label: "Go to Subscriptions", href: "/dashboard/subscriptions" }],
  },
  {
    id: "kyc-verification",
    category: "getting-started",
    title: "What is KYC verification?",
    content: `KYC (Know Your Customer) verification is an identity verification process required for vendors on Kwikseller. It helps build trust with customers and enables higher transaction limits.

**Why Verify Your Identity:**
- Higher transaction and withdrawal limits.
- Your store gets a verified badge, increasing customer confidence.
- Access to priority support and premium features.
- Compliance with financial regulations for payment processing.

**What You Need to Verify:**
1. **Business Type** — Individual, Sole Proprietorship, or Registered Business.
2. **Personal Information** — Full legal name, date of birth, phone number.
3. **ID Document** — National ID (NIN), International Passport, or Driver's License (front photo required, back for NIN/Driver's License).
4. **Business Documents** (for non-individual types) — Business registration certificate, utility bill or bank statement, Tax Identification Number.
5. **Face Verification** (optional) — A selfie photo for additional verification.

**The Verification Process:**
- Submit your documents through the KYC Verification page.
- Our team reviews submissions within 1-3 business days.
- If approved, your store status updates to Verified.
- If rejected, you will receive feedback and can resubmit corrected documents.

Verification is a one-time process. You cannot edit your submission while it is under review.`,
    links: [{ label: "Go to KYC Verification", href: "/dashboard/kyc" }],
  },
  {
    id: "receive-payments",
    category: "getting-started",
    title: "How do I receive payments?",
    content: `Kwikseller uses an escrow payment system to protect both vendors and customers. Here is how payments work:

**The Escrow Process:**
1. **Customer Pays** — When a customer places an order, the payment is held in escrow by Kwikseller. This protects the customer's money until the order is fulfilled.
2. **You Fulfill the Order** — Process, package, and hand off the order for delivery. Update the order status as it progresses.
3. **Delivery Confirmed** — Once the customer confirms receipt of the order (or after the auto-confirmation period), the escrow hold is released.
4. **Payment to Your Wallet** — The funds (minus platform fees) are deposited into your vendor wallet.
5. **Withdraw** — You can withdraw funds from your wallet to your linked bank account at any time.

**Payment Protection:**
- Funds are held securely until delivery is confirmed.
- If a dispute arises, the escrow hold remains until the dispute is resolved.
- Vendors are protected from fraudulent chargebacks.

**Supported Payment Methods:**
Customers can pay using Paystack, Flutterwave, or their Kwikseller wallet balance.

To set up your bank account for withdrawals, visit the Wallet page in your dashboard.`,
    links: [{ label: "Go to Wallet", href: "/dashboard/wallet" }],
  },
  {
    id: "navigating-dashboard",
    category: "getting-started",
    title: "Navigating the dashboard",
    content: `The Kwikseller vendor dashboard is your command center for managing your store. Here is an overview of all the sections:

**Main Navigation (Sidebar):**
- **Dashboard** — Your home base with sales metrics, recent orders, and quick actions.
- **Products** — Manage your product catalog: add, edit, archive, and organize products.
- **Orders** — View and manage all customer orders, filter by status, and access order details.
- **Inventory** — Track stock levels, set low-stock alerts, and manage warehouse inventory.
- **Pool Sourcing** — Browse and add Pool products to expand your catalog.
- **Storefront** — Preview and customize how your store appears to customers.
- **Analytics** — View sales data, revenue trends, product performance, and customer insights.
- **Wallet** — Check your balance, view transactions, and initiate withdrawals.
- **Deliveries** — Track deliveries, assign riders, and manage fulfillment.
- **Messages** — Communicate with customers about their orders.
- **Notifications** — View alerts for new orders, delivery updates, and system announcements.
- **Subscriptions** — Manage your subscription plan and billing.
- **KYC Verification** — Submit identity documents for verification.
- **Settings** — Manage account details, store preferences, and danger zone options.
- **Help** — Browse FAQs and contact support.

**Quick Actions:**
From the dashboard home, you can quickly add products, view orders, edit your store, and check messages using the Quick Actions grid.

Use the search bar at the top of the dashboard to quickly find products, orders, or pages.`,
  },

  // ===== Selling Products (6 articles) =====
  {
    id: "add-product",
    category: "selling",
    title: "How do I add a product?",
    content: `Adding a product to your Kwikseller store is simple. Follow these steps:

1. **Navigate to Products** — Click "Products" in the sidebar navigation.
2. **Click "Add Product"** — The button is at the top of the products page.
3. **Fill in Basic Information:**
   - **Product Name** — Clear, descriptive name (e.g., "Black Cotton T-Shirt - Size L").
   - **Description** — Detailed description including materials, dimensions, care instructions.
   - **Category** — Select the most relevant category from the dropdown.
   - **Tags** — Add relevant tags to help customers find your product (up to 10 tags).
4. **Set Pricing:**
   - **Base Price** — The selling price (required).
   - **Compare-at Price** — Original price before discount (shown as strikethrough).
   - **Cost Price** — Your actual cost for profit tracking.
5. **Set Inventory:**
   - **Stock Quantity** — How many units are available.
   - **Low Stock Threshold** — You will be alerted when stock drops below this number.
6. **Upload Images** — Add high-quality product photos. The first image is the main display image. You can upload up to 5 images per product (PNG/JPG, max 5MB each).
7. **Set Visibility** — Choose Active to publish immediately, or Draft to save without publishing.
8. **Click "Save"** — Your product is now live on your store.

For Pool products, you will also set a source price and minimum sale price.`,
    links: [{ label: "Go to Products", href: "/dashboard/products" }],
  },
  {
    id: "manage-inventory",
    category: "selling",
    title: "How do I manage inventory?",
    content: `Effective inventory management helps you avoid stockouts and overselling. Here is how to manage inventory on Kwikseller:

**Viewing Inventory:**
- Go to the Inventory page in your sidebar to see all products with their current stock levels.
- Products are sorted by stock level, with low-stock items highlighted.

**Setting Stock Levels:**
- When adding or editing a product, set the "Stock Quantity" field.
- For digital products, you can set unlimited stock or a license count.

**Low Stock Alerts:**
- Set a "Low Stock Threshold" for each product (e.g., 5 units).
- When stock drops below the threshold, you will receive a notification.
- The dashboard shows low stock alerts in the sidebar.

**Backorders:**
- Enable the "Allow Backorders" toggle to accept orders even when stock is zero.
- The product page will show "Available on backorder" to customers.
- Fulfill backorders as soon as you restock.

**Bulk Updates:**
- Use the Products page to quickly update stock for multiple products.
- Filter by low stock to prioritize restocking decisions.

**Best Practices:**
- Review inventory levels weekly.
- Set conservative low stock thresholds for best-selling items.
- Archive products that are permanently out of stock instead of leaving them at zero.`,
    links: [
      { label: "Go to Inventory", href: "/dashboard/inventory" },
      { label: "Go to Products", href: "/dashboard/products" },
    ],
  },
  {
    id: "product-variants",
    category: "selling",
    title: "What are product variants?",
    content: `Product variants allow you to offer different versions of the same product. For example, a t-shirt might come in multiple sizes, colors, or materials.

**Common Variant Types:**
- **Size** — S, M, L, XL, etc.
- **Color** — Black, White, Red, Blue, etc.
- **Material** — Cotton, Polyester, Leather, etc.
- **Weight/Volume** — 250ml, 500ml, 1L, etc.

**How Variants Work on Kwikseller:**
Each variant is created as a separate product listing linked to the same parent product. This allows you to:
- Set different prices for different variants (e.g., XL costs more than S).
- Track stock independently per variant.
- Display variant-specific images.

**Setting Up Variants:**
1. Create your main product with the base information.
2. For each variant, create a new product with a modified name (e.g., "Black Cotton T-Shirt - Size L").
3. Use the SKU field to create unique identifiers for each variant.
4. Set appropriate stock levels and pricing per variant.

**Customer Experience:**
Customers will see all available variants on the product page and can select their preferred option before adding to cart.`,
    links: [{ label: "Go to Products", href: "/dashboard/products" }],
  },
  {
    id: "pool-sourcing-setup",
    category: "selling",
    title: "How do I set up pool sourcing?",
    content: `Pool sourcing lets you sell products from a shared catalog without holding inventory. Here is how to get started:

**Step 1: Browse the Pool**
- Navigate to Pool Sourcing in your dashboard.
- Browse available products by category, price, or popularity.
- Each Pool product shows the source price (your cost) and suggested sale price.

**Step 2: Add Pool Products to Your Store**
- Click on a Pool product to view details.
- Set your desired sale price (must be above the minimum sale price).
- Choose how many units to list in your store.
- Add the product — it will appear in your regular product catalog.

**Step 3: Set Your Margins**
- Your profit margin = Sale Price - Source Price - Platform Fee.
- Use the margin calculator in the Pool product detail view to ensure profitability.
- Example: Source price is ₦2,000, you sell at ₦3,500, platform fee is 3.5%. Profit = ₦3,500 - ₦2,000 - ₦122.50 = ₦1,377.50.

**Step 4: Manage Pool Orders**
- When a customer orders a Pool product, the order appears in your Orders page just like regular orders.
- Fulfillment is handled automatically from the central inventory.
- Payment works through the same escrow system.

**Best Practices:**
- Start with a few Pool products to test what sells well in your market.
- Research competitor pricing to set competitive margins.
- Monitor your Pool product performance in Analytics.`,
    links: [{ label: "Go to Pool Sourcing", href: "/dashboard/pool" }],
  },
  {
    id: "mark-order-ready",
    category: "selling",
    title: "How do I mark an order as ready?",
    content: `Marking an order as ready is an important step in the fulfillment process. It tells the system that your product is packaged and ready for pickup by a delivery rider.

**The Order Status Workflow:**
1. **Pending** — New order placed, awaiting your confirmation.
2. **Confirmed** — You have accepted the order.
3. **Processing** — You are preparing the product.
4. **Ready** — Product is packaged and ready for pickup.
5. **In Transit** — Rider has picked up and is delivering.
6. **Delivered** — Customer has received the order.

**How to Mark as Ready:**
1. Go to the Orders page and find the order you want to update.
2. Click on the order to open the order detail view.
3. Click the "Mark as Ready" button.
4. The order status will change to "Ready" and a delivery rider will be assigned (or you can assign one manually).

**What Happens Next:**
- Once marked as ready, the customer receives a notification that their order is being prepared for delivery.
- A rider will be assigned to pick up the package.
- When the rider picks up the order, the status changes to "In Transit".

**Tips:**
- Make sure the product is properly packaged before marking as ready.
- Double-check the order contents against the packing slip.
- Update the status promptly to keep customers informed.`,
    links: [{ label: "Go to Orders", href: "/dashboard/orders" }],
  },
  {
    id: "handle-returns",
    category: "selling",
    title: "How do I handle returns?",
    content: `Handling returns professionally is important for maintaining customer trust. Here is the Kwikseller return process:

**Return Policy:**
- Kwikseller does not mandate a specific return policy, but we recommend having one.
- You can set your return window (e.g., 7 days, 14 days, 30 days) in your store settings.
- Clearly communicate your return policy on product pages and order confirmations.

**When a Customer Requests a Return:**
1. **Customer Initiates** — The customer submits a return request through their order page.
2. **Review the Request** — You will receive a notification. Review the reason and any photos provided.
3. **Accept or Reject** — You can accept the return (initiating the refund process) or reject it with a reason.
4. **If Accepted** — Provide return shipping instructions. The customer ships the item back.
5. **Inspect the Return** — Once received, inspect the item for damage and completeness.
6. **Process Refund** — If the return is valid, process the refund. The escrow hold will be released back to the customer.

**Refund Options:**
- Full refund to customer's original payment method.
- Store credit (encourages repeat purchases).

**Dispute Handling:**
If you and the customer disagree about a return, the dispute resolution team will mediate. Both parties can provide evidence, and Kwikseller will make a final decision.`,
    links: [{ label: "Go to Orders", href: "/dashboard/orders" }],
  },

  // ===== Orders & Shipping (6 articles) =====
  {
    id: "view-orders",
    category: "orders-shipping",
    title: "How do I view my orders?",
    content: `The Orders page is your central hub for managing all customer orders. Here is how to use it:

**Accessing Orders:**
Click "Orders" in the sidebar navigation to see all your orders.

**Order List Features:**
- **Search** — Find orders by order ID or customer name.
- **Filter by Status** — Filter orders by Pending, Confirmed, Processing, Ready, In Transit, Delivered, Cancelled, or Refunded.
- **Sort** — Sort by date (newest/oldest) or total amount.
- **Pagination** — Navigate through pages of orders (20 per page).

**Order Information:**
Each order in the list shows:
- Order ID (clickable to view details)
- Customer name
- Order status (color-coded)
- Total amount
- Order date
- Number of items

**Order Detail View:**
Click on an order to see:
- Full customer information (name, phone, email, delivery address)
- Order items with quantities and prices
- Payment status and method
- Activity timeline
- Delivery tracking progress
- Action buttons (Accept, Reject, Mark Ready, etc.)

**Tips:**
- Check the Orders page regularly for new orders.
- Use filters to quickly find orders that need attention (e.g., filter by "Pending" to see orders awaiting confirmation).`,
    links: [{ label: "Go to Orders", href: "/dashboard/orders" }],
  },
  {
    id: "delivery-stages",
    category: "orders-shipping",
    title: "What are the delivery stages?",
    content: `Understanding the delivery stages helps you track orders and keep customers informed. Here are the stages an order goes through:

**1. Pending**
The customer has placed an order and payment is held in escrow. The order awaits your confirmation. Review the order details and accept or reject it.

**2. Confirmed**
You have accepted the order. The customer receives a confirmation notification. Begin preparing the product.

**3. Processing**
You are actively preparing the product for shipment. Package the items, print any needed labels, and prepare for handoff.

**4. Ready (Awaiting Pickup)**
The product is packaged and ready for pickup by a delivery rider. A rider will be assigned automatically, or you can assign one manually.

**5. In Transit**
The rider has picked up the package and is on the way to the customer. The customer can track the delivery in real-time.

**6. Delivered**
The customer has received and confirmed the order. Payment is released from escrow to your wallet. If the customer does not confirm within the auto-confirmation window, the order is automatically marked as delivered.

**Cancelled / Refunded**
If an order is cancelled or refunded at any stage, the escrow hold is released back to the customer.

**Auto-Confirmation:**
If a customer does not confirm delivery within a set period after the rider marks it delivered, the system auto-confirms the delivery to release payments promptly.`,
  },
  {
    id: "assign-rider",
    category: "orders-shipping",
    title: "How do I assign a rider?",
    content: `Once an order is marked as "Ready," you need to assign a delivery rider to pick up and deliver the package.

**Automatic Assignment:**
By default, Kwikseller automatically assigns available riders to orders marked as ready. The system considers:
- Rider proximity to your location.
- Rider availability and current load.
- Delivery region settings.

**Manual Assignment:**
If you prefer to assign a specific rider or if auto-assignment is not available:

1. Open the order detail view for the order you want to assign.
2. Look for the "Assign Rider" section in the delivery tracking area.
3. Select a rider from the available riders list.
4. Click "Assign" to confirm.

**Rider Assignment Tips:**
- Assign riders promptly after marking orders as ready to minimize delivery delays.
- Check the rider's current location and workload before manual assignment.
- Ensure the delivery address is within the rider's coverage area.

**If a Rider is Unavailable:**
- If no riders are available, the order remains in "Ready" status until one becomes available.
- You can reassign riders if needed.
- If delivery is significantly delayed, proactively communicate with the customer.`,
    links: [{ label: "Go to Deliveries", href: "/dashboard/deliveries" }],
  },
  {
    id: "what-is-escrow",
    category: "orders-shipping",
    title: "What is escrow?",
    content: `Escrow is a payment protection system that holds funds securely until certain conditions are met. On Kwikseller, escrow protects both vendors and customers.

**How Escrow Works:**
1. **Payment Held** — When a customer pays for an order, the funds are held in an escrow account, not released to anyone immediately.
2. **Order Fulfilled** — You process and deliver the order to the customer.
3. **Delivery Confirmed** — The customer confirms receipt (or auto-confirmation triggers).
4. **Funds Released** — The escrow hold is released. The funds (minus platform fees) are deposited into your vendor wallet.

**Escrow Timing:**
- Funds are held from the moment of payment until delivery confirmation.
- If a dispute is opened, funds remain in escrow until the dispute is resolved.
- Typical release time is within 24 hours of delivery confirmation.

**Disputes and Escrow:**
- If a customer disputes an order, the escrow hold remains.
- Both parties provide evidence.
- Kwikseller resolves the dispute and releases funds accordingly.
- Vendors are protected from fraudulent disputes.

**Benefits for Vendors:**
- Guaranteed payment for delivered orders.
- Protection against fraudulent chargebacks.
- Transparent fee structure (fees are deducted at release time).

**Viewing Escrow:**
Check your Wallet page to see the total amount held in escrow (Pending Escrow) versus available for withdrawal.`,
    links: [
      { label: "Go to Wallet", href: "/dashboard/wallet" },
      { label: "Go to Orders", href: "/dashboard/orders" },
    ],
  },
  {
    id: "print-invoice",
    category: "orders-shipping",
    title: "How do I print an invoice?",
    content: `You can generate and print invoices for your orders directly from the order detail page.

**To Print an Invoice:**
1. Navigate to the Orders page and click on the order you want to invoice.
2. In the order detail view, look for the "Print Invoice" button.
3. Click the button to open the invoice in a new tab.
4. Use your browser's print function (Ctrl+P or Cmd+P) to print.

**What is on the Invoice:**
- Your store name and logo
- Order number and date
- Customer name and delivery address
- Itemized list of products with quantities and prices
- Subtotal, shipping, discounts, and total
- Payment method and status
- Your store contact information

**Invoice Uses:**
- Include with physical shipments as a packing slip.
- Keep for your own accounting and tax records.
- Provide to customers upon request.

**Note:**
Invoices are generated based on the order data at the time of viewing. If you make changes to the order (e.g., partial refund), the invoice will reflect the updated amounts.`,
    links: [{ label: "Go to Orders", href: "/dashboard/orders" }],
  },
  {
    id: "customer-disputes",
    category: "orders-shipping",
    title: "What happens when a customer disputes?",
    content: `Disputes arise when a customer is unhappy with an order and requests intervention. Here is how the dispute process works:

**How a Dispute is Initiated:**
- A customer can open a dispute from their order page.
- Common reasons: item not received, item damaged, wrong item delivered, significant quality issues.
- The customer may provide photos and a description of the issue.

**What Happens When a Dispute is Opened:**
1. **Escrow Hold** — The payment remains in escrow. It is not released to you or refunded to the customer until the dispute is resolved.
2. **Notification** — You receive a notification about the dispute with the reason and evidence.
3. **Your Response** — You have a limited time to respond with your side of the story and any evidence (photos, delivery confirmation, etc.).
4. **Resolution** — Kwikseller's dispute resolution team reviews both sides and makes a decision.

**Possible Outcomes:**
- **Vendor Favor** — Payment is released to your wallet as normal.
- **Customer Favor (Full Refund)** — Full payment is returned to the customer.
- **Customer Favor (Partial Refund)** — A portion is refunded, the rest released to you.
- **Return Required** — Customer returns the item, then receives a refund.

**Best Practices:**
- Respond to disputes promptly with clear evidence.
- Keep records of delivery confirmations and communications.
- Maintain high product quality to minimize disputes.
- Communicate proactively with customers if issues arise.`,
  },

  // ===== Payments (5 articles) =====
  {
    id: "withdraw-money",
    category: "payments",
    title: "How do I withdraw money?",
    content: `You can withdraw funds from your vendor wallet to your linked bank account at any time. Here is how:

**Prerequisites:**
- You must have a verified bank account linked to your Kwikseller account.
- Your wallet must have an available balance (funds not in escrow).
- KYC verification may be required for withdrawals above certain limits.

**How to Withdraw:**
1. Go to the Wallet page in your dashboard.
2. Check your "Available Balance" (funds ready for withdrawal).
3. Click the "Withdraw" button.
4. Enter the withdrawal amount (or click "Max" to withdraw all available funds).
5. Select your bank account from the dropdown.
6. Confirm the withdrawal request.

**Processing Time:**
- Withdrawals are typically processed within 1-3 business days.
- Weekend and holiday withdrawals may take longer.
- You will receive a notification when the withdrawal is complete.

**Withdrawal Limits:**
- Minimum withdrawal: ₦1,000
- Maximum withdrawal: Depends on your KYC verification level
  - Unverified: ₦50,000 per transaction
  - Verified: ₦500,000 per transaction
  - Premium: ₦2,000,000 per transaction

**Fees:**
- Bank transfer fees may apply depending on your bank.
- Kwikseller charges a small processing fee per withdrawal (shown before confirmation).`,
    links: [{ label: "Go to Wallet", href: "/dashboard/wallet" }],
  },
  {
    id: "transaction-fees",
    category: "payments",
    title: "What are the fees?",
    content: `Kwikseller charges transparent fees for using the platform. Here is a breakdown:

**Transaction Fees:**
- Applied to each successful sale.
- Deducted from the payment before it reaches your wallet.
- Rate: 3.5% of the transaction amount (may vary by subscription plan).

**Withdrawal Fees:**
- A small flat fee is charged per withdrawal to your bank account.
- The exact fee is displayed before you confirm a withdrawal.
- Bank transfer fees may also apply depending on your bank.

**Subscription Fees:**
- Starter plan: Free
- Growth plan: ₦2,500/month
- Pro plan: ₦7,500/month
- Billed monthly, auto-renewed unless cancelled.

**How Fees Are Calculated (Example):**
- Customer pays: ₦10,000
- Platform fee (3.5%): ₦350
- Amount to your wallet: ₦9,650
- Withdrawal fee: ₦100
- Amount to your bank: ₦9,550

**Fee Transparency:**
All fees are displayed clearly before any transaction. You can view a breakdown of fees on each order in your Wallet transaction history.

**Reducing Fees:**
- Higher subscription plans may include reduced transaction fees.
- Consolidate withdrawals to minimize withdrawal fees.`,
    links: [
      { label: "Go to Wallet", href: "/dashboard/wallet" },
      { label: "Go to Subscriptions", href: "/dashboard/subscriptions" },
    ],
  },
  {
    id: "change-bank-account",
    category: "payments",
    title: "How do I change my bank account?",
    content: `You can update your linked bank account for withdrawals at any time from the Wallet page.

**How to Change Your Bank Account:**
1. Go to the Wallet page in your dashboard.
2. Scroll to the "Bank Accounts" section.
3. If you want to add a new account:
   - Click "Add Bank Account."
   - Select your bank from the dropdown.
   - Enter your account number.
   - The system will verify the account name automatically.
   - Set it as your default if desired.
4. If you want to remove an old account:
   - Click the remove (trash) icon next to the account.
   - Confirm the removal.
5. To change your default withdrawal account:
   - Click "Set as Default" on the account you want to use.

**Important Notes:**
- You must have at least one verified bank account to make withdrawals.
- Account verification is instant using Paystack's account verification API.
- Make sure your account name matches your registered business name for smooth verification.
- Changing your bank account does not affect pending withdrawals.`,
    links: [{ label: "Go to Wallet", href: "/dashboard/wallet" }],
  },
  {
    id: "payment-on-hold",
    category: "payments",
    title: "Why is my payment on hold?",
    content: `Payments may be placed on hold for several reasons. Here are the most common:

**Escrow Hold (Normal):**
- All payments are held in escrow until delivery is confirmed.
- This is standard protection for both you and the customer.
- Payment is released within 24 hours of delivery confirmation.
- Check the "Pending Escrow" amount on your Wallet page.

**Dispute Hold:**
- If a customer opens a dispute, the payment is held until resolved.
- Respond promptly to disputes to speed up resolution.
- Typical resolution time: 3-7 business days.

**New Account Review:**
- New vendor accounts may have payments held for the first few transactions.
- This is a security measure that is lifted after building a positive history.
- Usually resolved after 3-5 successful deliveries.

**Account Verification Required:**
- Incomplete KYC verification may limit withdrawal amounts.
- Complete verification to unlock full access to your funds.
- Go to KYC Verification in your dashboard to check your status.

**Suspicious Activity Review:**
- Unusual transaction patterns may trigger a temporary hold.
- Contact support if you believe a hold was placed in error.
- Provide any requested documentation promptly.

**How to Check:**
Visit your Wallet page to see a breakdown of Available Balance vs. Pending Escrow. Each transaction shows its current status.`,
    links: [
      { label: "Go to Wallet", href: "/dashboard/wallet" },
      { label: "Go to KYC Verification", href: "/dashboard/kyc" },
    ],
  },
  {
    id: "payment-methods",
    category: "payments",
    title: "Payment methods supported",
    content: `Kwikseller supports multiple payment methods to give customers flexibility and increase conversion rates.

**Supported Payment Methods:**

**1. Paystack**
- Card payments (Visa, Mastercard, Verve)
- Bank transfers
- USSD payments
- One of the most popular payment gateways in Nigeria
- Instant payment confirmation

**2. Flutterwave**
- Card payments (Visa, Mastercard)
- Bank transfers
- Mobile money (where supported)
- Alternative payment gateway for broader coverage
- Instant payment confirmation

**3. Kwikseller Wallet**
- Customers can fund their Kwikseller wallet and pay directly.
- Faster checkout for returning customers.
- No gateway fees for wallet payments.

**How Customers Pay:**
At checkout, customers see all available payment methods and can choose their preferred option. Payment is confirmed instantly, and the order status updates automatically.

**For Vendors:**
- All payment methods go through the same escrow system.
- Funds are consolidated in your wallet regardless of payment method.
- You do not need to set up individual payment integrations.

**Adding New Payment Methods:**
Kwikseller continuously evaluates and adds new payment methods. Check the dashboard for updates on newly supported options.`,
  },

  // ===== Account Settings (5 articles) =====
  {
    id: "change-store-name",
    category: "account",
    title: "How do I change my store name?",
    content: `You can change your store name at any time from the Settings page. Here is how:

**Steps:**
1. Go to Settings in the sidebar navigation.
2. In the "Account Settings" section, find the "Store Name" field.
3. Enter your new store name.
4. The store URL/slug will update automatically based on the new name.
5. Click "Save Changes" to apply.

**Important Considerations:**
- Your store URL (kwikseller.com/store/your-slug) will change when you update your store name.
- Existing customers who have bookmarked your old URL will be redirected to the new one.
- Your store name appears on all customer-facing pages, invoices, and communications.
- Choose a name that is memorable, descriptive, and easy to spell.

**Best Practices:**
- Avoid overly long names.
- Do not use special characters or numbers unless they are part of your brand.
- Make sure the name is unique and not already used by another vendor.
- Consider SEO implications — include relevant keywords if possible.`,
    links: [{ label: "Go to Settings", href: "/dashboard/settings" }],
  },
  {
    id: "change-password",
    category: "account",
    title: "How do I change my password?",
    content: `Keeping your password secure is important for protecting your store. Here is how to change it:

**Steps:**
1. Go to Settings in the sidebar navigation.
2. Scroll to the "Account Settings" section.
3. Find the "Password" area.
4. Enter your current password.
5. Enter your new password (must be at least 8 characters).
6. Confirm your new password by typing it again.
7. Click "Change Password" to save.

**Password Requirements:**
- Minimum 8 characters.
- We recommend including uppercase letters, lowercase letters, numbers, and special characters.
- Avoid using common passwords or easily guessable information.

**After Changing Your Password:**
- You will be logged out of all active sessions.
- Log back in with your new password.
- Update any saved passwords in your browser or password manager.

**If You Forgot Your Password:**
- Use the "Forgot Password" link on the login page.
- Enter your email address to receive a password reset link.
- Follow the link to set a new password.`,
    links: [{ label: "Go to Settings", href: "/dashboard/settings" }],
  },
  {
    id: "update-phone",
    category: "account",
    title: "How do I update my phone number?",
    content: `You can update your phone number from the Settings page. Phone number verification is required for security.

**Steps:**
1. Go to Settings in the sidebar navigation.
2. In the "Account Settings" section, find the "Phone Number" field.
3. Enter your new phone number.
4. Click "Send Verification Code."
5. You will receive an OTP (One-Time Password) via SMS.
6. Enter the OTP in the verification field.
7. Once verified, click "Save Changes."

**Why Phone Verification:**
- Protects your account from unauthorized changes.
- Ensures you receive important notifications (order alerts, payment updates).
- Required for two-factor authentication features.

**Troubleshooting:**
- **Did not receive OTP?** Wait a few minutes, then click "Resend." Check that the phone number is correct.
- **OTP expired?** OTPs are valid for 5 minutes. Request a new one.
- **Wrong number?** Make sure you include the country code (+234 for Nigeria).`,
    links: [{ label: "Go to Settings", href: "/dashboard/settings" }],
  },
  {
    id: "close-store",
    category: "account",
    title: "How do I close my store?",
    content: `If you need to temporarily close your store, you can deactivate it from the Settings page.

**Deactivating Your Store:**
1. Go to Settings in the sidebar navigation.
2. Scroll to the "Danger Zone" section at the bottom.
3. Click the "Deactivate Store" button.
4. A confirmation modal will appear. Confirm that you want to deactivate.
5. Your store will be deactivated immediately.

**What Happens When You Deactivate:**
- Your store becomes invisible to customers — they cannot browse products or place orders.
- All existing orders remain active and must be fulfilled.
- Your wallet balance and transaction history are preserved.
- You can reactivate your store at any time by contacting support.
- Your subscription remains active and billing continues.

**Before Deactivating:**
- Fulfill all pending orders.
- Withdraw any available wallet balance.
- Notify customers who have active orders about the temporary closure.
- Consider archiving products instead if you plan to return.

**Reactivating:**
Contact Kwikseller support to reactivate your store. You will regain access to all your data and settings.`,
    links: [{ label: "Go to Settings", href: "/dashboard/settings" }],
  },
  {
    id: "delete-account",
    category: "account",
    title: "How do I delete my account?",
    content: `Account deletion is permanent and irreversible. Please read this carefully before proceeding.

**Before Deleting Your Account:**
- **Withdraw all funds** from your wallet. Deleted account balances cannot be recovered.
- **Fulfill all pending orders.** Unresolved orders may be escalated.
- **Export your data** (products, customer info, transaction history) if needed.
- **Cancel your subscription** to stop recurring billing.

**How to Delete Your Account:**
1. Go to Settings in the sidebar navigation.
2. Scroll to the "Danger Zone" section at the bottom.
3. Click the "Delete Account" button.
4. A confirmation modal will appear requiring you to type "DELETE MY ACCOUNT" to confirm.
5. Click "Delete Account" to proceed.

**What Gets Deleted:**
- Your store, products, and all store data.
- Your account information and profile.
- Transaction history and wallet records.
- KYC verification documents.
- Notifications and messages.

**What Happens to Active Orders:**
- Orders in progress will be flagged and may be refunded to customers.
- Customers with pending issues will be directed to support.

**Recovery:**
Account deletion is permanent. There is no undo. If you are unsure, consider deactivating your store instead (which is reversible).`,
    links: [{ label: "Go to Settings", href: "/dashboard/settings" }],
  },

  // ===== Store Settings (4 articles) =====
  {
    id: "processing-time",
    category: "store-settings",
    title: "How do I set my processing time?",
    content: `Processing time tells customers how long it takes you to prepare an order for delivery. Setting an accurate processing time helps manage customer expectations.

**Steps to Set Processing Time:**
1. Go to Settings in the sidebar navigation.
2. Navigate to the "Shipping/Delivery" section.
3. Find the "Processing Time" dropdown.
4. Select from the available options:
   - **Same Day** — Orders placed before a cutoff time ship the same day.
   - **1-2 Days** — Most orders ship within 48 hours.
   - **3-5 Days** — Standard processing for made-to-order items.
   - **5-7 Days** — For custom or specialized products.
5. Save your changes.

**How Processing Time Works:**
- The processing time is displayed to customers on the product page and at checkout.
- It starts when the order is confirmed (not when it is placed).
- Customers see an estimated delivery date based on processing time + delivery time.
- Late processing may result in negative reviews or disputes.

**Best Practices:**
- Set a processing time you can consistently meet.
- Build in buffer time for busy periods.
- If you need longer than 7 days, consider using "Made to Order" in the product description.
- Update processing time during peak seasons or sales.`,
    links: [{ label: "Go to Settings", href: "/dashboard/settings" }],
  },
  {
    id: "delivery-regions",
    category: "store-settings",
    title: "How do I configure delivery regions?",
    content: `Delivery regions determine where you can ship products. Configuring regions correctly prevents orders to areas you cannot serve.

**Steps to Configure Delivery Regions:**
1. Go to Settings in the sidebar navigation.
2. Navigate to the "Shipping/Delivery" section.
3. Find the "Delivery Regions" field.
4. Enter the regions, cities, or states you deliver to (one per line).
   - Example: Lagos, Abuja, Port Harcourt, Oyo
5. Save your changes.

**How It Works:**
- At checkout, the system checks if the customer's delivery address is within your configured regions.
- If the address is outside your regions, the customer cannot complete the order.
- This prevents orders to locations you cannot fulfill.

**Recommended Setup:**
- Start with your local area and expand as you grow.
- Include major cities and states where you have reliable delivery partners.
- Consider delivery costs when expanding regions.

**Nationwide Delivery:**
If you deliver nationwide, enter "All Regions" or leave the field blank (depending on the setting). Note that longer delivery distances may require more processing time.`,
    links: [{ label: "Go to Settings", href: "/dashboard/settings" }],
  },
  {
    id: "set-tax-rate",
    category: "store-settings",
    title: "How do I set tax rate?",
    content: `You can configure tax rates for your products in the Store Settings section.

**Steps to Set Tax Rate:**
1. Go to Settings in the sidebar navigation.
2. Navigate to the "Store Settings" section.
3. Find the "Tax Rate" field.
4. Enter your tax rate as a percentage (e.g., 7.5 for 7.5% VAT).
5. Toggle "Taxable" to enable or disable tax collection.
6. Save your changes.

**How Tax is Applied:**
- When enabled, the tax rate is applied to the product price at checkout.
- The tax amount is shown separately on the order and invoice.
- Tax is included in the total payment and released to your wallet.
- You are responsible for remitting collected taxes to the relevant tax authority.

**Tax Categories:**
- **VAT (Value Added Tax)** — Standard rate in Nigeria is 7.5%.
- Some products may be exempt from VAT (check current regulations).
- Digital products may have different tax treatment.

**Important Notes:**
- Tax regulations vary by jurisdiction. Consult a tax professional for guidance.
- Update your tax rate when regulations change.
- Keep records of tax collected for compliance purposes.`,
    links: [{ label: "Go to Settings", href: "/dashboard/settings" }],
  },
  {
    id: "auto-accept-orders",
    category: "store-settings",
    title: "How do I enable auto-accept orders?",
    content: `Auto-accept orders automatically confirms new orders so you do not have to manually accept each one. This speeds up fulfillment.

**How to Enable Auto-Accept:**
1. Go to Settings in the sidebar navigation.
2. Navigate to the "Store Settings" section.
3. Find the "Auto-Accept Orders" toggle.
4. Switch it on to enable.
5. Save your changes.

**How Auto-Accept Works:**
- When a new order is placed, it is automatically moved to "Confirmed" status.
- You skip the manual review and accept step.
- The order goes directly to "Processing" status.
- You still need to prepare, package, and mark the order as ready.

**Benefits:**
- Faster order processing and shorter delivery times.
- No risk of forgetting to accept orders.
- Better customer experience with quicker confirmation.

**When to Use Auto-Accept:**
- When you have reliable stock levels (no overselling risk).
- When your product catalog does not include custom or made-to-order items.
- When you can process orders quickly.

**When to Avoid:**
- If you sell limited-stock or unique items.
- If you need to review orders before committing.
- If you experience frequent fraudulent orders.

You can toggle auto-accept on and off at any time.`,
    links: [{ label: "Go to Settings", href: "/dashboard/settings" }],
  },

  // ===== Troubleshooting (6 articles) =====
  {
    id: "dashboard-no-data",
    category: "troubleshooting",
    title: "My dashboard shows no data",
    content: `If your dashboard appears empty or shows no data, here are steps to resolve it:

**1. Check Your Internet Connection**
- Ensure you have a stable internet connection.
- Try loading other websites to confirm connectivity.

**2. Clear Your Browser Cache**
- Open your browser settings.
- Clear cached data and cookies for the Kwikseller site.
- Reload the dashboard.

**3. Check Your Authentication**
- Log out and log back in.
- If the issue persists, try resetting your password.
- Ensure you are using the correct account credentials.

**4. Check the API Status**
- If the Kwikseller backend is experiencing downtime, the dashboard cannot load data.
- Try again in a few minutes.
- Check for any announcements about system maintenance.

**5. Try a Different Browser**
- Some browser extensions or settings can interfere with the dashboard.
- Try Chrome, Firefox, or Edge in incognito/private mode.

**6. Contact Support**
If none of the above resolves the issue, contact Kwikseller support with:
- Your browser and version.
- Screenshots of the issue.
- Steps you have already tried.
- Your vendor account email.`,
  },
  {
    id: "cannot-upload-images",
    category: "troubleshooting",
    title: "I can't upload images",
    content: `If you are having trouble uploading product images, check the following:

**File Format Requirements:**
- Supported formats: PNG and JPG/JPEG only.
- Unsupported formats: BMP, TIFF, GIF (animated), SVG, WebP.
- Convert your images to PNG or JPG before uploading.

**File Size Limits:**
- Maximum file size: 5MB per image.
- For large images, resize them before uploading:
  - Use an image editor or online tool.
  - Recommended size: 800x800px to 1200x1200px.
  - Compress to under 5MB while maintaining quality.

**Upload Errors:**
- **"File too large"** — Reduce the image size or resolution.
- **"Invalid format"** — Convert to PNG or JPG.
- **"Upload failed"** — Check your internet connection and try again.
- **"Network error"** — The upload timed out. Try a faster connection.

**Tips for Better Uploads:**
- Use high-quality, well-lit photos.
- White or light backgrounds work best for product images.
- Include multiple angles of the product.
- Avoid watermarks or heavy text overlays on product images.

**If the Issue Persists:**
Try a different browser, clear your cache, or contact support with the error message you received.`,
  },
  {
    id: "orders-not-appearing",
    category: "troubleshooting",
    title: "Orders aren't appearing",
    content: `If new orders are not showing up in your Orders page, try these solutions:

**1. Check Your Filters**
- Make sure you are not filtering by a specific status that excludes new orders.
- Click "Clear Filters" to show all orders.
- New orders appear with "Pending" status by default.

**2. Refresh the Page**
- Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R).
- Or reload the page normally and check again.

**3. Sync Delay**
- There may be a brief delay (up to 30 seconds) between a customer placing an order and it appearing in your dashboard.
- Wait a moment and refresh.

**4. Check Notification Settings**
- Ensure you have not disabled new order notifications.
- Go to Settings > Notification Preferences and verify "New order alerts" is enabled.

**5. Check Your Email**
- You should receive an email notification for each new order.
- If you receive emails but orders do not appear in the dashboard, there may be a sync issue.

**6. Try a Different Browser or Device**
- The issue may be browser-specific.
- Try accessing the dashboard from a different browser or your mobile device.

**7. Contact Support**
If orders are confirmed (customer received confirmation) but not showing in your dashboard, contact support immediately with the order details.`,
    links: [
      { label: "Go to Orders", href: "/dashboard/orders" },
      { label: "Go to Settings", href: "/dashboard/settings" },
    ],
  },
  {
    id: "payment-failed",
    category: "troubleshooting",
    title: "Payment failed",
    content: `If a payment failed (either as a vendor withdrawal or a customer order payment), here is what to do:

**Customer Payment Failed:**
- This is handled on the customer's end. They will see an error at checkout.
- Common causes: insufficient funds, expired card, network timeout, incorrect card details.
- The customer can retry with a different payment method.
- You do not need to take action — the order is not created until payment succeeds.

**Vendor Withdrawal Failed:**
- Check your bank account details in Wallet > Bank Accounts.
- Ensure the account is active and can receive transfers.
- Insufficient wallet balance: make sure you are not trying to withdraw more than your available balance.
- Bank maintenance: some banks have scheduled downtime. Try again later.
- Contact your bank to verify there are no issues with your account.

**Payment Gateway Timeout:**
- Paystack or Flutterwave may experience temporary outages.
- These are usually resolved within minutes.
- Try the transaction again after a short wait.

**If Your Withdrawal is Stuck:**
- Check the Wallet page for the withdrawal status.
- If it shows "Failed," retry the withdrawal.
- If it shows "Processing" for more than 3 business days, contact support.

**Always Verify:**
- Your bank account number is correct.
- Your account name matches the verified name.
- Your bank is supported for transfers.`,
    links: [{ label: "Go to Wallet", href: "/dashboard/wallet" }],
  },
  {
    id: "delivery-not-updating",
    category: "troubleshooting",
    title: "Delivery not updating",
    content: `If delivery tracking is not updating for an order, here are possible causes and solutions:

**Rider App Offline:**
- The delivery rider's app may be offline or have a poor connection.
- Delivery tracking updates require the rider's app to be active.
- The status will update once the rider's connection is restored.
- This is the most common cause of tracking delays.

**System Delay:**
- There may be a brief delay between a status change and it appearing in your dashboard.
- Allow up to 5 minutes for updates to reflect.

**Order Not Assigned:**
- If no rider has been assigned, the delivery status will not progress.
- Check the order detail to see if a rider is assigned.
- If not, you may need to manually assign one or wait for auto-assignment.

**Check the Order Status:**
- Open the order detail view.
- Review the delivery tracking progress bar.
- Check if there are any error indicators.

**Customer Communication:**
- If delivery is significantly delayed, proactively message the customer.
- Use the Messages feature to provide updates.
- Transparency builds trust even when things go wrong.

**Contact Support:**
If delivery has been stuck in the same status for over 24 hours with no update, contact support with the order ID and current status.`,
    links: [
      { label: "Go to Deliveries", href: "/dashboard/deliveries" },
      { label: "Go to Orders", href: "/dashboard/orders" },
    ],
  },
  {
    id: "email-verification-not-received",
    category: "troubleshooting",
    title: "Email verification not received",
    content: `If you are waiting for an email verification and it has not arrived, try these steps:

**1. Check Your Spam/Junk Folder**
- Verification emails sometimes end up in spam.
- Search your inbox for "Kwikseller" or "verification."
- Add noreply@kwikseller.com to your contacts or safe senders list.

**2. Wait a Few Minutes**
- Email delivery can take 1-5 minutes, sometimes longer during peak periods.
- Be patient before requesting a resend.

**3. Resend the Verification Email**
- Go to the page where you requested verification.
- Click "Resend Verification Email."
- Wait another 1-5 minutes.

**4. Check Your Email Address**
- Make sure the email address on your account is correct.
- Check for typos in the email address.
- Update the email if needed and request a new verification.

**5. Try a Different Email Provider**
- Some email providers (especially corporate or school emails) may block verification emails.
- Try using a personal email address (Gmail, Yahoo, etc.).

**6. Clear Browser Cache and Retry**
- Clear your browser cache and cookies.
- Log out and log back in.
- Request a new verification email.

**7. Contact Support**
If you have tried all the above and still cannot receive the verification email, contact support with:
- Your registered email address.
- The email provider you are using.
- Steps you have already tried.`,
    links: [{ label: "Go to Settings", href: "/dashboard/settings" }],
  },
];

// ==================== Quick Links ====================

const QUICK_LINKS = [
  {
    title: "Get Started",
    description: "Complete the onboarding wizard to set up your store.",
    icon: Rocket,
    href: "/dashboard/onboarding",
  },
  {
    title: "Contact Support",
    description: "Get help from our support team via email.",
    icon: MessageSquare,
    href: "mailto:support@kwikseller.com",
  },
  {
    title: "API Documentation",
    description: "Integrate Kwikseller with your existing tools.",
    icon: FileText,
    href: "#",
  },
  {
    title: "Video Tutorials",
    description: "Watch step-by-step guides for common tasks.",
    icon: PlayCircle,
    href: "#",
  },
];

// ==================== Helpers ====================

const STORAGE_KEY = "kwikseller_help_expanded";

function loadExpanded(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveExpanded(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

function getCategoryIcon(category: CategoryId) {
  switch (category) {
    case "getting-started":
      return Rocket;
    case "selling":
      return Package;
    case "orders-shipping":
      return Truck;
    case "payments":
      return Wallet;
    case "account":
      return User;
    case "store-settings":
      return Settings;
    case "troubleshooting":
      return AlertTriangle;
  }
}

function getCategoryColor(category: CategoryId) {
  switch (category) {
    case "getting-started":
      return "text-gray-700 bg-gray-100";
    case "selling":
      return "text-green-700 bg-green-50";
    case "orders-shipping":
      return "text-amber-700 bg-amber-50";
    case "payments":
      return "text-purple-700 bg-purple-50";
    case "account":
      return "text-blue-700 bg-blue-50";
    case "store-settings":
      return "text-orange-700 bg-orange-50";
    case "troubleshooting":
      return "text-red-700 bg-red-50";
  }
}

// ==================== Main Component ====================

export default function HelpPage() {
  // State
  const [activeCategory, setActiveCategory] = React.useState<CategoryId | "all">("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [expandedIds, setExpandedIds] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchInput, setSearchInput] = React.useState("");
  const faqRef = React.useRef<HTMLDivElement>(null);

  // Load expanded state from localStorage on mount
  React.useEffect(() => {
    setExpandedIds(loadExpanded());
    // Simulate skeleton loading
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim().toLowerCase());
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Save expanded state to localStorage
  const updateExpanded = React.useCallback((ids: string[]) => {
    setExpandedIds(ids);
    saveExpanded(ids);
  }, []);

  // Toggle article expansion
  const toggleArticle = React.useCallback(
    (id: string) => {
      if (expandedIds.includes(id)) {
        updateExpanded(expandedIds.filter((i) => i !== id));
      } else {
        updateExpanded([...expandedIds, id]);
      }
    },
    [expandedIds, updateExpanded]
  );

  // Scroll to an article by id
  const scrollToArticle = React.useCallback((articleId: string) => {
    const el = document.getElementById(`article-${articleId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      // Expand the article
      if (!expandedIds.includes(articleId)) {
        updateExpanded([...expandedIds, articleId]);
      }
    }
  }, [expandedIds, updateExpanded]);

  // Filter articles
  const filteredArticles = React.useMemo(() => {
    let articles = ARTICLES;

    // Category filter
    if (activeCategory !== "all") {
      articles = articles.filter((a) => a.category === activeCategory);
    }

    // Search filter
    if (searchQuery) {
      articles = articles.filter(
        (a) =>
          a.title.toLowerCase().includes(searchQuery) ||
          a.content.toLowerCase().includes(searchQuery)
      );
    }

    return articles;
  }, [activeCategory, searchQuery]);

  // Group filtered articles by category
  const groupedArticles = React.useMemo(() => {
    const groups: Record<CategoryId, HelpArticle[]> = {} as Record<CategoryId, HelpArticle[]>;
    for (const article of filteredArticles) {
      if (!groups[article.category]) {
        groups[article.category] = [];
      }
      groups[article.category].push(article);
    }
    return groups;
  }, [filteredArticles]);

  // Scroll to top (FAQ section)
  const scrollToTop = () => {
    if (faqRef.current) {
      faqRef.current.scrollIntoView({ behavior: "smooth" });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Total article count for search results
  const totalArticles = filteredArticles.length;

  return (
    <div className="space-y-8">
      {/* ==================== Section 1: Page Header ==================== */}
      <section>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Help Center
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Browse FAQs, search articles, and get support for your Kwikseller store.
          </p>
        </div>
      </section>

      {/* ==================== Section 2: Search Bar ==================== */}
      <section>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            strokeWidth={1.5}
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search help articles..."
            className="h-10 w-full rounded-md border border-gray-300 bg-white pl-10 pr-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-gray-500"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-4 w-4" strokeWidth={1.5} />
            </button>
          )}
        </div>
      </section>

      {/* ==================== Section 3: Quick Links ==================== */}
      <section>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4">
          {QUICK_LINKS.map((link) => {
            const IconComponent = link.icon;
            return (
              <Link
                key={link.title}
                href={link.href}
                className="group flex flex-col gap-3 border border-gray-200 p-4 transition hover:border-gray-300"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gray-100">
                  <IconComponent
                    className="h-4 w-4 text-gray-600"
                    strokeWidth={1.5}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {link.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">
                    {link.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ==================== Section 4: Category Navigation + FAQ ==================== */}
      <section ref={faqRef}>
        {/* Category pills - horizontal scrollable */}
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-2 pb-2 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                activeCategory === "all"
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" strokeWidth={1.5} />
              All
            </button>
            {CATEGORIES.map((cat) => {
              const CatIcon = getCategoryIcon(cat.id);
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                    isActive
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700"
                  }`}
                >
                  <CatIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search result info */}
        {searchQuery && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {totalArticles} {totalArticles === 1 ? "result" : "results"} for &ldquo;{searchInput}&rdquo;
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setActiveCategory("all");
              }}
              className="text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Articles */}
        {isLoading ? (
          <div className="mt-6 space-y-0 divide-y divide-gray-100">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="py-4">
                <Skeleton className="mb-2 h-4 w-56" />
                <Skeleton className="h-3 w-80" />
              </div>
            ))}
          </div>
        ) : totalArticles === 0 ? (
          <div className="mt-12 flex flex-col items-center justify-center">
            <HelpCircle className="h-10 w-10 text-gray-300" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-medium text-gray-500">
              No articles found
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {searchQuery
                ? "Try different keywords or clear your search."
                : "No articles in this category yet."}
            </p>
          </div>
        ) : activeCategory === "all" || searchQuery ? (
          // Grouped by category
          <div className="mt-6 space-y-8">
            {CATEGORIES.filter(
              (cat) => groupedArticles[cat.id] && groupedArticles[cat.id].length > 0
            ).map((cat) => (
              <div key={cat.id}>
                {/* Category heading */}
                <div className="flex items-center gap-2 pb-3">
                  <CatIconComponent catId={cat.id} />
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    {cat.label}
                  </h3>
                  <span className="text-xs text-gray-400">
                    ({groupedArticles[cat.id].length})
                  </span>
                </div>
                {/* Articles list */}
                <div className="divide-y divide-gray-100 border-t border-gray-100">
                  {groupedArticles[cat.id].map((article) => (
                    <ArticleItem
                      key={article.id}
                      article={article}
                      isExpanded={expandedIds.includes(article.id)}
                      onToggle={() => toggleArticle(article.id)}
                      onNavigate={scrollToArticle}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Single category view
          <div className="mt-6">
            <div className="divide-y divide-gray-100 border-t border-gray-100">
              {(groupedArticles[activeCategory] || []).map((article) => (
                <ArticleItem
                  key={article.id}
                  article={article}
                  isExpanded={expandedIds.includes(article.id)}
                  onToggle={() => toggleArticle(article.id)}
                  onNavigate={scrollToArticle}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ==================== Section 5: Contact Support ==================== */}
      <section className="border-t border-gray-100 pt-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-lg">
            <h2 className="text-lg font-semibold text-foreground">
              Still need help?
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Could not find what you were looking for? Our support team is here to
              help. We typically respond within 24 hours.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <a href="mailto:support@kwikseller.com">
              <AppButton variant="primary" size="sm">
                <Mail className="h-4 w-4" strokeWidth={1.5} />
                Contact Support
              </AppButton>
            </a>
            <AppButton variant="secondary" size="sm" onClick={scrollToTop}>
              <ArrowUp className="h-4 w-4" strokeWidth={1.5} />
              Browse FAQs
            </AppButton>
          </div>
        </div>
      </section>
    </div>
  );
}

// ==================== Sub-components ====================

function CatIconComponent({ catId }: { catId: CategoryId }) {
  const Icon = getCategoryIcon(catId);
  const colorClass = getCategoryColor(catId);
  return (
    <div className={`flex h-6 w-6 items-center justify-center rounded-md ${colorClass}`}>
      <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
    </div>
  );
}

function ArticleItem({
  article,
  isExpanded,
  onToggle,
  onNavigate,
}: {
  article: HelpArticle;
  isExpanded: boolean;
  onToggle: () => void;
  onNavigate: (articleId: string) => void;
}) {
  return (
    <div id={`article-${article.id}`} className="scroll-mt-4">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 py-4 text-left transition"
        aria-expanded={isExpanded}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">{article.title}</p>
        </div>
        {isExpanded ? (
          <ChevronUp className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" strokeWidth={1.5} />
        ) : (
          <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" strokeWidth={1.5} />
        )}
      </button>

      {isExpanded && (
        <div className="pb-5">
          <div className="prose-content text-sm leading-relaxed text-gray-600">
            {article.content.split("\n\n").map((paragraph, idx) => (
              <React.Fragment key={idx}>
                {paragraph.split("\n").map((line, lineIdx) => {
                  // Check for bold text pattern **text**
                  const parts = line.split(/(\*\*[^*]+\*\*)/g);
                  return (
                    <React.Fragment key={lineIdx}>
                      {lineIdx > 0 && <br />}
                      {parts.map((part, partIdx) => {
                        if (part.startsWith("**") && part.endsWith("**")) {
                          return (
                            <strong key={partIdx} className="font-semibold text-gray-800">
                              {part.slice(2, -2)}
                            </strong>
                          );
                        }
                        // Check for numbered list items like "1. **Text** — description"
                        const listItemMatch = part.match(/^(\d+)\.\s/);
                        if (listItemMatch && partIdx === 0 && lineIdx === 0 && paragraph.match(/^\d+\./)) {
                          return (
                            <span key={partIdx}>
                              <span className="font-medium text-gray-800">{listItemMatch[1]}.</span>
                              {part.slice(listItemMatch[0].length)}
                            </span>
                          );
                        }
                        return <span key={partIdx}>{part}</span>;
                      })}
                    </React.Fragment>
                  );
                })}
                {idx < article.content.split("\n\n").length - 1 && (
                  <br />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Links */}
          {article.links && article.links.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3 border-t border-gray-100 pt-3">
              {article.links.map((link) =>
                link.href ? (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:underline"
                  >
                    {link.label}
                    <span className="text-gray-400">&rarr;</span>
                  </Link>
                ) : link.articleId ? (
                  <button
                    key={link.label}
                    type="button"
                    onClick={() => onNavigate(link.articleId!)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:underline"
                  >
                    {link.label}
                    <span className="text-gray-400">&rarr;</span>
                  </button>
                ) : null
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
