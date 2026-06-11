
-- =========================================
-- Enums and helper functions
-- =========================================
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');

-- =========================================
-- profiles
-- =========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  location TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =========================================
-- user_roles
-- =========================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role security definer
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- =========================================
-- admin_password_resets (force change on first login)
-- =========================================
CREATE TABLE public.admin_password_resets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.admin_password_resets TO authenticated;
GRANT ALL ON public.admin_password_resets TO service_role;
ALTER TABLE public.admin_password_resets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own reset flag"
ON public.admin_password_resets FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users update their own reset flag"
ON public.admin_password_resets FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- =========================================
-- profiles RLS
-- =========================================
CREATE POLICY "Profiles: owner can read"
ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Profiles: owner can update"
ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "Profiles: owner can insert"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

-- =========================================
-- user_roles RLS
-- =========================================
CREATE POLICY "User roles: self read"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- =========================================
-- packages
-- =========================================
CREATE TABLE public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  total_sessions INTEGER NOT NULL CHECK (total_sessions > 0),
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.packages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.packages TO authenticated;
GRANT ALL ON public.packages TO service_role;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Packages: anyone can read active"
ON public.packages FOR SELECT TO anon, authenticated
USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Packages: admins manage"
ON public.packages FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- stylists
-- =========================================
CREATE TABLE public.stylists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specialty TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stylists TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stylists TO authenticated;
GRANT ALL ON public.stylists TO service_role;
ALTER TABLE public.stylists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stylists: anyone can read"
ON public.stylists FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Stylists: admins manage"
ON public.stylists FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- purchases
-- =========================================
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.packages(id),
  purchase_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  remaining_sessions INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO service_role;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Purchases: customer read own"
ON public.purchases FOR SELECT TO authenticated
USING (customer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Purchases: admins manage"
ON public.purchases FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- session_usages
-- =========================================
CREATE TABLE public.session_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  stylist_id UUID REFERENCES public.stylists(id),
  service_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  service_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_usages TO authenticated;
GRANT ALL ON public.session_usages TO service_role;
ALTER TABLE public.session_usages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session usages: customer read own"
ON public.session_usages FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.purchases p WHERE p.id = purchase_id AND p.customer_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Session usages: admins manage"
ON public.session_usages FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- points_transactions
-- =========================================
CREATE TABLE public.points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.points_transactions TO authenticated;
GRANT ALL ON public.points_transactions TO service_role;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Points: customer read own"
ON public.points_transactions FOR SELECT TO authenticated
USING (customer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Points: admins manage"
ON public.points_transactions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- notifications
-- =========================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL = broadcast
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notifications: recipient or broadcast read"
ON public.notifications FOR SELECT TO authenticated
USING (recipient_id = auth.uid() OR recipient_id IS NULL OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Notifications: recipient update read flag"
ON public.notifications FOR UPDATE TO authenticated
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());

CREATE POLICY "Notifications: admins manage"
ON public.notifications FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- Triggers: auto-create profile + customer role on signup
-- =========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Default everyone to customer role; admins must be granted explicitly
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- Triggers: automatic points & session decrement
-- =========================================
CREATE OR REPLACE FUNCTION public.points_on_purchase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.points_transactions (customer_id, points, reason)
  VALUES (NEW.customer_id, 50, 'Package purchase bonus');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_points_on_purchase
AFTER INSERT ON public.purchases
FOR EACH ROW EXECUTE FUNCTION public.points_on_purchase();

CREATE OR REPLACE FUNCTION public.handle_session_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer UUID;
  v_remaining INT;
BEGIN
  SELECT customer_id, remaining_sessions INTO v_customer, v_remaining
  FROM public.purchases WHERE id = NEW.purchase_id FOR UPDATE;

  IF v_customer IS NULL THEN
    RAISE EXCEPTION 'Purchase not found';
  END IF;

  IF v_remaining <= 0 THEN
    RAISE EXCEPTION 'No remaining sessions on this package';
  END IF;

  UPDATE public.purchases SET remaining_sessions = remaining_sessions - 1
  WHERE id = NEW.purchase_id;

  INSERT INTO public.points_transactions (customer_id, points, reason)
  VALUES (v_customer, 10, 'Session reward');

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_handle_session_usage
AFTER INSERT ON public.session_usages
FOR EACH ROW EXECUTE FUNCTION public.handle_session_usage();

-- =========================================
-- Realtime
-- =========================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
