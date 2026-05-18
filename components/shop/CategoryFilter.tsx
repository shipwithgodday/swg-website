import Link from 'next/link';
import { cn } from '@/lib/utils';

export function CategoryFilter({
  categories,
  activeSlug,
}: {
  categories: { id: string; name: string; slug: string }[];
  activeSlug?: string;
}) {
  const pill =
    'rounded-full border border-border px-4 py-1.5 text-sm transition-colors';
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/shop/products"
        className={cn(
          pill,
          !activeSlug ? 'bg-primary text-black' : 'hover:bg-accent'
        )}>
        All
      </Link>
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/shop/products?category=${c.slug}`}
          className={cn(
            pill,
            activeSlug === c.slug
              ? 'bg-primary text-black'
              : 'hover:bg-accent'
          )}>
          {c.name}
        </Link>
      ))}
    </div>
  );
}
