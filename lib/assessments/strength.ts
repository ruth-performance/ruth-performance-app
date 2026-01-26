import { getSupabase } from '../supabase';

export interface StrengthAssessmentData {
  profileId: string;

  // Primary lifts (lbs)
  backSquat?: number;
  frontSquat?: number;
  deadlift?: number;
  clean?: number;
  cleanAndJerk?: number;
  snatch?: number;
  strictPress?: number;
  pushPress?: number;
  benchPress?: number;

  // Ratios (calculated)
  frontToBackSquat?: number;
  cleanToFrontSquat?: number;
  snatchToClean?: number;
  jerkToClean?: number;
  deadliftToBackSquat?: number;

  // BW ratios
  backSquatToBw?: number;
  deadliftToBw?: number;
  cleanToBw?: number;
  snatchToBw?: number;

  strengthPriorities?: unknown[];
  ratioAnalysis?: unknown;
  rawData: Record<string, unknown>;
}

export interface StrengthAssessment {
  id: string;
  profile_id: string;
  assessment_date: string;
  back_squat?: number;
  front_squat?: number;
  deadlift?: number;
  clean?: number;
  clean_and_jerk?: number;
  snatch?: number;
  strict_press?: number;
  push_press?: number;
  bench_press?: number;
  front_to_back_squat?: number;
  clean_to_front_squat?: number;
  snatch_to_clean?: number;
  jerk_to_clean?: number;
  deadlift_to_back_squat?: number;
  back_squat_to_bw?: number;
  deadlift_to_bw?: number;
  clean_to_bw?: number;
  snatch_to_bw?: number;
  strength_priorities?: unknown[];
  ratio_analysis?: unknown;
  raw_data: Record<string, unknown>;
  created_at: string;
}

export async function saveStrengthAssessment(data: StrengthAssessmentData): Promise<StrengthAssessment> {
  const supabase = getSupabase();
  const { data: assessment, error } = await supabase
    .from('strength_assessments')
    .insert({
      profile_id: data.profileId,
      assessment_date: new Date().toISOString().split('T')[0],
      back_squat: data.backSquat,
      front_squat: data.frontSquat,
      deadlift: data.deadlift,
      clean: data.clean,
      clean_and_jerk: data.cleanAndJerk,
      snatch: data.snatch,
      strict_press: data.strictPress,
      push_press: data.pushPress,
      bench_press: data.benchPress,
      front_to_back_squat: data.frontToBackSquat,
      clean_to_front_squat: data.cleanToFrontSquat,
      snatch_to_clean: data.snatchToClean,
      jerk_to_clean: data.jerkToClean,
      deadlift_to_back_squat: data.deadliftToBackSquat,
      back_squat_to_bw: data.backSquatToBw,
      deadlift_to_bw: data.deadliftToBw,
      clean_to_bw: data.cleanToBw,
      snatch_to_bw: data.snatchToBw,
      strength_priorities: data.strengthPriorities,
      ratio_analysis: data.ratioAnalysis,
      raw_data: data.rawData,
    })
    .select()
    .single();

  if (error) throw error;
  return assessment;
}

export async function getLatestStrengthAssessment(profileId: string): Promise<StrengthAssessment | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('strength_assessments')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}
