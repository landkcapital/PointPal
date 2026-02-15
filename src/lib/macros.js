/**
 * Approximate macro breakdown per food category.
 * Values represent the proportion of a category's points
 * attributable to each macro.
 */
export const CATEGORY_MACROS = {
  vegetables:      { protein: 0.15, carbs: 0.40, fat: 0.05, fiber: 0.40 },
  fruits:          { protein: 0.05, carbs: 0.70, fat: 0.05, fiber: 0.20 },
  "lean-protein":  { protein: 0.80, carbs: 0.10, fat: 0.10, fiber: 0.00 },
  grains:          { protein: 0.10, carbs: 0.65, fat: 0.10, fiber: 0.15 },
  dairy:           { protein: 0.30, carbs: 0.25, fat: 0.40, fiber: 0.05 },
  "fatty-protein": { protein: 0.55, carbs: 0.05, fat: 0.40, fiber: 0.00 },
  "red-meat":      { protein: 0.55, carbs: 0.00, fat: 0.45, fiber: 0.00 },
  fats:            { protein: 0.05, carbs: 0.05, fat: 0.85, fiber: 0.05 },
  alcohol:         { protein: 0.00, carbs: 0.85, fat: 0.05, fiber: 0.10 },
  "sugary-drinks": { protein: 0.00, carbs: 0.90, fat: 0.05, fiber: 0.05 },
  sweets:          { protein: 0.05, carbs: 0.55, fat: 0.35, fiber: 0.05 },
  processed:       { protein: 0.15, carbs: 0.40, fat: 0.40, fiber: 0.05 },
  rated_meal:      { protein: 0.25, carbs: 0.40, fat: 0.30, fiber: 0.05 },
};

/**
 * Physique goals with macro target splits.
 */
export const PHYSIQUE_GOALS = [
  {
    key: "build_muscle",
    label: "Build Muscle",
    desc: "High protein to support muscle growth",
    split: { protein: 0.35, carbs: 0.45, fat: 0.15, fiber: 0.05 },
  },
  {
    key: "lose_fat",
    label: "Lose Fat",
    desc: "Higher protein, moderate carbs",
    split: { protein: 0.40, carbs: 0.30, fat: 0.20, fiber: 0.10 },
  },
  {
    key: "recomp",
    label: "Recomposition",
    desc: "Build muscle while losing fat",
    split: { protein: 0.35, carbs: 0.35, fat: 0.20, fiber: 0.10 },
  },
  {
    key: "maintain",
    label: "Maintain",
    desc: "Balanced macro distribution",
    split: { protein: 0.25, carbs: 0.45, fat: 0.25, fiber: 0.05 },
  },
];

/**
 * Macro display metadata.
 */
export const MACRO_META = {
  protein: { label: "Protein", color: "#3b82f6", icon: "\uD83E\uDD69" },
  carbs:   { label: "Carbs", color: "#f59e0b", icon: "\uD83C\uDF5E" },
  fat:     { label: "Fat", color: "#f97316", icon: "\uD83E\uDDC8" },
  fiber:   { label: "Fiber", color: "#22c55e", icon: "\uD83E\uDD66" },
};

/**
 * Get macro point targets from daily points and physique goal.
 */
export function getMacroTargets(dailyPoints, physiqueGoalKey) {
  const goal = PHYSIQUE_GOALS.find((g) => g.key === physiqueGoalKey);
  if (!goal) return null;
  const { split } = goal;
  return {
    protein: Math.round(dailyPoints * split.protein),
    carbs: Math.round(dailyPoints * split.carbs),
    fat: Math.round(dailyPoints * split.fat),
    fiber: Math.round(dailyPoints * split.fiber),
  };
}

/**
 * Distribute a food log's points across macros based on its category.
 */
export function getLogMacros(category, points) {
  const breakdown = CATEGORY_MACROS[category] || CATEGORY_MACROS.rated_meal;
  return {
    protein: points * breakdown.protein,
    carbs: points * breakdown.carbs,
    fat: points * breakdown.fat,
    fiber: points * breakdown.fiber,
  };
}

/**
 * Aggregate macros across all logs for a day.
 */
export function aggregateMacros(logs) {
  const totals = { protein: 0, carbs: 0, fat: 0, fiber: 0 };
  for (const log of logs) {
    const m = getLogMacros(log.category, log.points);
    totals.protein += m.protein;
    totals.carbs += m.carbs;
    totals.fat += m.fat;
    totals.fiber += m.fiber;
  }
  return {
    protein: Math.round(totals.protein),
    carbs: Math.round(totals.carbs),
    fat: Math.round(totals.fat),
    fiber: Math.round(totals.fiber),
  };
}
