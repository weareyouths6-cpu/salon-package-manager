import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { CustomerShell } from "@/components/customer-shell";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SignedImage } from "@/lib/signed-image";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const { data, isLoading, refetch } = useQuery({
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
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Purchased Services</h1>
        <Button variant="link" className="text-primary px-0" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading...</div>
      ) : !data?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No services yet. Ask your salon to add one to your account.
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg overflow-hidden border">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-2 px-3 font-normal w-10">No</th>
                <th className="py-2 px-3 font-normal text-center">Service</th>
                <th className="py-2 px-3 font-normal text-center w-20">Remain</th>
                <th className="py-2 px-3 font-normal text-center w-20">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p: any, i: number) => (
                <tr
                  key={p.id}
                  onClick={() => router.navigate({ to: "/packages/$purchaseId", params: { purchaseId: p.id } })}
                  className={`cursor-pointer hover:bg-muted/60 ${i % 2 === 0 ? "bg-muted/30" : ""}`}
                >
                  <td className="py-3 px-3 text-muted-foreground">{i + 1}.</td>
                  <td className="py-3 px-3 text-center font-medium">{p.packages?.name}</td>
                  <td className="py-3 px-3 text-center font-semibold text-green-500">
                    {p.remaining_sessions}
                  </td>
                  <td className="py-3 px-3 text-center">{p.packages?.total_sessions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {stylists && stylists.length > 0 && (
        <>
          <div className="mt-10 mb-4">
            <h2 className="text-lg font-bold">Our Stylists</h2>
          </div>
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
        </>
      )}
    </CustomerShell>
  );
}
