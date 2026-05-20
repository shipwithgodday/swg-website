'use client';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { ImagePlus, Loader2, UploadCloud, X } from 'lucide-react';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
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

const ACCEPT = 'image/*';

/**
 * Controlled image dropzone for the product form. Uploads files to Cloudinary
 * immediately on drop or pick; persistence is the parent's job — staged
 * images only reach the database when the product is saved.
 */
export function ProductImageField({ images, onChange, onUploaded }: Props) {
  const { upload } = useCloudinaryUpload();
  const [dragging, setDragging] = useState(false);
  const [activeUploads, setActiveUploads] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  // Keep an always-current snapshot so parallel uploads append correctly even
  // if the controlled `images` prop hasn't repropagated yet.
  const imagesRef = useRef(images);
  imagesRef.current = images;

  function ingest(files: FileList | File[]) {
    const list = Array.from(files).filter((f) =>
      f.type.startsWith('image/')
    );
    if (list.length === 0) {
      toast.error('Only image files can be uploaded');
      return;
    }
    setActiveUploads((n) => n + list.length);
    list.forEach(async (file) => {
      try {
        const uploaded = await upload(file);
        onUploaded(uploaded.publicId);
        const next = [...imagesRef.current, uploaded];
        imagesRef.current = next;
        onChange(next);
      } catch {
        toast.error(`Couldn't upload ${file.name}`);
      } finally {
        setActiveUploads((n) => Math.max(0, n - 1));
      }
    });
  }

  function onDragEnter(e: React.DragEvent) {
    if (!e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    dragDepth.current += 1;
    setDragging(true);
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  }

  function onDragOver(e: React.DragEvent) {
    // Required for a drop to fire.
    if (e.dataTransfer.types.includes('Files')) e.preventDefault();
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    if (e.dataTransfer.files?.length) ingest(e.dataTransfer.files);
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) ingest(e.target.files);
    e.target.value = '';
  }

  function browse() {
    inputRef.current?.click();
  }

  function remove(publicId: string) {
    const next = images.filter((img) => img.publicId !== publicId);
    imagesRef.current = next;
    onChange(next);
  }

  const isEmpty = images.length === 0 && activeUploads === 0;

  return (
    <div className="space-y-2">
      <Label>Images</Label>

      <div
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          'relative rounded-2xl border-2 border-dashed bg-zinc-50/60 p-4 transition-colors',
          dragging
            ? 'border-primary bg-primary/5'
            : 'border-zinc-200 hover:border-zinc-300'
        )}>
        {isEmpty ? (
          <button
            type="button"
            onClick={browse}
            className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 py-10 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-white text-zinc-600 shadow-sm ring-1 ring-zinc-200">
              <UploadCloud className="size-5" />
            </span>
            <p className="text-sm font-semibold text-zinc-900">
              {dragging ? 'Drop to upload' : 'Drag images here'}
            </p>
            <p className="text-xs text-zinc-500">
              or click to browse · PNG, JPG, WebP
            </p>
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {images.map((img) => (
              <div
                key={img.publicId}
                className="group relative aspect-square overflow-hidden rounded-xl ring-1 ring-zinc-200">
                <Image
                  src={img.url}
                  alt=""
                  fill
                  sizes="120px"
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => remove(img.publicId)}
                  aria-label="Remove image"
                  className="absolute top-1.5 right-1.5 grid size-6 cursor-pointer place-items-center rounded-full bg-zinc-900/80 text-white opacity-0 transition-opacity hover:bg-zinc-900 group-hover:opacity-100 focus-visible:opacity-100">
                  <X className="size-3.5" />
                </button>
              </div>
            ))}

            {Array.from({ length: activeUploads }).map((_, i) => (
              <div
                key={`uploading-${i}`}
                className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl bg-white ring-1 ring-zinc-200">
                <Loader2 className="size-5 animate-spin text-zinc-400" />
                <span className="text-[11px] text-zinc-400">Uploading…</span>
              </div>
            ))}

            <button
              type="button"
              onClick={browse}
              aria-label="Add images"
              className={cn(
                'flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-zinc-500 transition-colors',
                dragging
                  ? 'border-primary bg-primary/5 text-zinc-900'
                  : 'border-zinc-300 hover:border-zinc-400 hover:bg-white'
              )}>
              <ImagePlus className="size-5" />
              <span className="text-xs font-medium">Add</span>
            </button>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          onChange={onPick}
          className="hidden"
        />
      </div>

      <p className="text-xs text-zinc-400">
        Tip: drop multiple files at once. The first image is used as the
        product thumbnail.
      </p>
    </div>
  );
}
