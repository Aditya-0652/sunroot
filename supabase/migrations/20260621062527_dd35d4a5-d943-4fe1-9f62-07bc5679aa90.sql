
-- Restrict column-level SELECT on site_settings
REVOKE SELECT ON public.site_settings FROM anon, authenticated;
GRANT SELECT (id, brand_tagline, shipping_fee_inr, free_shipping_threshold_inr, updated_at)
  ON public.site_settings TO anon, authenticated;

-- Public checkout: fetch UPI info via SECURITY DEFINER function
CREATE OR REPLACE FUNCTION public.get_upi_settings()
RETURNS TABLE(upi_id text, upi_payee_name text, qr_image_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT upi_id, upi_payee_name, qr_image_url FROM public.site_settings WHERE id = 1;
$$;
REVOKE ALL ON FUNCTION public.get_upi_settings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_upi_settings() TO anon, authenticated;

-- Admin: read full settings row
CREATE OR REPLACE FUNCTION public.admin_get_settings()
RETURNS public.site_settings
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE r public.site_settings;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  SELECT * INTO r FROM public.site_settings WHERE id = 1;
  RETURN r;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_get_settings() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_settings() TO authenticated;

-- Admin: update settings row
CREATE OR REPLACE FUNCTION public.admin_update_settings(
  p_upi_id text,
  p_upi_payee_name text,
  p_qr_image_url text,
  p_brand_tagline text,
  p_shipping_fee_inr integer,
  p_free_shipping_threshold_inr integer
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  UPDATE public.site_settings SET
    upi_id = trim(p_upi_id),
    upi_payee_name = COALESCE(NULLIF(trim(p_upi_payee_name), ''), 'SUNROOT'),
    qr_image_url = p_qr_image_url,
    brand_tagline = trim(p_brand_tagline),
    shipping_fee_inr = GREATEST(0, p_shipping_fee_inr),
    free_shipping_threshold_inr = GREATEST(0, p_free_shipping_threshold_inr),
    updated_at = now()
  WHERE id = 1;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_update_settings(text,text,text,text,integer,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_settings(text,text,text,text,integer,integer) TO authenticated;
