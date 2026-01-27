import { jsPDF } from 'jspdf';
import { getProfileByEmail } from '@/lib/assessment-profile';
import { getCurrentUser } from '@/lib/auth';
import { getLatestMovementAssessment, getMovementPriorities } from '@/lib/assessments/movement';
import { getLatestStrengthAssessment } from '@/lib/assessments/strength';
import { getLatestGoalsAssessment } from '@/lib/assessments/goals';

export const dynamic = 'force-dynamic';

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
    let movementPriorities: Array<{ rank: number; movement_name: string }> = [];
    const movementAssessment = await getLatestMovementAssessment(profile.id);
    if (movementAssessment) {
      const priorities = await getMovementPriorities(movementAssessment.id);
      movementPriorities = priorities?.map((p) => ({
        rank: p.rank,
        movement_name: p.movement_name,
      })) || [];
    }

    // Get strength assessment
    const strengthAssessment = await getLatestStrengthAssessment(profile.id);

    // Get goals assessment
    const goalsAssessment = await getLatestGoalsAssessment(profile.id);

    // Generate PDF with jsPDF
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    // Colors (RGB tuples)
    const orange: [number, number, number] = [249, 115, 22];
    const darkGray: [number, number, number] = [30, 41, 59];
    const medGray: [number, number, number] = [100, 116, 139];
    const green: [number, number, number] = [22, 163, 74];
    const red: [number, number, number] = [220, 38, 38];

    // Helper functions
    const addSubtitle = (text: string) => {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...orange);
      doc.text(text.toUpperCase(), margin, y);
      y += 8;
    };

    const addText = (text: string, indent = 0) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...darkGray);
      const lines = doc.splitTextToSize(text, contentWidth - indent);
      doc.text(lines, margin + indent, y);
      y += lines.length * 5;
    };

    const addSpace = (space = 8) => {
      y += space;
    };

    const checkNewPage = () => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    };

    // === HEADER ===
    doc.setFillColor(...darkGray);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setFillColor(...orange);
    doc.rect(0, 40, pageWidth, 3, 'F');

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(profile.name || 'Athlete', margin, 18);

    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    const tierText = profile.competition_tier
      ? `${profile.competition_tier.charAt(0).toUpperCase() + profile.competition_tier.slice(1)} Athlete`
      : 'Athlete';
    const weightText = profile.weight_lbs ? ` • ${profile.weight_lbs}lbs` : '';
    doc.text(`${tierText}${weightText}`, margin, 28);

    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc.text(`Generated: ${dateStr}`, margin, 35);

    y = 55;

    // === SPORT PRIORITIES ===
    addSubtitle('Sport Priorities');
    if (movementPriorities.length > 0) {
      movementPriorities.slice(0, 10).forEach((p, i) => {
        checkNewPage();
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...darkGray);
        doc.text(`${p.rank || i + 1}. ${p.movement_name}`, margin + 5, y);
        y += 6;
      });
    } else {
      addText('No movement assessment completed', 5);
    }
    addSpace(10);

    // === STRENGTH PRIORITIES ===
    checkNewPage();
    addSubtitle('Strength Priorities');
    const strengthPriorities = strengthAssessment?.strength_priorities as
      | Array<{ rank: number; lift: string; gap15?: number }>
      | undefined;
    if (strengthPriorities && strengthPriorities.length > 0) {
      strengthPriorities.slice(0, 5).forEach((p, i) => {
        checkNewPage();
        const gap = p.gap15 && p.gap15 > 0 ? ` (+${p.gap15} lb)` : '';
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...darkGray);
        doc.text(`${p.rank || i + 1}. ${p.lift}${gap}`, margin + 5, y);
        y += 6;
      });
    } else {
      addText('No strength assessment completed', 5);
    }
    addSpace(10);

    // === 1RM TABLE ===
    checkNewPage();
    addSubtitle('Current 1RMs');
    if (strengthAssessment) {
      const lifts: [string, number | undefined][] = [
        ['Back Squat', strengthAssessment.back_squat],
        ['Front Squat', strengthAssessment.front_squat],
        ['Deadlift', strengthAssessment.deadlift],
        ['Clean', strengthAssessment.clean],
        ['Clean & Jerk', strengthAssessment.clean_and_jerk],
        ['Snatch', strengthAssessment.snatch],
        ['Strict Press', strengthAssessment.strict_press],
        ['Push Press', strengthAssessment.push_press],
        ['Bench Press', strengthAssessment.bench_press],
      ];

      lifts.forEach(([name, value]) => {
        if (value) {
          doc.setFontSize(10);
          doc.setTextColor(...medGray);
          doc.text(name, margin + 5, y);
          doc.setTextColor(...darkGray);
          doc.setFont('helvetica', 'bold');
          doc.text(`${value} lb`, margin + 50, y);
          doc.setFont('helvetica', 'normal');
          y += 6;
        }
      });
    } else {
      addText('No strength assessment completed', 5);
    }
    addSpace(10);

    // === ATHLETE PROFILE ===
    if (goalsAssessment?.athlete_type) {
      checkNewPage();
      addSubtitle('Athlete Profile');

      // Archetype box
      doc.setFillColor(245, 245, 250);
      doc.roundedRect(margin, y - 2, contentWidth, 25, 3, 3, 'F');

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...orange);
      doc.text(goalsAssessment.athlete_type, margin + 5, y + 6);

      if (goalsAssessment.athlete_type_description) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(...medGray);
        const descLines = doc.splitTextToSize(
          goalsAssessment.athlete_type_description,
          contentWidth - 10
        );
        doc.text(descLines, margin + 5, y + 14);
      }
      y += 30;
      addSpace(5);
    }

    // === GOALS ===
    if (goalsAssessment?.outcome_goals && goalsAssessment.outcome_goals.length > 0) {
      checkNewPage();
      addSubtitle('Goals');

      goalsAssessment.outcome_goals.forEach(
        (goal: { id?: string; goal: string; date: string }, i: number) => {
          checkNewPage();
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...darkGray);
          doc.text(`> ${goal.goal}`, margin + 5, y);
          y += 5;

          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...orange);
          doc.text(`Target: ${goal.date}`, margin + 10, y);
          y += 7;

          // Benchmarks - try both id-based and index-based keys
          const goalKey = goal.id || `goal-${i + 1}`;
          const benchmarks =
            goalsAssessment.performance_goals?.[goalKey] ||
            goalsAssessment.performance_goals?.[`goal-${i + 1}`] ||
            [];
          if (benchmarks.length > 0) {
            doc.setTextColor(...green);
            benchmarks.forEach((b: string) => {
              doc.text(`+ ${b}`, margin + 10, y);
              y += 5;
            });
          }

          // Obstacles - try both id-based and index-based keys
          const obstacles =
            goalsAssessment.obstacles?.[goalKey] ||
            goalsAssessment.obstacles?.[`goal-${i + 1}`] ||
            [];
          if (obstacles.length > 0) {
            doc.setTextColor(...red);
            obstacles.forEach((o: string) => {
              doc.text(`! ${o}`, margin + 10, y);
              y += 5;
            });
          }

          y += 5;
        }
      );
      addSpace(5);
    }

    // === PROCESS GOALS ===
    if (goalsAssessment?.process_goals && goalsAssessment.process_goals.length > 0) {
      checkNewPage();
      addSubtitle('Process Goals (Habits)');

      goalsAssessment.process_goals.forEach(
        (habit: { action: string; frequency: string; when: string }) => {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...darkGray);
          doc.text(`* ${habit.action} (${habit.frequency})`, margin + 5, y);
          y += 5;
          doc.setFontSize(9);
          doc.setTextColor(...medGray);
          doc.text(`When: ${habit.when}`, margin + 10, y);
          y += 6;
        }
      );
      addSpace(5);
    }

    // === MENTAL SKILLS ===
    if (goalsAssessment?.mental_strengths || goalsAssessment?.development_areas) {
      checkNewPage();
      addSubtitle('Mental Skills');

      const formatSkill = (key: string) => {
        const names: Record<string, string> = {
          coping: 'Coping with Adversity',
          peaking: 'Peaking Under Pressure',
          goalSetting: 'Goal Setting',
          concentration: 'Concentration',
          freedomFromWorry: 'Freedom from Worry',
          confidence: 'Confidence',
          coachability: 'Coachability',
        };
        return names[key] || key;
      };

      if (goalsAssessment.mental_strengths?.length > 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...green);
        doc.text('Strengths:', margin + 5, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        goalsAssessment.mental_strengths.forEach((s: string) => {
          doc.text(`+ ${formatSkill(s)}`, margin + 10, y);
          y += 5;
        });
        y += 3;
      }

      if (goalsAssessment.development_areas?.length > 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...red);
        doc.text('Development Areas:', margin + 5, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        goalsAssessment.development_areas.forEach((s: string) => {
          doc.text(`! ${formatSkill(s)}`, margin + 10, y);
          y += 5;
        });
      }
    }

    // === FOOTER ===
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(...medGray);
      doc.text(
        `Ruth Performance Lab • ${profile.email} • Page ${i} of ${totalPages}`,
        pageWidth / 2,
        290,
        { align: 'center' }
      );
    }

    // Return PDF as buffer
    const pdfArrayBuffer = doc.output('arraybuffer');
    const pdfBuffer = new Uint8Array(pdfArrayBuffer);

    const fileName = profile.name
      ? `${profile.name.replace(/\s+/g, '_')}_Report.pdf`
      : 'Athlete_Report.pdf';

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return new Response(`Failed to generate PDF: ${error}`, { status: 500 });
  }
}
