import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CustomerShell } from "@/components/customer-shell";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignedImage } from "@/lib/signed-image";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/packages/$purchaseId")({
  component: PackageDetail,
});

function PackageDetail() {
  const { purchaseId } = Route.useParams();
  const { data: purchase } = useQuery({
    queryKey: ["purchase", purchaseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select("*, packages(*)")
        .eq("id", purchaseId)
        .single();
      if (error) throw error;
      return data;
    },
  });
  const { data: usages } = useQuery({
    queryKey: ["usages", purchaseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("session_usages")
        .select("*, stylists(*)")
        .eq("purchase_id", purchaseId)
        .order("service_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <CustomerShell>
      <Link to="/dashboard">
        <Button variant="ghost" size="sm" className="mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      </Link>
      {purchase && (
        <Card className="mb-6 overflow-hidden">
          <SignedImage
            bucket="package-images"
            path={purchase.packages?.image_url}
            alt={purchase.packages?.name}
            className="h-40 w-full object-cover"
            fallback={<div className="h-40 w-full bg-gradient-to-br from-primary/20 to-accent/20" />}
          />
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle>{purchase.packages?.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {purchase.packages?.description}
                </p>
              </div>
              <Badge>
                {purchase.remaining_sessions}/{purchase.packages?.total_sessions} left
              </Badge>
            </div>
          </CardHeader>
        </Card>
      )}

      <h2 className="text-lg font-semibold mb-3">Session History</h2>
      {!usages?.length ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No sessions used yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {usages.map((u: any) => (
            <Card key={u.id}>
              <CardContent className="flex items-center gap-4 py-4">
                <SignedImage
                  bucket="stylist-photos"
                  path={u.stylists?.photo_url}
                  alt={u.stylists?.name ?? ""}
                  className="h-12 w-12 rounded-full object-cover"
                  fallback={
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {u.stylists?.name?.[0] ?? "?"}
                    </div>
                  }
                />
                <div className="flex-1">
                  <div className="font-medium">{u.service_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {u.stylists?.name ?? "Unknown stylist"} •{" "}
                    {format(new Date(u.service_date), "PPp")}
                  </div>
                  {u.notes && <div className="text-xs mt-1">{u.notes}</div>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </CustomerShell>
  );
}
