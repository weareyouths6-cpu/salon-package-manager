import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { CustomerShell } from "@/components/customer-shell";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Bell } from "lucide-react";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({
    enabled: !!user,
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .or(`recipient_id.eq.${user!.id},recipient_id.is.null`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function markRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <CustomerShell>
      <h1 className="text-2xl font-bold mb-4">Notifications</h1>
      <div className="space-y-2">
        {!data?.length && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Bell className="mx-auto h-8 w-8 mb-2 opacity-50" />
              You're all caught up.
            </CardContent>
          </Card>
        )}
        {data?.map((n: any) => (
          <Card key={n.id} className={n.is_read ? "" : "border-primary"}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{n.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">{n.message}</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {format(new Date(n.created_at), "PPp")}
                  </div>
                </div>
                {!n.is_read && n.recipient_id === user?.id && (
                  <Button size="sm" variant="outline" onClick={() => markRead(n.id)}>
                    Mark read
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </CustomerShell>
  );
}
