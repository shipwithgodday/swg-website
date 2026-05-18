'use client';
import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function ProductGallery({
  images,
  name,
}: {
  images: { id: string; url: string }[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl bg-muted text-muted-foreground">
        No image
      </div>
    );
  }
  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
        <Image
          src={images[active].url}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                'relative size-16 overflow-hidden rounded-md border',
                i === active ? 'border-primary' : 'border-border'
              )}>
              <Image
                src={img.url}
                alt=""
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
