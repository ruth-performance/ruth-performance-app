import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { upsertAssessmentProfile, getProfileByEmail, tryAutoLinkToCoachCommand } from '@/lib/assessment-profile';

// Google Sheets imports - kept for reference/rollback
// import { upsertAthlete } from '@/lib/sheets';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const data = await request.json();

    // Ensure email matches authenticated user
    if (data.email !== user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Save to Supabase
    const profile = await upsertAssessmentProfile({
      email: data.email,
      name: data.name,
      gender: data.gender,
      weight_lbs: data.weight,
      height_inches: data.height,
      competition_tier: data.competitionTier,
    });

    // Try to auto-link to Coach Command if not already linked
    if (!profile.coach_command_athlete_id) {
      await tryAutoLinkToCoachCommand(profile.id, data.email);
    }

    // Google Sheets backup - commented out, can uncomment for dual-write during transition
    // await upsertAthlete({
    //   email: data.email,
    //   name: data.name,
    //   gender: data.gender,
    //   weight: data.weight,
    //   height: data.height,
    //   competitionTier: data.competitionTier,
    // });

    return NextResponse.json({ success: true, profileId: profile.id });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const profile = await getProfileByEmail(user.email);

    if (profile) {
      return NextResponse.json({
        email: profile.email,
        name: profile.name,
        gender: profile.gender,
        weight: profile.weight_lbs,
        height: profile.height_inches,
        competitionTier: profile.competition_tier,
        coachCommandLinked: !!profile.coach_command_athlete_id,
      });
    }

    return NextResponse.json({ profile: null });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
