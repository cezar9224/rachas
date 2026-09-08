export type SupportedImage = {
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  bytes: Uint8Array;
};

export const MAX_PROFILE_IMAGE_BYTES = 2 * 1024 * 1024;

export async function validateImage(file: File, maxBytes: number, sizeError: string): Promise<SupportedImage | null> {
  if (file.size === 0) return null;
  if (file.size > maxBytes) throw new Error(sizeError);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mimeType = detectImage(bytes);
  if (!mimeType) throw new Error("Envie uma imagem JPEG, PNG ou WebP válida.");
  return { bytes, mimeType };
}

export function validateProfileImage(file: File) {
  return validateImage(file, MAX_PROFILE_IMAGE_BYTES, "A foto deve ter no máximo 2 MB.");
}

function detectImage(bytes: Uint8Array): SupportedImage["mimeType"] | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return "image/png";
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "image/webp";
  return null;
}
