import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getProfileByEmail, upsertAssessmentProfile, tryAutoLinkToCoachCommand } from '@/lib/assessment-profile';
import { saveMovementAssessment, getLatestMovementAssessment, MovementPriority } from '@/lib/assessments/movement';
import { analyzeMovementData } from '@/lib/movement-analysis';

// Google Sheets imports - kept for reference/rollback
// import { saveSheetData, ensureSheetHeaders, getSheetData } from '@/lib/sheets';
// const MOVEMENT_HEADERS = ['email', 'movementData', 'completedAt', 'updatedAt'];

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { email, movementData, competitionTier } = await request.json();

    // Ensure email matches authenticated user
    if (email !== user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get or create assessment profile in Supabase
    let profile = await getProfileByEmail(email);
    if (!profile) {
      profile = await upsertAssessmentProfile({
        email: email,
        competition_tier: competitionTier,
      });
      // Try to auto-link to Coach Command if the athlete exists there
      await tryAutoLinkToCoachCommand(profile.id, email);
    }

    // Analyze movement data to extract metrics
    const analysis = analyzeMovementData(movementData, competitionTier || 'open');

    // Build priorities from weaknesses
    const priorities: MovementPriority[] = analysis.weaknesses.slice(0, 10).map((w, index) => ({
      rank: index + 1,
      movementId: w.name.toLowerCase().replace(/\s+/g, '_'),
      movementName: w.name,
      category: w.category,
      confidenceRating: w.confidence,
      priorityScore: w.priority,
    }));

    // Save to Supabase
    const assessment = await saveMovementAssessment({
      profileId: profile.id,
      overallAverage: analysis.overallAverage,
      basicCfAverage: analysis.categoryAverages['Basic CF'] || 0,
      gymnasticsAverage: analysis.categoryAverages['Gymnastics'] || 0,
      dumbbellAverage: analysis.categoryAverages['Dumbbell'] || 0,
      barbellAverage: analysis.categoryAverages['Barbell'] || 0,
      totalMovementsRated: analysis.completedMovements,
      strengthsCount: analysis.strengths.length,
      weaknessesCount: analysis.weaknesses.length,
      rawData: movementData,
      priorities,
    });

    // Google Sheets backup - commented out, can uncomment for dual-write during transition
    // await ensureSheetHeaders('movement', MOVEMENT_HEADERS);
    // await saveSheetData('movement', email, {
    //   movementData: JSON.stringify(movementData),
    //   completedAt: new Date().toISOString(),
    // });

    return NextResponse.json({ success: true, assessmentId: assessment.id });
  } catch (error) {
    console.error('Movement save error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Get profile from Supabase
    const profile = await getProfileByEmail(user.email);

    if (!profile) {
      return NextResponse.json({ movementData: null });
    }

    // Get latest movement assessment
    const assessment = await getLatestMovementAssessment(profile.id);

    if (assessment && assessment.raw_data) {
      return NextResponse.json({
        movementData: assessment.raw_data,
        completedAt: assessment.created_at,
        assessmentId: assessment.id,
      });
    }

    // Fallback to Google Sheets if no Supabase data - for migration period
    // const data = await getSheetData('movement', user.email);
    // if (data && data.movementData) {
    //   return NextResponse.json({
    //     movementData: JSON.parse(data.movementData),
    //     completedAt: data.completedAt,
    //     updatedAt: data.updatedAt,
    //   });
    // }

    return NextResponse.json({ movementData: null });
  } catch (error) {
    console.error('Movement fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
