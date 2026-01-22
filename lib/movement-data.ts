// ============================================================================
// MOVEMENT DATA DEFINITIONS
// ============================================================================

export interface Movement {
  id: string;
  name: string;
  maxUB?: number | null;
  noSlider?: boolean;
  unit?: string;
  maxValue?: number;
}

export interface CategoryWithSubcategories {
  label: string;
  color: string;
  subcategories: Record<string, Movement[]>;
}

export interface CategoryWithMovements {
  label: string;
  color: string;
  hasLoadingZones: boolean;
  loadingZones?: {
    male: { light: number; moderate: number; heavy: number };
    female: { light: number; moderate: number; heavy: number };
  };
  movements: Movement[];
}

export const MOVEMENTS = {
  BasicCF: {
    label: 'Basic CF',
    color: '#ff6b6b',
    subcategories: {
      Burpees: [
        { id: 'burpee-touch', name: 'Burpee to Touch', maxUB: 100 },
        { id: 'bar-facing-burpee', name: 'Bar Facing Burpee', maxUB: 100 },
        { id: 'bbjo', name: 'Burpee Box Jump Over', maxUB: 75 },
      ],
      BoxJumps: [
        { id: 'box-jump', name: 'Box Jump', maxUB: 100 },
        { id: 'box-jump-over', name: 'Box Jump Over', maxUB: 100 },
      ],
      Other: [
        { id: 'wallball', name: 'Wallball', maxUB: 150 },
        { id: 'airsquat', name: 'Air Squat', maxUB: 150 },
      ],
      JumpRope: [
        { id: 'double-unders', name: 'Double-Unders', maxUB: 500 },
        { id: 'crossover-singles', name: 'Crossover Singles', maxUB: 200 },
        { id: 'crossover-doubles', name: 'Crossover Double-Unders', maxUB: 100 },
      ],
    },
  } as CategoryWithSubcategories,
  
  Gymnastics: {
    label: 'Gymnastics',
    color: '#4ecdc4',
    subcategories: {
      Midline: [
        { id: 'ttb', name: 'Toes-to-Bar', maxUB: 100 },
        { id: 'ghd-situp', name: 'GHD Sit-Up', maxUB: 100 },
        { id: 'v-up', name: 'V-Up', maxUB: 100 },
      ],
      Pulling: [
        { id: 'pull-up', name: 'Pull-Up', maxUB: 100 },
        { id: 'c2b', name: 'Chest-to-Bar', maxUB: 100 },
        { id: 'bar-mu', name: 'Bar Muscle-Up', maxUB: 50 },
        { id: 'ring-mu', name: 'Ring Muscle-Up', maxUB: 50 },
        { id: 'rope-climb', name: 'Rope Climb', maxUB: null, noSlider: true },
        { id: 'legless-rc', name: 'Legless Rope Climb', maxUB: null, noSlider: true },
      ],
      HS: [
        { id: 'hs-hold', name: 'HS Hold', maxUB: null, noSlider: true, unit: 'sec', maxValue: 120 },
        { id: 'hs-walk', name: 'HS Walk', maxUB: 200, unit: 'ft' },
        { id: 'wall-walk', name: 'Wall Walk', maxUB: 30 },
        { id: 'strict-hspu', name: 'Strict HSPU', maxUB: 50 },
        { id: 'kipping-hspu', name: 'Kipping HSPU', maxUB: 75 },
        { id: 'deficit-hspu', name: 'Deficit HSPU', maxUB: 50 },
      ],
    },
  } as CategoryWithSubcategories,
  
  DB: {
    label: 'Dumbbell',
    color: '#a855f7',
    hasLoadingZones: true,
    loadingZones: {
      male: { light: 50, moderate: 70, heavy: 100 },
      female: { light: 35, moderate: 50, heavy: 70 },
    },
    movements: [
      { id: 'db-alt-snatch', name: 'Alt DB Snatch' },
      { id: 'db-alt-hcj', name: 'Alt DB Hang C&J' },
      { id: 'db-front-squat', name: 'DB Front Squat' },
      { id: 'db-power-clean', name: 'DB Power Clean' },
      { id: 'db-stoh-1arm', name: 'DB S2OH (1-Arm)' },
      { id: 'db-stoh-2arm', name: 'DB S2OH (2-Arm)' },
      { id: 'db-lunge-farmers', name: 'DB Lunge - Farmers' },
      { id: 'db-lunge-front-rack', name: 'DB Lunge - Front Rack' },
      { id: 'db-lunge-single-oh', name: 'DB Lunge - Single OH' },
      { id: 'db-lunge-double-oh', name: 'DB Lunge - Double OH' },
      { id: 'db-thruster', name: 'DB Thruster' },
      { id: 'devils-press', name: "Devil's Press" },
      { id: 'db-stepover-single', name: 'DB Step-Over (Single)' },
      { id: 'db-stepover-double', name: 'DB Step-Over (Double)' },
    ],
  } as CategoryWithMovements,
  
  Barbell: {
    label: 'Barbell',
    color: '#ffbe0b',
    hasLoadingZones: true,
    movements: [
      { id: 'snatch', name: 'Barbell Snatch' },
      { id: 'clean', name: 'Barbell Clean' },
      { id: 'cnj', name: 'Clean & Jerk' },
      { id: 'thruster', name: 'Thruster' },
      { id: 's2oh', name: 'Shoulder-to-Overhead' },
      { id: 'deadlift', name: 'Deadlift' },
      { id: 'front-squat', name: 'Front Squat' },
      { id: 'ohs', name: 'Overhead Squat' },
    ],
  } as CategoryWithMovements,
};

export const BARBELL_RANGES_LBS: Record<string, { male: { min: number; max: number }; female: { min: number; max: number } }> = {
  snatch: { male: { min: 75, max: 315 }, female: { min: 55, max: 225 } },
  clean: { male: { min: 95, max: 415 }, female: { min: 65, max: 315 } },
  cnj: { male: { min: 95, max: 415 }, female: { min: 65, max: 315 } },
  thruster: { male: { min: 65, max: 355 }, female: { min: 45, max: 255 } },
  s2oh: { male: { min: 95, max: 415 }, female: { min: 65, max: 315 } },
  deadlift: { male: { min: 135, max: 615 }, female: { min: 95, max: 425 } },
  'front-squat': { male: { min: 95, max: 455 }, female: { min: 65, max: 355 } },
  ohs: { male: { min: 75, max: 415 }, female: { min: 55, max: 315 } },
};

export const COMPETITION_TIERS = ['Scaled', 'Rx', 'Quarterfinals', 'Semis', 'Games'] as const;
export type CompetitionTier = typeof COMPETITION_TIERS[number];

// Competition frequency data (combined from Open, Quarterfinals, Semifinals, Games)
// Tier: 5=VeryFrequent, 4=Frequent, 3=Common, 2=Occasional, 1=Rare
export const COMPETITION_FREQUENCY: Record<string, { 
  open: number; 
  qf: number; 
  games: number; 
  loadingBias?: { light: number; moderate: number; heavy: number } 
}> = {
  // Basic CF
  'burpee-touch': { open: 3, qf: 3, games: 4 },
  'bar-facing-burpee': { open: 4, qf: 4, games: 3 },
  'bbjo': { open: 2, qf: 3, games: 2 },
  'box-jump': { open: 3, qf: 3, games: 3 },
  'box-jump-over': { open: 3, qf: 3, games: 3 },
  'wallball': { open: 4, qf: 4, games: 3 },
  'airsquat': { open: 2, qf: 2, games: 2 },
  'double-unders': { open: 5, qf: 5, games: 4 },
  'crossover-singles': { open: 2, qf: 2, games: 1 },
  'crossover-doubles': { open: 1, qf: 1, games: 1 },
  
  // Gymnastics - Midline
  'ttb': { open: 4, qf: 4, games: 3 },
  'ghd-situp': { open: 2, qf: 3, games: 4 },
  'v-up': { open: 1, qf: 1, games: 1 },
  
  // Gymnastics - Pulling
  'pull-up': { open: 4, qf: 4, games: 4 },
  'c2b': { open: 4, qf: 4, games: 4 },
  'bar-mu': { open: 4, qf: 4, games: 4 },
  'ring-mu': { open: 3, qf: 4, games: 5 },
  'rope-climb': { open: 3, qf: 4, games: 4 },
  'legless-rc': { open: 2, qf: 3, games: 3 },
  
  // Gymnastics - HS
  'hs-hold': { open: 1, qf: 1, games: 1 },
  'hs-walk': { open: 3, qf: 3, games: 4 },
  'wall-walk': { open: 4, qf: 4, games: 2 },
  'strict-hspu': { open: 2, qf: 3, games: 2 },
  'kipping-hspu': { open: 3, qf: 4, games: 4 },
  'deficit-hspu': { open: 2, qf: 3, games: 2 },
  
  // Dumbbell
  'db-alt-snatch': { open: 3, qf: 4, games: 3 },
  'db-alt-hcj': { open: 2, qf: 2, games: 2 },
  'db-front-squat': { open: 1, qf: 1, games: 1 },
  'db-power-clean': { open: 2, qf: 2, games: 1 },
  'db-stoh-1arm': { open: 2, qf: 2, games: 1 },
  'db-stoh-2arm': { open: 2, qf: 2, games: 1 },
  'db-lunge-farmers': { open: 2, qf: 2, games: 2 },
  'db-lunge-front-rack': { open: 2, qf: 3, games: 2 },
  'db-lunge-single-oh': { open: 3, qf: 3, games: 2 },
  'db-lunge-double-oh': { open: 2, qf: 3, games: 2 },
  'db-thruster': { open: 2, qf: 2, games: 1 },
  'devils-press': { open: 2, qf: 2, games: 1 },
  'db-stepover-single': { open: 2, qf: 3, games: 2 },
  'db-stepover-double': { open: 2, qf: 2, games: 1 },
  
  // Barbell (overall frequency, loading zones have their own weights)
  'snatch': { open: 3, qf: 4, games: 4, loadingBias: { light: 0.1, moderate: 0.6, heavy: 0.3 } },
  'clean': { open: 4, qf: 4, games: 5, loadingBias: { light: 0.2, moderate: 0.4, heavy: 0.4 } },
  'cnj': { open: 3, qf: 4, games: 3, loadingBias: { light: 0.2, moderate: 0.4, heavy: 0.4 } },
  'thruster': { open: 5, qf: 5, games: 5, loadingBias: { light: 0.1, moderate: 0.5, heavy: 0.4 } },
  's2oh': { open: 3, qf: 4, games: 3, loadingBias: { light: 0.2, moderate: 0.5, heavy: 0.3 } },
  'deadlift': { open: 3, qf: 4, games: 5, loadingBias: { light: 0.15, moderate: 0.35, heavy: 0.5 } },
  'front-squat': { open: 2, qf: 3, games: 2, loadingBias: { light: 0.2, moderate: 0.4, heavy: 0.4 } },
  'ohs': { open: 2, qf: 3, games: 3, loadingBias: { light: 0.2, moderate: 0.5, heavy: 0.3 } },
};

// Get frequency score based on athlete's competition tier
export const getFrequencyScore = (movementId: string, tier: string): number => {
  const freq = COMPETITION_FREQUENCY[movementId];
  if (!freq) return 3; // default to medium
  
  if (tier === 'Scaled' || tier === 'Rx') return freq.open;
  if (tier === 'Quarterfinals') return Math.round((freq.open + freq.qf) / 2);
  if (tier === 'Semis') return freq.qf;
  if (tier === 'Games') return freq.games;
  return 3;
};

// Calculate priority score (higher = more important to address)
export const calculatePriorityScore = (
  movementId: string, 
  proficiency: number, 
  tier: string, 
  zone: string | null = null
): number => {
  const freqScore = getFrequencyScore(movementId, tier);
  const weaknessScore = 6 - proficiency; // 1 proficiency = 5, 5 proficiency = 1
  
  // Zone-specific loading bias for barbell
  let loadingMultiplier = 1;
  if (zone && COMPETITION_FREQUENCY[movementId]?.loadingBias) {
    const bias = COMPETITION_FREQUENCY[movementId].loadingBias;
    if (bias && zone in bias) {
      loadingMultiplier = (bias as Record<string, number>)[zone] * 3 + 0.5;
    }
  }
  
  return Math.round(freqScore * weaknessScore * loadingMultiplier * 10) / 10;
};

export const lbsToKg = (lbs: number): number => Math.round(lbs * 0.453592 / 2.5) * 2.5;

export const STEPS = ['Basic CF', 'Gymnastics', 'Dumbbell', 'Barbell', 'Review'] as const;
export type Step = typeof STEPS[number];

// Movement data types
export interface BasicMovementData {
  confidence?: number;
  maxUB?: number;
  notes?: string;
  doesNotApply?: boolean;
}

export interface DBMovementData {
  confidence?: {
    light?: number;
    moderate?: number;
    heavy?: number;
  };
  notes?: string;
  doesNotApply?: boolean;
}

export interface BarbellMovementData {
  zones?: {
    light: number;
    moderate: number;
    heavy: number;
    max: number;
  };
  confidence?: {
    light?: number;
    moderate?: number;
    heavy?: number;
  };
  notes?: string;
  doesNotApply?: boolean;
}

export type MovementData = Record<string, BasicMovementData | DBMovementData | BarbellMovementData>;
