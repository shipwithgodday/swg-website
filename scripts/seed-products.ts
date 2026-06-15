import { eq } from 'drizzle-orm';
import { db } from '../lib/db';
import {
  categories,
  products,
  productImages,
  productVariants,
} from '../lib/db/schema';
import { slugify } from '../lib/shop/slug';

// Prices in pesewas (GHS minor units), e.g. 4500 = GHS 45.00.

const CATEGORIES = [
  { name: 'Electronics', description: 'Gadgets and accessories.' },
  { name: 'Home & Kitchen', description: 'Everyday essentials for the home.' },
  { name: 'Fashion', description: 'Clothing and apparel.' },
  { name: 'Beauty', description: 'Skincare and personal care.' },
];

type SeedVariant = {
  name: string;
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
};

type SeedProduct = {
  name: string;
  category: string;
  description: string;
  status: 'draft' | 'active' | 'archived';
  featured: boolean;
  image: { url: string; alt: string };
  variants: SeedVariant[];
};

const PRODUCTS: SeedProduct[] = [
  {
    name: 'Wireless Earbuds Pro',
    category: 'Electronics',
    description: 'Noise-cancelling earbuds with 24-hour battery life.',
    status: 'active',
    featured: true,
    image: { url: 'https://picsum.photos/seed/earbuds/800', alt: 'Wireless Earbuds Pro' },
    variants: [
      { name: 'Black', price: 45000, compareAtPrice: 55000, stockQuantity: 40 },
      { name: 'White', price: 45000, compareAtPrice: 55000, stockQuantity: 25 },
    ],
  },
  {
    name: 'Portable Bluetooth Speaker',
    category: 'Electronics',
    description: 'Water-resistant speaker with deep bass.',
    status: 'active',
    featured: false,
    image: { url: 'https://picsum.photos/seed/speaker/800', alt: 'Portable Bluetooth Speaker' },
    variants: [{ name: 'Standard', price: 32000, stockQuantity: 60 }],
  },
  {
    name: 'Stainless Steel Cookware Set',
    category: 'Home & Kitchen',
    description: '5-piece non-stick cookware set with glass lids.',
    status: 'active',
    featured: true,
    image: { url: 'https://picsum.photos/seed/cookware/800', alt: 'Stainless Steel Cookware Set' },
    variants: [{ name: '5-Piece Set', price: 78000, compareAtPrice: 95000, stockQuantity: 15 }],
  },
  {
    name: 'Ceramic Coffee Mug',
    category: 'Home & Kitchen',
    description: 'Handmade 350ml mug, dishwasher safe.',
    status: 'active',
    featured: false,
    image: { url: 'https://picsum.photos/seed/mug/800', alt: 'Ceramic Coffee Mug' },
    variants: [
      { name: 'Cream', price: 6500, stockQuantity: 100 },
      { name: 'Charcoal', price: 6500, stockQuantity: 80 },
    ],
  },
  {
    name: 'Classic Cotton T-Shirt',
    category: 'Fashion',
    description: '100% combed cotton crew-neck tee.',
    status: 'active',
    featured: false,
    image: { url: 'https://picsum.photos/seed/tshirt/800', alt: 'Classic Cotton T-Shirt' },
    variants: [
      { name: 'Small', price: 9000, stockQuantity: 50 },
      { name: 'Medium', price: 9000, stockQuantity: 65 },
      { name: 'Large', price: 9500, stockQuantity: 45 },
    ],
  },
  {
    name: 'Leather Crossbody Bag',
    category: 'Fashion',
    description: 'Genuine leather bag with adjustable strap.',
    status: 'draft',
    featured: false,
    image: { url: 'https://picsum.photos/seed/bag/800', alt: 'Leather Crossbody Bag' },
    variants: [{ name: 'Tan', price: 52000, stockQuantity: 12 }],
  },
  {
    name: 'Hydrating Face Serum',
    category: 'Beauty',
    description: 'Vitamin C serum for brighter, even-toned skin.',
    status: 'active',
    featured: true,
    image: { url: 'https://picsum.photos/seed/serum/800', alt: 'Hydrating Face Serum' },
    variants: [{ name: '30ml', price: 18000, compareAtPrice: 22000, stockQuantity: 70 }],
  },
  {
    name: 'Shea Butter Body Lotion',
    category: 'Beauty',
    description: 'Rich moisturising lotion with natural shea butter.',
    status: 'active',
    featured: false,
    image: { url: 'https://picsum.photos/seed/lotion/800', alt: 'Shea Butter Body Lotion' },
    variants: [{ name: '250ml', price: 12000, stockQuantity: 90 }],
  },
];

async function main() {
  // Seed categories (skip ones that already exist by slug).
  const categoryIds = new Map<string, string>();
  for (const cat of CATEGORIES) {
    const slug = slugify(cat.name);
    const existing = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, slug));
    if (existing[0]) {
      categoryIds.set(cat.name, existing[0].id);
      continue;
    }
    const [inserted] = await db
      .insert(categories)
      .values({ name: cat.name, slug, description: cat.description })
      .returning({ id: categories.id });
    categoryIds.set(cat.name, inserted.id);
  }

  // Seed products (skip ones that already exist by slug).
  let created = 0;
  for (const p of PRODUCTS) {
    const slug = slugify(p.name);
    const existing = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, slug));
    if (existing[0]) {
      console.log(`Skipping existing product: ${p.name}`);
      continue;
    }

    const [product] = await db
      .insert(products)
      .values({
        name: p.name,
        slug,
        description: p.description,
        categoryId: categoryIds.get(p.category) ?? null,
        status: p.status,
        featured: p.featured,
      })
      .returning({ id: products.id });

    await db.insert(productImages).values({
      productId: product.id,
      url: p.image.url,
      publicId: `seed/${slug}`,
      alt: p.image.alt,
      position: 0,
    });

    await db.insert(productVariants).values(
      p.variants.map((v, i) => ({
        productId: product.id,
        name: v.name,
        sku: `${slug}-${slugify(v.name)}`.toUpperCase(),
        price: v.price,
        compareAtPrice: v.compareAtPrice ?? null,
        stockQuantity: v.stockQuantity,
        position: i,
      }))
    );

    created += 1;
  }

  console.log(`Seeded ${created} product(s).`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
