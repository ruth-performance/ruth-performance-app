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
// UTILITY FUNCTIONS
// ============================================================================

export const parseTime = (timeStr: string | undefined): number | null => {
  if (!timeStr || timeStr === '') return null;
  const cleaned = timeStr.trim();
  const parts = cleaned.split(':').map(p => parseFloat(p));
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 1 && !isNaN(parts[0])) return parts[0];
  return null;
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
  weightLbs: number | null
): ConditioningAnalysis {
  const bm = BENCHMARKS[gender] || BENCHMARKS.male;

  // ========== ECHO ANALYSIS ==========
  const echoCals = data.echo10min ? parseFloat(data.echo10min) : null;
  const echoCalPerLb = echoCals && weightLbs ? echoCals / weightLbs : null;
  
  const echoPowerRating = echoCals ? (echoCals / bm.echo.baseline) * 100 : null;
  const echoPowerPctOfElite = echoCals ? Math.min((echoCals / bm.echo.eliteThreshold) * 100, 115) : null;
  const echoRatioPct = echoCalPerLb ? (echoCalPerLb / bm.echo.eliteFloor) * 100 : null;
  
  let echoAssessment = '';
  let echoPriority = false;
  
  if (echoPowerRating !== null && echoRatioPct !== null) {
    if (echoPowerRating >= 110) {
      echoAssessment = 'Elite output — echo is not a priority';
      echoPriority = false;
    } else if (echoPowerRating >= 90 && echoRatioPct >= 85) {
      echoAssessment = 'Strong performer with good efficiency';
      echoPriority = false;
    } else if (echoPowerRating >= 90 && echoRatioPct < 85) {
      echoAssessment = 'Good output — body composition could unlock more';
      echoPriority = false;
    } else if (echoPowerRating >= 70 && echoRatioPct >= 85) {
      echoAssessment = 'Good efficiency — focus on building raw power';
      echoPriority = true;
    } else if (echoPowerRating >= 70 && echoRatioPct < 85) {
      echoAssessment = 'Opportunity in both power and body composition';
      echoPriority = true;
    } else {
      echoAssessment = 'Priority area for development';
      echoPriority = true;
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
      { zone: 7, name: 'Anaerobic Power', description: 'Neuromuscular power, maximal speed', color: ZONE_COLORS.z7, paceRange: `≤ ${formatTime(p500 + 3)}` },
      { zone: 6, name: 'Anaerobic Capacity', description: 'Lactate buffering, speed preservation', color: ZONE_COLORS.z6, paceRange: `${formatTime(p500 + 3)} - ${formatTime(p2k)}` },
      { zone: 5, name: 'VO2max', description: 'Max aerobic power', color: ZONE_COLORS.z5, paceRange: `${formatTime(p2k)} - ${formatTime(p2k + 3)}` },
      { zone: 4, name: 'Threshold', description: 'Develop lactate threshold', color: ZONE_COLORS.z4, paceRange: `${formatTime(p2k + 3)} - ${formatTime(p5k + 5)}` },
      { zone: 3, name: 'Tempo', description: 'Sustainable aerobic training', color: ZONE_COLORS.z3, paceRange: `${formatTime(p5k + 5)} - ${formatTime(p5k + 15)}` },
      { zone: 2, name: 'Base', description: 'Aerobic base, capillary density', color: ZONE_COLORS.z2, paceRange: `${formatTime(p5k + 15)} - ${formatTime(p5k + 30)}` },
      { zone: 1, name: 'Recovery', description: 'Promote circulation, recovery', color: ZONE_COLORS.z1, paceRange: `> ${formatTime(p5k + 30)}` }
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
      priority: echoPriority
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
