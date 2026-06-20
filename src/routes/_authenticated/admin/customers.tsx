import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  component: CustomersList,
});

function CustomersList() {
  const [q, setQ] = useState("");
  const { data } = useQuery({
    queryKey: ["customers-list"],
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "customer");
      if (error) throw error;
      const ids = (roles ?? []).map((r) => r.user_id);
      if (ids.length === 0) return [];
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("id, full_name, phone, location, avatar_url")
        .in("id", ids);
      if (pErr) throw pErr;
      return (profiles ?? []).map((p) => ({ user_id: p.id, profiles: p }));
    },
  });

  const filtered = (data ?? []).filter((r: any) => {
    const p = r.profiles;
    const text = `${p?.full_name ?? ""} ${p?.phone ?? ""} ${p?.location ?? ""}`.toLowerCase();
    return text.includes(q.toLowerCase());
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Customers</h1>
      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search customers..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="space-y-2">
        {filtered.map((r: any) => (
          <Link key={r.user_id} to="/admin/customers/$id" params={{ id: r.user_id }}>
            <Card className="hover:bg-accent transition-colors">
              <CardContent className="py-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {r.profiles?.full_name?.[0] ?? "?"}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{r.profiles?.full_name ?? "(no name)"}</div>
                  <div className="text-xs text-muted-foreground">
                    {[r.profiles?.phone, r.profiles?.location].filter(Boolean).join(" • ") || "—"}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {filtered.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">No customers</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
