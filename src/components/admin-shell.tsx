import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  Users,
  Scissors,
  ClipboardList,
  ShoppingCart,
  Star,
  UserCog,
  Bell,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const groups = [
  {
    label: "Overview",
    items: [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Catalog",
    items: [
      { to: "/admin/packages", label: "Packages", icon: Package },
      { to: "/admin/stylists", label: "Stylists", icon: Scissors },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/admin/customers", label: "Customers", icon: Users },
      { to: "/admin/sell-package", label: "Sell Package", icon: ShoppingCart },
      { to: "/admin/record-session", label: "Record Session", icon: ClipboardList },
      { to: "/admin/points", label: "Points", icon: Star },
      { to: "/admin/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    label: "Settings",
    items: [{ to: "/admin/admins", label: "Admins", icon: UserCog }],
  },
] as const;

function AdminSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <Scissors className="h-5 w-5 text-primary" />
          <span className="font-semibold">Salon Admin</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => {
                  const active = pathname === item.to;
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild isActive={active}>
                        <Link to={item.to}>
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={async () => {
                    await supabase.auth.signOut();
                    navigate({ to: "/auth" });
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b bg-background sticky top-0 z-30">
            <SidebarTrigger className="ml-2" />
          </header>
          <main className="flex-1 p-4 md:p-6 bg-muted/30">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
