import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_admin/sell-package")({
  component: SellPackage,
});

function SellPackage() {
  const navigate = useNavigate();
  const [customerId, setCustomerId] = useState("");
  const [packageId, setPackageId] = useState("");

  const { data: customers } = useQuery({
    queryKey: ["sell-customers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("user_id, profiles!inner(full_name)")
        .eq("role", "customer");
      return data ?? [];
    },
  });
  const { data: packages } = useQuery({
    queryKey: ["sell-packages"],
    queryFn: async () => {
      const { data } = await supabase.from("packages").select("*").eq("is_active", true);
      return data ?? [];
    },
  });

  async function submit() {
    if (!customerId || !packageId) return toast.error("Pick a customer and package");
    const pkg = packages?.find((p: any) => p.id === packageId);
    if (!pkg) return;
    const { error } = await supabase.from("purchases").insert({
      customer_id: customerId,
      package_id: packageId,
      remaining_sessions: pkg.total_sessions,
    });
    if (error) return toast.error(error.message);
    toast.success("Package sold (+50 points awarded)");
    navigate({ to: "/admin/customers/$id", params: { id: customerId } });
  }

  return (
    <div className="max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Sell a Package</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Customer</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
              <SelectContent>
                {customers?.map((c: any) => (
                  <SelectItem key={c.user_id} value={c.user_id}>{c.profiles?.full_name ?? c.user_id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Package</Label>
            <Select value={packageId} onValueChange={setPackageId}>
              <SelectTrigger><SelectValue placeholder="Select package" /></SelectTrigger>
              <SelectContent>
                {packages?.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} ({p.total_sessions} sessions)</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={submit}>Record Purchase</Button>
        </CardContent>
      </Card>
    </div>
  );
}
