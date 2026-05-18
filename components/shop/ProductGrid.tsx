import { ProductCard, type ProductCardData } from './ProductCard';

export function ProductGrid({
  products,
  empty = 'No products found.',
}: {
  products: ProductCardData[];
  empty?: string;
}) {
  if (products.length === 0) {
    return <p className="text-muted-foreground">{empty}</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.slug} product={p} />
      ))}
    </div>
  );
}
