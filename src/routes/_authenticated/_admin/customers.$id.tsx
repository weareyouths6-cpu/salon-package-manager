import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_admin/customers/$id")({
  component: CustomerDetail,
});

function CustomerDetail() {
  const { id } = Route.useParams();
  const { data: profile } = useQuery({
    queryKey: ["customer-profile", id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", id).single();
      return data;
    },
  });
  const { data: purchases } = useQuery({
    queryKey: ["customer-purchases", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("purchases")
        .select("*, packages(*), session_usages(*, stylists(name))")
        .eq("customer_id", id)
        .order("purchase_date", { ascending: false });
      return data ?? [];
    },
  });
  const { data: points } = useQuery({
    queryKey: ["customer-points", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("points_transactions")
        .select("*")
        .eq("customer_id", id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const balance = (points ?? []).reduce((s: number, t: any) => s + t.points, 0);

  return (
    <div>
      <Link to="/admin/customers">
        <Button variant="ghost" size="sm" className="mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      </Link>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{profile?.full_name ?? "—"}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <div>Phone: {profile?.phone ?? "—"}</div>
          <div>Location: {profile?.location ?? "—"}</div>
          <div className="pt-2 font-semibold text-primary">Points: {balance}</div>
        </CardContent>
      </Card>

      <h2 className="text-lg font-semibold mb-2">Packages</h2>
      <div className="space-y-3 mb-6">
        {purchases?.map((p: any) => (
          <Card key={p.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{p.packages?.name}</CardTitle>
                <Badge>{p.remaining_sessions}/{p.packages?.total_sessions}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Purchased {format(new Date(p.purchase_date), "PP")}
              </div>
            </CardHeader>
            <CardContent>
              {p.session_usages?.length ? (
                <ul className="text-sm space-y-1">
                  {p.session_usages.map((u: any) => (
                    <li key={u.id} className="flex justify-between">
                      <span>{u.service_name} — {u.stylists?.name ?? "?"}</span>
                      <span className="text-muted-foreground">{format(new Date(u.service_date), "PP")}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-muted-foreground">No sessions yet</div>
              )}
            </CardContent>
          </Card>
        ))}
        {!purchases?.length && <div className="text-sm text-muted-foreground">No purchases.</div>}
      </div>

      <h2 className="text-lg font-semibold mb-2">Points history</h2>
      <div className="space-y-2">
        {points?.map((t: any) => (
          <Card key={t.id}>
            <CardContent className="py-2 flex justify-between text-sm">
              <span>{t.reason}</span>
              <span className={t.points > 0 ? "text-green-600 font-bold" : "text-destructive font-bold"}>
                {t.points > 0 ? "+" : ""}{t.points}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
