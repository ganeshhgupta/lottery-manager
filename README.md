# LotteryAudit

A lottery ticket inventory auditing system for retail stores. Built with Next.js 14 App Router, TypeScript, and Tailwind CSS.

## Features

- 24-slot ticket inventory dashboard with Texas Lottery ticket images
- Shift-based closing entries (Morning / Day / Night) with server-side time validation
- Version history — page through every previous closing entry
- Automatic flagging when ticket count increases (possible restocking event)
- Google Sheets append-only backup log
- Role-based access: employees submit closings, managers manage tickets and staff
- Session-cookie authentication via iron-session

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in the values:

```bash
cp .env.local.example .env.local
```

| Variable | Description |
|---|---|
| `SESSION_SECRET` | A random 32+ character string for signing session cookies |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Full JSON key of your Google service account (optional) |

Generate a session secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Google Sheets backup (optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com) → IAM & Admin → Service Accounts
2. Create a service account, then create a JSON key
3. Paste the entire JSON key as the value of `GOOGLE_SERVICE_ACCOUNT_JSON` in `.env.local`
4. Open your Google Sheet (`1w3oXVXXA_VDs4WoJnN28EcGVckl6C6FvHaJAQ3ViQso`) and share it with the service account's `client_email` as **Editor**

If the env var is not set, closing entries are still saved locally — the sheet backup is skipped silently.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Default login

| Field | Value |
|---|---|
| Employee ID | `1` |
| PIN | `9530` |
| Role | Manager |

After logging in, go to **Manager Panel** to add employee accounts.

## Data storage

All data is stored in `lib/data.json`. This file is the source of truth and should **not** be in `.gitignore`. For production, consider a real database.

## Shift time rules (server-enforced)

| Shift | Hours |
|---|---|
| Morning | 5:00 AM – 12:59 PM |
| Day | 1:00 PM – 8:59 PM |
| Night | 9:00 PM – 4:59 AM |

