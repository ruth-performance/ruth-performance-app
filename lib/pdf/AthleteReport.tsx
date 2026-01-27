import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#f97316',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f97316',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: 120,
    color: '#64748b',
  },
  value: {
    flex: 1,
    color: '#1e293b',
  },
  priorityItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
  },
  priorityRank: {
    width: 24,
    fontWeight: 'bold',
    color: '#f97316',
  },
  priorityName: {
    flex: 1,
    color: '#1e293b',
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 20,
  },
  column: {
    flex: 1,
  },
  goalCard: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  goalTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  goalDate: {
    fontSize: 10,
    color: '#f97316',
    marginBottom: 6,
  },
  obstacleItem: {
    color: '#dc2626',
    marginLeft: 10,
    marginBottom: 2,
  },
  benchmarkItem: {
    color: '#16a34a',
    marginLeft: 10,
    marginBottom: 2,
  },
  archetypeBox: {
    backgroundColor: '#1e293b',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  archetypeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f97316',
    marginBottom: 6,
  },
  archetypeDescription: {
    fontSize: 10,
    color: '#e2e8f0',
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
  },
  emptyText: {
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  labelBold: {
    fontWeight: 'bold',
    marginTop: 6,
    marginBottom: 2,
  },
  strengthText: {
    color: '#16a34a',
    marginBottom: 2,
  },
  weaknessText: {
    color: '#dc2626',
    marginBottom: 2,
  },
});

// Types
interface MovementPriority {
  rank: number;
  movement_name: string;
  category: string;
}

interface StrengthPriority {
  rank: number;
  lift: string;
  gap15?: number;
  rationale?: string;
}

interface StrengthData {
  back_squat?: number;
  front_squat?: number;
  deadlift?: number;
  clean?: number;
  clean_and_jerk?: number;
  snatch?: number;
  strict_press?: number;
  push_press?: number;
  bench_press?: number;
}

interface OutcomeGoal {
  goal: string;
  date: string;
  why: string;
}

interface ProcessGoal {
  action: string;
  frequency: string;
  when: string;
}

interface GoalsData {
  athlete_type?: string;
  athlete_type_description?: string;
  outcome_goals?: OutcomeGoal[];
  performance_goals?: Record<string, string[]>;
  obstacles?: Record<string, string[]>;
  process_goals?: ProcessGoal[];
  mental_strengths?: string[];
  development_areas?: string[];
}

interface AthleteReportProps {
  profile: {
    name: string;
    email: string;
    gender?: string;
    weight_lbs?: number;
    height_inches?: number;
    competition_tier?: string;
  };
  movementPriorities?: MovementPriority[];
  strengthPriorities?: StrengthPriority[];
  strengthData?: StrengthData;
  goalsData?: GoalsData;
  generatedDate: string;
}

// Component
export const AthleteReport = ({
  profile,
  movementPriorities,
  strengthPriorities,
  strengthData,
  goalsData,
  generatedDate,
}: AthleteReportProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{profile.name || 'Athlete'}</Text>
        <Text style={styles.subtitle}>
          {profile.competition_tier ? `${capitalize(profile.competition_tier)} Athlete` : 'Athlete'}
          {profile.weight_lbs ? ` • ${profile.weight_lbs} lbs` : ''}
          {` • Generated ${generatedDate}`}
        </Text>
      </View>

      {/* Two Column Layout: Sport Priorities & Strength Priorities */}
      <View style={styles.twoColumn}>
        {/* Sport Priorities */}
        <View style={styles.column}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sport Priorities</Text>
            {movementPriorities && movementPriorities.length > 0 ? (
              movementPriorities.slice(0, 10).map((p, i) => (
                <View key={i} style={styles.priorityItem}>
                  <Text style={styles.priorityRank}>{p.rank}.</Text>
                  <Text style={styles.priorityName}>{p.movement_name}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>
                No movement assessment completed
              </Text>
            )}
          </View>
        </View>

        {/* Strength Priorities */}
        <View style={styles.column}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Strength Priorities</Text>
            {strengthPriorities && strengthPriorities.length > 0 ? (
              strengthPriorities.slice(0, 5).map((p, i) => (
                <View key={i} style={styles.priorityItem}>
                  <Text style={styles.priorityRank}>{p.rank}.</Text>
                  <Text style={styles.priorityName}>
                    {p.lift}{p.gap15 && p.gap15 > 0 ? ` (+${p.gap15} lb)` : ''}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>
                No strength assessment completed
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* 1RM Table */}
      {strengthData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current 1RMs</Text>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Back Squat</Text>
                <Text style={styles.value}>{strengthData.back_squat || '—'} lb</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Front Squat</Text>
                <Text style={styles.value}>{strengthData.front_squat || '—'} lb</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Deadlift</Text>
                <Text style={styles.value}>{strengthData.deadlift || '—'} lb</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Clean</Text>
                <Text style={styles.value}>{strengthData.clean || '—'} lb</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Clean & Jerk</Text>
                <Text style={styles.value}>{strengthData.clean_and_jerk || '—'} lb</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Snatch</Text>
                <Text style={styles.value}>{strengthData.snatch || '—'} lb</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Strict Press</Text>
                <Text style={styles.value}>{strengthData.strict_press || '—'} lb</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Push Press</Text>
                <Text style={styles.value}>{strengthData.push_press || '—'} lb</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Bench Press</Text>
                <Text style={styles.value}>{strengthData.bench_press || '—'} lb</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Goals Section */}
      {goalsData && (
        <>
          {/* Archetype */}
          {goalsData.athlete_type && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Athlete Profile</Text>
              <View style={styles.archetypeBox}>
                <Text style={styles.archetypeName}>{goalsData.athlete_type}</Text>
                {goalsData.athlete_type_description && (
                  <Text style={styles.archetypeDescription}>
                    {goalsData.athlete_type_description}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Goals */}
          {goalsData.outcome_goals && goalsData.outcome_goals.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Goals & Obstacles</Text>
              {goalsData.outcome_goals.map((goal, i) => {
                const goalKey = `goal-${i + 1}`;
                const benchmarks = goalsData.performance_goals?.[goalKey] || [];
                const goalObstacles = goalsData.obstacles?.[goalKey] || [];
                return (
                  <View key={i} style={styles.goalCard}>
                    <Text style={styles.goalTitle}>{goal.goal}</Text>
                    <Text style={styles.goalDate}>Target: {goal.date}</Text>

                    {/* Benchmarks */}
                    {benchmarks.length > 0 && (
                      <>
                        <Text style={styles.labelBold}>Key Benchmarks:</Text>
                        {benchmarks.map((b, j) => (
                          <Text key={j} style={styles.benchmarkItem}>• {b}</Text>
                        ))}
                      </>
                    )}

                    {/* Obstacles */}
                    {goalObstacles.length > 0 && (
                      <>
                        <Text style={styles.labelBold}>Obstacles:</Text>
                        {goalObstacles.map((o, j) => (
                          <Text key={j} style={styles.obstacleItem}>• {o}</Text>
                        ))}
                      </>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Process Goals */}
          {goalsData.process_goals && goalsData.process_goals.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Process Goals (Habits)</Text>
              {goalsData.process_goals.map((habit, i) => (
                <View key={i} style={styles.row}>
                  <Text style={styles.value}>
                    • {habit.action} ({habit.frequency}) — {habit.when}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Mental Skills */}
          {(goalsData.mental_strengths?.length || goalsData.development_areas?.length) && (
            <View style={styles.twoColumn}>
              <View style={styles.column}>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Mental Strengths</Text>
                  {goalsData.mental_strengths && goalsData.mental_strengths.length > 0 ? (
                    goalsData.mental_strengths.map((s, i) => (
                      <Text key={i} style={styles.strengthText}>
                        + {formatSkillName(s)}
                      </Text>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>None identified</Text>
                  )}
                </View>
              </View>
              <View style={styles.column}>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Development Areas</Text>
                  {goalsData.development_areas && goalsData.development_areas.length > 0 ? (
                    goalsData.development_areas.map((s, i) => (
                      <Text key={i} style={styles.weaknessText}>
                        ! {formatSkillName(s)}
                      </Text>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>None identified</Text>
                  )}
                </View>
              </View>
            </View>
          )}
        </>
      )}

      {/* Footer */}
      <Text style={styles.footer}>
        Ruth Performance Lab • {profile.email} • Generated {generatedDate}
      </Text>
    </Page>
  </Document>
);

// Helpers
function formatSkillName(key: string): string {
  const names: Record<string, string> = {
    coping: 'Coping with Adversity',
    peaking: 'Peaking Under Pressure',
    goalSetting: 'Goal Setting',
    concentration: 'Concentration',
    freedomFromWorry: 'Freedom from Worry',
    confidence: 'Confidence',
    coachability: 'Coachability',
  };
  return names[key] || key;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
