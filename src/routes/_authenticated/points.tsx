import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { CustomerShell } from "@/components/customer-shell";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Star } from "lucide-react";

export const Route = createFileRoute("/_authenticated/points")({
  component: PointsPage,
});

function PointsPage() {
  const { user } = useAuth();
  const { data } = useQuery({
    enabled: !!user,
    queryKey: ["points", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("points_transactions")
        .select("*")
        .eq("customer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const balance = (data ?? []).reduce((s: number, t: any) => s + t.points, 0);

  return (
    <CustomerShell>
      <Card className="mb-6 bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" /> Points Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">{balance}</div>
        </CardContent>
      </Card>
      <h2 className="text-lg font-semibold mb-3">History</h2>
      <div className="space-y-2">
        {(data ?? []).map((t: any) => (
          <Card key={t.id}>
            <CardContent className="flex items-center justify-between py-3">
              <div>
                <div className="text-sm font-medium">{t.reason}</div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(t.created_at), "PPp")}
                </div>
              </div>
              <div
                className={`font-bold ${t.points > 0 ? "text-green-600" : "text-destructive"}`}
              >
                {t.points > 0 ? "+" : ""}
                {t.points}
              </div>
            </CardContent>
          </Card>
        ))}
        {!data?.length && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No points yet.
            </CardContent>
          </Card>
        )}
      </div>
    </CustomerShell>
  );
}
