# Shop Admin Redesign — Design Spec

**Date:** 2026-05-19
**Branch:** feature/shop
**Status:** Approved for planning

## Problem

The shop admin (`/admin/*`) looks plain and inconsistent because it reuses
`components/ui/{input,select,button}`, which were hard-styled for the
**storefront**: dark theme, bottom-only borders, white text, a `#00365D` blue
`Select` popover, and gold pill buttons with `hover:scale-105`. The admin
`layout.tsx` even patches around this (`[&_[data-slot=input]]:text-foreground`).
Symptoms: bottom-border-only inputs, a blue dropdown, an orange sidebar
(`--sidebar-primary: #fe6805`), a flat dashboard, weak order filters, and
lowercase status text in tables.

## Goals

- Give the admin a modern, aesthetically pleasing identity of its own.
- Stop inheriting storefront component theming **without touching any
  storefront file**.
- Remove all orange. Light theme only.
- Overhaul the dashboard visually and functionally.
- Redesign the Orders filter bar; capitalize all status text on Orders and
  Products.
- Give every admin table an adjustable page size and a "Show all" option.
- Stay DRY; prefer shadcn primitives; follow React best practices.

## Non-Goals

- No storefront (`components/ui/*`, storefront pages) changes.
- No dark mode for the admin.
- No new auth, data model, or business logic beyond dashboard queries.

## Aesthetic Direction

**Dark sidebar + warm elevated content.**

- **Sidebar:** near-black charcoal (`zinc-950`), `zinc-400` idle labels, white
  hover. Active item is a **gold pill** (brand `--primary` `#e4bb25`) with
  `zinc-950` text. Gold diamond logo mark. Grouped nav with small section
  captions. A footer block (app/version or admin identity).
- **Content area:** warm off-white (`#faf9f7`) with a very subtle top radial
  gradient for depth — not a flat white slab.
- **Cards:** `rounded-2xl`, hairline border (`zinc-200/70`), soft layered
  shadow. KPI cards carry a restrained gold accent (top hairline or icon chip).
- **Type:** keep brand font Manrope; headings tighter tracking + heavier
  weight; **tabular-nums** for all money and metrics.
- **Gold is an accent, not a workhorse:** active nav, KPI accents, the single
  primary CTA per screen. Ink (`zinc-900`) carries default buttons and links.
- Motion: quiet. 150–250ms color/opacity transitions, staggered card reveal on
  dashboard load. No scale-on-hover.

## Architecture

### New admin UI primitives — `components/admin/ui/`

Fresh, canonical, **neutral** shadcn components, used only by the admin. The
storefront keeps `components/ui/*` untouched (some intentional duplication —
this is the accepted tradeoff for zero storefront risk).

| File | Notes |
|------|-------|
| `input.tsx` | All-round `border-input` border, white surface, `rounded-md`, neutral focus ring (not orange `--ring`). |
| `textarea.tsx` | Same treatment. |
| `select.tsx` | Bordered trigger; **white** `popover` content (removes `#00365D`). |
| `button.tsx` | `rounded-md`, `transition-colors` only (no scale). Variants: `default` = ink (`zinc-900`), `gold` = brand CTA (`bg-primary text-zinc-900`), `outline`, `ghost`, `destructive`. |
| `chart.tsx` | shadcn chart wrapper over `recharts` (new dependency). Admin-scoped. |
| `data-table.tsx` | Moved here from `components/ui/data-table.tsx` (admin-only consumer). |

Card, Table, Dialog, Sheet, Label, Checkbox, dropdown-menu, badge are already
neutral and are reused directly from `components/ui/*`.

### Shared admin building blocks

| Item | Location | Purpose |
|------|----------|---------|
| `titleCase`, `formatOrderStatus`, `formatProductStatus` | `lib/shop/status-format.ts` | One source of truth for capitalized status text (Orders + Products). |
| `rangeToSince(range)` | `lib/shop/date-range.ts` | Maps a range key to a start `Date`; shared by dashboard queries. |
| `StatusBadge` | `components/admin/StatusBadge.tsx` | Consistent ink/gold/destructive tone mapping; replaces ad-hoc badge logic in tables. Storefront's `OrderStatusBadge` stays as-is. |
| `AdminPageHeader` | `components/admin/AdminPageHeader.tsx` | Title + optional description + actions slot; used by every admin page. |
| `StatCard` | `components/admin/StatCard.tsx` (rebuilt) | New KPI card: label, value (tabular), delta vs. previous period, icon chip, gold accent. |
| `DateRangeTabs` | `components/admin/DateRangeTabs.tsx` | Client segmented control writing `?range=` to the URL. |
| `RevenueChart` | `components/admin/RevenueChart.tsx` | Client area chart of daily revenue via `chart.tsx`. |
| `TopProducts` | `components/admin/TopProducts.tsx` | Best-sellers panel for the active range. |

### Enhanced `DataTable`

`components/admin/ui/data-table.tsx` gains a toolbar:

- A page-size `<Select>`: **10 / 25 / 50 / 100 / Show all**, default **25**.
  "Show all" sets page size to the row count.
- An "X of Y rows" count.
- Search input (existing) moved into the same toolbar, using the new admin
  `Input`.

All admin tables inherit this automatically: Products, Customers, Categories,
and the new Orders table.

### Page & component rebuilds

- **`AdminSidebar`** — rebuilt per the aesthetic direction; orange removed;
  active state via gold pill; nav grouped; explicit Tailwind classes (does not
  touch global `--sidebar-*` tokens).
- **`app/admin/layout.tsx`** — remove the input hack; warm content background;
  consistent padding; sidebar + main composition.
- **`app/admin/page.tsx` (Dashboard)** — see Dashboard section.
- **`app/admin/orders/page.tsx`** — server component fetches all orders and
  renders a new client **`OrdersTable`** on the enhanced `DataTable`. Filters
  become a clean toolbar: a **Capitalized** status segmented control +
  search. (Filtering moves client-side over the full set — acceptable at
  current admin scale; revisit with server-side pagination if order volume
  grows large.)
- **`app/admin/products/page.tsx` / `ProductsTable`** — status column rendered
  through `formatProductStatus` + `StatusBadge`; inherits page-size control.
- **`CategoriesTable`, `CustomersTable`** — inherit the enhanced `DataTable`;
  light restyle for consistency.
- **Forms / dialogs** (`ProductForm`, `CategoryForm`, `CustomerEditForm`,
  `VariantEditor`, `DeliveryZonesEditor`, `NewCustomerDialog`,
  `ProductImageField`) — re-point imports to `components/admin/ui/*` so inputs,
  selects, textareas and buttons render correctly.

## Dashboard

Server component reads `?range=` (`today` | `7d` | `30d` | `90d`, default
`7d`) via `DateRangeTabs`. Layout, top to bottom:

1. `AdminPageHeader` ("Dashboard") with `DateRangeTabs` in the actions slot.
2. KPI row — 4 `StatCard`s: **Revenue**, **Orders**, **Avg order value**,
   **Needs attention**. The first three are range-aware and show a delta vs.
   the immediately preceding equal-length period.
3. `RevenueChart` — daily revenue area chart for the range.
4. Two-column lower grid: **Top products** (left) and **Actionable lists**
   (right: recent orders + low stock as richer rows with `StatusBadge` and
   explicit empty states).

### Data layer — `lib/shop/admin-dashboard.ts`

- `getDashboardMetrics(range)` — revenue, order count, AOV, and `needsAttention`
  for the range, plus the previous-period equivalents for delta computation.
- `getRevenueSeries(range)` — daily `{ date, revenue }` buckets across the
  range (zero-filled for empty days).
- `getTopProducts(range, limit)` — aggregates `orderItems` (joined to `orders`
  for the date filter and revenue statuses) grouped by `productName`, returning
  units sold and revenue; default `limit` 5.

All three use `rangeToSince` and the existing `REVENUE_STATUSES` set.

## Data Flow

- Range selection: `DateRangeTabs` (client) → `router.push('?range=…')` →
  dashboard server component re-renders with new metrics. No client data
  fetching.
- Tables: server pages fetch full datasets; client `DataTable` (via
  `@tanstack/react-table`) handles sort, search, pagination, page size.
- Mutations (delete, status update) unchanged — existing server actions, then
  `router.refresh()`.

## Error & Empty States

- `RevenueChart`: "No revenue in this period" placeholder when the series is
  all zero; chart entrance animation respects `prefers-reduced-motion`.
- `TopProducts`, recent orders, low stock: explicit empty-state messages.
- `DataTable`: existing "No results." retained; page-size control hidden when
  there are 0 rows.
- Existing destructive-action confirmation dialogs retained.

## Testing

Jest (`ts-jest`) unit tests for the pure additions:

- `lib/shop/status-format.test.ts` — `titleCase`, `formatOrderStatus`,
  `formatProductStatus` for every known status and an unknown fallback.
- `lib/shop/date-range.test.ts` — `rangeToSince` for each range key and the
  default.

Dashboard query functions and visual changes are verified manually against the
running dev server (DB-dependent; not unit-tested).

## Dependencies

- Add `recharts` (peer of the shadcn chart component).

## Risks & Mitigations

- **Duplication** between admin and storefront primitives — accepted; the
  alternative (resetting shared components) risks the storefront. Files are
  small and stable.
- **Import sweep** across admin forms/dialogs — mechanical; verified by a
  successful `next build` / lint and a visual pass of each admin screen.
- **Orders client-side filtering** at scale — noted above; current volume is
  small, revisit later if needed.

## Out of Scope / Future

- Server-side paginated Orders.
- Admin dark mode.
- Resetting `components/ui/*` to neutral shadcn and theming the storefront at
  call sites.
