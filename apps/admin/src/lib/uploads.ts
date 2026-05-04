import type { ImageUploadValue } from "@/components/ui";
import { uploadApi, type UploadAsset } from "@/lib/api";

export type UploadKind = "general" | "product" | "banner";

export interface UploadedImageBatch {
  urls: string[];
  uploadedAssets: UploadAsset[];
}

export async function uploadQueuedImages(
  images: ImageUploadValue[],
  kind: UploadKind,
): Promise<UploadedImageBatch> {
  const urls: string[] = [];
  const uploadedAssets: UploadAsset[] = [];

  for (const image of images) {
    if (!image.file) {
      urls.push(image.url);
      continue;
    }

    const response = await uploadApi.upload(image.file, kind);
    const asset = response.data;
    uploadedAssets.push(asset);
    urls.push(asset.secureUrl || asset.url);
  }

  return { urls, uploadedAssets };
}

export async function rollbackUploadedImages(
  uploadedAssets: UploadAsset[],
): Promise<void> {
  await Promise.allSettled(
    uploadedAssets.map((asset) => uploadApi.delete(asset.publicId)),
  );
}
