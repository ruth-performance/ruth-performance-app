// ============================================================================
// STRENGTH DATA DEFINITIONS - Matching Original MVP Logic
// ============================================================================

// Elite benchmarks from CrossFit Games athlete data (absolute values in lbs)
export const BENCHMARKS = {
  female: {
    bmi: { low: 24.5, high: 25.0 },
    lifts: {
      back_squat: { top15: 305, top5: 330 },
      deadlift: { top15: 345, top5: 395 },
      snatch: { top15: 192, top5: 205 },
      clean: { top15: 247, top5: 265 },
      jerk: { top15: 260, top5: 276 }
    }
  },
  male: {
    bmi: { low: 27.5, high: 28.0 },
    lifts: {
      back_squat: { top15: 485, top5: 505 },
      deadlift: { top15: 525, top5: 575 },
      snatch: { top15: 296, top5: 309 },
      clean: { top15: 380, top5: 405 },
      jerk: { top15: 376, top5: 400 }
    }
  }
};

// Lift labels for display
export const LIFT_LABELS: Record<string, string> = {
  back_squat: 'Back Squat',
  deadlift: 'Deadlift',
  snatch: 'Snatch',
  clean: 'Clean',
  jerk: 'Clean & Jerk'
};

// ============================================================================
// DATA TYPES
// ============================================================================

export interface StrengthData {
  backSquat?: string;
  frontSquat?: string;
  deadlift?: string;
  clean?: string;
  cleanAndJerk?: string;
  snatch?: string;
  strictPress?: string;
  pushPress?: string;
  benchPress?: string;
}

export interface LiftGap {
  actual: number;
  top15: number;
  top5: number;
  gapTop15: number; // benchmark - actual (positive = below benchmark)
  gapTop5: number;
  meetsTop15: boolean;
  meetsTop5: boolean;
}

export interface PowerRatio {
  name: string;
  key: string;
  athleteRatio: number | null;
  eliteRatio: number;
  difference: number | null; // athlete - elite (positive = above elite)
  isGood: boolean; // within 2% of elite or better
}

export interface StrengthPriority {
  rank: number;
  lift: string;
  liftKey: string;
  score: number;
  gap15: number;
  gap5: number;
  ratioPenalty: number;
  rationale: string;
}

export interface BodyCompAnalysis {
  currentWeight: number;
  targetLow: number;
  targetHigh: number;
  targetMid: number;
  gap: number; // current - target mid (positive = over)
  note: string;
}

export interface StrengthAnalysis {
  liftGaps: Record<string, LiftGap>;
  powerRatios: PowerRatio[];
  priorities: StrengthPriority[];
  bodyComp: BodyCompAnalysis | null;
  summary: {
    totalLiftsEntered: number;
    liftsAtTop15: number;
    liftsAtTop5: number;
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function lbsToKg(lbs: number): number {
  return lbs * 0.453592;
}

export function kgToLbs(kg: number): number {
  return kg * 2.20462;
}

export function parseWeight(value: string | undefined): number | null {
  if (!value || value.trim() === '') return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

export function analyzeStrength(
  data: StrengthData,
  gender: 'male' | 'female',
  weightLbs: number,
  heightInches?: number
): StrengthAnalysis {
  const benchmark = BENCHMARKS[gender];

  // Parse lift values (convert to internal keys)
  const liftsLb: Record<string, number | null> = {
    back_squat: parseWeight(data.backSquat),
    deadlift: parseWeight(data.deadlift),
    snatch: parseWeight(data.snatch),
    clean: parseWeight(data.clean),
    jerk: parseWeight(data.cleanAndJerk),
  };

  // Calculate gaps for each lift
  const liftGaps: Record<string, LiftGap> = {};
  let totalLifts = 0;
  let atTop15 = 0;
  let atTop5 = 0;

  for (const [key, value] of Object.entries(liftsLb)) {
    if (value === null) continue;

    const benchmarkLift = benchmark.lifts[key as keyof typeof benchmark.lifts];
    if (!benchmarkLift) continue;

    const gapTop15 = benchmarkLift.top15 - value;
    const gapTop5 = benchmarkLift.top5 - value;

    liftGaps[key] = {
      actual: value,
      top15: benchmarkLift.top15,
      top5: benchmarkLift.top5,
      gapTop15,
      gapTop5,
      meetsTop15: gapTop15 <= 0,
      meetsTop5: gapTop5 <= 0,
    };

    totalLifts++;
    if (gapTop15 <= 0) atTop15++;
    if (gapTop5 <= 0) atTop5++;
  }

  // Calculate ideal ratios from benchmarks
  const idealRatios = {
    snatch_to_squat: benchmark.lifts.snatch.top15 / benchmark.lifts.back_squat.top15,
    clean_to_squat: benchmark.lifts.clean.top15 / benchmark.lifts.back_squat.top15,
    jerk_to_squat: benchmark.lifts.jerk.top15 / benchmark.lifts.back_squat.top15,
    clean_to_deadlift: benchmark.lifts.clean.top15 / benchmark.lifts.deadlift.top15,
  };

  // Calculate athlete ratios
  const athleteRatios: Record<string, number | null> = {
    snatch_to_squat: liftsLb.snatch && liftsLb.back_squat ? liftsLb.snatch / liftsLb.back_squat : null,
    clean_to_squat: liftsLb.clean && liftsLb.back_squat ? liftsLb.clean / liftsLb.back_squat : null,
    jerk_to_squat: liftsLb.jerk && liftsLb.back_squat ? liftsLb.jerk / liftsLb.back_squat : null,
    clean_to_deadlift: liftsLb.clean && liftsLb.deadlift ? liftsLb.clean / liftsLb.deadlift : null,
  };

  // Build power ratios array
  const ratioLabels: Record<string, string> = {
    snatch_to_squat: 'Snatch : Squat',
    clean_to_squat: 'Clean : Squat',
    jerk_to_squat: 'Jerk : Squat',
    clean_to_deadlift: 'Clean : Deadlift',
  };

  const powerRatios: PowerRatio[] = [];
  for (const [key, eliteRatio] of Object.entries(idealRatios)) {
    const athleteRatio = athleteRatios[key];
    const difference = athleteRatio !== null ? athleteRatio - eliteRatio : null;

    powerRatios.push({
      name: ratioLabels[key],
      key,
      athleteRatio,
      eliteRatio,
      difference,
      isGood: difference !== null && difference >= -0.02, // within 2% or better
    });
  }

  // Calculate priorities using MVP formula
  const priorities: StrengthPriority[] = [];

  const ratioMap: Record<string, string> = {
    snatch: 'snatch_to_squat',
    clean: 'clean_to_squat',
    jerk: 'jerk_to_squat',
  };

  for (const [key, label] of Object.entries(LIFT_LABELS)) {
    if (!liftGaps[key]) continue;

    const gap15 = liftGaps[key].gapTop15;
    const gap5 = liftGaps[key].gapTop5;

    // Ratio penalty for Olympic lifts
    let ratioPenalty = 0;
    if (ratioMap[key] && athleteRatios[ratioMap[key]] !== null) {
      const diff = idealRatios[ratioMap[key] as keyof typeof idealRatios] - athleteRatios[ratioMap[key]]!;
      ratioPenalty = Math.max(0, diff - 0.03) * 100;
    }

    // Priority score formula from MVP
    const score = 1.0 * Math.max(0, gap15) + 0.5 * Math.max(0, gap5) + 50 * ratioPenalty;

    // Generate rationale
    let rationale: string;
    if (gap15 > 0 && ratioPenalty > 0.5) {
      rationale = 'Below Top-15 with poor transfer — technique + strength';
    } else if (gap15 > 0) {
      rationale = 'Below Top-15 — absolute strength priority';
    } else if (ratioPenalty > 0.5) {
      rationale = 'Strong but poor transfer — technique focus';
    } else if (gap5 > 0) {
      rationale = 'At Top-15, pushing Top-5 — refine';
    } else {
      rationale = 'Exceeds Top-5 — maintain';
    }

    priorities.push({
      rank: 0, // will be set after sorting
      lift: label,
      liftKey: key,
      score,
      gap15,
      gap5,
      ratioPenalty,
      rationale,
    });
  }

  // Sort by score descending
  priorities.sort((a, b) => b.score - a.score);

  // Assign ranks
  priorities.forEach((p, i) => p.rank = i + 1);

  // Body composition analysis
  let bodyComp: BodyCompAnalysis | null = null;
  if (heightInches) {
    const heightM = heightInches * 0.0254;
    const targetBwLowKg = benchmark.bmi.low * Math.pow(heightM, 2);
    const targetBwHighKg = benchmark.bmi.high * Math.pow(heightM, 2);
    const targetBwLowLb = targetBwLowKg * 2.20462;
    const targetBwHighLb = targetBwHighKg * 2.20462;
    const targetBwMidLb = (targetBwLowLb + targetBwHighLb) / 2;
    const bwGap = weightLbs - targetBwMidLb;

    let note: string;
    if (Math.abs(bwGap) <= 5) {
      note = 'Within elite range — maintain';
    } else if (bwGap > 5) {
      note = `${Math.round(bwGap)} lb over — consider recomp`;
    } else {
      note = `${Math.round(Math.abs(bwGap))} lb under — potential for mass gain`;
    }

    bodyComp = {
      currentWeight: weightLbs,
      targetLow: Math.round(targetBwLowLb),
      targetHigh: Math.round(targetBwHighLb),
      targetMid: Math.round(targetBwMidLb),
      gap: Math.round(bwGap),
      note,
    };
  }

  return {
    liftGaps,
    powerRatios,
    priorities: priorities.slice(0, 5), // Top 5
    bodyComp,
    summary: {
      totalLiftsEntered: totalLifts,
      liftsAtTop15: atTop15,
      liftsAtTop5: atTop5,
    },
  };
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

export const LIFT_INFO: Record<string, { name: string; color: string; required: boolean }> = {
  backSquat: { name: 'Back Squat', color: '#f59e0b', required: true },
  frontSquat: { name: 'Front Squat', color: '#f59e0b', required: false },
  deadlift: { name: 'Deadlift', color: '#ef4444', required: true },
  clean: { name: 'Clean', color: '#22c55e', required: true },
  cleanAndJerk: { name: 'Clean & Jerk', color: '#22c55e', required: true },
  snatch: { name: 'Snatch', color: '#a855f7', required: true },
  strictPress: { name: 'Strict Press', color: '#3b82f6', required: false },
  pushPress: { name: 'Push Press', color: '#3b82f6', required: false },
  benchPress: { name: 'Bench Press', color: '#3b82f6', required: false },
};

export function formatGap(gap: number): string {
  if (gap <= 0) return '✓';
  return `+${Math.round(gap)}`;
}

export function getGapColor(gap: number, isTop5: boolean = false): string {
  if (gap <= 0) return '#22c55e'; // Green - meets benchmark
  if (isTop5) return '#f59e0b'; // Amber for Top-5 gap
  return '#ef4444'; // Red for Top-15 gap
}
