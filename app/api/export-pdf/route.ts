import { jsPDF } from 'jspdf';
import { getProfileByEmail } from '@/lib/assessment-profile';
import { getCurrentUser } from '@/lib/auth';
import { getLatestMovementAssessment, getMovementPriorities } from '@/lib/assessments/movement';
import { getLatestStrengthAssessment } from '@/lib/assessments/strength';
import { getLatestGoalsAssessment } from '@/lib/assessments/goals';
import { getLatestConditioningAssessment, TrainingZone } from '@/lib/assessments/conditioning';
import {
  RGB,
  addPageBackground,
  drawMovementHeatMap,
  drawStrengthChart,
  drawZoneTable,
  drawSpeedCurve,
  MovementRatings,
  SpeedCurveData,
  ELITE_ROW_PACES,
  ELITE_RUN_PACES,
} from './charts';

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

    // Get all assessments in parallel
    const [movementAssessment, strengthAssessment, goalsAssessment, conditioningAssessment] = await Promise.all([
      getLatestMovementAssessment(profile.id),
      getLatestStrengthAssessment(profile.id),
      getLatestGoalsAssessment(profile.id),
      getLatestConditioningAssessment(profile.id),
    ]);

    // Get movement priorities if assessment exists (includes confidence_rating for heat map)
    let movementPriorities: Array<{ rank: number; movement_name: string; confidence_rating?: number }> = [];
    let movementRatingsMap: MovementRatings = {};
    if (movementAssessment) {
      const priorities = await getMovementPriorities(movementAssessment.id);
      movementPriorities = priorities?.map((p) => ({
        rank: p.rank,
        movement_name: p.movement_name,
        confidence_rating: p.confidence_rating,
      })) || [];

      // Build ratings map from priorities for heat map
      priorities?.forEach((p) => {
        if (p.movement_name && p.confidence_rating) {
          movementRatingsMap[p.movement_name] = p.confidence_rating;
        }
      });

      // Also try to extract from raw_data as fallback
      if (movementAssessment.raw_data && Object.keys(movementRatingsMap).length === 0) {
        const rawData = movementAssessment.raw_data as Record<string, unknown>;
        const ratingsData = (rawData.ratings as Record<string, number>) || rawData;
        Object.entries(ratingsData).forEach(([key, value]) => {
          if (typeof value === 'number' && value >= 1 && value <= 5) {
            movementRatingsMap[key] = value;
          }
        });
      }
    }

    // Generate PDF with jsPDF
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;

    // Helper functions
    const addHeader = () => {
      // Header background
      doc.setFillColor(...RGB.cardBg);
      doc.rect(0, 0, pageWidth, 38, 'F');

      // Orange accent line
      doc.setFillColor(...RGB.accent);
      doc.rect(0, 38, pageWidth, 2, 'F');

      // Athlete name
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...RGB.text);
      doc.text(profile.name || 'Athlete Report', margin, 16);

      // Subtitle info
      doc.setFontSize(9);
      doc.setTextColor(...RGB.textMuted);
      const tierText = profile.competition_tier
        ? `${profile.competition_tier.charAt(0).toUpperCase() + profile.competition_tier.slice(1)} Athlete`
        : 'Athlete';
      const weightText = profile.weight_lbs ? ` | ${profile.weight_lbs} lbs` : '';
      const genderText = profile.gender ? ` | ${profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}` : '';
      doc.text(`${tierText}${genderText}${weightText}`, margin, 24);

      // Date
      const dateStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      doc.text(`Generated: ${dateStr}`, margin, 32);

      // Logo/Brand
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...RGB.accent);
      doc.text('RUTH PERFORMANCE LAB', pageWidth - margin, 16, { align: 'right' });
    };

    const addFooter = (pageNum: number, totalPages: number) => {
      doc.setFontSize(7);
      doc.setTextColor(...RGB.textMuted);
      doc.text(
        `Ruth Performance Lab | ${profile.email} | Page ${pageNum} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      );
    };

    const addSectionTitle = (text: string, y: number): number => {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...RGB.accent);
      doc.text(text.toUpperCase(), margin, y);
      return y + 8;
    };

    const addSubsectionTitle = (text: string, y: number): number => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...RGB.text);
      doc.text(text, margin, y);
      return y + 6;
    };

    // ========================================
    // PAGE 1: Header + Sport Priorities + Movement Heat Map
    // ========================================
    addPageBackground(doc);
    addHeader();
    let y = 50;

    // Sport Priorities
    y = addSectionTitle('Sport Priorities', y);
    if (movementPriorities.length > 0) {
      // Two-column layout for priorities
      const colWidth = contentWidth / 2 - 5;
      const col1X = margin;
      const col2X = margin + colWidth + 10;

      movementPriorities.slice(0, 10).forEach((p, i) => {
        const isCol2 = i >= 5;
        const x = isCol2 ? col2X : col1X;
        const itemY = y + (i % 5) * 7;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...RGB.text);
        doc.text(`${p.rank || i + 1}. ${p.movement_name}`, x, itemY);
      });
      y += Math.min(movementPriorities.length, 5) * 7 + 5;
    } else {
      doc.setFontSize(9);
      doc.setTextColor(...RGB.textMuted);
      doc.text('No movement assessment completed', margin, y);
      y += 10;
    }

    y += 5;

    // Movement Heat Map - use ratings from priorities (more reliable than raw_data)
    if (Object.keys(movementRatingsMap).length > 0) {
      y = drawMovementHeatMap(doc, movementRatingsMap, margin, y, contentWidth);
    } else if (movementAssessment) {
      // Show heat map with no ratings (all gray) if assessment exists but no ratings
      y = drawMovementHeatMap(doc, {}, margin, y, contentWidth);
    } else {
      y = addSectionTitle('Movement Heat Map', y);
      doc.setFontSize(9);
      doc.setTextColor(...RGB.textMuted);
      doc.text('Complete movement assessment to see heat map', margin, y);
    }

    // ========================================
    // PAGE 2: Strength Priorities + 1RMs + Strength Bar Chart
    // ========================================
    doc.addPage();
    addPageBackground(doc);
    addHeader();
    y = 50;

    // Strength Priorities
    y = addSectionTitle('Strength Priorities', y);
    const strengthPriorities = strengthAssessment?.strength_priorities as
      | Array<{ rank: number; lift: string; gap15?: number }>
      | undefined;

    if (strengthPriorities && strengthPriorities.length > 0) {
      strengthPriorities.slice(0, 5).forEach((p, i) => {
        const gap = p.gap15 && p.gap15 > 0 ? ` (+${p.gap15} lb to elite)` : '';
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...RGB.text);
        doc.text(`${p.rank || i + 1}. ${p.lift}${gap}`, margin, y);
        y += 6;
      });
    } else {
      doc.setFontSize(9);
      doc.setTextColor(...RGB.textMuted);
      doc.text('No strength assessment completed', margin, y);
      y += 6;
    }

    y += 8;

    // Current 1RMs Table
    y = addSectionTitle('Current 1RMs', y);
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

      // Card background
      const cardHeight = 48;
      doc.setFillColor(...RGB.cardBg);
      doc.roundedRect(margin, y - 2, contentWidth, cardHeight, 2, 2, 'F');

      // Two-column layout
      const col1X = margin + 5;
      const col2X = margin + contentWidth / 2 + 5;
      let itemY = y + 5;

      lifts.forEach(([name, value], i) => {
        const isCol2 = i >= 5;
        const x = isCol2 ? col2X : col1X;
        const rowY = itemY + (i % 5) * 9;

        doc.setFontSize(8);
        doc.setTextColor(...RGB.textMuted);
        doc.text(name, x, rowY);

        if (value) {
          doc.setTextColor(...RGB.text);
          doc.setFont('helvetica', 'bold');
          doc.text(`${value} lb`, x + 40, rowY);
          doc.setFont('helvetica', 'normal');
        } else {
          doc.setTextColor(...RGB.gray);
          doc.text('--', x + 40, rowY);
        }
      });

      y += cardHeight + 8;
    } else {
      doc.setFontSize(9);
      doc.setTextColor(...RGB.textMuted);
      doc.text('No strength assessment completed', margin, y);
      y += 12;
    }

    // Strength Bar Chart
    if (strengthAssessment) {
      const gender = (profile.gender as 'male' | 'female') || 'male';
      const lifts: Record<string, number | undefined> = {
        back_squat: strengthAssessment.back_squat,
        front_squat: strengthAssessment.front_squat,
        deadlift: strengthAssessment.deadlift,
        clean: strengthAssessment.clean,
        clean_and_jerk: strengthAssessment.clean_and_jerk,
        snatch: strengthAssessment.snatch,
        strict_press: strengthAssessment.strict_press,
        push_press: strengthAssessment.push_press,
        bench_press: strengthAssessment.bench_press,
      };

      y = drawStrengthChart(doc, lifts, gender, margin, y, contentWidth);
    }

    // ========================================
    // PAGE 3: Conditioning - Zone Tables + Speed Curves
    // ========================================
    doc.addPage();
    addPageBackground(doc);
    addHeader();
    y = 50;

    y = addSectionTitle('Conditioning Zones', y);

    const rowZones = conditioningAssessment?.row_zones as TrainingZone[] | undefined;
    const runZones = conditioningAssessment?.run_zones as TrainingZone[] | undefined;

    // Two-column layout for zone tables
    const tableWidth = (contentWidth - 10) / 2;

    if (rowZones && rowZones.length > 0) {
      drawZoneTable(doc, rowZones, 'Row Zones (/500m)', 'paceRange', margin, y, tableWidth);
    } else {
      doc.setFillColor(...RGB.cardBg);
      doc.roundedRect(margin, y + 7, tableWidth, 50, 2, 2, 'F');
      doc.setFontSize(8);
      doc.setTextColor(...RGB.textMuted);
      doc.text('Row Zones', margin, y + 7);
      doc.text('Complete conditioning assessment', margin + 5, y + 30);
    }

    if (runZones && runZones.length > 0) {
      drawZoneTable(doc, runZones, 'Run Zones (/mile)', 'paceRangeMile', margin + tableWidth + 10, y, tableWidth);
    } else {
      doc.setFillColor(...RGB.cardBg);
      doc.roundedRect(margin + tableWidth + 10, y + 7, tableWidth, 50, 2, 2, 'F');
      doc.setFontSize(8);
      doc.setTextColor(...RGB.textMuted);
      doc.text('Run Zones', margin + tableWidth + 10, y + 7);
      doc.text('Complete conditioning assessment', margin + tableWidth + 15, y + 30);
    }

    // Calculate zone table height
    const maxZones = Math.max(rowZones?.length || 0, runZones?.length || 0, 5);
    y += maxZones * 12 + 25;

    // Speed Curves Section
    y = addSectionTitle('Performance Curves', y);

    // Build athlete row times from conditioning assessment
    const rowTimes: SpeedCurveData[] = [];
    if (conditioningAssessment) {
      if (conditioningAssessment.row_500m_time) {
        rowTimes.push({
          distance: '500m',
          seconds: conditioningAssessment.row_500m_time,
          pace: conditioningAssessment.row_500m_time / 500 * 500, // pace per 500m
        });
      }
      if (conditioningAssessment.row_1000m_time) {
        rowTimes.push({
          distance: '1000m',
          seconds: conditioningAssessment.row_1000m_time,
          pace: conditioningAssessment.row_1000m_time / 1000 * 500,
        });
      }
      if (conditioningAssessment.row_2000m_time) {
        rowTimes.push({
          distance: '2000m',
          seconds: conditioningAssessment.row_2000m_time,
          pace: conditioningAssessment.row_2000m_time / 2000 * 500,
        });
      }
      if (conditioningAssessment.row_5000m_time) {
        rowTimes.push({
          distance: '5000m',
          seconds: conditioningAssessment.row_5000m_time,
          pace: conditioningAssessment.row_5000m_time / 5000 * 500,
        });
      }
    }

    // Build elite row reference data (convert to same format)
    const eliteRowTimes: SpeedCurveData[] = ELITE_ROW_PACES.map(p => ({
      distance: p.distance,
      seconds: p.pace * (p.meters / 500), // total seconds based on pace per 500m
      pace: p.pace,
    }));

    // Build athlete run times from conditioning assessment
    const runTimes: SpeedCurveData[] = [];
    if (conditioningAssessment) {
      if (conditioningAssessment.run_400m_time) {
        runTimes.push({
          distance: '400m',
          seconds: conditioningAssessment.run_400m_time,
          pace: conditioningAssessment.run_400m_time / 400 * 1609, // pace per mile
        });
      }
      if (conditioningAssessment.run_mile_time) {
        runTimes.push({
          distance: '1 mi',
          seconds: conditioningAssessment.run_mile_time,
          pace: conditioningAssessment.run_mile_time,
        });
      }
      if (conditioningAssessment.run_5k_time) {
        runTimes.push({
          distance: '5K',
          seconds: conditioningAssessment.run_5k_time,
          pace: conditioningAssessment.run_5k_time / 5000 * 1609,
        });
      }
      if (conditioningAssessment.run_10k_time) {
        runTimes.push({
          distance: '10K',
          seconds: conditioningAssessment.run_10k_time,
          pace: conditioningAssessment.run_10k_time / 10000 * 1609,
        });
      }
    }

    // Build elite run reference data
    const eliteRunTimes: SpeedCurveData[] = ELITE_RUN_PACES.map(p => ({
      distance: p.distance,
      seconds: p.pace * (p.meters / 1609), // total seconds based on pace per mile
      pace: p.pace,
    }));

    // Draw curves side by side with proper alignment
    const curveWidth = tableWidth;
    const curveHeight = 55;
    const curveStartY = y;

    // Row Speed Curve (left)
    if (rowTimes.length >= 2 || eliteRowTimes.length >= 2) {
      drawSpeedCurve(doc, rowTimes, eliteRowTimes, 'Row Pace Curve', margin, curveStartY, curveWidth, curveHeight);
    } else {
      doc.setFillColor(51, 65, 85);
      doc.roundedRect(margin, curveStartY + 6, curveWidth, curveHeight, 2, 2, 'F');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Row Pace Curve', margin, curveStartY);
      doc.text('No row data available', margin + 10, curveStartY + curveHeight / 2);
    }

    // Run Speed Curve (right)
    if (runTimes.length >= 2 || eliteRunTimes.length >= 2) {
      drawSpeedCurve(doc, runTimes, eliteRunTimes, 'Run Pace Curve', margin + tableWidth + 10, curveStartY, curveWidth, curveHeight);
    } else {
      doc.setFillColor(51, 65, 85);
      doc.roundedRect(margin + tableWidth + 10, curveStartY + 6, curveWidth, curveHeight, 2, 2, 'F');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Run Pace Curve', margin + tableWidth + 10, curveStartY);
      doc.text('No run data available', margin + tableWidth + 20, curveStartY + curveHeight / 2);
    }

    y = curveStartY + curveHeight + 12;

    // ========================================
    // PAGE 4: Athlete Profile + Goals + Habits + Mental Skills
    // ========================================
    doc.addPage();
    addPageBackground(doc);
    addHeader();
    y = 50;

    // Athlete Profile (Archetype)
    if (goalsAssessment?.athlete_type) {
      y = addSectionTitle('Athlete Profile', y);

      // Archetype card
      doc.setFillColor(...RGB.cardBg);
      doc.roundedRect(margin, y - 2, contentWidth, 22, 2, 2, 'F');

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...RGB.accent);
      doc.text(goalsAssessment.athlete_type, margin + 5, y + 6);

      if (goalsAssessment.athlete_type_description) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(...RGB.textMuted);
        const descLines = doc.splitTextToSize(
          goalsAssessment.athlete_type_description,
          contentWidth - 10
        );
        doc.text(descLines.slice(0, 2), margin + 5, y + 14);
      }
      y += 28;
    }

    // Goals Section
    if (goalsAssessment?.outcome_goals && goalsAssessment.outcome_goals.length > 0) {
      y = addSectionTitle('Goals & Obstacles', y);

      goalsAssessment.outcome_goals.forEach(
        (goal: { id?: string; goal: string; date: string }, i: number) => {
          // Goal header
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...RGB.text);
          const goalText = goal.goal.length > 50 ? goal.goal.substring(0, 47) + '...' : goal.goal;
          doc.text(`> ${goalText}`, margin, y);
          y += 5;

          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...RGB.accent);
          doc.text(`Target: ${goal.date}`, margin + 5, y);
          y += 5;

          // Benchmarks
          const goalKey = goal.id || `goal-${i + 1}`;
          const benchmarks =
            goalsAssessment.performance_goals?.[goalKey] ||
            goalsAssessment.performance_goals?.[`goal-${i + 1}`] ||
            [];
          if (benchmarks.length > 0) {
            doc.setTextColor(...RGB.success);
            doc.setFontSize(7);
            benchmarks.slice(0, 3).forEach((b: string) => {
              doc.text(`+ ${b}`, margin + 5, y);
              y += 4;
            });
          }

          // Obstacles
          const obstacles =
            goalsAssessment.obstacles?.[goalKey] ||
            goalsAssessment.obstacles?.[`goal-${i + 1}`] ||
            [];
          if (obstacles.length > 0) {
            doc.setTextColor(...RGB.danger);
            doc.setFontSize(7);
            obstacles.slice(0, 2).forEach((o: string) => {
              doc.text(`! ${o}`, margin + 5, y);
              y += 4;
            });
          }

          y += 4;
        }
      );
    }

    // Process Goals (Habits)
    if (goalsAssessment?.process_goals && goalsAssessment.process_goals.length > 0) {
      y = addSectionTitle('Habits', y);

      goalsAssessment.process_goals.slice(0, 4).forEach(
        (habit: { action: string; frequency: string; when: string }) => {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...RGB.text);
          doc.text(`* ${habit.action} (${habit.frequency})`, margin, y);
          y += 4;
          doc.setFontSize(7);
          doc.setTextColor(...RGB.textMuted);
          doc.text(`When: ${habit.when}`, margin + 5, y);
          y += 6;
        }
      );
      y += 4;
    }

    // Mental Skills
    if (goalsAssessment?.mental_strengths || goalsAssessment?.development_areas) {
      y = addSectionTitle('Mental Skills', y);

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

      // Two column layout
      const colWidth = contentWidth / 2 - 5;

      if (goalsAssessment.mental_strengths?.length > 0) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...RGB.success);
        doc.text('Strengths', margin, y);
        let strengthY = y + 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        goalsAssessment.mental_strengths.slice(0, 4).forEach((s: string) => {
          doc.text(`+ ${formatSkill(s)}`, margin, strengthY);
          strengthY += 5;
        });
      }

      if (goalsAssessment.development_areas?.length > 0) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...RGB.warning);
        doc.text('Development Areas', margin + colWidth + 10, y);
        let devY = y + 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        goalsAssessment.development_areas.slice(0, 4).forEach((s: string) => {
          doc.text(`! ${formatSkill(s)}`, margin + colWidth + 10, devY);
          devY += 5;
        });
      }
    }

    // ========================================
    // Add footers to all pages
    // ========================================
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addFooter(i, totalPages);
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
