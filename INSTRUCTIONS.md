# RentManager — Setup Guide

A property management website you can host for free on GitHub Pages.
Built with plain HTML/JS + Supabase (free database & auth).

---

## What you need before starting
- A free account on [github.com](https://github.com) — stores your code and hosts the site
- A free account on [supabase.com](https://supabase.com) — your database and user logins
- The [Supabase CLI](https://supabase.com/docs/guides/cli) — needed only for the Edge Function (Step 5)

---

## Step 1 — Create your Supabase project

1. Go to [supabase.com](https://supabase.com) → **Start your project** → sign in
2. Click **New Project**
3. Give it a name (e.g. `rentmanager`), set a strong database password, choose a region close to you
4. Wait ~2 minutes for it to finish setting up

---

## Step 2 — Run the database schema

1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open the file `sql/schema.sql` from this project and **copy all its contents**
4. Paste it into the SQL Editor and click **Run**
5. You should see "Success. No rows returned."

This creates all the tables (houses, rooms, leases, rent records) and the security rules.

---

## Step 3 — Connect the website to Supabase

1. In Supabase, go to **Settings → API**
2. Copy the **Project URL** (looks like `https://xxxxxxxxxxxx.supabase.co`)
3. Copy the **anon public** key (long string starting with `eyJ...`)
4. Open the file `js/app.js` in this project
5. Replace the two lines near the top:

```js
var SUPABASE_URL      = 'YOUR_SUPABASE_PROJECT_URL'   // ← paste Project URL here
var SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'      // ← paste anon key here
```

---

## Step 4 — Create your owner account

1. In Supabase, go to **Authentication → Users**
2. Click **Add user → Create new user**
3. Enter your email and a password → click **Create user**
4. Now go to **SQL Editor → New query** and run this (replace the email with yours):

```sql
UPDATE profiles
SET role = 'owner'
WHERE id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE');
```

5. Click **Run** — this makes your account the house owner

---

## Step 5 — Deploy the Tenant Invite function

This small server-side function lets you invite tenants by email.

### Install Supabase CLI (if not installed)

```bash
# On Windows (PowerShell):
winget install Supabase.CLI

# Or download from: https://github.com/supabase/cli/releases
```

### Link and deploy

Open a terminal in the `rental-manager` folder, then run:

```bash
# Log in to Supabase
supabase login

# Link to your project (find your project ref in Supabase → Settings → General)
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
supabase functions deploy create-tenant
```

If successful, you'll see something like:
```
Deployed Functions create-tenant on project YOUR_PROJECT_REF
```

---

## Step 6 — Publish to GitHub Pages

1. Go to [github.com](https://github.com) → click **New repository**
2. Name it `rental-manager`, set it to **Public**, click **Create repository**
3. Follow the instructions GitHub shows to upload your project files
   (or use GitHub Desktop app if you prefer not to use the terminal)
4. Once uploaded, go to your repo → **Settings → Pages**
5. Under "Source", select **Deploy from a branch** → pick `main` branch → `/ (root)` folder
6. Click **Save**. After ~1 minute, your site will be live at:
   `https://YOUR_USERNAME.github.io/rental-manager/`

---

## Step 7 — First login

1. Open your website URL
2. Log in with the email + password you created in Step 4
3. You'll land on the **Dashboard** (owner view)

---

## How to use the website

### As the house owner:
| What you want to do | Where to go |
|---|---|
| Add a house | Houses → Add House |
| Add rooms to a house | Houses → click the house → Add Room |
| Invite a tenant | Tenants → Invite Tenant (they get an email to set their password) |
| Assign a tenant to a room | Houses → click the house → click the room → Assign Tenant |
| Mark rent as paid | Rent page, or click any room → Mark as Paid |

### As a tenant:
1. The tenant receives an email invitation — they click the link and set a password
2. They log in at your website URL and see only their own room and rent

---

## Language switching

Click the **EN / DE** button in the corner of any page to toggle between English and German.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| "Invalid email or password" on login | Check Step 4 — make sure you ran the SQL to set `role = 'owner'` |
| Tenant invite fails | Make sure you completed Step 5 (Edge Function deployed) |
| Site shows blank page | Open browser DevTools → Console — check for errors; likely the Supabase URL/key in `js/supabase.js` is wrong |
| Data not showing | Go to Supabase → Table Editor and verify your tables exist (from Step 2) |

---

## File overview (for reference)

```
rental-manager/
  index.html                       Login page
  js/
    app.js                         ← Supabase credentials + all shared logic
  owner/
    dashboard.html                 Stats overview
    houses.html                    Manage houses
    house-detail.html              Rooms in a house
    room-detail.html               Room info, lease, rent records
    tenants.html                   Invite & view tenants
    rent.html                      Full rent ledger with filters
  tenant/
    dashboard.html                 Tenant's room + current rent
    rent-history.html              All past payments
  supabase/
    functions/create-tenant/
      index.ts                     Server function for tenant invite
  sql/
    schema.sql                     Database setup (run once in Supabase)
```
