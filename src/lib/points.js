/**
 * Goal definitions: each goal applies a multiplier to TDEE before
 * converting to points, creating a caloric deficit or maintenance.
 */
export const GOALS = [
  { key: "lose_fast", label: "Lose Fat Fast", desc: "Aggressive deficit (~30%)", multiplier: 0.70 },
  { key: "lose_steady", label: "Lose Steadily", desc: "Moderate deficit (~15%)", multiplier: 0.85 },
  { key: "maintain", label: "Maintain Weight", desc: "Eat at maintenance", multiplier: 1.0 },
];

export function getGoalByKey(key) {
  return GOALS.find((g) => g.key === key) || GOALS[1];
}

/**
 * Calculate daily points based on user profile.
 * Uses Mifflin-St Jeor equation for BMR, then activity multiplier,
 * then goal multiplier. 1 point ~ 50 calories.
 */
export function calculateDailyPoints({ height_cm, weight_kg, age, gender, activity_level, goal }) {
  let bmr;
  if (gender === "male") {
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
  } else {
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
  }

  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
  };

  const tdee = bmr * (multipliers[activity_level] || 1.55);
  const goalMultiplier = getGoalByKey(goal).multiplier;
  return Math.round((tdee * goalMultiplier) / 50);
}

/**
 * Multi-stop HSL interpolation: green → amber → red.
 * Avoids the muddy brown/olive tones of a simple hue sweep.
 */
function getHSL(remaining, total) {
  const pct = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 1;
  // Green (100%) → Amber (50%) → Red (0%)
  if (pct >= 0.5) {
    const t = (pct - 0.5) / 0.5;
    return [Math.round(38 + t * 104), Math.round(92 - t * 20), Math.round(50 - t * 12)];
  }
  const t = pct / 0.5;
  return [Math.round(t * 38), Math.round(75 + t * 17), Math.round(48 + t * 2)];
}

export function getPointsColor(remaining, total) {
  const [h, s, l] = getHSL(remaining, total);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

export function getPointsGradient(remaining, total) {
  const [h, s, l] = getHSL(remaining, total);
  return `linear-gradient(135deg, hsl(${h}, ${s}%, ${l - 14}%), hsl(${h}, ${s}%, ${l}%), hsl(${h}, ${s}%, ${l + 12}%))`;
}

export function getPointsGlow(remaining, total) {
  const [h, s, l] = getHSL(remaining, total);
  return `hsla(${h}, ${s}%, ${l}%, 0.2)`;
}

/**
 * Set dynamic CSS custom properties on the root element
 * so all UI elements (nav, buttons, accents) match the
 * current points color throughout the day.
 */
export function applyPointsTheme(remaining, total) {
  const [h, s, l] = getHSL(remaining, total);
  const root = document.documentElement;
  root.style.setProperty("--primary", `hsl(${h}, ${s}%, ${l}%)`);
  root.style.setProperty("--primary-dark", `hsl(${h}, ${s}%, ${l - 8}%)`);
  root.style.setProperty("--primary-darker", `hsl(${h}, ${s}%, ${l - 18}%)`);
  root.style.setProperty("--gradient", `linear-gradient(135deg, hsl(${h}, ${s}%, ${l - 14}%), hsl(${h}, ${s}%, ${l}%), hsl(${h}, ${s}%, ${l + 12}%))`);
  root.style.setProperty("--gradient-btn", `linear-gradient(135deg, hsl(${h}, ${s}%, ${l - 8}%), hsl(${h}, ${s}%, ${l}%))`);
  root.style.setProperty("--glow", `hsla(${h}, ${s}%, ${l}%, 0.15)`);
  root.style.setProperty("--glow-strong", `hsla(${h}, ${s}%, ${l}%, 0.25)`);
  // Extra opacity levels for backgrounds and borders
  root.style.setProperty("--primary-a4", `hsla(${h}, ${s}%, ${l}%, 0.04)`);
  root.style.setProperty("--primary-a6", `hsla(${h}, ${s}%, ${l}%, 0.06)`);
  root.style.setProperty("--primary-a8", `hsla(${h}, ${s}%, ${l}%, 0.08)`);
  root.style.setProperty("--primary-a10", `hsla(${h}, ${s}%, ${l}%, 0.10)`);
  root.style.setProperty("--primary-a12", `hsla(${h}, ${s}%, ${l}%, 0.12)`);
  root.style.setProperty("--primary-a15", `hsla(${h}, ${s}%, ${l}%, 0.15)`);
  root.style.setProperty("--primary-a20", `hsla(${h}, ${s}%, ${l}%, 0.20)`);
}

/**
 * Get start/end of a specific date in local timezone.
 */
export function getDayRange(date) {
  const d = new Date(date);
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  return { start, end };
}

/**
 * Format a date for display.
 */
export function formatDate(date) {
  return new Date(date).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Check if a date is today.
 */
export function isToday(date) {
  const d = new Date(date);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}
