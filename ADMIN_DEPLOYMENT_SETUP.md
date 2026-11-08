# ZARIAH Studio Admin — same-domain deployment

The admin application is built into the repository's `/admin/` directory during the GitHub Pages deployment. The storefront source and existing root `index.html` are not redesigned or rewritten.

## 1. Configure the Supabase browser key in GitHub

In GitHub, open **Settings → Secrets and variables → Actions**.

Create this repository secret:

- `VITE_SUPABASE_ANON_KEY`: the Supabase **Publishable key** (or legacy anon/public key) for the `zariah-studio-sg` project.

Do not use the `service_role` / secret key in this setting. The Admin app runs in the browser and relies on Supabase Auth plus Row Level Security.

The project URL is already set as a workflow fallback:
`https://keuqvqnhxlpsglsjfopd.supabase.co`

If the project URL changes, add or update the repository Actions variable `VITE_SUPABASE_URL`.

## 2. Apply database migrations

In the Supabase SQL Editor, apply the migration files from `supabase/migrations/` in this order:

1. `202611060001_initial_schema.sql`
2. `202611060002_seed_existing_catalogue.sql`
3. `202611070001_storefront_catalogue_rpc.sql`
4. `202611070002_site_media.sql`
5. `202611070003_preorder_availability.sql`
6. `202611070004_order_tracking_lookup.sql`
7. `202611070005_secure_website_checkout.sql`
8. `202611080001_customer_loyalty_membership.sql`
9. `202611080001_digital_receipts_pos_payments.sql`
10. `202611080002_inventory_sales_intelligence.sql`

Do not skip the initial schema or seed migration. Review each SQL execution result before proceeding.

## 3. Create the first Admin user

1. In Supabase, open **Authentication → Users** and create the owner's email/password account.
2. Copy the new Auth user's UUID.
3. In the SQL Editor, run the following after replacing the email and display name:

```sql
insert into public.profiles (id, display_name, role)
select id, 'ZARIAH Admin', 'admin'
from auth.users
where email = 'YOUR_ADMIN_EMAIL'
on conflict (id) do update
set display_name = excluded.display_name,
    role = 'admin';
```

3. Confirm exactly one row was inserted or updated. The user must exist in Auth first.

## 4. Deploy

Merge the reviewed deployment pull request into `main`. The GitHub Actions workflow will:

- install the Admin app dependencies;
- build Vite with the `/admin/` asset base path;
- place the generated files in the repository's `admin/` directory;
- deploy the storefront and Admin app together to GitHub Pages.

The target URL is:

`https://www.zariahstudio.com/admin/`

The directory route should also resolve from `/admin` and canonicalize to the trailing-slash path.

## 5. Verify before using

- Confirm the GitHub Pages deployment workflow succeeds.
- Open the Admin URL in a private browser window.
- Confirm the login screen appears.
- Sign in with the Auth user created above.
- Confirm the profile role is `admin`.
- Test dashboard data, product reads and one controlled inventory update before operational use.

If the Supabase key is missing, the Admin app will show its setup screen rather than load the dashboard. A successful static deployment alone does not mean the database migrations or Admin account are ready.
