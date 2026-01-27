import { renderToBuffer } from '@react-pdf/renderer';
import { AthleteReport } from '@/lib/pdf/AthleteReport';
import { getProfileByEmail } from '@/lib/assessment-profile';
import { getCurrentUser } from '@/lib/auth';
import { getLatestMovementAssessment, getMovementPriorities } from '@/lib/assessments/movement';
import { getLatestStrengthAssessment } from '@/lib/assessments/strength';
import { getLatestGoalsAssessment } from '@/lib/assessments/goals';

export async function GET() {
  try {
    // Auth guard
    const user = await getCurrentUser();
    if (!user) {
      return new Response('Not authenticated', { status: 401 });
    }

    const email = user.email;

    // Get profile
    const profile = await getProfileByEmail(email);
    if (!profile) {
      return new Response('Profile not found', { status: 404 });
    }

    // Get movement assessment and priorities
    let movementPriorities: Array<{
      rank: number;
      movement_name: string;
      category: string;
    }> = [];

    const movementAssessment = await getLatestMovementAssessment(profile.id);
    if (movementAssessment) {
      const priorities = await getMovementPriorities(movementAssessment.id);
      movementPriorities = priorities?.map((p) => ({
        rank: p.rank,
        movement_name: p.movement_name,
        category: p.category,
      })) || [];
    }

    // Get strength assessment
    const strengthAssessment = await getLatestStrengthAssessment(profile.id);

    // Get goals assessment
    const goalsAssessment = await getLatestGoalsAssessment(profile.id);

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      <AthleteReport
        profile={{
          name: profile.name || 'Athlete',
          email: profile.email,
          gender: profile.gender,
          weight_lbs: profile.weight_lbs,
          height_inches: profile.height_inches,
          competition_tier: profile.competition_tier,
        }}
        movementPriorities={movementPriorities}
        strengthPriorities={strengthAssessment?.strength_priorities as Array<{
          rank: number;
          lift: string;
          gap15?: number;
          rationale?: string;
        }> | undefined}
        strengthData={strengthAssessment ? {
          back_squat: strengthAssessment.back_squat,
          front_squat: strengthAssessment.front_squat,
          deadlift: strengthAssessment.deadlift,
          clean: strengthAssessment.clean,
          clean_and_jerk: strengthAssessment.clean_and_jerk,
          snatch: strengthAssessment.snatch,
          strict_press: strengthAssessment.strict_press,
          push_press: strengthAssessment.push_press,
          bench_press: strengthAssessment.bench_press,
        } : undefined}
        goalsData={goalsAssessment ? {
          athlete_type: goalsAssessment.athlete_type,
          athlete_type_description: goalsAssessment.athlete_type_description,
          outcome_goals: goalsAssessment.outcome_goals,
          performance_goals: goalsAssessment.performance_goals,
          obstacles: goalsAssessment.obstacles,
          process_goals: goalsAssessment.process_goals,
          mental_strengths: goalsAssessment.mental_strengths,
          development_areas: goalsAssessment.development_areas,
        } : undefined}
        generatedDate={new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      />
    );

    // Return PDF
    const fileName = profile.name
      ? `${profile.name.replace(/\s+/g, '_')}_Report.pdf`
      : 'Athlete_Report.pdf';

    // Convert Buffer to Uint8Array for Response compatibility
    const uint8Array = new Uint8Array(pdfBuffer);

    return new Response(uint8Array, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return new Response('Failed to generate PDF', { status: 500 });
  }
}
