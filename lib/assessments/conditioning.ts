import { getSupabase } from '../supabase';

export interface TrainingZone {
  zone: number;
  name: string;
  description?: string;
  color?: string;
  paceRange?: string;
  calHrRange?: string;
  paceRangeMile?: string;
  paceRangeKm?: string;
}

export interface ConditioningAssessmentData {
  profileId: string;

  // Echo Bike
  echo10minCals?: number;
  echoCalPerLb?: number;
  echoPowerRating?: number;
  echoPowerPctElite?: number;
  echoAssessment?: string;
  echoIsPriority?: boolean;

  // Row (times in seconds)
  row500mTime?: number;
  row1000mTime?: number;
  row2000mTime?: number;
  row5000mTime?: number;
  rowCpWatts?: number;
  rowCpPace?: number;

  // Run (times in seconds)
  run400mTime?: number;
  runMileTime?: number;
  run5kTime?: number;
  run10kTime?: number;
  runCvPace?: number;

  // Zones
  rowZones?: TrainingZone[];
  runZones?: TrainingZone[];

  rawData: Record<string, unknown>;
}

export interface ConditioningAssessment {
  id: string;
  profile_id: string;
  assessment_date: string;
  echo_10min_cals?: number;
  echo_cal_per_lb?: number;
  echo_power_rating?: number;
  echo_power_pct_elite?: number;
  echo_assessment?: string;
  echo_is_priority?: boolean;
  row_500m_time?: number;
  row_1000m_time?: number;
  row_2000m_time?: number;
  row_5000m_time?: number;
  row_cp_watts?: number;
  row_cp_pace?: number;
  run_400m_time?: number;
  run_mile_time?: number;
  run_5k_time?: number;
  run_10k_time?: number;
  run_cv_pace?: number;
  row_zones?: TrainingZone[];
  run_zones?: TrainingZone[];
  raw_data: Record<string, unknown>;
  created_at: string;
}

export async function saveConditioningAssessment(data: ConditioningAssessmentData): Promise<ConditioningAssessment> {
  const supabase = getSupabase();
  const { data: assessment, error } = await supabase
    .from('conditioning_assessments')
    .insert({
      profile_id: data.profileId,
      assessment_date: new Date().toISOString().split('T')[0],
      echo_10min_cals: data.echo10minCals,
      echo_cal_per_lb: data.echoCalPerLb,
      echo_power_rating: data.echoPowerRating,
      echo_power_pct_elite: data.echoPowerPctElite,
      echo_assessment: data.echoAssessment,
      echo_is_priority: data.echoIsPriority,
      row_500m_time: data.row500mTime,
      row_1000m_time: data.row1000mTime,
      row_2000m_time: data.row2000mTime,
      row_5000m_time: data.row5000mTime,
      row_cp_watts: data.rowCpWatts,
      row_cp_pace: data.rowCpPace,
      run_400m_time: data.run400mTime,
      run_mile_time: data.runMileTime,
      run_5k_time: data.run5kTime,
      run_10k_time: data.run10kTime,
      run_cv_pace: data.runCvPace,
      row_zones: data.rowZones,
      run_zones: data.runZones,
      raw_data: data.rawData,
    })
    .select()
    .single();

  if (error) throw error;
  return assessment;
}

export async function getLatestConditioningAssessment(profileId: string): Promise<ConditioningAssessment | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('conditioning_assessments')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}
