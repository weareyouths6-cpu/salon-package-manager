import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { inviteAdmin } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/admins")({
  component: AdminsPage,
});

function AdminsPage() {
  const invite = useServerFn(inviteAdmin);
  const [email, setEmail] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [issued, setIssued] = useState<{ email: string; password: string } | null>(null);

  async function submit() {
    if (!email || tempPassword.length < 8) {
      toast.error("Email + temporary password (min 8 chars) required");
      return;
    }
    try {
      await invite({ data: { email, tempPassword } });
      setIssued({ email, password: tempPassword });
      setEmail("");
      setTempPassword("");
      toast.success("Admin invited");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to invite");
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Invite an Admin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Temporary password (min 8 chars)</Label>
            <Input value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} />
          </div>
          <Button onClick={submit}>Send invite</Button>
        </CardContent>
      </Card>
      {issued && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-base">Share these credentials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div><strong>Email:</strong> {issued.email}</div>
            <div><strong>Temp password:</strong> {issued.password}</div>
            <p className="text-xs text-muted-foreground mt-2">
              They must change this on first login.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
