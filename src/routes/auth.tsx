import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Scissors } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Salon" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [customerMode, setCustomerMode] = useState<"signin" | "signup">("signin");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPassword, setCustomerPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/public/setup-admin", { method: "POST" }).catch(() => {});
  }, []);

  async function handleCustomer(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    if (customerMode === "signup") {
      const { error } = await supabase.auth.signUp({
        email: customerEmail,
        password: customerPassword,
        options: { emailRedirectTo: window.location.origin },
      });
      setSubmitting(false);
      if (error) return toast.error(error.message);
      toast.success("Account created");
      navigate({ to: "/" });
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: customerEmail,
        password: customerPassword,
      });
      setSubmitting(false);
      if (error) return toast.error(error.message);
      toast.success("Welcome back");
      navigate({ to: "/" });
    }
  }

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Scissors className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Salon Package Manager</CardTitle>
          <CardDescription>Sign in to manage packages and rewards</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="customer">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="customer">Customer</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
            </TabsList>
            <TabsContent value="customer" className="pt-4 space-y-3">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={customerMode === "signin" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setCustomerMode("signin")}
                >
                  Sign in
                </Button>
                <Button
                  type="button"
                  variant={customerMode === "signup" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setCustomerMode("signup")}
                >
                  Sign up
                </Button>
              </div>
              <form onSubmit={handleCustomer} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="customer-email">Email</Label>
                  <Input
                    id="customer-email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="you@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-password">Password</Label>
                  <Input
                    id="customer-password"
                    type="password"
                    value={customerPassword}
                    onChange={(e) => setCustomerPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting
                    ? "Please wait..."
                    : customerMode === "signup"
                      ? "Create account"
                      : "Sign in"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="admin" className="pt-4">
              <form onSubmit={handleAdminLogin} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@salon.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Signing in..." : "Sign in"}
                </Button>
              </form>
              <p className="mt-3 text-xs text-muted-foreground text-center">
                Default: admin@salon.com / admin123
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
