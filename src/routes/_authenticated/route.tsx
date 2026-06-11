import { createFileRoute, Outlet, Navigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Scissors } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthGate,
});

function AuthGate() {
  const { user, loading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mustChange, setMustChange] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setMustChange(null);
      return;
    }
    supabase
      .from("admin_password_resets")
      .select("must_change_password")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setMustChange(!!data?.must_change_password));
  }, [user]);

  if (loading || (user && mustChange === null)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Scissors className="h-8 w-8 animate-pulse text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" />;
  if (mustChange && pathname !== "/change-password") return <Navigate to="/change-password" />;
  return <Outlet />;
}
