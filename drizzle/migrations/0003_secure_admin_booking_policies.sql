CREATE OR REPLACE FUNCTION public.has_admin_role()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
$$;
REVOKE ALL ON FUNCTION public.has_admin_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_admin_role() TO authenticated;
DROP POLICY IF EXISTS "Only admins can read bookings" ON public.bookings;
CREATE POLICY "Only admins can read bookings" ON public.bookings FOR SELECT TO authenticated USING (public.has_admin_role());
DROP POLICY IF EXISTS "Only admins can update bookings" ON public.bookings;
CREATE POLICY "Only admins can update bookings" ON public.bookings FOR UPDATE TO authenticated USING (public.has_admin_role()) WITH CHECK (public.has_admin_role());
DROP POLICY IF EXISTS "Only admins can delete bookings" ON public.bookings;
CREATE POLICY "Only admins can delete bookings" ON public.bookings FOR DELETE TO authenticated USING (public.has_admin_role());
