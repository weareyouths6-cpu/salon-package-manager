
## Salon Customer Package Management App

A full-stack salon app on **TanStack Start + Lovable Cloud (Supabase)** with separate Admin and Customer portals. Customers sign in with Google; admins sign in with email/password. Tracks packages, session usage, stylists, points, and notifications in realtime.

---

### 1. Backend (Lovable Cloud / Supabase)

**Enable Lovable Cloud**, then run a migration that creates:

- `app_role` enum (`admin`, `customer`)
- `profiles` (id → auth.users, full_name, phone, location, avatar_url, created_at)
- `user_roles` (id, user_id, role) — roles stored separately for security
- `packages` (id, name, description, total_sessions, price, image_url, is_active, created_at)
- `stylists` (id, name, specialty, photo_url, created_at)
- `purchases` (id, customer_id, package_id, purchase_date, remaining_sessions, created_at)
- `session_usages` (id, purchase_id, stylist_id, service_date, service_name, notes, created_at)
- `points_transactions` (id, customer_id, points, reason, created_at)
- `notifications` (id, recipient_id nullable, title, message, is_read, created_at)
- `admin_password_resets` (user_id, must_change_password boolean) — for forced first-login change

**Security definer functions:** `has_role(_user_id, _role)`, plus a trigger on `auth.users` insert to auto-create a `profiles` row and assign `customer` role for Google signups.

**RLS policies:** customers only see their own purchases/usages/points/notifications; admins (via `has_role`) see all. Public read on `packages` (is_active) and `stylists`. Explicit `GRANT` statements per the public-schema-grants rule.

**Automatic points triggers** (DB triggers, not client logic):
- On `purchases` insert → +50 points
- On `session_usages` insert → +10 points and decrement `purchases.remaining_sessions`

**Storage buckets:** `package-images` (public), `stylist-photos` (public), `avatars` (public).

**Seed admin:** migration inserts `admin@salon.com` with password `admin123` via `auth.admin` (using a SQL bootstrap) and assigns admin role. Flagged with `must_change_password = false` (per your choice to keep as-is).

---

### 2. Auth

- **Google OAuth** for customers (configured via Supabase social auth tool).
- **Email/password** for admins. New admin invite = server fn that creates the auth user, assigns admin role, sets `must_change_password = true`. On login, if flag is true, redirect to `/admin/change-password` and block other routes.
- Integration-managed `_authenticated` layout used as-is. Add a second `_admin` layout that additionally checks `has_role('admin')` via server fn.
- Sign-in routes: `/auth` (customer Google + admin email/pw tabs), `/admin/change-password`.

---

### 3. Routes

```
src/routes/
  __root.tsx                          (existing, add Toaster + onAuthStateChange)
  index.tsx                           (landing → redirects based on role)
  auth.tsx                            (Google + admin email/pw)
  _authenticated/
    route.tsx                         (managed gate)
    dashboard.tsx                     (customer home: My Packages)
    packages.$purchaseId.tsx          (package detail + usage history)
    points.tsx                        (balance + transactions)
    profile.tsx                       (edit phone/location/avatar)
    notifications.tsx                 (list, mark read)
    _admin/
      route.tsx                       (admin role gate)
      index.tsx                       (admin dashboard metrics)
      packages.tsx                    (CRUD packages)
      stylists.tsx                    (CRUD stylists)
      customers.tsx                   (search/list)
      customers.$id.tsx               (customer detail: purchases, usage, points)
      record-session.tsx              (log a session usage)
      sell-package.tsx                (record a purchase)
      points.tsx                      (manual award/deduct)
      admins.tsx                      (invite admin)
      notifications.tsx               (broadcast / target a customer)
      change-password.tsx             (forced first-login change; outside _admin gate so it's reachable when flagged)
```

### 4. Server functions (`src/lib/*.functions.ts`)

All privileged actions go through `createServerFn` with `requireSupabaseAuth` + `has_role('admin')` check:
- `inviteAdmin`, `forcePasswordChange`
- `recordSessionUsage`, `recordPurchase`
- `adjustPoints`, `sendNotification`
- `getDashboardMetrics`, `listCustomers`, `getCustomerDetail`
- `uploadImage` helpers (or use direct browser uploads with RLS on storage)

### 5. Realtime

Single Supabase realtime subscription in the customer shell on `notifications` filtered by `recipient_id=eq.<me>` plus broadcasts (`recipient_id is null`). Updates a bell badge and fires a Sonner toast.

### 6. UI

- Shadcn components throughout. Admin uses Shadcn Sidebar (`collapsible="icon"`). Customer uses a top nav.
- Mobile responsive, Lucide icons, Sonner toasts, date-fns for friendly dates.
- Forms validated with zod + react-hook-form.
- Search/filter on admin customer list.

### 7. Build order

1. Enable Lovable Cloud + configure Google social auth.
2. Migration: enum, tables, GRANTs, RLS, has_role, triggers, storage buckets, seed admin.
3. Auth pages + `_authenticated` and `_admin` gates + forced password change flow.
4. Customer portal (dashboard, package detail, points, profile, notifications + realtime).
5. Admin portal (sidebar shell, dashboard, packages, stylists, customers, record session, sell package, points, admins, notifications).
6. Polish: toasts, loading/error states, mobile QA.

### Notes / trade-offs

- **`admin@salon.com / admin123` is weak.** Seeded as requested; you should change it after first login via the profile page.
- Web Push omitted by your choice — bell + realtime + toasts only.
- Points rules hard-coded in DB triggers at +10/+50; admin manual adjustments still allowed.
