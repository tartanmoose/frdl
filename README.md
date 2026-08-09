# FRDL – Friends Rankings & Demon List

Online Geometry Dash friends stats + personal level rankings.

- **Everyone** can view the site
- **Only the admin** (your son) can add/remove friends, refresh stats, and manage the level ranking
- Simple password login — no email accounts needed

---

## What you need (all free)

1. A **GitHub** account (you already have one)
2. A **Vercel** account (sign up with GitHub — free)
3. A **Supabase** account (sign up free at [supabase.com](https://supabase.com))

---

## Setup (about 15–20 minutes)

### Step 1 – Create the Supabase database

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Pick a name (e.g. `frdl`), set a database password (save it), choose a region close to you
3. Wait for the project to finish creating
4. In the left menu open **SQL Editor** → **New query**
5. Copy **everything** from the file `supabase-schema.sql` in this project and paste it
6. Click **Run**
7. Go to **Project Settings** (gear icon) → **API**
8. Copy these three values (you’ll need them later):
   - **Project URL**
   - **anon public** key
   - **service_role** key (keep this secret — never share it)

### Step 2 – Put the code on GitHub

1. Create a **new repository** on GitHub (e.g. `frdl`)
2. Upload all the files from this folder into that repo  
   (or use GitHub Desktop / `git` if you prefer)

### Step 3 – Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and log in with GitHub
2. **Add New Project** → import your `frdl` repo
3. Before deploying, open **Environment Variables** and add:

| Name | Value |
|------|--------|
| `ADMIN_PASSWORD` | The password your son will use to log in (pick something he’ll remember) |
| `ADMIN_SECRET` | Any long random text (e.g. mash the keyboard for 30+ characters) |
| `SUPABASE_URL` | The Project URL from Supabase |
| `SUPABASE_ANON_KEY` | The anon public key from Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | The service_role key from Supabase |

4. Click **Deploy**

When it finishes you’ll get a free link like:

`https://frdl-xxxx.vercel.app`

That’s the public site. Share it with friends.

### Step 4 – First login

1. Open the site
2. Click **Admin login**
3. Enter the `ADMIN_PASSWORD` you set
4. You’re in admin mode — add friends, search levels, drag to reorder

The first time an admin loads the site with an empty friends list, **TheRealpeanutGD** is added automatically as a starter.

---

## How your son uses it

| Action | How |
|--------|-----|
| View rankings | Just open the link (no login) |
| Edit anything | Click **Admin login** → enter password |
| Add a friend | Friends tab → type username → **Add** |
| Refresh stats | **↻ Refresh** button |
| Rank a level | Level Rankings tab → search → pick placement → **Add Level** |
| Reorder levels | Drag the ⠿ handle |
| Log out | **Log out** button |

Login stays active for **7 days** on that browser.

---

## Changing the password later

In Vercel → your project → **Settings** → **Environment Variables** → edit `ADMIN_PASSWORD` → Redeploy.

---

## Optional: custom domain later

Vercel → Project → **Domains** → add your domain when you’re ready.

---

## Project structure

```
frdl/
  public/index.html     ← the website
  api/
    login.js            ← password check
    friends.js          ← friends data
    levels.js           ← level rankings
    _lib.js             ← shared helpers
  supabase-schema.sql   ← run once in Supabase
  package.json
  vercel.json
  .env.example
  README.md
```

---

## Local testing (optional)

```bash
npm install
# create .env.local with the same variables as above
npx vercel dev
```

Then open http://localhost:3000

---

Enjoy FRDL!
