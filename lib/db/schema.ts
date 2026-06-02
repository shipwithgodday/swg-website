import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
};

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  imageUrl: text('image_url'),
  ...timestamps,
});

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  categoryId: uuid('category_id').references(() => categories.id, {
    onDelete: 'set null',
  }),
  status: text('status').notNull().default('draft'),
  featured: boolean('featured').notNull().default(false),
  isPreorder: boolean('is_preorder').notNull().default(false),
  preorderShipEstimate: text('preorder_ship_estimate'),
  ...timestamps,
});

export const productImages = pgTable('product_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  publicId: text('public_id').notNull(),
  alt: text('alt'),
  position: integer('position').notNull().default(0),
});

export const productVariants = pgTable('product_variants', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  sku: text('sku').unique(),
  price: integer('price').notNull(),
  compareAtPrice: integer('compare_at_price'),
  stockQuantity: integer('stock_quantity').notNull().default(0),
  position: integer('position').notNull().default(0),
});

export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clerkUserId: text('clerk_user_id').unique(),
    shippingMark: text('shipping_mark').notNull().unique(),
    shippingMarkNo: integer('shipping_mark_no').notNull(),
    name: text('name'),
    email: text('email'),
    phone: text('phone'),
    source: text('source').notNull().default('system'),
    ...timestamps,
  },
  (t) => [
    index('customers_email_idx').on(t.email),
    index('customers_phone_idx').on(t.phone),
  ]
);

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNumber: text('order_number').notNull().unique(),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.id),
  status: text('status').notNull().default('pending'),
  subtotal: integer('subtotal').notNull(),
  total: integer('total').notNull(),
  shipName: text('ship_name'),
  shipPhone: text('ship_phone'),
  shipAddress: text('ship_address'),
  shipCity: text('ship_city'),
  paystackReference: text('paystack_reference'),
  ...timestamps,
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id')
    .notNull()
    .references(() => productVariants.id),
  productName: text('product_name').notNull(),
  variantName: text('variant_name').notNull(),
  unitPrice: integer('unit_price').notNull(),
  quantity: integer('quantity').notNull(),
  isPreorder: boolean('is_preorder').notNull().default(false),
  preorderShipEstimate: text('preorder_ship_estimate'),
});

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  images: many(productImages),
  variants: many(productVariants),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const productVariantsRelations = relations(
  productVariants,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productVariants.productId],
      references: [products.id],
    }),
    orderItems: many(orderItems),
  })
);

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
}));

export const containers = pgTable('containers', {
  id: uuid('id').primaryKey().defaultRandom(),
  containerNumber: text('container_number').notNull().unique(),
  etaPort: timestamp('eta_port', { withTimezone: true }),
  etaWarehouse: timestamp('eta_warehouse', { withTimezone: true }),
  arrivedAtPort: timestamp('arrived_at_port', { withTimezone: true }),
  arrivedAtWarehouse: timestamp('arrived_at_warehouse', { withTimezone: true }),
  ...timestamps,
});

export const etaAdjustments = pgTable(
  'eta_adjustments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    containerId: uuid('container_id')
      .notNull()
      .references(() => containers.id, { onDelete: 'cascade' }),
    field: text('field').notNull(), // "etaPort" | "etaWarehouse"
    previousDate: timestamp('previous_date', { withTimezone: true }), // null when this is the initial ETA set
    newDate: timestamp('new_date', { withTimezone: true }).notNull(),
    reason: text('reason'),
    adjustedAt: timestamp('adjusted_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    adjustedBy: text('adjusted_by').notNull(),
  },
  (t) => [index('eta_adjustments_container_id_idx').on(t.containerId)]
);

export const shipmentNotificationSubscribers = pgTable(
  'shipment_notification_subscribers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    containerId: uuid('container_id')
      .notNull()
      .references(() => containers.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id').references(() => customers.id, {
      onDelete: 'set null',
    }),
    emailOverride: text('email_override'),
    invoiceNumber: text('invoice_number').notNull(),
    subscribedAt: timestamp('subscribed_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    notifiedPortArrival: boolean('notified_port_arrival')
      .notNull()
      .default(false),
    notifiedWarehouseArrival: boolean('notified_warehouse_arrival')
      .notNull()
      .default(false),
    notifiedPortArrived: boolean('notified_port_arrived')
      .notNull()
      .default(false),
    notifiedWarehouseArrived: boolean('notified_warehouse_arrived')
      .notNull()
      .default(false),
  },
  (t) => [
    uniqueIndex('subscribers_invoice_unique').on(t.invoiceNumber, t.containerId),
    index('subscribers_container_id_idx').on(t.containerId),
  ]
);

export const containersRelations = relations(containers, ({ many }) => ({
  adjustments: many(etaAdjustments),
  subscribers: many(shipmentNotificationSubscribers),
}));

export const etaAdjustmentsRelations = relations(etaAdjustments, ({ one }) => ({
  container: one(containers, {
    fields: [etaAdjustments.containerId],
    references: [containers.id],
  }),
}));

export const shipmentNotificationSubscribersRelations = relations(
  shipmentNotificationSubscribers,
  ({ one }) => ({
    container: one(containers, {
      fields: [shipmentNotificationSubscribers.containerId],
      references: [containers.id],
    }),
    customer: one(customers, {
      fields: [shipmentNotificationSubscribers.customerId],
      references: [customers.id],
    }),
  })
);

export type Product = typeof products.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type ProductImage = typeof productImages.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Container = typeof containers.$inferSelect;
export type EtaAdjustment = typeof etaAdjustments.$inferSelect;
export type ShipmentNotificationSubscriber =
  typeof shipmentNotificationSubscribers.$inferSelect;

// ── Booking / scheduling ────────────────────────────────────────────────

export const bookings = pgTable(
  'bookings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    date: text('date').notNull(), // 'YYYY-MM-DD'
    time: text('time').notNull(), // 'HH:mm'
    fullName: text('full_name').notNull(),
    phoneNumber: text('phone_number').notNull(),
    whatsappNumber: text('whatsapp_number'),
    email: text('email').notNull(),
    organization: text('organization'),
    desiredService: text('desired_service').notNull(),
    meetingType: text('meeting_type').notNull(),
    ...timestamps,
  },
  (t) => ({
    dateTimeUnique: uniqueIndex('bookings_date_time_unique').on(
      t.date,
      t.time
    ),
  })
);

export const bookingWeekdayHours = pgTable('booking_weekday_hours', {
  weekday: integer('weekday').primaryKey(), // 0 = Sunday … 6 = Saturday
  isOpen: boolean('is_open').notNull().default(true),
  openTime: text('open_time').notNull(), // 'HH:mm'
  closeTime: text('close_time').notNull(), // 'HH:mm'
  slotMinutes: integer('slot_minutes').notNull().default(60),
});

export const bookingBlackoutDates = pgTable('booking_blackout_dates', {
  id: uuid('id').primaryKey().defaultRandom(),
  date: text('date').notNull().unique(), // 'YYYY-MM-DD'
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
