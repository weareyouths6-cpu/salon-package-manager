import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type Role = "admin" | "customer" | null;

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [roleLoaded, setRoleLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Subscribe first so we don't miss events
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);
      setSessionLoaded(true);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setSessionLoaded(true);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!sessionLoaded) return;
    if (!user) {
      setRole(null);
      setRoleLoaded(true);
      return;
    }
    setRoleLoaded(false);
    let cancelled = false;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (cancelled) return;
        const roles = (data ?? []).map((r) => r.role);
        setRole(
          roles.includes("admin") ? "admin" : roles.includes("customer") ? "customer" : null,
        );
        setRoleLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user, sessionLoaded]);

  const loading = !sessionLoaded || (!!user && !roleLoaded);
  return { session, user, role, loading };
}
