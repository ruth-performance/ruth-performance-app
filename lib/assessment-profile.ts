import { supabase } from './supabase';

export interface ProfileData {
  email: string;
  name?: string;
  gender?: 'male' | 'female';
  weight_lbs?: number;
  height_inches?: number;
  competition_tier?: 'open' | 'quarterfinals' | 'semifinals' | 'games';
}

export interface AssessmentProfile {
  id: string;
  email: string;
  name?: string;
  gender?: 'male' | 'female';
  weight_lbs?: number;
  height_inches?: number;
  competition_tier?: 'open' | 'quarterfinals' | 'semifinals' | 'games';
  coach_command_athlete_id?: string;
  created_at: string;
  updated_at: string;
}

export async function upsertAssessmentProfile(data: ProfileData): Promise<AssessmentProfile> {
  const { data: profile, error } = await supabase
    .from('assessment_profiles')
    .upsert(
      {
        email: data.email.toLowerCase(),
        name: data.name,
        gender: data.gender,
        weight_lbs: data.weight_lbs,
        height_inches: data.height_inches,
        competition_tier: data.competition_tier,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'email',
        ignoreDuplicates: false
      }
    )
    .select()
    .single();

  if (error) throw error;
  return profile;
}

export async function getProfileByEmail(email: string): Promise<AssessmentProfile | null> {
  const { data, error } = await supabase
    .from('assessment_profiles')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
  return data;
}

export async function tryAutoLinkToCoachCommand(profileId: string, email: string): Promise<string | null> {
  // Check if Coach Command has an athlete with this email
  const { data: athlete } = await supabase
    .from('athletes')
    .select('id')
    .eq('email', email.toLowerCase())
    .single();

  if (athlete) {
    // Link the profile
    await supabase
      .from('assessment_profiles')
      .update({
        coach_command_athlete_id: athlete.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId);

    return athlete.id;
  }

  return null;
}
