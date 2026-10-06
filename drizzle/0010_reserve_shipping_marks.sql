-- Marks remain reserved after contacts are deleted. Historical newsletter
-- labels also reserve numbers, even when no shop customer was imported.
CREATE TABLE "shipping_mark_reservations" (
  "mark" text PRIMARY KEY,
  "mark_no" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO shipping_mark_reservations (mark, mark_no)
SELECT upper(trim(shipping_mark)),
       CASE WHEN upper(trim(shipping_mark)) ~ '^GD[0-9]{1,9}$'
            THEN substring(upper(trim(shipping_mark)) from 3)::integer END
FROM customers
ON CONFLICT (mark) DO NOTHING;
--> statement-breakpoint
INSERT INTO shipping_mark_reservations (mark, mark_no)
SELECT mark, substring(mark from 3)::integer
FROM (
  SELECT substring(upper(trim(full_name)) from '^(GD[0-9]{1,9})([[:space:]]|$)') AS mark
  FROM subscribers
) historical
WHERE mark IS NOT NULL
ON CONFLICT (mark) DO NOTHING;
--> statement-breakpoint
CREATE FUNCTION remember_shipping_mark() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE reserved_mark text;
BEGIN
  PERFORM pg_advisory_xact_lock(72419031);
  IF TG_TABLE_NAME = 'customers' THEN
    reserved_mark := upper(trim(NEW.shipping_mark));
  ELSE
    reserved_mark := substring(upper(trim(NEW.full_name)) from '^(GD[0-9]{1,9})([[:space:]]|$)');
  END IF;
  IF reserved_mark IS NOT NULL THEN
    INSERT INTO shipping_mark_reservations (mark, mark_no)
    VALUES (reserved_mark, CASE WHEN reserved_mark ~ '^GD[0-9]{1,9}$'
                               THEN substring(reserved_mark from 3)::integer END)
    ON CONFLICT (mark) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER customers_remember_shipping_mark
BEFORE INSERT OR UPDATE OF shipping_mark ON customers
FOR EACH ROW EXECUTE FUNCTION remember_shipping_mark();
--> statement-breakpoint
CREATE TRIGGER subscribers_remember_shipping_mark
BEFORE INSERT OR UPDATE OF full_name ON subscribers
FOR EACH ROW EXECUTE FUNCTION remember_shipping_mark();
--> statement-breakpoint
CREATE FUNCTION allocate_shipping_mark(custom_mark text DEFAULT NULL)
RETURNS TABLE (n integer, mark text)
LANGUAGE plpgsql AS $$
DECLARE next_no integer; chosen_mark text; custom_no integer;
BEGIN
  -- Serialize allocation and reservation across guests, accounts and admins.
  PERFORM pg_advisory_xact_lock(72419031);
  chosen_mark := upper(nullif(trim(custom_mark), ''));
  IF chosen_mark ~ '^GD[0-9]{1,9}$' THEN
    custom_no := substring(chosen_mark from 3)::integer;
  END IF;
  SELECT greatest(
    (SELECT last_value + CASE WHEN is_called THEN 1 ELSE 0 END FROM shipping_mark_seq),
    coalesce((SELECT max(mark_no) FROM shipping_mark_reservations), 0) + 1,
    coalesce((SELECT max(shipping_mark_no) FROM customers), 0) + 1,
    coalesce(custom_no, 0)
  )::integer INTO next_no;
  chosen_mark := coalesce(chosen_mark, 'GD' || next_no);
  -- The unique reservation rejects custom marks belonging to old or deleted
  -- contacts, including newsletter-only contacts and concurrent allocations.
  INSERT INTO shipping_mark_reservations (mark, mark_no)
  VALUES (chosen_mark, CASE WHEN chosen_mark ~ '^GD[0-9]{1,9}$'
                           THEN substring(chosen_mark from 3)::integer END);
  PERFORM setval('shipping_mark_seq', next_no, true);
  RETURN QUERY SELECT next_no, chosen_mark;
END;
$$;
--> statement-breakpoint
-- Raise the counter above historical marks without lowering its high water.
SELECT setval('shipping_mark_seq', greatest(
  (SELECT last_value FROM shipping_mark_seq),
  coalesce((SELECT max(mark_no) FROM shipping_mark_reservations), 1),
  coalesce((SELECT max(shipping_mark_no) FROM customers), 1)
), true);
