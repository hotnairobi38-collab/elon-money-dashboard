ALTER TABLE public.orders ADD COLUMN delivery_details text, ADD COLUMN delivered_at timestamptz;
CREATE OR REPLACE FUNCTION public.deliver_order(_id uuid, _details text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o public.orders;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF _details IS NULL OR length(btrim(_details)) = 0 THEN RAISE EXCEPTION 'Delivery details are required'; END IF;
  SELECT * INTO o FROM public.orders WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF o.status NOT IN ('pending', 'approved') THEN RAISE EXCEPTION 'Rejected orders cannot be delivered'; END IF;
  UPDATE public.orders SET delivery_details = btrim(_details), delivered_at = now(), status = 'approved' WHERE id = _id;
END;
$$;
REVOKE ALL ON FUNCTION public.deliver_order(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.deliver_order(uuid, text) TO authenticated;
COMMENT ON COLUMN public.orders.delivery_details IS 'Manual delivery entered only through the admin-only deliver_order function; owner/admin read policies apply.';