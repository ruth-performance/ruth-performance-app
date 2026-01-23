// ============================================================================
// CONDITIONING DATA DEFINITIONS
// ============================================================================

export const BENCHMARKS = {
  male: {
    echo: { eliteFloor: 1.26, eliteTop: 1.4, baseline: 200, eliteThreshold: 220 },
    row: {
      times: { 500: 78, 1000: 178, 2000: 380, 5000: 1080 },
      retention: { 1000: 0.90, 2000: 0.85, 5000: 0.78 }
    },
    run: {
      times: { 400: 58, mile: 295, '5k': 1020, '10k': 2160 },
      retention: { mile: 0.78, '5k': 0.68, '10k': 0.62 }
    }
  },
  female: {
    echo: { eliteFloor: 1.14, eliteTop: 1.3, baseline: 160, eliteThreshold: 170 },
    row: {
      times: { 500: 93, 1000: 202, 2000: 440, 5000: 1200 },
      retention: { 1000: 0.92, 2000: 0.88, 5000: 0.81 }
    },
    run: {
      times: { 400: 70, mile: 330, '5k': 1200, '10k': 2580 },
      retention: { mile: 0.84, '5k': 0.73, '10k': 0.68 }
    }
  }
};

// ============================================================================
// BMI TARGETS FOR ELITE CROSSFIT ATHLETES
// ============================================================================

export const BMI_TARGETS = {
  elite: {
    male: { min: 28, max: 30 },
    female: { min: 23.7, max: 24.4 }
  },
  masters: {
    'male_35-39': 29.9,
    'male_40-44': 27.6,
    'male_45-49': 27.9,
    'male_50-54': 29.0,
    'male_55-59': 26.3,
    'male_60-64': 26.6,
    'male_65-70': 25.4,
    'female_35-39': 24.1,
    'female_40-44': 23.7,
    'female_45-49': 25.0,
    'female_50-54': 23.0,
    'female_55-59': 22.8,
    'female_60-64': 22.8,
    'female_65-70': 22.3,
  }
};

// Calculate ideal weight range based on height and gender
export function calculateIdealWeightRange(
  heightInches: number, 
  gender: 'male' | 'female'
): { min: number; max: number } {
  const heightMeters = heightInches * 0.0254;
  const targets = BMI_TARGETS.elite[gender];
  
  // BMI = weight(kg) / height(m)^2
  // weight(kg) = BMI * height(m)^2
  // weight(lbs) = weight(kg) * 2.20462
  const minWeightKg = targets.min * (heightMeters * heightMeters);
  const maxWeightKg = targets.max * (heightMeters * heightMeters);
  
  return {
    min: Math.round(minWeightKg * 2.20462),
    max: Math.round(maxWeightKg * 2.20462)
  };
}

// Determine body composition status relative to ideal
export type BodyCompStatus = 'under' | 'ideal' | 'over';

export function getBodyCompStatus(
  weightLbs: number,
  heightInches: number,
  gender: 'male' | 'female'
): BodyCompStatus {
  const idealRange = calculateIdealWeightRange(heightInches, gender);
  
  if (weightLbs < idealRange.min) return 'under';
  if (weightLbs > idealRange.max) return 'over';
  return 'ideal';
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const parseTime = (timeStr: string | undefined): number | null => {
  if (!timeStr || timeStr === '') return null;
  const cleaned = timeStr.trim();
  
  // If contains colon, parse as MM:SS or HH:MM:SS
  if (cleaned.includes(':')) {
    const parts = cleaned.split(':').map(p => parseFloat(p));
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return null;
  }
  
  // No colon - smart parse based on value
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;
  
  // If it looks like MMSS format (e.g., 130 = 1:30, 645 = 6:45)
  // Values 100+ are likely MMSS format
  if (num >= 100) {
    const mins = Math.floor(num / 100);
    const secs = num % 100;
    // Validate seconds are 0-59
    if (secs < 60) {
      return mins * 60 + secs;
    }
  }
  
  // Small numbers (under 100) are ambiguous
  // For short efforts (400m, 500m), treat as seconds
  // This handles "56" as 56 seconds
  return num;
};

export const formatTime = (seconds: number | null): string => {
  if (!seconds || isNaN(seconds)) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const paceToWatts = (secPer500m: number | null): number | null => {
  if (!secPer500m || secPer500m <= 0) return null;
  const secPerMeter = secPer500m / 500;
  return 2.80 / Math.pow(secPerMeter, 3);
};

// Convert watts to cal/hr (Concept2 formula)
export const wattsToCalHr = (watts: number | null): number | null => {
  if (!watts || watts <= 0) return null;
  // Concept2 uses: cal/hr = (watts * 4) + 300 (approximate)
  // More accurate: cal/hr = watts * 0.8604 + 300
  return Math.round((watts * 4) + 300);
};

// Convert pace/500m to cal/hr directly
export const paceToCalHr = (secPer500m: number | null): number | null => {
  const watts = paceToWatts(secPer500m);
  return wattsToCalHr(watts);
};

export const calculateCP = (
  time1: number | null, 
  dist1: number, 
  time2: number | null, 
  dist2: number
): number | null => {
  if (!time1 || !time2 || !dist1 || !dist2) return null;
  if (time2 <= time1) return null;
  return (dist2 - dist1) / (time2 - time1);
};

// ============================================================================
// ZONE DEFINITIONS
// ============================================================================

export interface Zone {
  zone: number;
  name: string;
  description: string;
  color: string;
  paceRange?: string;
  calHrRange?: string;
  paceRangeMile?: string;
  paceRangeKm?: string;
}

export const ZONE_COLORS = {
  z7: '#a855f7', // purple - Anaerobic Power
  z6: '#ef4444', // red - Anaerobic Capacity
  z5: '#f97316', // orange - VO2max
  z4: '#eab308', // yellow - Threshold
  z3: '#22c55e', // green - Tempo
  z2: '#06b6d4', // cyan - Base
  z1: '#6b7280', // gray - Recovery
};

// ============================================================================
// DATA TYPES
// ============================================================================

export interface ConditioningData {
  // Echo Bike
  echo10min?: string;
  
  // Row times (MM:SS format)
  row500?: string;
  row1000?: string;
  row2000?: string;
  row5000?: string;
  
  // Run times (MM:SS format)
  run400?: string;
  runMile?: string;
  run5k?: string;
  run10k?: string;
}

export interface EchoAnalysis {
  cals: number | null;
  calPerLb: number | null;
  powerRating: number | null;
  powerPctOfElite: number | null;
  ratioPct: number | null;
  assessment: string;
  priority: boolean;
  bodyCompStatus?: BodyCompStatus;
  idealWeightRange?: { min: number; max: number };
}

export interface RowAnalysis {
  times: Record<string, number | null>;
  paces: Record<string, number | null>;
  retention: Record<string, number | null>;
  cpWatts: number | null;
  cpPace: number | null;
  zones: Zone[];
}

export interface RunAnalysis {
  times: Record<string, number | null>;
  pacePerMile: Record<string, number | null>;
  cvPace: number | null;
  zones: Zone[];
}

export interface ConditioningAnalysis {
  echo: EchoAnalysis;
  row: RowAnalysis;
  run: RunAnalysis;
}

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

export function analyzeConditioning(
  data: ConditioningData,
  gender: 'male' | 'female',
  weightLbs: number | null,
  heightInches: number | null
): ConditioningAnalysis {
  const bm = BENCHMARKS[gender] || BENCHMARKS.male;

  // ========== BODY COMPOSITION STATUS ==========
  let bodyCompStatus: BodyCompStatus | undefined;
  let idealWeightRange: { min: number; max: number } | undefined;
  
  if (weightLbs && heightInches) {
    bodyCompStatus = getBodyCompStatus(weightLbs, heightInches, gender);
    idealWeightRange = calculateIdealWeightRange(heightInches, gender);
  }

  // ========== ECHO ANALYSIS ==========
  const echoCals = data.echo10min ? parseFloat(data.echo10min) : null;
  const echoCalPerLb = echoCals && weightLbs ? echoCals / weightLbs : null;
  
  const echoPowerRating = echoCals ? (echoCals / bm.echo.baseline) * 100 : null;
  const echoPowerPctOfElite = echoCals ? Math.min((echoCals / bm.echo.eliteThreshold) * 100, 115) : null;
  const echoRatioPct = echoCalPerLb ? (echoCalPerLb / bm.echo.eliteFloor) * 100 : null;
  
  let echoAssessment = '';
  let echoPriority = false;
  
  if (echoPowerRating !== null && echoRatioPct !== null) {
    // Elite output - never a priority regardless of body comp
    if (echoPowerRating >= 110) {
      echoAssessment = 'Elite output — echo bike is not a priority';
      echoPriority = false;
    } 
    // Good output (90-110%)
    else if (echoPowerRating >= 90) {
      if (bodyCompStatus === 'ideal' || bodyCompStatus === 'under') {
        echoAssessment = 'Strong performer — continue developing raw power capacity';
        echoPriority = false;
      } else if (bodyCompStatus === 'over') {
        echoAssessment = 'Good output — body composition improvements could enhance power:weight ratio';
        echoPriority = false;
      } else {
        // No height data, can't determine body comp
        echoAssessment = 'Strong performer with good output';
        echoPriority = false;
      }
    }
    // Developing output (70-90%)
    else if (echoPowerRating >= 70) {
      if (bodyCompStatus === 'ideal' || bodyCompStatus === 'under') {
        echoAssessment = 'Priority: build raw power capacity through dedicated bike training';
        echoPriority = true;
      } else if (bodyCompStatus === 'over') {
        echoAssessment = 'Dual opportunity: develop power capacity and optimize body composition';
        echoPriority = true;
      } else {
        echoAssessment = 'Good efficiency — focus on building raw power';
        echoPriority = true;
      }
    }
    // Low output (<70%)
    else {
      if (bodyCompStatus === 'over') {
        echoAssessment = 'Priority area: focus on both power development and body composition';
        echoPriority = true;
      } else {
        echoAssessment = 'Priority area: dedicated focus on building aerobic power capacity';
        echoPriority = true;
      }
    }
  }

  // ========== ROW ANALYSIS ==========
  const rowTimes = {
    500: parseTime(data.row500),
    1000: parseTime(data.row1000),
    2000: parseTime(data.row2000),
    5000: parseTime(data.row5000)
  };

  const rowPaces = {
    500: rowTimes[500] ? rowTimes[500] / 1 : null,
    1000: rowTimes[1000] ? rowTimes[1000] / 2 : null,
    2000: rowTimes[2000] ? rowTimes[2000] / 4 : null,
    5000: rowTimes[5000] ? rowTimes[5000] / 10 : null
  };

  const rowRetention = {
    1000: rowPaces[500] && rowPaces[1000] ? rowPaces[500] / rowPaces[1000] : null,
    2000: rowPaces[500] && rowPaces[2000] ? rowPaces[500] / rowPaces[2000] : null,
    5000: rowPaces[500] && rowPaces[5000] ? rowPaces[500] / rowPaces[5000] : null
  };

  const rowCP = calculateCP(rowTimes[2000], 2000, rowTimes[5000], 5000);
  const rowCPPace = rowCP ? 500 / rowCP : null;
  const rowCPWatts = paceToWatts(rowCPPace);

  // Row Training Zones
  let rowZones: Zone[] = [];
  if (rowPaces[500] && rowPaces[2000] && rowPaces[5000]) {
    const p500 = rowPaces[500];
    const p2k = rowPaces[2000];
    const p5k = rowPaces[5000];

    rowZones = [
      { zone: 7, name: 'Anaerobic Power', description: 'Neuromuscular power, maximal speed', color: ZONE_COLORS.z7, paceRange: `≤ ${formatTime(p500 + 3)}`, calHrRange: `≥ ${paceToCalHr(p500 + 3)}` },
      { zone: 6, name: 'Anaerobic Capacity', description: 'Lactate buffering, speed preservation', color: ZONE_COLORS.z6, paceRange: `${formatTime(p500 + 3)} - ${formatTime(p2k)}`, calHrRange: `${paceToCalHr(p2k)} - ${paceToCalHr(p500 + 3)}` },
      { zone: 5, name: 'VO2max', description: 'Max aerobic power', color: ZONE_COLORS.z5, paceRange: `${formatTime(p2k)} - ${formatTime(p2k + 3)}`, calHrRange: `${paceToCalHr(p2k + 3)} - ${paceToCalHr(p2k)}` },
      { zone: 4, name: 'Threshold', description: 'Develop lactate threshold', color: ZONE_COLORS.z4, paceRange: `${formatTime(p2k + 3)} - ${formatTime(p5k + 5)}`, calHrRange: `${paceToCalHr(p5k + 5)} - ${paceToCalHr(p2k + 3)}` },
      { zone: 3, name: 'Tempo', description: 'Sustainable aerobic training', color: ZONE_COLORS.z3, paceRange: `${formatTime(p5k + 5)} - ${formatTime(p5k + 15)}`, calHrRange: `${paceToCalHr(p5k + 15)} - ${paceToCalHr(p5k + 5)}` },
      { zone: 2, name: 'Base', description: 'Aerobic base, capillary density', color: ZONE_COLORS.z2, paceRange: `${formatTime(p5k + 15)} - ${formatTime(p5k + 30)}`, calHrRange: `${paceToCalHr(p5k + 30)} - ${paceToCalHr(p5k + 15)}` },
      { zone: 1, name: 'Recovery', description: 'Promote circulation, recovery', color: ZONE_COLORS.z1, paceRange: `> ${formatTime(p5k + 30)}`, calHrRange: `< ${paceToCalHr(p5k + 30)}` }
    ];
  }

  // ========== RUN ANALYSIS ==========
  const runTimes = {
    400: parseTime(data.run400),
    mile: parseTime(data.runMile),
    '5k': parseTime(data.run5k),
    '10k': parseTime(data.run10k)
  };

  const runPacePerMile = {
    400: runTimes[400] ? (runTimes[400] / 400) * 1609.34 : null,
    mile: runTimes.mile,
    '5k': runTimes['5k'] ? (runTimes['5k'] / 5000) * 1609.34 : null,
    '10k': runTimes['10k'] ? (runTimes['10k'] / 10000) * 1609.34 : null
  };

  const runCV = calculateCP(runTimes.mile, 1609.34, runTimes['10k'], 10000);
  const runCVPace = runCV ? 1609.34 / runCV : null;

  // Run Training Zones
  let runZones: Zone[] = [];
  if (runPacePerMile[400] && runPacePerMile.mile && runPacePerMile['5k']) {
    const p400 = runPacePerMile[400];
    const pMile = runPacePerMile.mile;
    const p5k = runPacePerMile['5k'];
    
    const z5Low = p5k;
    const z5High = p5k * 1.05;
    const z4Low = p5k * 1.05;
    const z4High = p5k * 1.15;
    const z3Low = p5k * 1.15;
    const z3High = p5k * 1.25;
    const z2Low = p5k * 1.25;
    const z2High = p5k * 1.35;
    const z1Low = p5k * 1.35;

    runZones = [
      { zone: 7, name: 'Anaerobic Power', description: 'Neuromuscular power, maximal speed', color: ZONE_COLORS.z7, paceRangeMile: `≤ ${formatTime(p400 + 5)}`, paceRangeKm: `≤ ${formatTime((p400 + 5) / 1.60934)}` },
      { zone: 6, name: 'Anaerobic Capacity', description: 'Lactate buffering, speed preservation', color: ZONE_COLORS.z6, paceRangeMile: `${formatTime(p400 + 5)} - ${formatTime(pMile)}`, paceRangeKm: `${formatTime((p400 + 5) / 1.60934)} - ${formatTime(pMile / 1.60934)}` },
      { zone: 5, name: 'VO2max', description: 'Max aerobic power (0-5% off 5K)', color: ZONE_COLORS.z5, paceRangeMile: `${formatTime(z5Low)} - ${formatTime(z5High)}`, paceRangeKm: `${formatTime(z5Low / 1.60934)} - ${formatTime(z5High / 1.60934)}` },
      { zone: 4, name: 'Threshold', description: 'Lactate threshold (5-15% off 5K)', color: ZONE_COLORS.z4, paceRangeMile: `${formatTime(z4Low)} - ${formatTime(z4High)}`, paceRangeKm: `${formatTime(z4Low / 1.60934)} - ${formatTime(z4High / 1.60934)}` },
      { zone: 3, name: 'Tempo', description: 'Aerobic endurance (15-25% off 5K)', color: ZONE_COLORS.z3, paceRangeMile: `${formatTime(z3Low)} - ${formatTime(z3High)}`, paceRangeKm: `${formatTime(z3Low / 1.60934)} - ${formatTime(z3High / 1.60934)}` },
      { zone: 2, name: 'Base', description: 'Aerobic base (25-35% off 5K)', color: ZONE_COLORS.z2, paceRangeMile: `${formatTime(z2Low)} - ${formatTime(z2High)}`, paceRangeKm: `${formatTime(z2Low / 1.60934)} - ${formatTime(z2High / 1.60934)}` },
      { zone: 1, name: 'Recovery', description: 'Active recovery (35-50% off 5K)', color: ZONE_COLORS.z1, paceRangeMile: `> ${formatTime(z1Low)}`, paceRangeKm: `> ${formatTime(z1Low / 1.60934)}` }
    ];
  }

  return {
    echo: {
      cals: echoCals,
      calPerLb: echoCalPerLb,
      powerRating: echoPowerRating,
      powerPctOfElite: echoPowerPctOfElite,
      ratioPct: echoRatioPct,
      assessment: echoAssessment,
      priority: echoPriority,
      bodyCompStatus,
      idealWeightRange
    },
    row: {
      times: rowTimes,
      paces: rowPaces,
      retention: rowRetention,
      cpWatts: rowCPWatts,
      cpPace: rowCPPace,
      zones: rowZones
    },
    run: {
      times: runTimes,
      pacePerMile: runPacePerMile,
      cvPace: runCVPace,
      zones: runZones
    }
  };
}
