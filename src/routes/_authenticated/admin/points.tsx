import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export const Route = createFileRoute("/_authenticated/admin/points")({
  component: PointsAdjust,
});

function PointsAdjust() {
  const [customerId, setCustomerId] = useState("");
  const [points, setPoints] = useState(0);
  const [reason, setReason] = useState("");

  const { data: customers } = useQuery({
    queryKey: ["pts-customers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("user_id, profiles!inner(full_name)")
        .eq("role", "customer");
      return data ?? [];
    },
  });

  async function submit() {
    if (!customerId || !points || !reason) return toast.error("Fill all fields");
    const { error } = await supabase
      .from("points_transactions")
      .insert({ customer_id: customerId, points, reason });
    if (error) return toast.error(error.message);
    toast.success("Points adjusted");
    setPoints(0);
    setReason("");
  }

  return (
    <div className="max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Adjust Points</CardTitle>
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
            <Label>Points (negative to deduct)</Label>
            <Input type="number" value={points} onChange={(e) => setPoints(parseInt(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <Button onClick={submit}>Apply</Button>
        </CardContent>
      </Card>
    </div>
  );
}
