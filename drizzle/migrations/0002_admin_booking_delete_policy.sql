GRANT DELETE ON public.bookings TO authenticated;
CREATE POLICY "Only admins can delete bookings" ON public.bookings FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
