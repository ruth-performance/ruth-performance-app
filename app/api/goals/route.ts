import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getProfileByEmail, upsertAssessmentProfile, tryAutoLinkToCoachCommand } from '@/lib/assessment-profile';
import { saveGoalsAssessment, getLatestGoalsAssessment } from '@/lib/assessments/goals';
import { analyzeGoals, GoalsData } from '@/lib/goals-data';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { email, goalsData } = await request.json();

    // Ensure email matches authenticated user
    if (email !== user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get or create assessment profile in Supabase
    let profile = await getProfileByEmail(email);
    if (!profile) {
      profile = await upsertAssessmentProfile({ email });
      await tryAutoLinkToCoachCommand(profile.id, email);
    }

    // Cast and analyze goals data
    const data = goalsData as GoalsData;
    const analysis = analyzeGoals(data);

    // Save to Supabase
    const assessment = await saveGoalsAssessment({
      profileId: profile.id,
      primaryGoal: data.outcomeGoals[0]?.goal || undefined,
      selectedValues: data.selectedValues,
      valuesReflections: data.valuesReflections,
      outcomeGoals: data.outcomeGoals,
      valueAlignment: data.valueAlignment,
      valueExplanations: data.valueExplanations,
      performanceGoals: data.performanceGoals,
      obstacles: data.obstacles,
      processGoals: data.processGoals,
      mentalSkillRatings: data.mentalSkillRatings,
      athleteType: analysis.athleteType.name,
      athleteTypeDescription: analysis.athleteType.description,
      mentalSkillsAverage: analysis.mentalSkillsAverage,
      mentalStrengths: analysis.mentalStrengths,
      developmentAreas: analysis.developmentAreas,
      rawData: goalsData,
    });

    return NextResponse.json({
      success: true,
      assessmentId: assessment.id,
      analysis
    });
  } catch (error) {
    console.error('Goals save error:', error);
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
      return NextResponse.json({ goalsData: null });
    }

    // Get latest goals assessment
    const assessment = await getLatestGoalsAssessment(profile.id);

    if (assessment && assessment.raw_data) {
      return NextResponse.json({
        goalsData: assessment.raw_data,
        completedAt: assessment.created_at,
        assessmentId: assessment.id,
        analysis: {
          athleteType: {
            name: assessment.athlete_type,
            description: assessment.athlete_type_description
          },
          mentalSkillsAverage: assessment.mental_skills_average,
          mentalStrengths: assessment.mental_strengths,
          developmentAreas: assessment.development_areas
        }
      });
    }

    return NextResponse.json({ goalsData: null });
  } catch (error) {
    console.error('Goals fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
