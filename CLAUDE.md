# CLAUDE.md - Ruth Performance App

## Project Overview

Ruth Performance is a comprehensive athlete assessment platform designed for CrossFit athletes. It enables athletes to evaluate their movement proficiency, strength benchmarks, conditioning capacity, and mental skills through structured assessments, then exports results as professional PDF reports.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with custom Ruth theme colors
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT tokens with email/password + magic link via Resend
- **PDF Generation**: jsPDF
- **Charts**: Recharts (UI), custom drawing functions (PDF)
- **Icons**: Lucide React
- **Hosting**: Vercel

## Project Structure

```
ruth-performance-app/
├── app/                          # Next.js App Router pages
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── login/           # Email + password login
│   │   │   ├── logout/          # Session termination
│   │   │   ├── me/              # Get current user
│   │   │   ├── send-magic-link/ # Passwordless auth
│   │   │   ├── signup/          # Account creation
│   │   │   └── verify/          # Magic link verification
│   │   ├── conditioning/        # Conditioning assessment CRUD
│   │   ├── export-pdf/          # PDF report generation
│   │   │   ├── route.ts         # PDF generation endpoint
│   │   │   └── charts.ts        # Custom chart drawing for PDF
│   │   ├── goals/               # Goals assessment CRUD
│   │   ├── movement/            # Movement assessment CRUD
│   │   ├── profile/             # User profile CRUD
│   │   └── strength/            # Strength assessment CRUD
│   ├── conditioning/            # Conditioning assessment module
│   ├── dashboard/               # Main dashboard page
│   ├── fitness/                 # Fitness testing (placeholder)
│   ├── goals/                   # Goals assessment module
│   ├── login/                   # Login page
│   ├── movement/                # Movement assessment module
│   │   └── components/          # Movement-specific components
│   ├── profile/                 # Profile management
│   ├── signup/                  # Registration page
│   ├── strength/                # Strength assessment module
│   ├── globals.css              # Global styles + Tailwind
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home (redirects based on auth)
├── components/                   # Shared components
│   ├── ExportPdfButton.tsx      # PDF export trigger
│   ├── ModuleCard.tsx           # Dashboard module cards
│   └── Navbar.tsx               # Navigation bar
├── lib/                          # Shared utilities and data
│   ├── assessments/             # Assessment-specific Supabase operations
│   │   ├── conditioning.ts
│   │   ├── goals.ts
│   │   ├── movement.ts
│   │   └── strength.ts
│   ├── assessment-profile.ts    # Profile CRUD operations
│   ├── auth.ts                  # JWT token management
│   ├── conditioning-data.ts     # Conditioning constants/formulas
│   ├── goals-data.ts            # Goals assessment data structures
│   ├── movement-analysis.ts     # Movement priority scoring
│   ├── movement-data.ts         # Movement definitions + frequencies
│   ├── sheets.ts                # Google Sheets (legacy, kept for migration)
│   ├── strength-data.ts         # Strength benchmarks/ratios
│   └── supabase.ts              # Supabase client setup
├── tailwind.config.ts           # Tailwind + Ruth theme colors
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies and scripts
```

## Key Conventions

### Styling

The app uses a dark theme with custom Ruth brand colors defined in `tailwind.config.ts`:

```typescript
colors: {
  'ruth': {
    'cyan': '#06b6d4',    // Primary accent
    'green': '#10b981',   // Secondary accent
    'dark': '#0a0a0f',    // Background
    'card': '#111118',    // Card backgrounds
    'border': '#1e1e2e',  // Borders
  }
}
```

Custom CSS classes in `globals.css`:
- `.text-gradient` - Cyan-to-green gradient text
- `.card-hover` - Hover effects for cards
- `.bg-gradient-ruth` - Background gradient

### Authentication Flow

1. **Password Auth**: Email + password stored in `user_credentials` table (bcrypt hashed)
2. **Magic Link**: Email via Resend, 15-minute expiry tokens
3. **Session**: JWT stored in `auth_token` httpOnly cookie, 7-day expiry
4. **Protected Routes**: Use `getCurrentUser()` from `lib/auth.ts` to check auth

### Data Flow Pattern

Each assessment module follows this pattern:

1. **Page** (Server Component): Checks auth, loads profile, fetches existing data
2. **Assessment Component** (Client): Multi-step form with state management
3. **API Route**: Validates auth, saves to Supabase, returns result
4. **Assessment Module** (`lib/assessments/*.ts`): Supabase queries

### Supabase Tables

- `user_credentials` - Email + password_hash for authentication
- `assessment_profiles` - Athlete profiles (email, name, gender, weight, tier)
- `movement_assessments` - Movement confidence ratings + priorities
- `movement_priorities` - Ranked movement weaknesses (linked to assessment)
- `strength_assessments` - Lift numbers + ratios + priorities
- `conditioning_assessments` - Speed data + training zones
- `goals_assessments` - Values, goals, obstacles, mental skills

### Assessment Modules

| Module | Purpose | Key Data |
|--------|---------|----------|
| Movement | Rate confidence (1-5) across ~40 movements | Categories: Basic CF, Gymnastics, DB, Barbell with loading zones |
| Strength | Enter 1RM lifts for comparison to elite benchmarks | Back Squat, Front Squat, Deadlift, Clean, Snatch, etc. |
| Conditioning | Speed curves for Row, Run, Echo Bike | Critical Power/Velocity, training zones |
| Goals | Values alignment, outcome goals, mental skills | Spider chart for 7 mental skill categories |

### PDF Export

The PDF export (`/api/export-pdf`) generates a 4-page report using jsPDF with:
- Custom chart rendering functions in `charts.ts`
- Movement heat map, strength bar charts, speed curves, mental skills spider chart
- Dark theme matching the web UI

## Development Commands

```bash
npm install     # Install dependencies
npm run dev     # Start development server (http://localhost:3000)
npm run build   # Production build
npm run start   # Start production server
npm run lint    # Run ESLint
```

## Environment Variables

Required in `.env.local` (see `.env.local.example`):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Authentication
RESEND_API_KEY=your-resend-api-key
JWT_SECRET=your-jwt-secret
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Google Sheets (legacy - optional)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GOOGLE_SHEET_ID=your-sheet-id
```

## Common Patterns

### Adding a New Assessment Module

1. Create data types in `lib/assessments/[module].ts`
2. Create Supabase table and add save/get functions
3. Create page at `app/[module]/page.tsx` (server component)
4. Create assessment component `app/[module]/[Module]Assessment.tsx` (client)
5. Create API routes at `app/api/[module]/route.ts`
6. Add module card to dashboard in `app/dashboard/page.tsx`

### Protected API Route Pattern

```typescript
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  // ... handle request
}
```

### Protected Page Pattern

```typescript
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default async function ProtectedPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  // ... render page
}
```

## Important Notes

1. **Profile Required**: Movement, Strength, and Conditioning assessments require profile completion (at minimum: gender)
2. **Competition Tier**: Affects priority scoring for movements based on frequency data
3. **Loading Zones**: DB and Barbell movements have Light/Moderate/Heavy zones with different weights by gender
4. **Legacy Google Sheets**: The `lib/sheets.ts` code is kept for migration but Supabase is the primary database
5. **Coach Command Integration**: Profiles can auto-link to Coach Command CRM via `coach_command_athlete_id`

## Deployment

Push to `main` branch triggers Vercel auto-deployment. Ensure all environment variables are set in Vercel project settings.
