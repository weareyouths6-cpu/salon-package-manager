import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { AdminShell } from "@/components/admin-shell";
import { Scissors } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_admin")({
  component: AdminGate,
});

function AdminGate() {
  const { role, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Scissors className="h-8 w-8 animate-pulse text-primary" />
      </div>
    );
  }
  if (role !== "admin") return <Navigate to="/dashboard" />;
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
