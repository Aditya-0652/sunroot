
DROP POLICY IF EXISTS "orders anyone insert" ON public.orders;
DROP POLICY IF EXISTS "items anyone insert" ON public.order_items;

CREATE OR REPLACE FUNCTION public.place_order(
  p_customer_name text, p_email text, p_phone text,
  p_address_line1 text, p_address_line2 text, p_city text, p_state text, p_pincode text,
  p_upi_txn_id text, p_payment_screenshot_url text, p_notes text, p_items jsonb
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _order_id uuid; _order_number text;
  _subtotal int := 0; _shipping int := 0;
  _free_threshold int := 0; _ship_fee int := 0; _total int;
  _item jsonb; _product record; _qty int; _line int;
BEGIN
  IF p_customer_name IS NULL OR length(trim(p_customer_name)) < 2 THEN RAISE EXCEPTION 'Invalid name'; END IF;
  IF p_email IS NULL OR p_email !~ '^[^@]+@[^@]+\.[^@]+$' THEN RAISE EXCEPTION 'Invalid email'; END IF;
  IF p_phone IS NULL OR length(trim(p_phone)) < 7 THEN RAISE EXCEPTION 'Invalid phone'; END IF;
  IF p_upi_txn_id IS NULL OR length(trim(p_upi_txn_id)) < 4 THEN RAISE EXCEPTION 'UPI transaction id required'; END IF;
  IF p_payment_screenshot_url IS NULL OR length(p_payment_screenshot_url) = 0 THEN RAISE EXCEPTION 'Payment screenshot required'; END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN RAISE EXCEPTION 'Cart is empty'; END IF;

  SELECT shipping_fee_inr, free_shipping_threshold_inr
    INTO _ship_fee, _free_threshold FROM public.site_settings WHERE id = 1;
  _ship_fee := COALESCE(_ship_fee, 0);
  _free_threshold := COALESCE(_free_threshold, 0);

  INSERT INTO public.orders (
    customer_name, email, phone, address_line1, address_line2,
    city, state, pincode, upi_txn_id, payment_screenshot_url, notes,
    subtotal_inr, shipping_inr, total_inr
  ) VALUES (
    trim(p_customer_name), lower(trim(p_email)), trim(p_phone),
    trim(p_address_line1), NULLIF(trim(COALESCE(p_address_line2,'')),''),
    trim(p_city), trim(p_state), trim(p_pincode),
    trim(p_upi_txn_id), p_payment_screenshot_url, NULLIF(trim(COALESCE(p_notes,'')),''),
    0, 0, 0
  ) RETURNING id, order_number INTO _order_id, _order_number;

  FOR _item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    _qty := GREATEST(1, COALESCE((_item->>'quantity')::int, 1));
    SELECT id, name, price_inr, is_active, stock INTO _product
      FROM public.products WHERE id = (_item->>'product_id')::uuid;
    IF NOT FOUND OR NOT _product.is_active THEN RAISE EXCEPTION 'Product unavailable'; END IF;
    IF _product.stock IS NOT NULL AND _product.stock < _qty THEN
      RAISE EXCEPTION 'Not enough stock for %', _product.name;
    END IF;
    _line := _product.price_inr * _qty;
    _subtotal := _subtotal + _line;
    INSERT INTO public.order_items (order_id, product_id, product_name, unit_price_inr, quantity, line_total_inr)
    VALUES (_order_id, _product.id, _product.name, _product.price_inr, _qty, _line);
  END LOOP;

  _shipping := CASE WHEN _free_threshold > 0 AND _subtotal >= _free_threshold THEN 0 ELSE _ship_fee END;
  _total := _subtotal + _shipping;

  UPDATE public.orders SET subtotal_inr = _subtotal, shipping_inr = _shipping, total_inr = _total
    WHERE id = _order_id;

  RETURN _order_number;
END;
$$;

REVOKE ALL ON FUNCTION public.place_order(text,text,text,text,text,text,text,text,text,text,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order(text,text,text,text,text,text,text,text,text,text,text,jsonb) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC;
