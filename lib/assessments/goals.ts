import { getSupabase } from '../supabase';
import { ValuesReflections } from '../goals-data';

export interface GoalsAssessmentData {
  profileId: string;
  primaryGoal?: string;
  selectedValues: string[];
  valuesReflections: ValuesReflections;
  outcomeGoals: Array<{
    id: string;
    goal: string;
    date: string;
    why: string;
  }>;
  valueAlignment: Record<string, string[]>;
  valueExplanations: Record<string, string>;
  performanceGoals: Record<string, string[]>;
  obstacles: Record<string, string[]>;
  processGoals: Array<{
    id: string;
    action: string;
    frequency: string;
    when: string;
    obstacle: string;
  }>;
  mentalSkillRatings: Record<string, number>;
  athleteType: string;
  athleteTypeDescription: string;
  mentalSkillsAverage: number;
  mentalStrengths: string[];
  developmentAreas: string[];
  rawData: Record<string, unknown>;
}

export interface GoalsAssessment {
  id: string;
  profile_id: string;
  assessment_date: string;
  primary_goal?: string;
  selected_values: string[];
  values_reflections: ValuesReflections;
  outcome_goals: Array<{
    id: string;
    goal: string;
    date: string;
    why: string;
  }>;
  value_alignment: Record<string, string[]>;
  value_explanations: Record<string, string>;
  performance_goals: Record<string, string[]>;
  obstacles: Record<string, string[]>;
  process_goals: Array<{
    id: string;
    action: string;
    frequency: string;
    when: string;
    obstacle: string;
  }>;
  mental_skill_ratings: Record<string, number>;
  athlete_type: string;
  athlete_type_description: string;
  mental_skills_average: number;
  mental_strengths: string[];
  development_areas: string[];
  raw_data: Record<string, unknown>;
  created_at: string;
}

export async function saveGoalsAssessment(data: GoalsAssessmentData): Promise<GoalsAssessment> {
  const supabase = getSupabase();
  const { data: assessment, error } = await supabase
    .from('goals_assessments')
    .insert({
      profile_id: data.profileId,
      assessment_date: new Date().toISOString().split('T')[0],
      primary_goal: data.primaryGoal,
      selected_values: data.selectedValues,
      values_reflections: data.valuesReflections,
      outcome_goals: data.outcomeGoals,
      value_alignment: data.valueAlignment,
      value_explanations: data.valueExplanations,
      performance_goals: data.performanceGoals,
      obstacles: data.obstacles,
      process_goals: data.processGoals,
      mental_skill_ratings: data.mentalSkillRatings,
      athlete_type: data.athleteType,
      athlete_type_description: data.athleteTypeDescription,
      mental_skills_average: data.mentalSkillsAverage,
      mental_strengths: data.mentalStrengths,
      development_areas: data.developmentAreas,
      raw_data: data.rawData,
    })
    .select()
    .single();

  if (error) throw error;
  return assessment;
}

export async function getLatestGoalsAssessment(profileId: string): Promise<GoalsAssessment | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('goals_assessments')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}
