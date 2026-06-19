
CREATE OR REPLACE FUNCTION public.lookup_order_status(_order_number text, _email text)
RETURNS TABLE(
  order_number text, status order_status, customer_name text,
  total_inr integer, created_at timestamptz, updated_at timestamptz,
  city text, state text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.order_number, o.status, o.customer_name, o.total_inr,
         o.created_at, o.updated_at, o.city, o.state
  FROM public.orders o
  WHERE o.order_number = trim(_order_number)
    AND lower(o.email) = lower(trim(_email))
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.lookup_order_status(text, text) TO anon, authenticated;
