import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_admin/record-session")({
  component: RecordSession,
});

function RecordSession() {
  const navigate = useNavigate();
  const [customerId, setCustomerId] = useState("");
  const [purchaseId, setPurchaseId] = useState("");
  const [stylistId, setStylistId] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [notes, setNotes] = useState("");

  const { data: customers } = useQuery({
    queryKey: ["rec-customers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("user_id, profiles!inner(full_name)")
        .eq("role", "customer");
      return data ?? [];
    },
  });

  const { data: purchases } = useQuery({
    enabled: !!customerId,
    queryKey: ["rec-purchases", customerId],
    queryFn: async () => {
      const { data } = await supabase
        .from("purchases")
        .select("*, packages(name, total_sessions)")
        .eq("customer_id", customerId)
        .gt("remaining_sessions", 0);
      return data ?? [];
    },
  });

  const { data: stylists } = useQuery({
    queryKey: ["rec-stylists"],
    queryFn: async () => {
      const { data } = await supabase.from("stylists").select("*").order("name");
      return data ?? [];
    },
  });

  async function submit() {
    if (!purchaseId || !serviceName) return toast.error("Pick a package and service");
    const { error } = await supabase.from("session_usages").insert({
      purchase_id: purchaseId,
      stylist_id: stylistId || null,
      service_name: serviceName,
      notes: notes || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Session recorded (+10 points, 1 session used)");
    navigate({ to: "/admin/customers/$id", params: { id: customerId } });
  }

  return (
    <div className="max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Record a Session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Customer</Label>
            <Select value={customerId} onValueChange={(v) => { setCustomerId(v); setPurchaseId(""); }}>
              <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
              <SelectContent>
                {customers?.map((c: any) => (
                  <SelectItem key={c.user_id} value={c.user_id}>{c.profiles?.full_name ?? c.user_id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Active package</Label>
            <Select value={purchaseId} onValueChange={setPurchaseId} disabled={!customerId}>
              <SelectTrigger><SelectValue placeholder="Select package" /></SelectTrigger>
              <SelectContent>
                {purchases?.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.packages?.name} ({p.remaining_sessions}/{p.packages?.total_sessions} left)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Stylist</Label>
            <Select value={stylistId} onValueChange={setStylistId}>
              <SelectTrigger><SelectValue placeholder="Select stylist" /></SelectTrigger>
              <SelectContent>
                {stylists?.map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Service name</Label>
            <Input value={serviceName} onChange={(e) => setServiceName(e.target.value)} placeholder="e.g. Haircut" />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button onClick={submit}>Record Session</Button>
        </CardContent>
      </Card>
    </div>
  );
}
