// Goals Assessment Data - Values, Mental Skills, and Athlete Archetypes

// ============================================================================
// Brene Brown "Dare to Lead" Values List (107 values)
// ============================================================================

export const BRENE_VALUES = [
  "Accountability", "Achievement", "Adaptability", "Adventure", "Altruism",
  "Ambition", "Authenticity", "Balance", "Beauty", "Being the best",
  "Belonging", "Career", "Caring", "Collaboration", "Commitment",
  "Community", "Compassion", "Competence", "Confidence", "Connection",
  "Contentment", "Contribution", "Cooperation", "Courage", "Creativity",
  "Curiosity", "Dignity", "Diversity", "Environment", "Efficiency",
  "Equality", "Ethics", "Excellence", "Fairness", "Faith",
  "Family", "Financial stability", "Forgiveness", "Freedom", "Friendship",
  "Fun", "Future generations", "Generosity", "Giving back", "Grace",
  "Gratitude", "Growth", "Harmony", "Health", "Home",
  "Honesty", "Hope", "Humility", "Humor", "Inclusion",
  "Independence", "Initiative", "Integrity", "Intuition", "Job security",
  "Joy", "Justice", "Kindness", "Knowledge", "Leadership",
  "Learning", "Legacy", "Leisure", "Love", "Loyalty",
  "Making a difference", "Nature", "Openness", "Optimism", "Order",
  "Parenting", "Patience", "Patriotism", "Peace", "Perseverance",
  "Personal fulfillment", "Power", "Pride", "Recognition", "Reliability",
  "Resourcefulness", "Respect", "Responsibility", "Risk-taking", "Safety",
  "Security", "Self-discipline", "Self-expression", "Self-respect", "Serenity",
  "Service", "Simplicity", "Spirituality", "Sportsmanship", "Stewardship",
  "Success", "Teamwork", "Thrift", "Time", "Tradition",
  "Travel", "Trust", "Truth", "Understanding", "Uniqueness",
  "Usefulness", "Vision", "Vulnerability", "Wealth", "Well-being",
  "Wholeheartedness", "Wisdom"
];

// ============================================================================
// Values Reflection Questions
// ============================================================================

export const VALUES_QUESTIONS = [
  {
    id: 'q1',
    question: "When you're training at your absolute best, what does that feel like? What's driving you?",
    placeholder: "Describe the feeling and what motivates you in those moments..."
  },
  {
    id: 'q2',
    question: "What would make you proud even if you didn't achieve your ultimate goal?",
    placeholder: "Think about what matters beyond the outcome..."
  },
  {
    id: 'q3',
    question: "What do you want people to say about how you compete and train?",
    placeholder: "Consider your character and approach to the sport..."
  }
];

// ============================================================================
// Mental Skills (ACSI-28 based)
// ============================================================================

export interface MentalSkill {
  id: string;
  name: string;
  description: string;
}

export const MENTAL_SKILLS: MentalSkill[] = [
  {
    id: 'coping',
    name: 'Coping with Adversity',
    description: 'Staying positive and enthusiastic after mistakes'
  },
  {
    id: 'peaking',
    name: 'Peaking Under Pressure',
    description: 'Performing your best when pressure is greatest'
  },
  {
    id: 'goalSetting',
    name: 'Goal Setting & Mental Prep',
    description: 'Setting and working toward specific goals'
  },
  {
    id: 'concentration',
    name: 'Concentration',
    description: 'Maintaining focus on the task at hand'
  },
  {
    id: 'freedomFromWorry',
    name: 'Freedom from Worry',
    description: 'Not putting pressure on yourself or worrying about performing poorly'
  },
  {
    id: 'confidence',
    name: 'Confidence & Achievement Motivation',
    description: 'Believing in your abilities and being determined to succeed'
  },
  {
    id: 'coachability',
    name: 'Coachability',
    description: 'Being open to and learning from instruction and criticism'
  }
];

export type MentalSkillId = 'coping' | 'peaking' | 'goalSetting' | 'concentration' | 'freedomFromWorry' | 'confidence' | 'coachability';

export type MentalSkillRatings = Record<MentalSkillId, number>;

// ============================================================================
// Athlete Archetypes
// ============================================================================

export interface Archetype {
  name: string;
  values: string[];
  mentalFocus: MentalSkillId[];
  description: string;
}

export const ARCHETYPES: Record<string, Archetype> = {
  'The Competitor': {
    name: 'The Competitor',
    values: ['achievement', 'success', 'being the best', 'excellence', 'recognition', 'pride', 'power'],
    mentalFocus: ['peaking', 'confidence'],
    description: 'You thrive on competition and measuring yourself against the best. Your drive for excellence pushes you to constantly raise the bar.'
  },
  'The Growth-Seeker': {
    name: 'The Growth-Seeker',
    values: ['growth', 'learning', 'curiosity', 'knowledge', 'self-expression', 'personal fulfillment', 'wisdom'],
    mentalFocus: ['goalSetting', 'coachability'],
    description: 'You see every training session as an opportunity to improve. The journey matters as much as the destination for you.'
  },
  'The Resilient Warrior': {
    name: 'The Resilient Warrior',
    values: ['perseverance', 'courage', 'self-discipline', 'determination', 'resourcefulness', 'strength'],
    mentalFocus: ['coping', 'concentration'],
    description: 'You define yourself by your ability to push through adversity. Obstacles are just fuel for your fire.'
  },
  'The Team Player': {
    name: 'The Team Player',
    values: ['teamwork', 'collaboration', 'community', 'connection', 'belonging', 'loyalty', 'service'],
    mentalFocus: ['coachability', 'confidence'],
    description: 'You draw energy from those around you and elevate everyone in your circle. Your success is shared success.'
  },
  'The Balanced Performer': {
    name: 'The Balanced Performer',
    values: ['balance', 'harmony', 'well-being', 'health', 'peace', 'serenity', 'contentment'],
    mentalFocus: ['freedomFromWorry', 'concentration'],
    description: 'You understand that sustainable performance comes from holistic wellness. You compete fiercely but maintain perspective.'
  },
  'The Legacy Builder': {
    name: 'The Legacy Builder',
    values: ['legacy', 'making a difference', 'contribution', 'future generations', 'leadership', 'integrity', 'stewardship'],
    mentalFocus: ['goalSetting', 'confidence'],
    description: 'You play for something bigger than yourself. Your impact extends beyond your own results.'
  },
  'The Authentic Athlete': {
    name: 'The Authentic Athlete',
    values: ['authenticity', 'honesty', 'truth', 'integrity', 'self-respect', 'vulnerability', 'wholeheartedness'],
    mentalFocus: ['coping', 'freedomFromWorry'],
    description: 'You compete as your true self. Your genuineness creates unshakeable confidence and inspires others.'
  },
  'The Joy-Driven': {
    name: 'The Joy-Driven',
    values: ['fun', 'joy', 'humor', 'adventure', 'creativity', 'play', 'enthusiasm'],
    mentalFocus: ['freedomFromWorry', 'confidence'],
    description: 'You remember why you started - for the love of the sport. Your positive energy is contagious and sustainable.'
  }
};

export const DEFAULT_ARCHETYPE = {
  name: 'The Driven Athlete',
  description: 'You bring a unique combination of values and mental strengths to your sport. Your individual approach is your competitive advantage.'
};

// ============================================================================
// Type Determination
// ============================================================================

export function determineAthleteType(
  selectedValues: string[],
  mentalSkillRatings: MentalSkillRatings
): { name: string; description: string } {
  const valueSet = new Set(selectedValues.map(v => v.toLowerCase()));

  let bestMatch = DEFAULT_ARCHETYPE;
  let bestScore = 0;

  for (const [, archetype] of Object.entries(ARCHETYPES)) {
    let score = 0;

    // Check value matches (2 points each)
    archetype.values.forEach(v => {
      if (valueSet.has(v.toLowerCase())) score += 2;
    });

    // Check mental skill alignment (1 point each if rated >= 4)
    archetype.mentalFocus.forEach(skill => {
      if ((mentalSkillRatings[skill] || 0) >= 4) score += 1;
    });

    if (score > bestScore) {
      bestScore = score;
      bestMatch = { name: archetype.name, description: archetype.description };
    }
  }

  return bestMatch;
}

// ============================================================================
// Data Types
// ============================================================================

export interface ValuesReflections {
  q1: string;
  q2: string;
  q3: string;
}

export interface OutcomeGoal {
  id: string;
  goal: string;
  date: string;
  why: string;
}

export interface ProcessGoal {
  id: string;
  action: string;
  frequency: 'daily' | 'weekly' | '3x-week';
  when: string;
  obstacle: string;
}

export interface GoalsData {
  // Phase 1: Values
  selectedValues: string[];
  valuesReflections: ValuesReflections;

  // Phase 2: Outcome Goals
  outcomeGoals: OutcomeGoal[];

  // Phase 3: Value Alignment
  valueAlignment: Record<string, string[]>;  // goalId -> selected values
  valueExplanations: Record<string, string>; // goalId -> explanation

  // Phase 4: Breakdown
  performanceGoals: Record<string, string[]>; // goalId -> benchmarks
  obstacles: Record<string, string[]>;        // goalId -> obstacles

  // Phase 5: Process Goals
  processGoals: ProcessGoal[];

  // Phase 6: Mental Skills
  mentalSkillRatings: MentalSkillRatings;
}

export interface GoalsAnalysis {
  athleteType: { name: string; description: string };
  mentalSkillsAverage: number;
  mentalStrengths: string[];      // Skill IDs rated >= 4
  developmentAreas: string[];     // Skill IDs rated <= 2
}

// ============================================================================
// Analysis Functions
// ============================================================================

export function analyzeGoals(data: GoalsData): GoalsAnalysis {
  const { selectedValues, mentalSkillRatings } = data;

  // Determine athlete type
  const athleteType = determineAthleteType(selectedValues, mentalSkillRatings);

  // Calculate mental skills average
  const ratings = Object.values(mentalSkillRatings);
  const mentalSkillsAverage = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
    : 0;

  // Find strengths (>= 4) and development areas (<= 2)
  const mentalStrengths: string[] = [];
  const developmentAreas: string[] = [];

  for (const [skillId, rating] of Object.entries(mentalSkillRatings)) {
    if (rating >= 4) {
      mentalStrengths.push(skillId);
    }
    if (rating <= 2) {
      developmentAreas.push(skillId);
    }
  }

  return {
    athleteType,
    mentalSkillsAverage,
    mentalStrengths,
    developmentAreas
  };
}

// ============================================================================
// Default/Empty Data
// ============================================================================

export function createEmptyGoalsData(): GoalsData {
  return {
    selectedValues: [],
    valuesReflections: { q1: '', q2: '', q3: '' },
    outcomeGoals: [],
    valueAlignment: {},
    valueExplanations: {},
    performanceGoals: {},
    obstacles: {},
    processGoals: [],
    mentalSkillRatings: {
      coping: 0,
      peaking: 0,
      goalSetting: 0,
      concentration: 0,
      freedomFromWorry: 0,
      confidence: 0,
      coachability: 0
    }
  };
}

// ============================================================================
// Frequency Labels
// ============================================================================

export const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: '3x-week', label: '3x per Week' }
] as const;

// Get skill name from ID
export function getSkillName(skillId: string): string {
  const skill = MENTAL_SKILLS.find(s => s.id === skillId);
  return skill?.name || skillId;
}
