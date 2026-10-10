CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Antony Xavier' CHECK (char_length(display_name) BETWEEN 1 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL CHECK (char_length(customer_name) BETWEEN 1 AND 100),
  customer_phone TEXT NOT NULL CHECK (char_length(customer_phone) BETWEEN 8 AND 20),
  customer_email TEXT NOT NULL CHECK (char_length(customer_email) <= 255),
  service_name TEXT NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time TIME NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  customer_message TEXT NOT NULL DEFAULT '' CHECK (char_length(customer_message) <= 1000),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  whatsapp_status TEXT NOT NULL DEFAULT 'not_configured' CHECK (whatsapp_status IN ('not_configured', 'accepted', 'sent', 'delivered', 'read', 'failed')),
  whatsapp_sent_at TIMESTAMPTZ,
  whatsapp_error TEXT,
  notification_attempts INTEGER NOT NULL DEFAULT 0 CHECK (notification_attempts >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins can read bookings" ON public.bookings FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
CREATE POLICY "Only admins can update bookings" ON public.bookings FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
CREATE INDEX bookings_created_at_idx ON public.bookings (created_at DESC);
CREATE INDEX bookings_preferred_date_idx ON public.bookings (preferred_date);
CREATE INDEX bookings_status_idx ON public.bookings (status);

CREATE TABLE public.booking_rate_limits (
  ip_hash TEXT PRIMARY KEY,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.booking_rate_limits TO service_role;
ALTER TABLE public.booking_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.whatsapp_outbound_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  whatsapp_message_id TEXT UNIQUE,
  send_status TEXT NOT NULL CHECK (send_status IN ('accepted', 'failed', 'unresolved')),
  delivery_status TEXT CHECK (delivery_status IN ('sent', 'delivered', 'read', 'failed')),
  recipient_phone TEXT NOT NULL,
  send_response JSONB,
  send_error JSONB,
  delivery_errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  provider_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.whatsapp_outbound_messages TO service_role;
ALTER TABLE public.whatsapp_outbound_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX whatsapp_outbound_booking_idx ON public.whatsapp_outbound_messages (booking_id, created_at DESC);

CREATE TABLE public.whatsapp_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id TEXT NOT NULL UNIQUE,
  event TEXT NOT NULL,
  payload JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processing_error TEXT
);
GRANT ALL ON public.whatsapp_webhook_events TO service_role;
ALTER TABLE public.whatsapp_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX whatsapp_webhook_pending_idx ON public.whatsapp_webhook_events (received_at) WHERE processed_at IS NULL;

CREATE OR REPLACE FUNCTION public.create_booking_request(
  p_ip_hash TEXT,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_customer_email TEXT,
  p_service_name TEXT,
  p_preferred_date DATE,
  p_preferred_time TIME,
  p_customer_message TEXT
) RETURNS TABLE (id UUID, booking_reference TEXT, customer_name TEXT, service_name TEXT, preferred_date DATE, preferred_time TIME, status TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  attempt_count INTEGER;
  new_reference TEXT;
BEGIN
  INSERT INTO public.booking_rate_limits (ip_hash, attempts, window_started_at, updated_at)
  VALUES (p_ip_hash, 1, now(), now())
  ON CONFLICT (ip_hash) DO UPDATE
    SET attempts = CASE WHEN public.booking_rate_limits.window_started_at < now() - interval '10 minutes' THEN 1 ELSE public.booking_rate_limits.attempts + 1 END,
        window_started_at = CASE WHEN public.booking_rate_limits.window_started_at < now() - interval '10 minutes' THEN now() ELSE public.booking_rate_limits.window_started_at END,
        updated_at = now()
  RETURNING attempts INTO attempt_count;
  IF attempt_count > 5 THEN RAISE EXCEPTION 'Too many booking requests. Please try again later.' USING ERRCODE = 'P0001'; END IF;
  IF p_preferred_date < (now() AT TIME ZONE 'Asia/Kolkata')::date THEN RAISE EXCEPTION 'Preferred booking date cannot be in the past.' USING ERRCODE = '22007'; END IF;
  IF p_service_name <> ALL (ARRAY['Financier','Investor','Philosopher','Relationship Counsellor','Strangers Partner','Event Co-ordinator','Life Partner','Sperm Donor','Authentic Speaker','Time Seller','Yoga Instructor','Skater','Actor','Singer','Dancer','Model','Producer','Sponsor','Astrologer']) THEN RAISE EXCEPTION 'Select a valid service.' USING ERRCODE = '22023'; END IF;
  new_reference := 'AX-' || to_char(now() AT TIME ZONE 'Asia/Kolkata', 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  RETURN QUERY
  INSERT INTO public.bookings (booking_reference, customer_name, customer_phone, customer_email, service_name, preferred_date, preferred_time, customer_message, timezone)
  VALUES (new_reference, p_customer_name, p_customer_phone, p_customer_email, p_service_name, p_preferred_date, p_preferred_time, p_customer_message, 'Asia/Kolkata')
  RETURNING bookings.id, bookings.booking_reference, bookings.customer_name, bookings.service_name, bookings.preferred_date, bookings.preferred_time, bookings.status;
END;
$$;
REVOKE ALL ON FUNCTION public.create_booking_request(TEXT,TEXT,TEXT,TEXT,TEXT,DATE,TIME,TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_booking_request(TEXT,TEXT,TEXT,TEXT,TEXT,DATE,TIME,TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER bookings_set_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER whatsapp_outbound_set_updated_at BEFORE UPDATE ON public.whatsapp_outbound_messages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();