import { jsPDF } from 'jspdf';

// Color constants for dark mode
export const COLORS = {
  background: '#1e293b',      // Main dark bg
  cardBg: '#334155',          // Section backgrounds
  text: '#f8fafc',            // Primary text (white)
  textMuted: '#94a3b8',       // Secondary text (gray)
  accent: '#f97316',          // Orange accent
  success: '#22c55e',         // Green (rating 5)
  warning: '#eab308',         // Yellow (rating 3)
  danger: '#ef4444',          // Red (rating 1)
};

// RGB conversions for jsPDF
export const RGB = {
  background: [30, 41, 59] as [number, number, number],
  cardBg: [51, 65, 85] as [number, number, number],
  text: [248, 250, 252] as [number, number, number],
  textMuted: [148, 163, 184] as [number, number, number],
  accent: [249, 115, 22] as [number, number, number],
  success: [34, 197, 94] as [number, number, number],
  warning: [250, 204, 21] as [number, number, number],  // Brighter yellow for visibility
  danger: [239, 68, 68] as [number, number, number],
  lime: [132, 204, 22] as [number, number, number],
  gray: [71, 85, 105] as [number, number, number],
  eliteGray: [150, 150, 150] as [number, number, number],
};

// Rating color scale - explicit RGB values for heat map visibility
export const RATING_COLORS: Record<number, [number, number, number]> = {
  5: [34, 197, 94],    // Green - Expert
  4: [132, 204, 22],   // Lime - Proficient
  3: [250, 204, 21],   // Yellow - Competent
  2: [249, 115, 22],   // Orange - Developing
  1: [239, 68, 68],    // Red - Novice
  0: [71, 85, 105],    // Gray - No rating
};

// Elite pace benchmarks (seconds per 500m for row, seconds per mile for run)
export const ELITE_ROW_PACES = [
  { distance: '500m', meters: 500, pace: 85 },    // 1:25/500m
  { distance: '1000m', meters: 1000, pace: 95 },  // 1:35/500m
  { distance: '2000m', meters: 2000, pace: 105 }, // 1:45/500m
  { distance: '5000m', meters: 5000, pace: 115 }, // 1:55/500m
];

export const ELITE_RUN_PACES = [
  { distance: '400m', meters: 400, pace: 270 },   // ~4:30/mile pace
  { distance: '1 mi', meters: 1609, pace: 300 },  // 5:00/mile
  { distance: '5K', meters: 5000, pace: 330 },    // 5:30/mile
  { distance: '10K', meters: 10000, pace: 360 },  // 6:00/mile
];

// Movement categories for heat map
export const MOVEMENT_CATEGORIES: Record<string, string[]> = {
  'Basic CF': ['Air Squat', 'Front Squat', 'Back Squat', 'Overhead Squat', 'Thruster', 'Wall Ball', 'Box Jump', 'Burpee', 'Double-Unders', 'Pull-up', 'Push-up', 'Sit-up', 'Kettlebell Swing', 'Rowing', 'Running'],
  'Gymnastics': ['Toes-to-Bar', 'Knees-to-Elbow', 'GHD Sit-Up', 'Muscle-Up (Bar)', 'Muscle-Up (Ring)', 'Rope Climb', 'Pistol', 'HS Walk', 'HS Hold', 'Strict HSPU', 'Kipping HSPU', 'Wall Walk', 'L-Sit'],
  'Dumbbell': ['DB Snatch', 'DB Clean', 'DB Thruster', 'DB Front Squat', 'DB Walking Lunge', 'DB Box Step-Over', 'DB Step-Over (Double)', 'Man Maker'],
  'Barbell': ['Deadlift', 'Clean', 'Power Clean', 'Squat Clean', 'Hang Clean', 'Snatch', 'Power Snatch', 'Squat Snatch', 'Hang Snatch', 'Clean & Jerk', 'Push Press', 'Push Jerk', 'Split Jerk']
};

// Elite benchmarks for strength chart
export const ELITE_BENCHMARKS = {
  male: {
    back_squat: 485,
    front_squat: 405,
    deadlift: 525,
    clean: 380,
    clean_and_jerk: 376,
    snatch: 296,
    strict_press: 225,
    push_press: 340,
    bench_press: 365
  },
  female: {
    back_squat: 305,
    front_squat: 265,
    deadlift: 345,
    clean: 247,
    clean_and_jerk: 260,
    snatch: 192,
    strict_press: 140,
    push_press: 205,
    bench_press: 185
  }
};

// Lift display names
export const LIFT_LABELS: Record<string, string> = {
  back_squat: 'Back Squat',
  front_squat: 'Front Squat',
  deadlift: 'Deadlift',
  clean: 'Clean',
  clean_and_jerk: 'C&J',
  snatch: 'Snatch',
  strict_press: 'Strict Press',
  push_press: 'Push Press',
  bench_press: 'Bench Press'
};

export interface MovementRatings {
  [movement: string]: number;
}

export interface TrainingZone {
  zone: number;
  name: string;
  color?: string;
  paceRange?: string;
  calHrRange?: string;
  paceRangeMile?: string;
  paceRangeKm?: string;
}

/**
 * Add page background (dark slate)
 */
export function addPageBackground(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFillColor(...RGB.background);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
}

/**
 * Get rating color with explicit RGB values
 */
function getRatingColor(rating: number): [number, number, number] {
  switch (rating) {
    case 5: return [34, 197, 94];    // Green - Expert
    case 4: return [132, 204, 22];   // Lime - Proficient
    case 3: return [250, 204, 21];   // Yellow - Competent
    case 2: return [249, 115, 22];   // Orange - Developing
    case 1: return [239, 68, 68];    // Red - Novice
    default: return [71, 85, 105];   // Gray - No rating
  }
}

/**
 * Flexible lookup for movement rating - tries multiple key formats
 */
function findRating(ratings: MovementRatings, movement: string): number {
  // Try exact match first
  if (ratings[movement] !== undefined) return ratings[movement];

  // Try lowercase
  const lower = movement.toLowerCase();
  if (ratings[lower] !== undefined) return ratings[lower];

  // Try with underscores instead of spaces
  const underscored = movement.replace(/\s+/g, '_').toLowerCase();
  if (ratings[underscored] !== undefined) return ratings[underscored];

  // Try without parentheses content
  const noParens = movement.replace(/\s*\([^)]*\)\s*/g, '').trim();
  if (ratings[noParens] !== undefined) return ratings[noParens];

  // Try partial match - find a key that contains this movement name
  const keys = Object.keys(ratings);
  for (const key of keys) {
    const keyLower = key.toLowerCase();
    const movementLower = movement.toLowerCase();
    if (keyLower.includes(movementLower) || movementLower.includes(keyLower)) {
      return ratings[key];
    }
  }

  return 0; // No rating found
}

/**
 * Draw Movement Heat Map using jsPDF primitives
 */
export function drawMovementHeatMap(
  doc: jsPDF,
  ratings: MovementRatings,
  startX: number,
  startY: number,
  width: number
): number {
  const cellWidth = 32;
  const cellHeight = 9;
  const cols = Math.floor(width / cellWidth);
  let currentY = startY;

  // Section title
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(249, 115, 22); // Orange accent
  doc.text('Movement Confidence Heat Map', startX, currentY);
  currentY += 8;

  Object.entries(MOVEMENT_CATEGORIES).forEach(([category, movements]) => {
    // Category header
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(148, 163, 184); // Muted text
    doc.text(category.toUpperCase(), startX, currentY);
    currentY += 4;

    // Movement grid
    movements.forEach((movement, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * cellWidth;
      const y = currentY + row * cellHeight;

      // Use flexible lookup for rating
      const rating = findRating(ratings, movement);
      const [r, g, b] = getRatingColor(rating);

      // Cell background - explicitly set fill color before each rect
      doc.setFillColor(r, g, b);
      doc.rect(x, y, cellWidth - 1, cellHeight - 1, 'F');

      // Movement name (truncate if needed)
      // Use dark text on bright backgrounds (ratings 3-5), white on dark (1-2, 0)
      if (rating >= 3 && rating <= 5) {
        doc.setTextColor(30, 41, 59); // Dark text
      } else {
        doc.setTextColor(248, 250, 252); // White text
      }
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'normal');
      const displayName = movement.length > 12 ? movement.substring(0, 11) + '..' : movement;
      doc.text(displayName, x + 1.5, y + 5.5);
    });

    const rows = Math.ceil(movements.length / cols);
    currentY += rows * cellHeight + 4;
  });

  // Legend
  currentY += 2;
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184); // Muted text
  const legendItems = [
    { rating: 5, label: '5-Expert' },
    { rating: 4, label: '4-Proficient' },
    { rating: 3, label: '3-Competent' },
    { rating: 2, label: '2-Developing' },
    { rating: 1, label: '1-Novice' },
  ];

  let legendX = startX;
  legendItems.forEach(({ rating, label }) => {
    const [r, g, b] = getRatingColor(rating);
    doc.setFillColor(r, g, b);
    doc.rect(legendX, currentY - 2, 4, 4, 'F');
    doc.setTextColor(148, 163, 184);
    doc.text(label, legendX + 5, currentY + 1);
    legendX += 28;
  });

  return currentY + 8;
}

/**
 * Draw Strength Bar Chart using jsPDF primitives
 */
export function drawStrengthChart(
  doc: jsPDF,
  lifts: Record<string, number | undefined>,
  gender: 'male' | 'female',
  startX: number,
  startY: number,
  width: number
): number {
  const benchmarks = ELITE_BENCHMARKS[gender];
  const liftOrder = ['back_squat', 'front_squat', 'deadlift', 'clean', 'clean_and_jerk', 'snatch', 'strict_press', 'push_press', 'bench_press'];

  const barHeight = 10;
  const labelWidth = 28;
  const valueWidth = 40;
  const maxBarWidth = width - labelWidth - valueWidth - 10;
  const barStartX = startX + labelWidth;
  let y = startY;

  // Section title
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...RGB.accent);
  doc.text('Strength vs Elite Top-15', startX, y);
  y += 8;

  liftOrder.forEach((lift) => {
    const value = lifts[lift] || 0;
    const benchmark = benchmarks[lift as keyof typeof benchmarks] || 1;
    const percentage = value > 0 ? Math.min((value / benchmark) * 100, 120) : 0;

    // Label
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...RGB.textMuted);
    doc.text(LIFT_LABELS[lift], startX, y + 6);

    // Background bar (represents 100%)
    doc.setFillColor(...RGB.cardBg);
    doc.rect(barStartX, y, maxBarWidth, barHeight, 'F');

    // 100% marker line
    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(0.3);
    doc.line(barStartX + maxBarWidth, y, barStartX + maxBarWidth, y + barHeight);

    if (value > 0) {
      // Fill bar with color based on percentage
      let barColor: [number, number, number];
      if (percentage >= 100) barColor = RGB.success;
      else if (percentage >= 90) barColor = RGB.lime;
      else if (percentage >= 80) barColor = RGB.warning;
      else barColor = RGB.accent;

      const barWidth = Math.min((percentage / 100) * maxBarWidth, maxBarWidth * 1.15);
      doc.setFillColor(...barColor);
      doc.rect(barStartX, y, barWidth, barHeight, 'F');
    }

    // Value text
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...RGB.text);
    const valueText = value > 0 ? `${value} lb (${Math.round(percentage)}%)` : '--';
    doc.text(valueText, barStartX + maxBarWidth + 3, y + 6);

    y += barHeight + 3;
  });

  // Legend
  y += 2;
  doc.setFontSize(6);
  doc.setTextColor(...RGB.textMuted);
  doc.text('Bar = % of Elite Top-15 Benchmark | 100% line marks elite standard', startX, y);

  return y + 6;
}

/**
 * Draw Zone Table using jsPDF primitives
 */
export function drawZoneTable(
  doc: jsPDF,
  zones: TrainingZone[],
  title: string,
  paceField: 'paceRange' | 'paceRangeMile',
  startX: number,
  startY: number,
  width: number
): number {
  let y = startY;

  // Title
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...RGB.accent);
  doc.text(title, startX, y);
  y += 7;

  // Card background
  const cardHeight = zones.length * 12 + 8;
  doc.setFillColor(...RGB.cardBg);
  doc.roundedRect(startX, y - 2, width, cardHeight, 2, 2, 'F');

  // Zone rows
  zones.forEach((zone, i) => {
    const rowY = y + i * 12 + 6;

    // Color dot - parse zone.color or use default
    let dotColor: [number, number, number] = RGB.gray;
    if (zone.color) {
      const hex = zone.color.replace('#', '');
      if (hex.length === 6) {
        dotColor = [
          parseInt(hex.substring(0, 2), 16),
          parseInt(hex.substring(2, 4), 16),
          parseInt(hex.substring(4, 6), 16),
        ];
      }
    }

    doc.setFillColor(...dotColor);
    doc.circle(startX + 8, rowY - 1.5, 3, 'F');

    // Zone name
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...RGB.text);
    doc.text(`Z${zone.zone}`, startX + 14, rowY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...RGB.textMuted);
    const zoneName = zone.name.length > 12 ? zone.name.substring(0, 11) + '.' : zone.name;
    doc.text(zoneName, startX + 24, rowY);

    // Pace - sanitize any encoding issues with < and > symbols
    let pace = zone[paceField] || '--';
    if (typeof pace === 'string') {
      pace = pace
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#60;/g, '<')
        .replace(/&#62;/g, '>')
        .replace(/\u201c/g, '<')  // Left double quote used erroneously
        .replace(/\u201d/g, '>')  // Right double quote used erroneously
        .replace(/"d\s*/g, '< ')  // Fix "d pattern
        .replace(/"D\s*/g, '< '); // Fix "D pattern
    }
    doc.setTextColor(...RGB.text);
    doc.text(pace, startX + width - 30, rowY);
  });

  return y + cardHeight + 4;
}

export interface SpeedCurveData {
  distance: string;
  seconds: number;
  pace: number;
}

// Distance X-positions for consistent alignment (proportional spacing)
const ROW_DISTANCE_POSITIONS: Record<string, number> = {
  '500m': 0.1,
  '1000m': 0.35,
  '2000m': 0.65,
  '5000m': 0.95,
};

const RUN_DISTANCE_POSITIONS: Record<string, number> = {
  '400m': 0.1,
  '1 mi': 0.35,
  '5K': 0.65,
  '10K': 0.95,
};

/**
 * Draw Speed Curve using jsPDF primitives with elite reference line
 */
export function drawSpeedCurve(
  doc: jsPDF,
  athleteTimes: SpeedCurveData[],
  eliteTimes: SpeedCurveData[],
  title: string,
  startX: number,
  startY: number,
  width: number,
  height: number
): number {
  let y = startY;

  // Determine if this is row or run based on title
  const isRow = title.toLowerCase().includes('row');
  const distancePositions = isRow ? ROW_DISTANCE_POSITIONS : RUN_DISTANCE_POSITIONS;

  // Title
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(249, 115, 22); // Orange accent
  doc.text(title, startX, y);
  y += 6;

  // Chart background card
  doc.setFillColor(51, 65, 85); // Card background
  doc.roundedRect(startX, y, width, height, 2, 2, 'F');

  const hasAthleteData = athleteTimes.length >= 2;
  const hasEliteData = eliteTimes.length >= 2;

  if (!hasAthleteData && !hasEliteData) {
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Insufficient data', startX + 10, y + height / 2);
    return y + height + 4;
  }

  // Calculate chart dimensions
  const chartPadding = 6;
  const chartX = startX + chartPadding + 10;
  const chartY = y + chartPadding;
  const chartWidth = width - chartPadding * 2 - 15;
  const chartHeight = height - chartPadding * 2 - 14;

  // Combine all times to find Y-axis scaling bounds (pace)
  const allTimes = [...athleteTimes, ...eliteTimes];
  const allPaces = allTimes.map(t => t.pace);
  const minPace = Math.min(...allPaces) * 0.9;
  const maxPace = Math.max(...allPaces) * 1.1;
  const paceRange = maxPace - minPace || 1;

  // Draw axes
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.2);
  doc.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight); // X-axis
  doc.line(chartX, chartY, chartX, chartY + chartHeight); // Y-axis

  // Helper to calculate point position using distance-based X positioning
  const getPoint = (t: SpeedCurveData) => {
    // Get X position from distance lookup, fallback to proportional if not found
    const xPos = distancePositions[t.distance] ?? 0.5;
    return {
      x: chartX + xPos * chartWidth,
      y: chartY + chartHeight - ((t.pace - minPace) / paceRange) * chartHeight,
      label: t.distance,
      pace: t.pace,
    };
  };

  // Draw elite reference line (dashed gray)
  if (hasEliteData) {
    const elitePoints = eliteTimes.map(getPoint);

    doc.setDrawColor(150, 150, 150); // Gray
    doc.setLineWidth(0.4);

    // Draw dashed line manually (jsPDF doesn't support native dash)
    for (let i = 0; i < elitePoints.length - 1; i++) {
      const p1 = elitePoints[i];
      const p2 = elitePoints[i + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const dashLen = 2;
      const gapLen = 2;
      const numDashes = Math.floor(dist / (dashLen + gapLen));

      for (let j = 0; j < numDashes; j++) {
        const startRatio = j * (dashLen + gapLen) / dist;
        const endRatio = (j * (dashLen + gapLen) + dashLen) / dist;
        doc.line(
          p1.x + dx * startRatio,
          p1.y + dy * startRatio,
          p1.x + dx * Math.min(endRatio, 1),
          p1.y + dy * Math.min(endRatio, 1)
        );
      }
    }

    // Elite points (small hollow circles)
    elitePoints.forEach((pt) => {
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.3);
      doc.circle(pt.x, pt.y, 1.2, 'S');
    });
  }

  // Draw athlete line (solid orange)
  if (hasAthleteData) {
    const athletePoints = athleteTimes.map(getPoint);

    doc.setDrawColor(249, 115, 22); // Orange
    doc.setLineWidth(0.5);

    // Draw solid line
    for (let i = 0; i < athletePoints.length - 1; i++) {
      doc.line(athletePoints[i].x, athletePoints[i].y, athletePoints[i + 1].x, athletePoints[i + 1].y);
    }

    // Athlete points (filled orange circles)
    athletePoints.forEach((pt) => {
      doc.setFillColor(249, 115, 22);
      doc.circle(pt.x, pt.y, 1.5, 'F');
    });

    // Distance labels along x-axis
    doc.setFontSize(5);
    doc.setTextColor(248, 250, 252);
    athletePoints.forEach((pt) => {
      doc.text(pt.label, pt.x - 4, chartY + chartHeight + 4);
    });
  }

  // Legend at bottom
  const legendY = y + height - 4;
  doc.setFontSize(5);

  // Athlete legend
  doc.setDrawColor(249, 115, 22);
  doc.setLineWidth(0.5);
  doc.line(startX + 5, legendY, startX + 12, legendY);
  doc.setTextColor(248, 250, 252);
  doc.text('Athlete', startX + 14, legendY + 1);

  // Elite legend
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.4);
  // Dashed line for legend
  doc.line(startX + 35, legendY, startX + 37, legendY);
  doc.line(startX + 39, legendY, startX + 41, legendY);
  doc.setTextColor(150, 150, 150);
  doc.text('Elite', startX + 43, legendY + 1);

  return y + height + 6;
}

export interface MentalSkillScore {
  name: string;
  score: number;
}

// Mental skill display names
const MENTAL_SKILL_LABELS: Record<string, string> = {
  coping: 'Coping',
  peaking: 'Peaking',
  goalSetting: 'Goals',
  concentration: 'Focus',
  confidence: 'Confidence',
  coachability: 'Coachable',
  freedomFromWorry: 'Calm',
};

/**
 * Draw Mental Skills Spider/Radar Chart
 */
export function drawMentalSkillsSpider(
  doc: jsPDF,
  skills: MentalSkillScore[],
  centerX: number,
  centerY: number,
  radius: number
): void {
  if (skills.length === 0) return;

  const numSkills = skills.length;
  const angleStep = (2 * Math.PI) / numSkills;

  // Draw background web (concentric polygons for scale 1-5)
  for (let level = 1; level <= 5; level++) {
    const levelRadius = (level / 5) * radius;
    doc.setDrawColor(71, 85, 105); // #475569
    doc.setLineWidth(0.2);

    // Draw polygon edges
    for (let i = 0; i < numSkills; i++) {
      const angle = i * angleStep - Math.PI / 2; // Start from top
      const nextAngle = ((i + 1) % numSkills) * angleStep - Math.PI / 2;

      const x1 = centerX + levelRadius * Math.cos(angle);
      const y1 = centerY + levelRadius * Math.sin(angle);
      const x2 = centerX + levelRadius * Math.cos(nextAngle);
      const y2 = centerY + levelRadius * Math.sin(nextAngle);

      doc.line(x1, y1, x2, y2);
    }
  }

  // Draw axis lines (spokes)
  skills.forEach((_, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const endX = centerX + radius * Math.cos(angle);
    const endY = centerY + radius * Math.sin(angle);
    doc.setDrawColor(71, 85, 105);
    doc.setLineWidth(0.2);
    doc.line(centerX, centerY, endX, endY);
  });

  // Build path for athlete's scores
  const points: { x: number; y: number }[] = [];
  skills.forEach((skill, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const scoreRadius = (skill.score / 5) * radius;
    points.push({
      x: centerX + scoreRadius * Math.cos(angle),
      y: centerY + scoreRadius * Math.sin(angle),
    });
  });

  // Draw filled polygon (orange with lighter fill effect via multiple lines)
  doc.setDrawColor(249, 115, 22); // Orange
  doc.setLineWidth(1.5);

  // Draw outline
  for (let i = 0; i < points.length; i++) {
    const next = (i + 1) % points.length;
    doc.line(points[i].x, points[i].y, points[next].x, points[next].y);
  }

  // Draw filled area using triangles from center (simulated fill)
  doc.setFillColor(249, 115, 22);
  for (let i = 0; i < points.length; i++) {
    const next = (i + 1) % points.length;
    // Draw small filled circles along the edge for visual effect
    const midX = (points[i].x + points[next].x) / 2;
    const midY = (points[i].y + points[next].y) / 2;
    doc.circle(midX, midY, 0.5, 'F');
  }

  // Draw data points (larger circles)
  points.forEach((point) => {
    doc.setFillColor(249, 115, 22);
    doc.circle(point.x, point.y, 2, 'F');
  });

  // Draw labels outside the chart
  doc.setFontSize(6);
  skills.forEach((skill, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const labelRadius = radius + 8;
    const labelX = centerX + labelRadius * Math.cos(angle);
    const labelY = centerY + labelRadius * Math.sin(angle);

    // Get display name
    const displayName = MENTAL_SKILL_LABELS[skill.name] || skill.name;

    // Determine text alignment based on position
    let align: 'left' | 'center' | 'right' = 'center';
    if (Math.cos(angle) > 0.3) align = 'left';
    else if (Math.cos(angle) < -0.3) align = 'right';

    // Adjust Y for top/bottom labels
    const yOffset = Math.sin(angle) > 0.3 ? 2 : (Math.sin(angle) < -0.3 ? -1 : 0);

    doc.setTextColor(148, 163, 184); // Muted text
    doc.text(displayName, labelX, labelY + yOffset, { align });
  });

  // Draw score value inside each point
  doc.setFontSize(5);
  doc.setTextColor(30, 41, 59); // Dark text
  points.forEach((point, i) => {
    const score = skills[i].score;
    if (score >= 3) {
      doc.text(score.toString(), point.x - 1, point.y + 1);
    }
  });
}
