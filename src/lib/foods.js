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
 * Format the detail line for a food log entry.
 * Detects spoonful entries from the note prefix and displays them properly.
 */
export function formatLogDetail(log) {
  if (log.category === "rated_meal") {
    return log.note || "Rated meal";
  }
  const match = log.note?.match(/^(\d+)\s*(spoonfuls?|sips?)(?:\s*\u2022\s*(.*))?$/);
  if (match) {
    const count = parseInt(match[1]);
    const unitWord = match[2].startsWith("sip") ? "sip" : "spoonful";
    const userNote = match[3] || "";
    return `${count} ${unitWord}${count !== 1 ? "s" : ""}${userNote ? ` \u2022 ${userNote}` : ""}`;
  }
  const isDrink = log.category === "alcohol" || log.category === "sugary-drinks";
  const unit = isDrink ? "glass" : "palm";
  const plural = log.servings !== 1 ? (isDrink ? "es" : "s") : "";
  return `${formatServings(log.servings)} ${unit}${plural}${log.note ? ` \u2022 ${log.note}` : ""}`;
}
