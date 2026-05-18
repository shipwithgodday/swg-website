'use client';
import { useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import {
  getUploadSignature,
  addProductImage,
  deleteProductImage,
} from '@/app/actions/shop/images';

interface Img {
  id: string;
  url: string;
}

export function ImageUploader({
  productId,
  images,
}: {
  productId: string;
  images: Img[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [, start] = useTransition();

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
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
      if (!res.ok) throw new Error('Upload failed');
      const data = (await res.json()) as {
        secure_url: string;
        public_id: string;
      };
      const saved = await addProductImage({
        productId,
        url: data.secure_url,
        publicId: data.public_id,
      });
      if (saved.ok) {
        toast.success('Image added');
        router.refresh();
      } else {
        toast.error(saved.error);
      }
    } catch {
      toast.error('Image upload failed');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  function remove(id: string) {
    start(async () => {
      const res = await deleteProductImage(id);
      if (res.ok) {
        toast.success('Image removed');
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-3">
      <Label>Images</Label>
      <div className="flex flex-wrap gap-3">
        {images.map((img) => (
          <div key={img.id} className="relative">
            <Image
              src={img.url}
              alt=""
              width={96}
              height={96}
              className="size-24 rounded-md object-cover"
            />
            <button
              type="button"
              onClick={() => remove(img.id)}
              className="absolute -right-2 -top-2 rounded-full bg-destructive px-2 text-xs text-white">
              ×
            </button>
          </div>
        ))}
      </div>
      <input
        type="file"
        accept="image/*"
        onChange={onFile}
        disabled={busy}
      />
      {busy && <p className="text-sm text-muted-foreground">Uploading…</p>}
    </div>
  );
}
