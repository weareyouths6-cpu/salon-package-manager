import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, ShoppingCart, Star } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data } = useQuery({
    queryKey: ["admin-metrics"],
    queryFn: async () => {
      const [customers, packages, purchases, points] = await Promise.all([
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "customer"),
        supabase.from("packages").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("purchases").select("*", { count: "exact", head: true }),
        supabase.from("points_transactions").select("points"),
      ]);
      const totalPoints = (points.data ?? []).reduce((s: number, t: any) => s + t.points, 0);
      return {
        customers: customers.count ?? 0,
        packages: packages.count ?? 0,
        purchases: purchases.count ?? 0,
        totalPoints,
      };
    },
  });

  const cards = [
    { label: "Customers", value: data?.customers ?? 0, icon: Users },
    { label: "Active packages", value: data?.packages ?? 0, icon: Package },
    { label: "Total purchases", value: data?.purchases ?? 0, icon: ShoppingCart },
    { label: "Points issued", value: data?.totalPoints ?? 0, icon: Star },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{c.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{c.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
