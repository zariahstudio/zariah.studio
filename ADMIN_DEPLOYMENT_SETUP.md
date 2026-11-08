# ZARIAH Studio — cPanel deployment

This repository uses GitHub as the source of truth. The cPanel Git Version Control repository checks out `main`; its `.cpanel.yml` runs `deploy/cpanel-deploy.sh`.

## 1. GitHub Actions configuration

The workflow reads the Supabase Publishable key (or legacy anon/public key) from the existing public `storefront-config.js`. You may optionally add the same key as the GitHub Actions secret `VITE_SUPABASE_ANON_KEY` to override that fallback.

Never use a Supabase `service_role` or secret key in the browser application.

The workflow uses this project URL unless the repository variable `VITE_SUPABASE_URL` overrides it:

`https://keuqvqnhxlpsglsjfopd.supabase.co`

## 2. What the workflow does

On each push to `main`, `.github/workflows/static.yml`:

1. Generates and commits `admin-app/package-lock.json` if it does not exist.
2. Installs the locked Admin dependencies.
3. Builds the React/Vite Admin app with the `/admin/` base path.
4. Places the production build in the repository root at `admin/` and commits that generated output to `main`.
5. Publishes the same build to GitHub Pages as a secondary deployment target.

The generated `admin/` folder is the production app. Do not copy the `admin-app/` source folder into the public web root.

## 3. cPanel deployment

The cPanel Git repository must use:

- Remote: `https://github.com/zariahstudio/zariah.studio`
- Branch: `main`
- Repository path: `$HOME/repositories/zariah.studio`

The root `.cpanel.yml` runs `deploy/cpanel-deploy.sh`. The script validates all required storefront source files and folders before copying anything. It then copies the storefront to `$HOME/public_html/`. If a built `admin/index.html` exists in the repository, it also copies that production bundle to `$HOME/public_html/admin/`.

The deployment script does not delete existing website files. It does not copy development source, Supabase migrations, Git metadata, or documentation into the public web root.

Deployment sequence:

1. Push changes to GitHub `main`.
2. Wait for the GitHub Actions workflow to finish successfully. The workflow may create one additional commit containing the generated Admin build and dependency lockfile.
3. In cPanel **Git Version Control → Pull or Deploy**, click **Update from Remote**.
4. Confirm the latest commit includes the generated `admin/` directory.
5. Click **Deploy HEAD Commit** once and wait for completion.
6. If deployment fails, inspect the newest `$HOME/.cpanel/logs/*_git_deploy.log` file.

## 4. Supabase production readiness

A successful file deployment does not automatically apply database migrations or create an Admin account.

Before using Admin functions, review and apply the SQL migrations in `supabase/migrations/` in the intended dependency order, then create the first Auth user and assign its `profiles.role` as `admin`. Never expose a service-role key in the browser. Confirm Row Level Security policies and RPC permissions before enabling operational use.

The Admin app uses the Supabase Auth browser client and relies on RLS. A successful deployment alone is not proof that authentication, database schema, payment flows, or inventory operations are production-ready.

## 5. Domain and DNS

Git deployment copies files to the hosting account; it does not change DNS. The domain must separately point to the BitAserver hosting account before the public domain serves these files. Keep the existing DNS configuration unchanged until the new hosting files and domain mapping have been verified.
