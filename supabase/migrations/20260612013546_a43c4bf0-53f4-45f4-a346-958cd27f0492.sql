-- Grant Data API access to all public tables (was missing entirely)
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.packages TO authenticated;
GRANT ALL ON public.packages TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stylists TO authenticated;
GRANT ALL ON public.stylists TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_usages TO authenticated;
GRANT ALL ON public.session_usages TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.points_transactions TO authenticated;
GRANT ALL ON public.points_transactions TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_password_resets TO authenticated;
GRANT ALL ON public.admin_password_resets TO service_role;