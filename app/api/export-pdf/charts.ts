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
  warning: [234, 179, 8] as [number, number, number],
  danger: [239, 68, 68] as [number, number, number],
  lime: [132, 204, 22] as [number, number, number],
  gray: [71, 85, 105] as [number, number, number],
};

// Rating color scale
export const RATING_COLORS: Record<number, [number, number, number]> = {
  5: RGB.success,
  4: RGB.lime,
  3: RGB.warning,
  2: RGB.accent,
  1: RGB.danger,
  0: RGB.gray,
};

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
  doc.setTextColor(...RGB.accent);
  doc.text('Movement Confidence Heat Map', startX, currentY);
  currentY += 8;

  Object.entries(MOVEMENT_CATEGORIES).forEach(([category, movements]) => {
    // Category header
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...RGB.textMuted);
    doc.text(category.toUpperCase(), startX, currentY);
    currentY += 4;

    // Movement grid
    movements.forEach((movement, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * cellWidth;
      const y = currentY + row * cellHeight;

      const rating = ratings[movement] || 0;
      const bgColor = RATING_COLORS[rating] || RGB.gray;

      // Cell background
      doc.setFillColor(...bgColor);
      doc.roundedRect(x, y, cellWidth - 1, cellHeight - 1, 1, 1, 'F');

      // Movement name (truncate if needed)
      const textColor = rating >= 3 && rating <= 5 ? RGB.background : RGB.text;
      doc.setTextColor(...textColor);
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
  doc.setTextColor(...RGB.textMuted);
  const legendItems = [
    { rating: 5, label: '5-Expert' },
    { rating: 4, label: '4-Proficient' },
    { rating: 3, label: '3-Competent' },
    { rating: 2, label: '2-Developing' },
    { rating: 1, label: '1-Novice' },
  ];

  let legendX = startX;
  legendItems.forEach(({ rating, label }) => {
    doc.setFillColor(...RATING_COLORS[rating]);
    doc.rect(legendX, currentY - 2, 4, 4, 'F');
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

    // Pace
    const pace = zone[paceField] || '--';
    doc.setTextColor(...RGB.text);
    doc.text(pace, startX + width - 30, rowY);
  });

  return y + cardHeight + 4;
}

/**
 * Draw Speed Curve using jsPDF primitives
 */
export function drawSpeedCurve(
  doc: jsPDF,
  times: { distance: string; seconds: number; pace: number }[],
  title: string,
  startX: number,
  startY: number,
  width: number,
  height: number
): number {
  let y = startY;

  // Title
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...RGB.accent);
  doc.text(title, startX, y);
  y += 6;

  // Chart background
  doc.setFillColor(...RGB.cardBg);
  doc.roundedRect(startX, y, width, height, 2, 2, 'F');

  if (times.length < 2) {
    doc.setFontSize(8);
    doc.setTextColor(...RGB.textMuted);
    doc.text('Insufficient data for curve', startX + 10, y + height / 2);
    return y + height + 4;
  }

  // Calculate chart dimensions
  const chartPadding = 8;
  const chartX = startX + chartPadding + 15;
  const chartY = y + chartPadding;
  const chartWidth = width - chartPadding * 2 - 20;
  const chartHeight = height - chartPadding * 2 - 10;

  // Find min/max for scaling
  const maxTime = Math.max(...times.map(t => t.seconds));
  const minPace = Math.min(...times.map(t => t.pace));
  const maxPace = Math.max(...times.map(t => t.pace));
  const paceRange = maxPace - minPace || 1;

  // Draw axes
  doc.setDrawColor(...RGB.textMuted);
  doc.setLineWidth(0.3);
  doc.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight); // X-axis
  doc.line(chartX, chartY, chartX, chartY + chartHeight); // Y-axis

  // Y-axis label
  doc.setFontSize(6);
  doc.setTextColor(...RGB.textMuted);
  doc.text('Pace', startX + 2, chartY + chartHeight / 2, { angle: 90 });

  // Plot points and connect with lines
  doc.setDrawColor(...RGB.accent);
  doc.setLineWidth(1);

  const points = times.map((t, i) => ({
    x: chartX + (t.seconds / maxTime) * chartWidth,
    y: chartY + chartHeight - ((t.pace - minPace) / paceRange) * chartHeight * 0.8 - chartHeight * 0.1,
    label: t.distance,
    pace: t.pace,
    seconds: t.seconds
  }));

  // Draw line connecting points
  for (let i = 0; i < points.length - 1; i++) {
    doc.line(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
  }

  // Draw points and labels
  points.forEach((pt) => {
    doc.setFillColor(...RGB.accent);
    doc.circle(pt.x, pt.y, 2, 'F');

    doc.setFontSize(5);
    doc.setTextColor(...RGB.text);
    doc.text(pt.label, pt.x - 3, chartY + chartHeight + 5);
  });

  return y + height + 6;
}
