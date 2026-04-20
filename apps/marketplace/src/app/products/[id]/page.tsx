import { notFound } from "next/navigation";
import { getMarketplaceProduct } from "@/data/marketplace-home";
import { ProductDetailPage } from "@/components/product/product-detail-page";

export default function ProductPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const product = getMarketplaceProduct("chair-2");
  console.log("Fetched product for ID:", id, product); // Debug log
  if (!product) {
    notFound();
  }

  return (
    <ProductDetailPage product={product} />
  );
}
