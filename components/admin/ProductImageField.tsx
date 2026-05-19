'use client';
import Image from 'next/image';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { useCloudinaryUpload } from '@/lib/shop/use-cloudinary-upload';

export interface ProductImageRow {
  /** Present once the image is persisted in the database. */
  id?: string;
  url: string;
  publicId: string;
}

interface Props {
  images: ProductImageRow[];
  onChange: (next: ProductImageRow[]) => void;
  /** Fired after each successful Cloudinary upload, for orphan tracking. */
  onUploaded: (publicId: string) => void;
}

/**
 * Controlled image grid for the product form. Uploads files to
 * Cloudinary immediately but leaves persistence to the parent — staged
 * images only reach the database when the product is saved.
 */
export function ProductImageField({ images, onChange, onUploaded }: Props) {
  const { upload, uploading } = useCloudinaryUpload();

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const uploaded = await upload(file);
      onUploaded(uploaded.publicId);
      onChange([...images, uploaded]);
    } catch {
      toast.error('Image upload failed');
    }
  }

  function remove(publicId: string) {
    onChange(images.filter((img) => img.publicId !== publicId));
  }

  return (
    <div className="space-y-3">
      <Label>Images</Label>
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((img) => (
            <div key={img.publicId} className="relative">
              <Image
                src={img.url}
                alt=""
                width={96}
                height={96}
                className="size-24 rounded-md object-cover"
              />
              <button
                type="button"
                onClick={() => remove(img.publicId)}
                aria-label="Remove image"
                className="absolute -right-2 -top-2 rounded-full bg-destructive px-2 text-xs text-white">
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        onChange={onFile}
        disabled={uploading}
        className="text-sm"
      />
      {uploading && (
        <p className="text-sm text-muted-foreground">Uploading…</p>
      )}
    </div>
  );
}
