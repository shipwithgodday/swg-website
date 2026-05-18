import 'server-only';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const CLOUDINARY_FOLDER = 'shop/products';

export interface UploadSignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}

/** Builds a signature for a browser-side signed upload. */
export function createUploadSignature(): UploadSignature {
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder: CLOUDINARY_FOLDER },
    process.env.CLOUDINARY_API_SECRET as string
  );
  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY as string,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME as string,
    folder: CLOUDINARY_FOLDER,
  };
}

/** Deletes an asset by its Cloudinary public_id. */
export async function destroyImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
