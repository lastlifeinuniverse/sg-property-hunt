# SG Property Hunt

Structured private resale property search tool for Singapore — built with Next.js + Supabase.

## Setup (15 minutes)

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Name it `sg-property-hunt`, pick Southeast Asia region
3. Wait ~2 min for it to spin up

### 2. Run the database schema

1. Supabase dashboard → **SQL Editor** → **New query**
2. Paste the full contents of `supabase/schema.sql`
3. Click **Run**

### 3. Get your Supabase keys

Supabase → **Project Settings** → **API**:
- Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. Set environment variables

```bash
cp .env.local.example .env.local
# Edit .env.local and paste your keys
```

### 5. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel (share with your friend)

```bash
# 1. Push to GitHub
git init && git add . && git commit -m "initial"
gh repo create sg-property-hunt --private --push --source=.
```

2. Go to [vercel.com](https://vercel.com) → **New Project** → Import from GitHub
3. Add environment variables: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy** — you get a shareable public URL instantly

---

## Pages

| Page | What it does |
|---|---|
| `/` | Dashboard — top picks by score, stats |
| `/listings` | All listings with filters + sort |
| `/listings/[id]` | Detail, like/dislike rating, notes link |
| `/view/[id]` | **Mobile-first** post-viewing notes form |
| `/compare` | Side-by-side of up to 4 listings |
| `/criteria` | Score weights + hard filters |
| `/add` | Manually add a listing |

## Scoring

Each listing gets a **0–100 score** across 4 weighted dimensions (tune in `/criteria`):

| Dimension | Default weight | What it measures |
|---|---|---|
| Location | 25% | District preference, tenure |
| Price | 25% | vs budget, vs district PSF benchmark |
| Unit | 25% | Floor, size, facing, TOP year |
| Condition | 25% | Post-viewing scores (neutral 50 before visit) |

## PSF Benchmarks

Get from [URA REALIS](https://www.ura.gov.sg/reis/index) → filter by project → last 12 months → note median PSF.  
Enter in `/criteria` → PSF Benchmarks as: `D10:1800, D15:1500`

## Next steps after MVP

- [ ] Scraper to auto-pull from PropertyGuru / 99.co
- [ ] Photo upload in viewing notes (Supabase Storage)
- [ ] URA REALIS API for live PSF benchmarks
- [ ] Supabase Auth for multi-user access
- [ ] Voice-to-text for on-site notes (Web Speech API)
