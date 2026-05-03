# Daily2Odds — Setup & Deployment Guide

## কী বানিয়েছি

- **Landing page** — picks দেখা, stats, FAQ
- **Proof page** — `/proof/D2O-2026-000001` — প্রতিটি pick-এর permanent public page
- **Admin dashboard** — `/admin` — pick create, settle করা
- **API routes** — picks, settle, stats
- **Telegram bot** — /today, /stats, /history, /settle
- **Locked proof logic** — event start হলে auto-lock, সব edit logged
- **Stats calculation** — ROI, win rate, transparency score

---

## Step 1: Project তৈরি

```bash
# GitHub-এ একটি নতুন repository তৈরি করো: daily2odds

# Local machine-এ:
git clone https://github.com/YOUR_USERNAME/daily2odds.git
cd daily2odds

# এই folder-এর সব files কপি করো
```

## Step 2: Dependencies Install

```bash
npm install
```

## Step 3: Supabase Setup

1. [supabase.com](https://supabase.com) → New project তৈরি করো
2. Project তৈরি হলে: **Settings → Database → Connection string → URI** copy করো
3. `.env.local.example` কে `.env.local` নামে copy করো:

```bash
cp .env.local.example .env.local
```

4. `.env.local` খুলে `DATABASE_URL` paste করো

## Step 4: Database তৈরি

```bash
npm run db:generate   # Prisma client generate করবে
npm run db:push       # Database-এ tables তৈরি হবে
```

কাজ হলে এই message দেখবে:
```
✓ Generated Prisma Client
✓ Your database is now in sync with your Prisma schema.
```

## Step 5: Admin Secret সেট করো

`.env.local` তে:
```
ADMIN_SECRET="যেকোনো-random-strong-password-লেখো"
NEXT_PUBLIC_URL="http://localhost:3000"  # dev-এ
```

## Step 6: Local-এ Test করো

```bash
npm run dev
```

Browser-এ খোলো: `http://localhost:3000`

**Admin panel test:** `http://localhost:3000/admin`
- Secret দিয়ে login করো
- একটি test pick তৈরি করো
- Proof page দেখো: `/proof/D2O-2026-000001`

---

## Step 7: Vercel Deploy

```bash
# Vercel CLI install
npm install -g vercel

# Deploy
vercel

# Follow the prompts:
# - Link to your GitHub repo
# - Framework: Next.js (auto-detected)
```

Vercel dashboard → Settings → Environment Variables এ add করো:
```
DATABASE_URL = [Supabase connection string]
ADMIN_SECRET = [তোমার secret]
NEXT_PUBLIC_URL = https://your-project.vercel.app
```

তারপর redeploy:
```bash
vercel --prod
```

---

## Step 8: Telegram Bot Setup

1. Telegram-এ @BotFather → `/newbot` → নাম দাও
2. Bot token copy করো
3. `.env.local` তে:
   ```
   TELEGRAM_BOT_TOKEN=your_token_here
   ADMIN_TELEGRAM_CHAT_ID=your_chat_id
   ```
   (chat ID পেতে: @userinfobot কে message করো)

4. Bot চালাও (local বা VPS-এ):
   ```bash
   npm install ts-node -g
   npm run bot
   ```

---

## API Reference

### Create a pick (Admin only)

```bash
curl -X POST https://your-site.vercel.app/api/picks \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: YOUR_SECRET" \
  -d '{
    "sport": "TENNIS",
    "matchName": "Alcaraz vs Sinner",
    "pickType": "Match Winner",
    "selection": "Alcaraz ML",
    "odds": 1.65,
    "stakeUnit": 1,
    "riskLevel": "MEDIUM",
    "eventStartTime": "2026-05-10T14:00:00.000Z"
  }'
```

Response:
```json
{
  "pick": { "proofId": "D2O-2026-000001", ... },
  "proofUrl": "/proof/D2O-2026-000001"
}
```

### Settle a pick

```bash
curl -X POST https://your-site.vercel.app/api/picks/settle \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: YOUR_SECRET" \
  -d '{
    "pickId": "cuid_from_database",
    "status": "WON",
    "resultNote": "Alcaraz won in straight sets",
    "sourceLink": "https://atptour.com/..."
  }'
```

### Get stats

```bash
curl https://your-site.vercel.app/api/stats
curl https://your-site.vercel.app/api/stats?year=2026&month=5
```

---

## Common Errors & Fixes

| Error | Fix |
|-------|-----|
| `PrismaClientInitializationError` | DATABASE_URL ঠিকমতো set হয়নি |
| `401 Unauthorized` | ADMIN_SECRET header পাঠাওনি |
| `Pick is locked` | Event start time পেরিয়ে গেছে, edit করা যাবে না |
| `Cannot cancel after event start` | Match শুরু হয়ে গেছে |
| Bot না চললে | TELEGRAM_BOT_TOKEN ঠিক আছে কিনা দেখো |

---

## File Structure Summary

```
daily2odds/
├── prisma/
│   └── schema.prisma          ← Database tables
├── src/
│   ├── app/
│   │   ├── page.tsx           ← Landing page
│   │   ├── admin/page.tsx     ← Admin dashboard
│   │   ├── proof/[proofId]/   ← Public proof page
│   │   ├── api/picks/         ← Create/list API
│   │   ├── api/picks/settle/  ← Settle API
│   │   └── api/stats/         ← Stats API
│   └── lib/
│       ├── proof.ts           ← Core locked proof logic
│       ├── stats.ts           ← Stats calculation
│       └── prisma.ts          ← DB client
├── bot/
│   └── index.ts               ← Telegram bot
├── .env.local.example
└── package.json
```

---

## Next Steps (Phase 2)

- [ ] Email/password admin login (NextAuth)
- [ ] Today's picks page (`/today`)
- [ ] History page (`/history`) with pagination
- [ ] Monthly stats page (`/stats`)
- [ ] Telegram group auto-post on pick creation
- [ ] Edit pick before start (currently API-only)
- [ ] Auto-lock cron job (Vercel cron)
- [ ] Public profile page
- [ ] UFC, Badminton support
