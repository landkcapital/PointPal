export const FOOD_CATEGORIES = [
  { key: "vegetables", name: "Vegetables", emoji: "\u{1F966}", points: 0, examples: "Broccoli, spinach, carrots, salad, tomatoes", group: "free" },
  { key: "fruits", name: "Fruits", emoji: "\u{1F34E}", points: 1, examples: "Apples, bananas, berries, oranges, grapes", group: "low" },
  { key: "lean-protein", name: "Lean Protein", emoji: "\u{1F357}", points: 2, examples: "Chicken breast, turkey, white fish, egg whites, tofu", group: "low" },
  { key: "grains", name: "Grains & Starches", emoji: "\u{1F35A}", points: 3, examples: "Rice, pasta, bread, potatoes, oats", group: "medium" },
  { key: "dairy", name: "Dairy", emoji: "\u{1F9C0}", points: 3, examples: "Milk, yogurt, cheese, cream", group: "medium" },
  { key: "fatty-protein", name: "Fatty Protein", emoji: "\u{1F969}", points: 3, examples: "Salmon, pork chops, dark chicken, whole eggs", group: "medium" },
  { key: "red-meat", name: "Red Meat", emoji: "\u{1F356}", points: 4, examples: "Steak, beef mince, lamb, ribs", group: "high" },
  { key: "fats", name: "Fats & Oils", emoji: "\u{1FAD2}", points: 4, examples: "Butter, olive oil, nuts, avocado, mayo", group: "high" },
  { key: "alcohol", name: "Alcohol", emoji: "\u{1F37A}", points: 5, examples: "Beer, wine, spirits, cocktails", group: "penalty" },
  { key: "sugary-drinks", name: "Sugary Drinks", emoji: "\u{1F964}", points: 5, examples: "Soda, juice, energy drinks, sweet coffee", group: "penalty" },
  { key: "sweets", name: "Sugary Treats", emoji: "\u{1F370}", points: 6, examples: "Candy, cake, ice cream, chocolate, cookies", group: "penalty" },
  { key: "processed", name: "Processed / Fast Food", emoji: "\u{1F354}", points: 7, examples: "Burgers, pizza, chips, fried food, takeaway", group: "penalty" },
];

/**
 * Calorie-accurate point overrides (~50 calories per point per palm).
 */
const CALORIE_POINTS = {
  vegetables: 1,
  fruits: 1,
  "lean-protein": 3,
  grains: 3,
  dairy: 3,
  "fatty-protein": 4,
  "red-meat": 5,
  fats: 7,
  alcohol: 4,
  "sugary-drinks": 4,
  sweets: 6,
  processed: 8,
};

/**
 * Get food categories with points adjusted for the selected mode.
 */
export function getFoodCategories(mode = "hybrid") {
  if (mode === "calorie") {
    return FOOD_CATEGORIES.map((c) => ({
      ...c,
      points: CALORIE_POINTS[c.key] ?? c.points,
      group: CALORIE_POINTS[c.key] !== undefined ? getGroup(CALORIE_POINTS[c.key]) : c.group,
    }));
  }
  return FOOD_CATEGORIES;
}

function getGroup(pts) {
  if (pts <= 1) return "low";
  if (pts <= 3) return "medium";
  if (pts <= 5) return "high";
  return "penalty";
}

/**
 * Build a points lookup map for a given mode.
 */
export function getPointsMap(mode = "hybrid") {
  const map = {};
  getFoodCategories(mode).forEach((c) => { map[c.key] = c.points; });
  return map;
}

export const GROUP_LABELS = {
  free: "Free Foods",
  low: "Low Points",
  medium: "Medium Points",
  high: "High Points",
  penalty: "Penalty Foods",
};

export const GROUP_COLORS = {
  free: "#16a34a",
  low: "#2563eb",
  medium: "#ca8a04",
  high: "#ea580c",
  penalty: "#dc2626",
};

export function getCategoryByKey(key) {
  if (key === "rated_meal") return { key: "rated_meal", name: "Rated Meal", emoji: "\u{1F37D}\uFE0F", group: "medium" };
  return FOOD_CATEGORIES.find((c) => c.key === key);
}

/**
 * Format a fractional serving for display (0.25 → "¼", 0.5 → "½", etc.)
 */
export function formatServings(n) {
  const fractions = { 0.25: "\u00BC", 0.5: "\u00BD", 0.75: "\u00BE" };
  const whole = Math.floor(n);
  const frac = Math.round((n - whole) * 100) / 100;
  if (whole === 0 && fractions[frac]) return fractions[frac];
  if (frac === 0) return String(whole);
  if (fractions[frac]) return `${whole}${fractions[frac]}`;
  return String(n);
}

/**
 * Drink sub-types for drill-down selection.
 */
export const DRINK_SUBTYPES = {
  "alcohol": [
    { key: "beer", name: "Beer", emoji: "\uD83C\uDF7A" },
    { key: "wine", name: "Wine", emoji: "\uD83C\uDF77" },
    { key: "spirits", name: "Spirits", emoji: "\uD83E\uDD43" },
    { key: "cocktails", name: "Cocktails", emoji: "\uD83C\uDF79" },
  ],
  "sugary-drinks": [
    { key: "soda", name: "Soda", emoji: "\uD83E\uDD64" },
    { key: "juice", name: "Juice", emoji: "\uD83E\uDDC3" },
    { key: "energy_drink", name: "Energy Drink", emoji: "\u26A1" },
    { key: "sweet_coffee", name: "Sweet Coffee", emoji: "\u2615" },
  ],
};

/**
 * Format the detail line for a food log entry (serving info only, no user note).
 */
export function formatLogDetail(log) {
  if (log.category === "rated_meal") {
    const parts = (log.note || "Rated meal").split(" \u2022 ");
    const ratingLabels = ["Very Healthy", "Healthy", "Average", "Unhealthy", "Very Unhealthy"];
    const autoParts = parts.filter((p, i) =>
      i === 0 || ratingLabels.includes(p) || p.includes("guided rating")
    );
    return autoParts.join(" \u2022 ") || "Rated meal";
  }
  const match = log.note?.match(/^(\d+)\s*(spoonfuls?|sips?)(?:\s*\u2022\s*(.*))?$/);
  if (match) {
    const count = parseInt(match[1]);
    const unitWord = match[2].startsWith("sip") ? "sip" : "spoonful";
    return `${count} ${unitWord}${count !== 1 ? "s" : ""}`;
  }
  const isDrink = log.category === "alcohol" || log.category === "sugary-drinks";
  const unit = isDrink ? "glass" : "palm";
  const plural = log.servings !== 1 ? (isDrink ? "es" : "s") : "";
  return `${formatServings(log.servings)} ${unit}${plural}`;
}

/**
 * Extract just the user-written note from a food log entry.
 */
export function getUserNote(log) {
  if (!log.note) return null;
  if (log.category === "rated_meal") {
    const parts = log.note.split(" \u2022 ");
    const ratingLabels = ["Very Healthy", "Healthy", "Average", "Unhealthy", "Very Unhealthy"];
    const userParts = parts.filter((p, i) => {
      if (i === 0) return false;
      if (ratingLabels.includes(p)) return false;
      if (p.includes("guided rating")) return false;
      return true;
    });
    return userParts.length > 0 ? userParts.join(" \u2022 ") : null;
  }
  const match = log.note.match(/^(\d+)\s*(spoonfuls?|sips?)(?:\s*\u2022\s*(.*))?$/);
  if (match) return match[3] || null;
  return log.note;
}
