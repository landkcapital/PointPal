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
  if (key === "standard_meal") return { key: "standard_meal", name: "Meal", emoji: "\u{1F37D}\uFE0F", group: "medium" };
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
 * Standard meals for quick logging.
 * Each meal has component items used to calculate mode-aware points.
 */
export const STANDARD_MEALS = [
  { key: "meat_veg", name: "Meat & 3 Veg", emoji: "\uD83E\uDD69",
    items: [{ cat: "lean-protein", palms: 1 }, { cat: "vegetables", palms: 2 }, { cat: "grains", palms: 0.5 }] },
  { key: "chicken_salad", name: "Chicken Salad", emoji: "\uD83E\uDD57",
    items: [{ cat: "lean-protein", palms: 1 }, { cat: "vegetables", palms: 2 }, { cat: "fats", palms: 0.25 }] },
  { key: "burger_fries", name: "Burger & Fries", emoji: "\uD83C\uDF54",
    items: [{ cat: "red-meat", palms: 1 }, { cat: "grains", palms: 1 }, { cat: "fats", palms: 0.5 }] },
  { key: "pasta", name: "Pasta", emoji: "\uD83C\uDF5D",
    items: [{ cat: "grains", palms: 1.5 }, { cat: "lean-protein", palms: 0.5 }, { cat: "fats", palms: 0.25 }] },
  { key: "stir_fry", name: "Stir-Fry & Rice", emoji: "\uD83E\uDD58",
    items: [{ cat: "lean-protein", palms: 1 }, { cat: "vegetables", palms: 1 }, { cat: "grains", palms: 1 }] },
  { key: "pizza", name: "Pizza (2-3 slices)", emoji: "\uD83C\uDF55",
    items: [{ cat: "processed", palms: 1 }] },
  { key: "sandwich", name: "Sandwich", emoji: "\uD83E\uDD6A",
    items: [{ cat: "grains", palms: 1 }, { cat: "lean-protein", palms: 0.5 }, { cat: "fats", palms: 0.25 }] },
  { key: "curry_rice", name: "Curry & Rice", emoji: "\uD83C\uDF5B",
    items: [{ cat: "fatty-protein", palms: 1 }, { cat: "grains", palms: 1 }, { cat: "fats", palms: 0.5 }] },
  { key: "fish_chips", name: "Fish & Chips", emoji: "\uD83D\uDC1F",
    items: [{ cat: "fatty-protein", palms: 1 }, { cat: "grains", palms: 1 }, { cat: "fats", palms: 0.5 }] },
  { key: "omelette", name: "Omelette", emoji: "\uD83C\uDF73",
    items: [{ cat: "fatty-protein", palms: 1 }, { cat: "vegetables", palms: 0.5 }] },
  { key: "eggs_toast", name: "Eggs on Toast", emoji: "\uD83E\uDD5A",
    items: [{ cat: "fatty-protein", palms: 1 }, { cat: "grains", palms: 0.5 }] },
  { key: "cereal", name: "Cereal / Porridge", emoji: "\uD83E\uDD63",
    items: [{ cat: "grains", palms: 1 }, { cat: "dairy", palms: 0.5 }] },
  { key: "smoothie", name: "Smoothie", emoji: "\uD83E\uDDCB",
    items: [{ cat: "fruits", palms: 1.5 }, { cat: "dairy", palms: 0.5 }] },
  { key: "wrap", name: "Wrap / Burrito", emoji: "\uD83C\uDF2F",
    items: [{ cat: "grains", palms: 1 }, { cat: "lean-protein", palms: 0.5 }, { cat: "vegetables", palms: 0.5 }, { cat: "fats", palms: 0.25 }] },
  { key: "soup_bread", name: "Soup & Bread", emoji: "\uD83C\uDF72",
    items: [{ cat: "vegetables", palms: 1.5 }, { cat: "grains", palms: 0.5 }] },
  { key: "roast_dinner", name: "Roast Dinner", emoji: "\uD83C\uDF56",
    items: [{ cat: "red-meat", palms: 1 }, { cat: "vegetables", palms: 1 }, { cat: "grains", palms: 1 }, { cat: "fats", palms: 0.25 }] },
];

/**
 * Calculate the point cost of a standard meal in a given mode.
 */
export function getStandardMealCost(meal, mode = "hybrid") {
  const map = getPointsMap(mode);
  let total = 0;
  for (const item of meal.items) {
    total += (map[item.cat] || 0) * item.palms;
  }
  return Math.round(total);
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
  if (log.category === "standard_meal") {
    const parts = (log.note || "Meal").split(" \u2022 ");
    const mealName = parts[0];
    const sizeLabel = log.servings <= 0.75 ? "Small" : log.servings >= 1.25 ? "Large" : "";
    return sizeLabel ? `${sizeLabel} ${mealName}` : mealName;
  }
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
  if (log.category === "standard_meal") {
    const parts = log.note.split(" \u2022 ");
    return parts.length > 1 ? parts.slice(1).join(" \u2022 ") : null;
  }
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
