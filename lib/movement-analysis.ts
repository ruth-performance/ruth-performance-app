import { 
  MOVEMENTS, 
  MovementData, 
  BasicMovementData, 
  DBMovementData, 
  BarbellMovementData,
  calculatePriorityScore 
} from '@/lib/movement-data';

export interface AnalysisResult {
  strengths: Array<{ name: string; confidence: number; category: string }>;
  weaknesses: Array<{ name: string; confidence: number; category: string; priority: number }>;
  patterns: Array<{ name: string; avg: number; type: 'strength' | 'weakness' | 'neutral' }>;
  categoryAverages: Record<string, number>;
  overallAverage: number;
  totalMovements: number;
  completedMovements: number;
}

export function analyzeMovementData(
  movementData: MovementData, 
  competitionTier: string
): AnalysisResult {
  const strengths: AnalysisResult['strengths'] = [];
  const weaknesses: AnalysisResult['weaknesses'] = [];
  const categoryScores: Record<string, number[]> = {};
  const subcategoryScores: Record<string, number[]> = {};
  let totalMovements = 0;
  let completedMovements = 0;

  // Process Basic CF
  Object.entries(MOVEMENTS.BasicCF.subcategories).forEach(([subName, movements]) => {
    movements.forEach(m => {
      totalMovements++;
      const data = movementData[m.id] as BasicMovementData | undefined;
      if (data?.doesNotApply) return;
      
      const conf = data?.confidence;
      if (conf) {
        completedMovements++;
        if (!categoryScores['Basic CF']) categoryScores['Basic CF'] = [];
        categoryScores['Basic CF'].push(conf);
        
        if (!subcategoryScores[subName]) subcategoryScores[subName] = [];
        subcategoryScores[subName].push(conf);

        if (conf >= 4) {
          strengths.push({ name: m.name, confidence: conf, category: 'Basic CF' });
        } else if (conf <= 2) {
          const priority = calculatePriorityScore(m.id, conf, competitionTier);
          weaknesses.push({ name: m.name, confidence: conf, category: 'Basic CF', priority });
        }
      }
    });
  });

  // Process Gymnastics
  Object.entries(MOVEMENTS.Gymnastics.subcategories).forEach(([subName, movements]) => {
    movements.forEach(m => {
      totalMovements++;
      const data = movementData[m.id] as BasicMovementData | undefined;
      if (data?.doesNotApply) return;
      
      const conf = data?.confidence;
      if (conf) {
        completedMovements++;
        if (!categoryScores['Gymnastics']) categoryScores['Gymnastics'] = [];
        categoryScores['Gymnastics'].push(conf);
        
        if (!subcategoryScores[subName]) subcategoryScores[subName] = [];
        subcategoryScores[subName].push(conf);

        if (conf >= 4) {
          strengths.push({ name: m.name, confidence: conf, category: 'Gymnastics' });
        } else if (conf <= 2) {
          const priority = calculatePriorityScore(m.id, conf, competitionTier);
          weaknesses.push({ name: m.name, confidence: conf, category: 'Gymnastics', priority });
        }
      }
    });
  });

  // Process DB
  MOVEMENTS.DB.movements.forEach(m => {
    totalMovements++;
    const data = movementData[m.id] as DBMovementData | undefined;
    if (data?.doesNotApply) return;
    
    const conf = data?.confidence;
    if (conf?.light !== undefined || conf?.moderate !== undefined || conf?.heavy !== undefined) {
      completedMovements++;
      const zones = ['light', 'moderate', 'heavy'] as const;
      
      zones.forEach(zone => {
        const zoneConf = conf[zone];
        if (zoneConf) {
          if (!categoryScores['Dumbbell']) categoryScores['Dumbbell'] = [];
          categoryScores['Dumbbell'].push(zoneConf);
          
          const zoneKey = `DB ${zone}`;
          if (!subcategoryScores[zoneKey]) subcategoryScores[zoneKey] = [];
          subcategoryScores[zoneKey].push(zoneConf);

          if (zoneConf >= 4) {
            strengths.push({ name: `${m.name} (${zone})`, confidence: zoneConf, category: 'Dumbbell' });
          } else if (zoneConf <= 2) {
            const priority = calculatePriorityScore(m.id, zoneConf, competitionTier, zone);
            weaknesses.push({ name: `${m.name} (${zone})`, confidence: zoneConf, category: 'Dumbbell', priority });
          }
        }
      });
    }
  });

  // Process Barbell
  MOVEMENTS.Barbell.movements.forEach(m => {
    totalMovements++;
    const data = movementData[m.id] as BarbellMovementData | undefined;
    if (data?.doesNotApply) return;
    
    const conf = data?.confidence;
    if (conf?.light !== undefined || conf?.moderate !== undefined || conf?.heavy !== undefined) {
      completedMovements++;
      const zones = ['light', 'moderate', 'heavy'] as const;
      
      zones.forEach(zone => {
        const zoneConf = conf[zone];
        if (zoneConf) {
          if (!categoryScores['Barbell']) categoryScores['Barbell'] = [];
          categoryScores['Barbell'].push(zoneConf);
          
          const zoneKey = `BB ${zone}`;
          if (!subcategoryScores[zoneKey]) subcategoryScores[zoneKey] = [];
          subcategoryScores[zoneKey].push(zoneConf);

          if (zoneConf >= 4) {
            strengths.push({ name: `${m.name} (${zone})`, confidence: zoneConf, category: 'Barbell' });
          } else if (zoneConf <= 2) {
            const priority = calculatePriorityScore(m.id, zoneConf, competitionTier, zone);
            weaknesses.push({ name: `${m.name} (${zone})`, confidence: zoneConf, category: 'Barbell', priority });
          }
        }
      });
    }
  });

  // Calculate category averages
  const categoryAverages: Record<string, number> = {};
  Object.entries(categoryScores).forEach(([cat, scores]) => {
    if (scores.length > 0) {
      categoryAverages[cat] = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
    }
  });

  // Calculate overall average
  const allScores = Object.values(categoryScores).flat();
  const overallAverage = allScores.length > 0 
    ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10
    : 0;

  // Calculate patterns from subcategories
  const patterns: AnalysisResult['patterns'] = [];
  Object.entries(subcategoryScores).forEach(([name, scores]) => {
    if (scores.length >= 2) {
      const avg = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
      let type: 'strength' | 'weakness' | 'neutral' = 'neutral';
      if (avg >= 4) type = 'strength';
      else if (avg <= 2.5) type = 'weakness';
      patterns.push({ name, avg, type });
    }
  });

  // Sort patterns
  patterns.sort((a, b) => b.avg - a.avg);

  // Sort weaknesses by priority (highest first)
  weaknesses.sort((a, b) => b.priority - a.priority);

  // Sort strengths by confidence (highest first)
  strengths.sort((a, b) => b.confidence - a.confidence);

  return {
    strengths,
    weaknesses,
    patterns,
    categoryAverages,
    overallAverage,
    totalMovements,
    completedMovements,
  };
}

// Serialize movement data for storage (flatten to simple key-value pairs)
export function serializeMovementData(data: MovementData): Record<string, string> {
  const result: Record<string, string> = {};
  
  Object.entries(data).forEach(([movementId, movementData]) => {
    // Store as JSON string for each movement
    result[movementId] = JSON.stringify(movementData);
  });
  
  return result;
}

// Deserialize movement data from storage
export function deserializeMovementData(data: Record<string, string>): MovementData {
  const result: MovementData = {};
  
  Object.entries(data).forEach(([movementId, jsonString]) => {
    try {
      result[movementId] = JSON.parse(jsonString);
    } catch {
      // Skip invalid entries
    }
  });
  
  return result;
}
