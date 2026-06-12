import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { CustomerShell } from "@/components/customer-shell";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignedImage } from "@/lib/signed-image";
import { format } from "date-fns";
import { Package as PackageIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    enabled: !!user,
    queryKey: ["my-purchases", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select("*, packages(*)")
        .eq("customer_id", user!.id)
        .order("purchase_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: packages } = useQuery({
    queryKey: ["browse-packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: stylists } = useQuery({
    queryKey: ["browse-stylists"],
    queryFn: async () => {
      const { data, error } = await supabase.from("stylists").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <CustomerShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Packages</h1>
        <p className="text-sm text-muted-foreground">Track your remaining sessions.</p>
      </div>
      {isLoading ? (
        <div className="text-muted-foreground">Loading...</div>
      ) : !data?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <PackageIcon className="mx-auto h-10 w-10 mb-2 opacity-50" />
            No packages yet. Ask your salon admin to add one.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((p: any) => (
            <Link
              key={p.id}
              to="/packages/$purchaseId"
              params={{ purchaseId: p.id }}
              className="block"
            >
              <Card className="hover:shadow-md transition-shadow overflow-hidden h-full">
                <SignedImage
                  bucket="package-images"
                  path={p.packages?.image_url}
                  alt={p.packages?.name ?? ""}
                  className="h-32 w-full object-cover"
                  fallback={<div className="h-32 w-full bg-gradient-to-br from-primary/20 to-accent/20" />}
                />
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{p.packages?.name}</CardTitle>
                    <Badge variant={p.remaining_sessions > 0 ? "default" : "secondary"}>
                      {p.remaining_sessions}/{p.packages?.total_sessions}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Purchased {format(new Date(p.purchase_date), "PP")}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-10 mb-4">
        <h2 className="text-xl font-bold">Available Packages</h2>
        <p className="text-sm text-muted-foreground">Ask your salon admin to purchase one.</p>
      </div>
      {!packages?.length ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            No packages available yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((p: any) => (
            <Card key={p.id} className="overflow-hidden">
              <SignedImage
                bucket="package-images"
                path={p.image_url}
                alt={p.name}
                className="h-32 w-full object-cover"
                fallback={<div className="h-32 w-full bg-gradient-to-br from-primary/20 to-accent/20" />}
              />
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  <Badge variant="secondary">${p.price}</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {p.total_sessions} sessions
                {p.description && <div className="mt-1">{p.description}</div>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-10 mb-4">
        <h2 className="text-xl font-bold">Our Stylists</h2>
      </div>
      {!stylists?.length ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            No stylists yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stylists.map((s: any) => (
            <Card key={s.id}>
              <CardContent className="flex items-center gap-3 py-3">
                <SignedImage
                  bucket="stylist-photos"
                  path={s.photo_url}
                  alt={s.name}
                  className="h-14 w-14 rounded-full object-cover"
                  fallback={
                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {s.name[0]}
                    </div>
                  }
                />
                <div>
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.specialty}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </CustomerShell>
  );
}
  );
}
