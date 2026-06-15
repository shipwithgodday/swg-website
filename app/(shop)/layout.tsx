/**
 * The marketing navbar is `position: fixed` and overlays the page, so shop
 * pages need top padding to clear it (the home/about pages do this via their
 * hero sections).
 *
 * `CartProvider` lives in the root layout so the navbar's cart drawer and
 * shop pages share the same cart state.
 */
export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="pt-24 md:pt-32">{children}</div>;
}
