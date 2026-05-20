import Link from 'next/link';
import { cn } from '@/lib/utils';

export function CategoryFilter({
  categories,
  activeSlug,
  /** Where the "All" tab should link to. */
  allHref = '/shop/products',
}: {
  categories: { id: string; name: string; slug: string }[];
  activeSlug?: string;
  allHref?: string;
}) {
  const pill =
    'shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors';
  return (
    <div
      className="-mx-2 flex gap-2 overflow-x-auto px-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="navigation"
      aria-label="Categories">
      <Link
        href={allHref}
        className={cn(
          pill,
          !activeSlug
            ? 'border-primary bg-primary text-black'
            : 'border-border text-foreground hover:border-foreground/30 hover:bg-accent'
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
              ? 'border-primary bg-primary text-black'
              : 'border-border text-foreground hover:border-foreground/30 hover:bg-accent'
          )}>
          {c.name}
        </Link>
      ))}
    </div>
  );
}
