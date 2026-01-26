// ============================================================================
// STRENGTH DATA DEFINITIONS
// ============================================================================

// Elite benchmarks based on CrossFit Games athlete data
export const STRENGTH_BENCHMARKS = {
  male: {
    // BW ratios (lift / bodyweight)
    backSquatBW: 2.0,      // 2x bodyweight back squat
    frontSquatBW: 1.7,     // 1.7x bodyweight front squat
    deadliftBW: 2.3,       // 2.3x bodyweight deadlift
    cleanBW: 1.4,          // 1.4x bodyweight clean
    cleanAndJerkBW: 1.35,  // 1.35x bodyweight C&J
    snatchBW: 1.1,         // 1.1x bodyweight snatch
    strictPressBW: 0.75,   // 0.75x bodyweight strict press
    pushPressBW: 0.95,     // 0.95x bodyweight push press
    benchPressBW: 1.3,     // 1.3x bodyweight bench press
  },
  female: {
    backSquatBW: 1.7,
    frontSquatBW: 1.45,
    deadliftBW: 2.0,
    cleanBW: 1.15,
    cleanAndJerkBW: 1.1,
    snatchBW: 0.9,
    strictPressBW: 0.55,
    pushPressBW: 0.75,
    benchPressBW: 0.9,
  },
};

// Ideal power transfer ratios between lifts
export const POWER_RATIOS = {
  frontToBackSquat: { ideal: 0.85, min: 0.80, max: 0.90 },
  cleanToFrontSquat: { ideal: 0.85, min: 0.80, max: 0.92 },
  snatchToClean: { ideal: 0.80, min: 0.75, max: 0.85 },
  jerkToClean: { ideal: 1.05, min: 1.00, max: 1.15 }, // C&J should be slightly higher than clean
  deadliftToBackSquat: { ideal: 1.15, min: 1.10, max: 1.25 },
  strictToPress: { ideal: 0.80, min: 0.75, max: 0.85 }, // Strict press to push press
};

// BMI targets for elite CrossFit athletes (from conditioning-data.ts)
export const BMI_TARGETS = {
  male: { min: 28, max: 30 },
  female: { min: 23.7, max: 24.4 },
};

// ============================================================================
// DATA TYPES
// ============================================================================

export interface StrengthData {
  // Primary lifts (stored in lbs)
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

export interface LiftAnalysis {
  value: number | null;
  bwRatio: number | null;
  eliteRatio: number | null; // Percentage of elite standard
  assessment: 'elite' | 'strong' | 'developing' | 'priority' | null;
}

export interface RatioAnalysis {
  name: string;
  actual: number | null;
  ideal: number;
  min: number;
  max: number;
  status: 'optimal' | 'acceptable' | 'imbalanced' | null;
  assessment: string;
}

export interface StrengthPriority {
  rank: number;
  lift: string;
  liftName: string;
  category: 'absolute' | 'ratio';
  currentValue: number;
  eliteValue: number;
  gap: number; // Percentage gap to elite
  recommendation: string;
}

export interface StrengthAnalysis {
  lifts: Record<string, LiftAnalysis>;
  ratios: RatioAnalysis[];
  priorities: StrengthPriority[];
  summary: {
    strongestLift: string | null;
    weakestLift: string | null;
    avgEliteRatio: number;
    totalLiftsEntered: number;
  };
  bodyComp: {
    currentWeight: number;
    idealWeightRange: { min: number; max: number };
    status: 'under' | 'ideal' | 'over';
  } | null;
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

export function calculateIdealWeightRange(
  heightInches: number,
  gender: 'male' | 'female'
): { min: number; max: number } {
  const heightMeters = heightInches * 0.0254;
  const targets = BMI_TARGETS[gender];

  const minWeightKg = targets.min * (heightMeters * heightMeters);
  const maxWeightKg = targets.max * (heightMeters * heightMeters);

  return {
    min: Math.round(minWeightKg * 2.20462),
    max: Math.round(maxWeightKg * 2.20462),
  };
}

function getLiftAssessment(eliteRatio: number): 'elite' | 'strong' | 'developing' | 'priority' {
  if (eliteRatio >= 95) return 'elite';
  if (eliteRatio >= 80) return 'strong';
  if (eliteRatio >= 65) return 'developing';
  return 'priority';
}

function getRatioStatus(actual: number, min: number, max: number): 'optimal' | 'acceptable' | 'imbalanced' {
  if (actual >= min && actual <= max) return 'optimal';
  const tolerance = 0.05; // 5% tolerance outside range
  if (actual >= min - tolerance && actual <= max + tolerance) return 'acceptable';
  return 'imbalanced';
}

function getRatioAssessment(name: string, actual: number, ideal: number, status: string): string {
  if (status === 'optimal') return 'Excellent power transfer';

  const diff = actual - ideal;
  const percentDiff = Math.abs(diff / ideal * 100).toFixed(0);

  if (name === 'Front:Back Squat') {
    if (diff < 0) return `Front squat relatively weak (${percentDiff}% below ideal) — focus on front squat development`;
    return `Front squat relatively strong — back squat may need attention`;
  }

  if (name === 'Clean:Front Squat') {
    if (diff < 0) return `Clean technique limiting strength expression (${percentDiff}% below ideal)`;
    return `Strong clean relative to squat — good power transfer`;
  }

  if (name === 'Snatch:Clean') {
    if (diff < 0) return `Snatch lagging behind clean (${percentDiff}% below ideal) — prioritize snatch technique`;
    return `Strong snatch relative to clean`;
  }

  if (name === 'C&J:Clean') {
    if (diff < 0) return `Jerk limiting C&J (${percentDiff}% below ideal) — focus on jerk development`;
    return `Strong jerk relative to clean`;
  }

  if (name === 'Deadlift:Back Squat') {
    if (diff > 0.05) return `Deadlift dominant — may indicate quad weakness or squat technique issues`;
    if (diff < -0.05) return `Squat dominant — posterior chain may need development`;
    return 'Good balance between squat and hinge patterns';
  }

  return status === 'acceptable' ? 'Within acceptable range' : 'Imbalance detected';
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
  const benchmarks = STRENGTH_BENCHMARKS[gender];

  // Parse all lift values
  const liftsRaw = {
    backSquat: parseWeight(data.backSquat),
    frontSquat: parseWeight(data.frontSquat),
    deadlift: parseWeight(data.deadlift),
    clean: parseWeight(data.clean),
    cleanAndJerk: parseWeight(data.cleanAndJerk),
    snatch: parseWeight(data.snatch),
    strictPress: parseWeight(data.strictPress),
    pushPress: parseWeight(data.pushPress),
    benchPress: parseWeight(data.benchPress),
  };

  // Analyze each lift
  const lifts: Record<string, LiftAnalysis> = {};
  const liftNames: Record<string, string> = {
    backSquat: 'Back Squat',
    frontSquat: 'Front Squat',
    deadlift: 'Deadlift',
    clean: 'Clean',
    cleanAndJerk: 'Clean & Jerk',
    snatch: 'Snatch',
    strictPress: 'Strict Press',
    pushPress: 'Push Press',
    benchPress: 'Bench Press',
  };

  const benchmarkMap: Record<string, number> = {
    backSquat: benchmarks.backSquatBW,
    frontSquat: benchmarks.frontSquatBW,
    deadlift: benchmarks.deadliftBW,
    clean: benchmarks.cleanBW,
    cleanAndJerk: benchmarks.cleanAndJerkBW,
    snatch: benchmarks.snatchBW,
    strictPress: benchmarks.strictPressBW,
    pushPress: benchmarks.pushPressBW,
    benchPress: benchmarks.benchPressBW,
  };

  let totalEliteRatio = 0;
  let liftCount = 0;
  let strongestLift: { name: string; ratio: number } | null = null;
  let weakestLift: { name: string; ratio: number } | null = null;

  for (const [key, value] of Object.entries(liftsRaw)) {
    if (value === null) {
      lifts[key] = { value: null, bwRatio: null, eliteRatio: null, assessment: null };
      continue;
    }

    const bwRatio = value / weightLbs;
    const eliteBWRatio = benchmarkMap[key];
    const eliteRatio = (bwRatio / eliteBWRatio) * 100;

    lifts[key] = {
      value,
      bwRatio: Math.round(bwRatio * 100) / 100,
      eliteRatio: Math.round(eliteRatio),
      assessment: getLiftAssessment(eliteRatio),
    };

    totalEliteRatio += eliteRatio;
    liftCount++;

    if (!strongestLift || eliteRatio > strongestLift.ratio) {
      strongestLift = { name: liftNames[key], ratio: eliteRatio };
    }
    if (!weakestLift || eliteRatio < weakestLift.ratio) {
      weakestLift = { name: liftNames[key], ratio: eliteRatio };
    }
  }

  // Analyze power transfer ratios
  const ratios: RatioAnalysis[] = [];

  // Front:Back Squat
  if (liftsRaw.frontSquat && liftsRaw.backSquat) {
    const actual = liftsRaw.frontSquat / liftsRaw.backSquat;
    const { ideal, min, max } = POWER_RATIOS.frontToBackSquat;
    const status = getRatioStatus(actual, min, max);
    ratios.push({
      name: 'Front:Back Squat',
      actual: Math.round(actual * 100) / 100,
      ideal, min, max, status,
      assessment: getRatioAssessment('Front:Back Squat', actual, ideal, status),
    });
  }

  // Clean:Front Squat
  if (liftsRaw.clean && liftsRaw.frontSquat) {
    const actual = liftsRaw.clean / liftsRaw.frontSquat;
    const { ideal, min, max } = POWER_RATIOS.cleanToFrontSquat;
    const status = getRatioStatus(actual, min, max);
    ratios.push({
      name: 'Clean:Front Squat',
      actual: Math.round(actual * 100) / 100,
      ideal, min, max, status,
      assessment: getRatioAssessment('Clean:Front Squat', actual, ideal, status),
    });
  }

  // Snatch:Clean
  if (liftsRaw.snatch && liftsRaw.clean) {
    const actual = liftsRaw.snatch / liftsRaw.clean;
    const { ideal, min, max } = POWER_RATIOS.snatchToClean;
    const status = getRatioStatus(actual, min, max);
    ratios.push({
      name: 'Snatch:Clean',
      actual: Math.round(actual * 100) / 100,
      ideal, min, max, status,
      assessment: getRatioAssessment('Snatch:Clean', actual, ideal, status),
    });
  }

  // C&J:Clean
  if (liftsRaw.cleanAndJerk && liftsRaw.clean) {
    const actual = liftsRaw.cleanAndJerk / liftsRaw.clean;
    const { ideal, min, max } = POWER_RATIOS.jerkToClean;
    const status = getRatioStatus(actual, min, max);
    ratios.push({
      name: 'C&J:Clean',
      actual: Math.round(actual * 100) / 100,
      ideal, min, max, status,
      assessment: getRatioAssessment('C&J:Clean', actual, ideal, status),
    });
  }

  // Deadlift:Back Squat
  if (liftsRaw.deadlift && liftsRaw.backSquat) {
    const actual = liftsRaw.deadlift / liftsRaw.backSquat;
    const { ideal, min, max } = POWER_RATIOS.deadliftToBackSquat;
    const status = getRatioStatus(actual, min, max);
    ratios.push({
      name: 'Deadlift:Back Squat',
      actual: Math.round(actual * 100) / 100,
      ideal, min, max, status,
      assessment: getRatioAssessment('Deadlift:Back Squat', actual, ideal, status),
    });
  }

  // Generate priorities
  const priorities: StrengthPriority[] = [];
  let priorityRank = 1;

  // Add lifts below 80% elite as priorities
  for (const [key, analysis] of Object.entries(lifts)) {
    if (analysis.eliteRatio !== null && analysis.eliteRatio < 80) {
      const eliteValue = benchmarkMap[key] * weightLbs;
      priorities.push({
        rank: priorityRank++,
        lift: key,
        liftName: liftNames[key],
        category: 'absolute',
        currentValue: analysis.value!,
        eliteValue: Math.round(eliteValue),
        gap: Math.round(100 - analysis.eliteRatio),
        recommendation: getStrengthRecommendation(key, analysis.eliteRatio),
      });
    }
  }

  // Add imbalanced ratios as priorities
  for (const ratio of ratios) {
    if (ratio.status === 'imbalanced') {
      priorities.push({
        rank: priorityRank++,
        lift: ratio.name,
        liftName: ratio.name,
        category: 'ratio',
        currentValue: ratio.actual!,
        eliteValue: ratio.ideal,
        gap: Math.round(Math.abs((ratio.actual! - ratio.ideal) / ratio.ideal * 100)),
        recommendation: ratio.assessment,
      });
    }
  }

  // Sort priorities by gap (biggest gaps first)
  priorities.sort((a, b) => b.gap - a.gap);
  priorities.forEach((p, i) => p.rank = i + 1);

  // Body composition analysis
  let bodyComp: StrengthAnalysis['bodyComp'] = null;
  if (heightInches) {
    const idealRange = calculateIdealWeightRange(heightInches, gender);
    let status: 'under' | 'ideal' | 'over' = 'ideal';
    if (weightLbs < idealRange.min) status = 'under';
    else if (weightLbs > idealRange.max) status = 'over';

    bodyComp = {
      currentWeight: weightLbs,
      idealWeightRange: idealRange,
      status,
    };
  }

  return {
    lifts,
    ratios,
    priorities: priorities.slice(0, 5), // Top 5 priorities
    summary: {
      strongestLift: strongestLift?.name || null,
      weakestLift: weakestLift?.name || null,
      avgEliteRatio: liftCount > 0 ? Math.round(totalEliteRatio / liftCount) : 0,
      totalLiftsEntered: liftCount,
    },
    bodyComp,
  };
}

function getStrengthRecommendation(lift: string, eliteRatio: number): string {
  const gap = 100 - eliteRatio;

  if (gap > 30) {
    // More than 30% below elite
    switch (lift) {
      case 'backSquat':
      case 'frontSquat':
        return 'Focus on squat frequency (3-4x/week) with progressive overload';
      case 'deadlift':
        return 'Add dedicated deadlift days with accessory work';
      case 'clean':
      case 'cleanAndJerk':
        return 'Prioritize clean technique work and pulling strength';
      case 'snatch':
        return 'Focus on snatch technique and overhead strength';
      case 'strictPress':
      case 'pushPress':
        return 'Add overhead pressing volume and shoulder accessory work';
      case 'benchPress':
        return 'Include bench press in regular training rotation';
      default:
        return 'Prioritize this lift in training';
    }
  } else {
    // 20-30% below elite
    return 'Maintain current training with slight emphasis on progressive overload';
  }
}

// ============================================================================
// LIFT DISPLAY HELPERS
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

export function getAssessmentColor(assessment: string | null): string {
  switch (assessment) {
    case 'elite': return '#22c55e';
    case 'strong': return '#3b82f6';
    case 'developing': return '#f59e0b';
    case 'priority': return '#ef4444';
    default: return '#6b7280';
  }
}

export function getStatusColor(status: string | null): string {
  switch (status) {
    case 'optimal': return '#22c55e';
    case 'acceptable': return '#f59e0b';
    case 'imbalanced': return '#ef4444';
    default: return '#6b7280';
  }
}
