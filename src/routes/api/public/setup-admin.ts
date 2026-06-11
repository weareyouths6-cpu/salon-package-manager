import { createFileRoute } from "@tanstack/react-router";

// Idempotent: seeds admin@salon.com / admin123 if no admin exists yet.
export const Route = createFileRoute("/api/public/setup-admin")({
  server: {
    handlers: {
      POST: handler,
      GET: handler,
    },
  },
});

async function handler() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { count, error: countErr } = await supabaseAdmin
    .from("user_roles")
    .select("*", { count: "exact", head: true })
    .eq("role", "admin");
  if (countErr) return Response.json({ error: countErr.message }, { status: 500 });
  if ((count ?? 0) > 0) {
    return Response.json({ ok: true, seeded: false, message: "Admin already exists" });
  }

  const email = "admin@salon.com";
  const password = "admin123";

  const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Salon Admin" },
  });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const uid = created.user!.id;
  await supabaseAdmin.from("user_roles").delete().eq("user_id", uid);
  const { error: rErr } = await supabaseAdmin.from("user_roles").insert({ user_id: uid, role: "admin" });
  if (rErr) return Response.json({ error: rErr.message }, { status: 500 });

  await supabaseAdmin
    .from("admin_password_resets")
    .upsert({ user_id: uid, must_change_password: false });

  return Response.json({ ok: true, seeded: true, email });
}
