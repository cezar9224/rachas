import "server-only";

import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

import { type SupportedImage, validateImage } from "@/modules/players/image-validation";

const MAX_PROFILE_IMAGE_BYTES = 512 * 1024;
const MAX_CHAMPION_IMAGE_BYTES = 2 * 1024 * 1024;

export async function uploadProfileImage(file: File, memberId: string): Promise<string | null> {
  return uploadImage(file, MAX_PROFILE_IMAGE_BYTES, "A foto deve ter no máximo 512 KB.", `rachas/profiles/${memberId}`);
}

export async function uploadChampionImage(file: File, matchId: string): Promise<string | null> {
  return uploadImage(file, MAX_CHAMPION_IMAGE_BYTES, "A foto dos campeões deve ter no máximo 2 MB.", `rachas/champions/${matchId}`);
}

async function uploadImage(file: File, maxBytes: number, sizeError: string, publicId: string): Promise<string | null> {
  const image = await validateImage(file, maxBytes, sizeError);
  if (!image) return null;

  const cloudinaryConfig = getCloudinaryConfig();
  if (!cloudinaryConfig) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET para enviar fotos.");
    }
    return saveLocalImage(image, publicId);
  }

  cloudinary.config({ ...cloudinaryConfig, secure: true });
  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { invalidate: true, overwrite: true, public_id: publicId, resource_type: "image" },
      (error, response) => error || !response ? reject(error ?? new Error("Upload sem resposta.")) : resolve(response),
    );
    stream.end(Buffer.from(image.bytes));
  });

  if (!result.secure_url) throw new Error("O serviço de imagens não retornou uma URL segura.");
  return result.secure_url;
}

function getCloudinaryConfig() {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;
  return cloud_name && api_key && api_secret ? { api_key, api_secret, cloud_name } : null;
}

async function saveLocalImage(image: SupportedImage, publicId: string) {
  const extension = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const)[image.mimeType];
  const relativePath = `${publicId}.${extension}`;
  const uploadRoot = path.join(process.cwd(), "public", "uploads");
  const absolutePath = path.join(uploadRoot, relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await Promise.all(["jpg", "png", "webp"]
    .filter((candidate) => candidate !== extension)
    .map((candidate) => rm(path.join(uploadRoot, `${publicId}.${candidate}`), { force: true })));
  await writeFile(absolutePath, image.bytes);
  return `/uploads/${relativePath.replaceAll("\\", "/")}`;
}
