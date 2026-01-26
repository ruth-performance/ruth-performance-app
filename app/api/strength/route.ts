import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getProfileByEmail, upsertAssessmentProfile, tryAutoLinkToCoachCommand } from '@/lib/assessment-profile';
import { saveStrengthAssessment, getLatestStrengthAssessment } from '@/lib/assessments/strength';
import { analyzeStrength, StrengthData, parseWeight } from '@/lib/strength-data';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { email, strengthData } = await request.json();

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

    // Ensure profile has weight for analysis
    if (!profile.weight_lbs || !profile.gender) {
      return NextResponse.json({ error: 'Profile must have weight and gender set' }, { status: 400 });
    }

    // Analyze strength data to extract metrics
    const analysis = analyzeStrength(
      strengthData as StrengthData,
      profile.gender as 'male' | 'female',
      profile.weight_lbs,
      profile.height_inches || undefined
    );

    // Parse raw lift values for storage
    const data = strengthData as StrengthData;

    // Save to Supabase
    const assessment = await saveStrengthAssessment({
      profileId: profile.id,
      backSquat: parseWeight(data.backSquat) || undefined,
      frontSquat: parseWeight(data.frontSquat) || undefined,
      deadlift: parseWeight(data.deadlift) || undefined,
      clean: parseWeight(data.clean) || undefined,
      cleanAndJerk: parseWeight(data.cleanAndJerk) || undefined,
      snatch: parseWeight(data.snatch) || undefined,
      strictPress: parseWeight(data.strictPress) || undefined,
      pushPress: parseWeight(data.pushPress) || undefined,
      benchPress: parseWeight(data.benchPress) || undefined,
      // Calculated ratios
      frontToBackSquat: analysis.ratios.find(r => r.name === 'Front:Back Squat')?.actual || undefined,
      cleanToFrontSquat: analysis.ratios.find(r => r.name === 'Clean:Front Squat')?.actual || undefined,
      snatchToClean: analysis.ratios.find(r => r.name === 'Snatch:Clean')?.actual || undefined,
      jerkToClean: analysis.ratios.find(r => r.name === 'C&J:Clean')?.actual || undefined,
      deadliftToBackSquat: analysis.ratios.find(r => r.name === 'Deadlift:Back Squat')?.actual || undefined,
      // BW ratios
      backSquatToBw: analysis.lifts.backSquat?.bwRatio || undefined,
      deadliftToBw: analysis.lifts.deadlift?.bwRatio || undefined,
      cleanToBw: analysis.lifts.clean?.bwRatio || undefined,
      snatchToBw: analysis.lifts.snatch?.bwRatio || undefined,
      // Analysis data
      strengthPriorities: analysis.priorities,
      ratioAnalysis: analysis.ratios,
      rawData: strengthData,
    });

    return NextResponse.json({ success: true, assessmentId: assessment.id });
  } catch (error) {
    console.error('Strength save error:', error);
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
      return NextResponse.json({ strengthData: null });
    }

    // Get latest strength assessment
    const assessment = await getLatestStrengthAssessment(profile.id);

    if (assessment && assessment.raw_data) {
      return NextResponse.json({
        strengthData: assessment.raw_data,
        completedAt: assessment.created_at,
        assessmentId: assessment.id,
      });
    }

    return NextResponse.json({ strengthData: null });
  } catch (error) {
    console.error('Strength fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
