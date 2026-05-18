import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { formatCedis } from '@/lib/shop/money';
import { displayPrice, inStock } from '@/lib/shop/queries';

export interface ProductCardData {
  slug: string;
  name: string;
  imageUrl: string | null;
  variants: { price: number; stockQuantity: number }[];
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const available = inStock(product.variants);
  return (
    <Link
      href={`/shop/products/${product.slug}`}
      className="group block overflow-hidden rounded-xl border border-border transition-shadow hover:shadow-md">
      <div className="relative aspect-square bg-muted">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No image
          </div>
        )}
        {!available && (
          <Badge variant="secondary" className="absolute left-2 top-2">
            Out of stock
          </Badge>
        )}
      </div>
      <div className="p-4">
        <p className="font-medium">{product.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatCedis(displayPrice(product.variants))}
        </p>
      </div>
    </Link>
  );
}
