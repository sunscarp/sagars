export type ImageVariant = "thumb" | "medium" | "full";

export type UploadResult = {
  url: string;
  mediumUrl: string;
  thumbUrl: string;
  publicId?: string;
};

export type ReviewImageResult = {
  url: string;
  thumbUrl: string;
};

async function postToCloudinary(
  file: File,
  folder: string
): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);

  const res = await fetch("/api/upload", { method: "POST", body: form });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error || "Image upload failed");
  }

  return json as UploadResult;
}

export async function uploadProductImage(
  file: File,
  productId: string,
  slot: number
): Promise<UploadResult> {
  return postToCloudinary(file, `products/${productId}/image${slot}`);
}

export async function uploadReviewImage(
  file: File,
  reviewId: string,
  onProgress?: (fraction: number) => void
): Promise<ReviewImageResult> {
  onProgress?.(0.1);
  const result = await postToCloudinary(file, `reviews/${reviewId}`);
  onProgress?.(1);
  return { url: result.url, thumbUrl: result.thumbUrl };
}

export async function uploadCategoryImage(file: File): Promise<string> {
  const result = await postToCloudinary(file, "categories");
  return result.url;
}
