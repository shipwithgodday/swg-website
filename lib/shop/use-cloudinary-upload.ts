'use client';
import { useCallback, useState } from 'react';
import { getUploadSignature } from '@/app/actions/shop/images';

export interface UploadedImage {
  url: string;
  publicId: string;
}

/**
 * Uploads files straight to Cloudinary using a short-lived signed
 * signature from the server. The caller decides when (and whether) the
 * resulting asset is persisted to the database.
 */
export function useCloudinaryUpload() {
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(
    async (file: File): Promise<UploadedImage> => {
      setUploading(true);
      try {
        const sig = await getUploadSignature();
        const form = new FormData();
        form.append('file', file);
        form.append('api_key', sig.apiKey);
        form.append('timestamp', String(sig.timestamp));
        form.append('signature', sig.signature);
        form.append('folder', sig.folder);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
          { method: 'POST', body: form }
        );
        if (!res.ok) throw new Error('Cloudinary upload failed');

        const data = (await res.json()) as {
          secure_url: string;
          public_id: string;
        };
        return { url: data.secure_url, publicId: data.public_id };
      } finally {
        setUploading(false);
      }
    },
    []
  );

  return { upload, uploading };
}
