# Ruth Performance

Comprehensive athlete assessment platform for CrossFit athletes.

## Modules

- **Movement Assessment** - Confidence ratings across movement categories
- **Strength Assessment** - Elite benchmarks and lift ratio analysis
- **Conditioning Assessment** - Speed curves and critical power analysis
- **Fitness Testing** - Tiered testing from Open to Games level
- **Goal Setting** - Values alignment and mental skills assessment

## Tech Stack

- **Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **Database**: Google Sheets
- **Authentication**: Magic links via Resend
- **Hosting**: Vercel

## Environment Variables

Required in Vercel:
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SHEET_ID`
- `GOOGLE_PRIVATE_KEY`
- `RESEND_API_KEY`
- `JWT_SECRET`
- `NEXT_PUBLIC_BASE_URL`

## Development

```bash
npm install
npm run dev
```

## Deployment

Push to `main` branch - Vercel auto-deploys.
