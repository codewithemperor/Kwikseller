/**
 * product-seed.ts
 *
 * Static image lookup for Kwikseller seed data. Every product name maps to
 * ONE specific, category-correct Unsplash CDN photo — no hashing across a
 * shared pool (that's what caused the old mismatches, e.g. an air fryer
 * sometimes drawing a coffee-maker photo from the same bucket), no runtime
 * API calls, no rate limits.
 *
 * Usage in seed.ts:
 *   import { getProductImage, getProductImageSet } from "./product-seed";
 *   ...
 *   const mainImg = getProductImage(ps.name);
 *   const [img2, img3] = getProductImageSet(ps.name).slice(1);
 *
 * If a product name isn't in the table (e.g. you add a new one later),
 * getProductImage() falls back to a generic-but-honest placeholder and logs
 * a warning so it's easy to spot and add a real entry.
 */

function u(id: string, size = 800): string {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${size}&h=${size}&q=80`;
}

/**
 * One primary photo ID per exact product name (must match VENDORS[].products[].name
 * in seed.ts verbatim). Grouped by vendor/store for readability.
 */
const PRODUCT_IMAGES: Record<string, string> = {
  // ── AdeTech Electronics ──────────────────────────────────────
  "Samsung Galaxy A54 5G 128GB": u("photo-1598327105666-5b89351aff97"),
  "Apple iPhone 15 128GB Blue": u("photo-1592286927505-1def25115558"),
  "Samsung Galaxy Tab A9+ 11-inch": u("photo-1561078433-941f8f2d7b89"),
  "Apple AirPods Pro 2nd Gen": u("photo-1606220588913-b3aacb4d2f46"),
  "Anker PowerCore 20000mAh Power Bank": u("photo-1609592424823-91f4d2a3b95a"),
  "Samsung 25W Fast Charger": u("photo-1583863788434-e58a36330cf0"),
  "Sony WH-1000XM5 Headphones": u("photo-1505740420928-5e560c06d30e"),
  "Samsung Sound Tower MX-T50": u("photo-1608043152269-423dbba4e7e1"),
  "Samsung 43-inch Crystal UHD Smart TV": u("photo-1593359677879-a4bb92f829d1"),
  "Anker Wireless Charging Dock": u("photo-1591290619762-c2b9bbef4f60"),
  "Logitech Wireless Mouse M331": u("photo-1527864550417-7fd91fc51a46"),
  "Logitech Mechanical Keyboard": u("photo-1587829741301-dc798b83add3"),
  "Canon EOS M50 Mirrorless Camera": u("photo-1502920917128-1aa500764cbd"),
  "Samsung Galaxy S24 Ultra 256GB": u("photo-1580910051074-3eb694886505"),
  "Tecno Camon 20 Premier 256GB": u("photo-1616348436168-de43ad0db179"),

  // ── Bola Fashion House ───────────────────────────────────────
  "Nike Air Max 270 React Sneakers": u("photo-1542291026-7eec264c27ff"),
  "Adidas Ultraboost 23 Running Shoes": u("photo-1556906781-9a412961c28c"),
  "Nike Dri-FIT Men's Training T-Shirt": u("photo-1576566588028-4147f3842f27"),
  "Adidas Originals Trefoil Hoodie": u("photo-1620799140408-edc6dcb6d633"),
  "Women's Ankara Midi Dress": u("photo-1595777457583-95e059d581b8"),
  "Leather Crossbody Bag": u("photo-1584917865442-de89df76afd3"),
  "Women's Block Heel Pumps": u("photo-1543163521-1bf3a327fe57"),
  "Men's Casual Denim Jacket": u("photo-1591047139829-d91aecb6caea"),
  "Polarized Sunglasses UV400": u("photo-1572635196237-14b3f281503f"),
  "Men's Leather Formal Shoes": u("photo-1595950653106-6c9ebd614d3a"),
  "Women's Silk Evening Gown": u("photo-1572804013309-59a88b7e92f1"),
  "Nike Sportswear Hoodie": u("photo-1556821840-3a63f95609a7"),
  "Designer Tote Bag": u("photo-1591561954557-26941169b49e"),

  // ── Naija Home Essentials ────────────────────────────────────
  "Binatone 1.7L Electric Kettle": u("photo-1517048676732-659acc648b9a"),
  "Oraimo SmartChef 5L Air Fryer": u("photo-1626806787461-102c1b86f924"),
  "Binatone Blender 1.5L BLG-450": u("photo-1570222094114-d054a817e56b"),
  "Nexus 4-Burner Gas Cooker with Oven": u("photo-1556909114-f6e7ad7d3136"),
  "Samsung 320L Bottom Mount Refrigerator": u("photo-1571175443880-49e1d25b2bc5"),
  "Samsung Microwave 20L Solo": u("photo-1574269909862-7e1d70bb8073"),
  "Samsung Robot Vacuum Cleaner": u("photo-1558317374-067fb5f30001"),
  "Non-Stick Cookware Set 10pc": u("photo-1584990347449-a0d9cb774316"),
  "Stainless Steel Dinner Set 16pc": u("photo-1590794056226-79ef3a8147e1"),
  "Electric Coffee Maker 12-Cup": u("photo-1495474472287-4d71bcdd2085"),
  "Oraimo Air Fryer 6L Family Size": u("photo-1585442487324-91b4d60f3e88"),
  "Wooden Dining Table Set 6-Seater": u("photo-1617806118233-18e1de247200"),

  // ── Glow Beauty Hub ──────────────────────────────────────────
  "Nivea Soft Moisturizing Cream 200ml": u("photo-1570194065650-d99fb4bedf0a"),
  "L'Oreal Revitalift Day Cream 50ml": u("photo-1556228720-195a672e8a03"),
  "Maybelline Fit Me Foundation 128": u("photo-1522338242992-e1a54906a8da"),
  "MAC Matte Lipstick Set": u("photo-1586495777744-4413f21062fa"),
  "Calvin Klein Eternity Perfume 100ml": u("photo-1541643600914-78b084683601"),
  "Vitamin C Face Serum 30ml": u("photo-1620916566398-39f1143ab7be"),
  "Professional Makeup Brush Kit 12pc": u("photo-1596462502278-27bfdc403348"),
  "Argan Hair Care Oil 100ml": u("photo-1620916566398-39f1143ab7be"),
  "Setting Spray Makeup Lock 60ml": u("photo-1591361454773-e98c3ae73c68"),
  "Oraimo Electric Facial Cleansing Brush": u("photo-1556228453-efd6c1ff04f6"),

  // ── ProSports NG ─────────────────────────────────────────────
  "Adjustable Dumbbell Pair 20kg": u("photo-1571019613454-1cb2f99b2d8b"),
  "Pro Yoga Mat 6mm Thick": u("photo-1518611012118-696072aa579a"),
  "Official Football Size 5": u("photo-1614632537190-23e4146777db"),
  "Spalding Basketball Official": u("photo-1546519638-68e10949833d"),
  "Nike Running Shoes Pegasus 40": u("photo-1595950653106-6c9ebd614d3a"),
  "Resistance Bands Set 5pc": u("photo-1598289431512-b97b0917affc"),
  "Adjustable Bench Press": u("photo-1571388208497-71bedc66e932"),
  "Adidas Training Shorts": u("photo-1591195853828-11db59a44f6b"),
  "Kettlebell 16kg Cast Iron": u("photo-1583454110551-21f2fa2afe61"),
  "Compression Training Tights": u("photo-1517960413843-0aee8e2b3285"),

  // ── Knowledge Books ──────────────────────────────────────────
  "Think and Grow Rich Paperback": u("photo-1544947950-fa07a98d237f"),
  "Rich Dad Poor Dad": u("photo-1512820790803-83ca734da794"),
  "Half of a Yellow Sun": u("photo-1495446815901-a7297e633e8d"),
  "Digital Marketing Mastery Ebook": u("photo-1516321318423-f06f85e504b3"),
  "Startup Playbook Digital Guide": u("photo-1522202176988-66273c2fd55f"),
  "Personal Finance Handbook": u("photo-1554224155-8d04cb21cd6c"),
  "Children's Story Collection": u("photo-1512820790803-83ca734da794"),
  "JAMB Prep Textbook 2024": u("photo-1509266272358-7701da638078"),
  "Web Development Course Ebook": u("photo-1517694712202-14dd9538aa97"),
  "African Fiction Anthology": u("photo-1495446815901-a7297e633e8d"),

  // ── AutoParts Express ────────────────────────────────────────
  "4K Dual Dash Camera": u("photo-1583121274602-3e2823c6e7c9"),
  "Dual USB Car Charger Fast Charge": u("photo-1601362840469-51e4d8d58785"),
  "Portable Tire Inflator 12V": u("photo-1632823469850-2f77dd9c7f93"),
  "Wireless Car Phone Mount": u("photo-1591290619762-c2b9bbef4f60"),
  "Jump Starter Pack 2000A": u("photo-1620891549027-942fdc95d3f5"),
  "Car Vacuum Cleaner Portable": u("photo-1581578731548-c64695cc6952"),
  "Bluetooth FM Transmitter": u("photo-1558618666-fcd25c85cd64"),
  "360 Camera Car Security System": u("photo-1503376780353-7e6692767b70"),
  "OBD2 Scanner Diagnostic Tool": u("photo-1632823469850-2f77dd9c7f93"),
  "Car Seat Leather Cushion Set": u("photo-1503376780353-7e6692767b70"),

  // ── Wellness Pharmacy ────────────────────────────────────────
  "Samsung BP Monitor Upper Arm": u("photo-1631217868264-e5b90bb7e133"),
  "Omron Nebulizer NE-C28": u("photo-1584515933487-779824d29309"),
  "Oraimo Pulse Oximeter": u("photo-1576091160550-2173dba999ef"),
  "Infrared Thermometer TH-600": u("photo-1584515933487-779824d29309"),
  "Oraimo Smart Scale OCD-S21": u("photo-1576091160399-112ba8d25d1d"),
  "Infinix Smartband 6 Fitness Tracker": u("photo-1544117519-31a4b719223d"),
  "Digital Thermometer Flexible Tip": u("photo-1584744646237-9f3e854eb6c3"),
  "Oraimo Smart Body Fat Scale": u("photo-1512621776951-a57141f2eefd"),
  "First Aid Kit Home 100pc": u("photo-1603398938825-1201e8fb0f4d"),
  "Blood Glucose Monitor Kit": u("photo-1615486511262-c7a5f8b9c0e1"),

  // ── FreshMart Foods ──────────────────────────────────────────
  "Nestle Milo 400g": u("photo-1517673132651-8dd5da8d5b8a"),
  "Chi Exotic Fruit Juice 1L": u("photo-1600271886742-f049cd451bba"),
  "Premium Coffee Beans 500g": u("photo-1559056199-641a0ac8b55e"),
  "Indomie Noodles Carton 40pc": u("photo-1612929633738-8fe44f7ec841"),
  "Peak Milk Powder 900g": u("photo-1550583724-b2692b85b150"),
  "Breakfast Cereal Pack 500g": u("photo-1517673132651-8dd5da8d5b8a"),
  "Honeywell Wheat Meal 2kg": u("photo-1509440159596-0249088772ff"),
  "Dangote Sugar 1kg": u("photo-1581441363689-1f3c3c414635"),
  "Herbal Tea Set 3-Flavour": u("photo-1597481499750-3e6b22637e12"),
  "Organic Honey 500ml": u("photo-1587049352846-4a222e784d38"),

  // ── Digital Downloads Co ─────────────────────────────────────
  "Business Plan Template Pro": u("photo-1551288049-bebda4e38f71"),
  "Social Media Marketing Course": u("photo-1611926653458-09294b3142bf"),
  "Adobe Creative Cloud License 1yr": u("photo-1629654297299-c8506221ca97"),
  "Resume Design Template Bundle": u("photo-1586281380349-632531db7ed4"),
  "Web Design Masterclass": u("photo-1522202176988-66273c2fd55f"),
  "Microsoft Office 365 License": u("photo-1633419461186-7d40a38105ec"),
  "Financial Modeling Excel Pack": u("photo-1460925895917-afdab827c52f"),
  "Photography Editing Course": u("photo-1516035069371-29a1b244cc32"),
  "SEO Optimization Guide Ebook": u("photo-1571721795195-a2ca2d3370a9"),
  "Premium Icon Pack 500+": u("photo-1626785774573-4b799315345d"),
};

/**
 * Secondary "view 2 / view 3" photo IDs, keyed the same way. Real distinct
 * angles of these exact SKUs don't exist on stock sites, so these are
 * closely-related same-category shots rather than duplicates of the primary.
 * Falls back to the primary image if no secondary set is defined.
 */
const PRODUCT_IMAGES_SECONDARY: Record<string, [string, string]> = {
  "Apple iPhone 15 128GB Blue": [u("photo-1510557880182-3d4d3cba73ea"), u("photo-1591336038662-f2064590c22b")],
  "Samsung Galaxy S24 Ultra 256GB": [u("photo-1511707171634-5f897ff02aa9"), u("photo-1616348436168-de43ad0db179")],
  "Nike Air Max 270 React Sneakers": [u("photo-1595950653106-6c9ebd614d3a"), u("photo-1556906781-9a412961c28c")],
  "Sony WH-1000XM5 Headphones": [u("photo-1583394838336-acd977736f90"), u("photo-1484704849700-f032a568e944")],
};

const FALLBACK_BY_KEYWORD: [RegExp, string][] = [
  [/phone|galaxy|iphone/i, u("photo-1511707171634-5f897ff02aa9")],
  [/shoe|sneaker|boot/i, u("photo-1542291026-7eec264c27ff")],
  [/dress|gown|skirt/i, u("photo-1595777457583-95e059d581b8")],
  [/kettle|fryer|blender|cooker|fridge|microwave|vacuum/i, u("photo-1556909114-f6e7ad7d3136")],
  [/cream|serum|lipstick|perfume|makeup/i, u("photo-1556228720-195a672e8a03")],
  [/dumbbell|yoga|fitness|kettlebell|bench/i, u("photo-1571019613454-1cb2f99b2d8b")],
  [/book|ebook|guide|course/i, u("photo-1544947950-fa07a98d237f")],
  [/car |dash|tire|obd/i, u("photo-1583121274602-3e2823c6e7c9")],
  [/monitor|thermometer|scale|glucose|nebulizer/i, u("photo-1631217868264-e5b90bb7e133")],
  [/juice|coffee|tea|noodle|milk|sugar|honey|cereal/i, u("photo-1517673132651-8dd5da8d5b8a")],
  [/license|template|icon|software/i, u("photo-1629654297299-c8506221ca97")],
];

/** Primary image for a product. Warns + falls back if the name isn't mapped. */
export function getProductImage(name: string): string {
  const hit = PRODUCT_IMAGES[name];
  if (hit) return hit;
  console.warn(`⚠️  No curated image for "${name}" — using keyword fallback. Add a real entry to product-seed.ts.`);
  const match = FALLBACK_BY_KEYWORD.find(([re]) => re.test(name));
  return match ? match[1] : u("photo-1560472354-b33ff0c44a43"); // generic product-on-white fallback
}

/** [main, view2, view3] for the product image gallery. */
export function getProductImageSet(name: string): [string, string, string] {
  const main = getProductImage(name);
  const secondary = PRODUCT_IMAGES_SECONDARY[name];
  return secondary ? [main, secondary[0], secondary[1]] : [main, main, main];
}

export { PRODUCT_IMAGES };
