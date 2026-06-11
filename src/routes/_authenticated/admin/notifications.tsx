import { createFileRoute } from "@tanstack/react-router";
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

export const Route = createFileRoute("/_authenticated/admin/notifications")({
  component: NotifAdmin,
});

function NotifAdmin() {
  const [target, setTarget] = useState<string>("__all__");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const { data: customers } = useQuery({
    queryKey: ["notif-customers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("user_id, profiles!inner(full_name)")
        .eq("role", "customer");
      return data ?? [];
    },
  });

  async function send() {
    if (!title || !message) return toast.error("Title and message required");
    const recipient_id = target === "__all__" ? null : target;
    const { error } = await supabase.from("notifications").insert({ title, message, recipient_id });
    if (error) return toast.error(error.message);
    toast.success(recipient_id ? "Notification sent" : "Broadcast sent to all customers");
    setTitle("");
    setMessage("");
  }

  return (
    <div className="max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Send Notification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Recipient</Label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All customers (broadcast)</SelectItem>
                {customers?.map((c: any) => (
                  <SelectItem key={c.user_id} value={c.user_id}>{c.profiles?.full_name ?? c.user_id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <Button onClick={send}>Send</Button>
        </CardContent>
      </Card>
    </div>
  );
}
