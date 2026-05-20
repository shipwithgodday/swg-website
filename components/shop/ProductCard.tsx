import Link from 'next/link';
import Image from 'next/image';
import { Sparkles } from 'lucide-react';
import { formatCedis } from '@/lib/shop/money';
import { displayPrice, inStock } from '@/lib/shop/queries';

export interface ProductCardData {
  slug: string;
  name: string;
  imageUrl: string | null;
  variants: { price: number; stockQuantity: number }[];
  /** When true, shows a small gold "Featured" badge. */
  featured?: boolean;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const available = inStock(product.variants);
  return (
    <Link
      href={`/shop/products/${product.slug}`}
      className="group block overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
      <div className="relative aspect-square overflow-hidden bg-muted">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No image
          </div>
        )}
        {product.featured && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-black shadow-sm">
            <Sparkles className="size-3" />
            Featured
          </span>
        )}
        {!available && (
          <span className="absolute top-3 right-3 rounded-full bg-black/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
            Sold out
          </span>
        )}
      </div>
      <div className="space-y-1 p-4">
        <p className="line-clamp-2 font-medium text-foreground">
          {product.name}
        </p>
        <p className="text-sm font-semibold text-foreground tabular-nums">
          {formatCedis(displayPrice(product.variants))}
        </p>
      </div>
    </Link>
  );
}
