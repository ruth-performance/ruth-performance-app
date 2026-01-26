import { getSupabase } from '../supabase';

export interface MovementPriority {
  rank: number;
  movementId: string;
  movementName: string;
  category: string;
  subcategory?: string;
  confidenceRating: number;
  loadingZone?: string;
  priorityScore: number;
  competitionFrequency?: {
    open: number;
    qf: number;
    semis: number;
    games: number;
  };
}

export interface MovementAssessmentData {
  profileId: string;
  overallAverage: number;
  basicCfAverage: number;
  gymnasticsAverage: number;
  dumbbellAverage: number;
  barbellAverage: number;
  totalMovementsRated: number;
  strengthsCount: number;
  weaknessesCount: number;
  rawData: Record<string, unknown>;
  priorities: MovementPriority[];
}

export interface MovementAssessment {
  id: string;
  profile_id: string;
  assessment_date: string;
  overall_average: number;
  basic_cf_average?: number;
  gymnastics_average?: number;
  dumbbell_average?: number;
  barbell_average?: number;
  total_movements_rated: number;
  strengths_count: number;
  weaknesses_count: number;
  raw_data: Record<string, unknown>;
  created_at: string;
}

export async function saveMovementAssessment(data: MovementAssessmentData): Promise<MovementAssessment> {
  const supabase = getSupabase();

  // 1. Insert the movement assessment
  const { data: assessment, error: assessmentError } = await supabase
    .from('movement_assessments')
    .insert({
      profile_id: data.profileId,
      assessment_date: new Date().toISOString().split('T')[0],
      overall_average: data.overallAverage,
      basic_cf_average: data.basicCfAverage,
      gymnastics_average: data.gymnasticsAverage,
      dumbbell_average: data.dumbbellAverage,
      barbell_average: data.barbellAverage,
      total_movements_rated: data.totalMovementsRated,
      strengths_count: data.strengthsCount,
      weaknesses_count: data.weaknessesCount,
      raw_data: data.rawData,
    })
    .select()
    .single();

  if (assessmentError) throw assessmentError;

  // 2. Insert movement priorities
  if (data.priorities.length > 0) {
    const prioritiesToInsert = data.priorities.map(p => ({
      assessment_id: assessment.id,
      rank: p.rank,
      movement_id: p.movementId,
      movement_name: p.movementName,
      category: p.category,
      subcategory: p.subcategory,
      confidence_rating: p.confidenceRating,
      loading_zone: p.loadingZone,
      priority_score: p.priorityScore,
      competition_frequency: p.competitionFrequency,
    }));

    const { error: prioritiesError } = await supabase
      .from('movement_priorities')
      .insert(prioritiesToInsert);

    if (prioritiesError) throw prioritiesError;
  }

  return assessment;
}

export async function getLatestMovementAssessment(profileId: string): Promise<MovementAssessment | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('movement_assessments')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function getMovementPriorities(assessmentId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('movement_priorities')
    .select('*')
    .eq('assessment_id', assessmentId)
    .order('rank', { ascending: true });

  if (error) throw error;
  return data;
}
