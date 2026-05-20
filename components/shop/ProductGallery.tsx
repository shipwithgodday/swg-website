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
      <div className="flex aspect-square items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        No image
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted ring-1 ring-border">
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
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              className={cn(
                'relative size-20 shrink-0 overflow-hidden rounded-xl ring-1 transition-all',
                i === active
                  ? 'ring-2 ring-primary'
                  : 'ring-border opacity-70 hover:opacity-100'
              )}>
              <Image
                src={img.url}
                alt=""
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
