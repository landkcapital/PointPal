import { getPointsMap } from "./foods";

/**
 * Dietary restriction definitions.
 * Each restriction blocks templates containing certain allergens.
 */
export const DIETARY_RESTRICTIONS = [
  { key: "gluten_free", label: "Gluten-Free", emoji: "\uD83C\uDF3E", blocks: ["gluten"] },
  { key: "dairy_free", label: "Dairy-Free", emoji: "\uD83E\uDD5B", blocks: ["dairy"] },
  { key: "nut_free", label: "Nut-Free", emoji: "\uD83E\uDD5C", blocks: ["nuts"] },
  { key: "vegetarian", label: "Vegetarian", emoji: "\uD83E\uDD6C", blocks: ["meat", "fish"] },

  { key: "sugar_free", label: "Sugar-Free", emoji: "\uD83C\uDF6C", blocks: ["sugar"] },
];

/**
 * Meal templates — common food combos with point costs, tags, and allergen info.
 */
export const MEAL_TEMPLATES = [
  {
    id: "chicken_salad",
    name: "Chicken Salad",
    emoji: "\uD83E\uDD57",
    items: [{ cat: "lean-protein", palms: 1 }, { cat: "vegetables", palms: 2 }],
    tags: ["high_protein", "light", "healthy"],
    contains: ["meat"],
  },
  {
    id: "steak_veg",
    name: "Steak & Vegetables",
    emoji: "\uD83E\uDD69",
    items: [{ cat: "red-meat", palms: 1 }, { cat: "vegetables", palms: 1 }],
    tags: ["high_protein", "filling"],
    contains: ["meat", "red_meat"],
  },
  {
    id: "salmon_rice",
    name: "Salmon & Rice",
    emoji: "\uD83C\uDF63",
    items: [{ cat: "fatty-protein", palms: 1 }, { cat: "grains", palms: 1 }],
    tags: ["high_protein", "filling", "energy"],
    contains: ["fish"],
  },
  {
    id: "pasta_chicken",
    name: "Chicken Pasta",
    emoji: "\uD83C\uDF5D",
    items: [{ cat: "grains", palms: 1.5 }, { cat: "lean-protein", palms: 1 }],
    tags: ["filling", "energy"],
    contains: ["gluten", "meat"],
  },
  {
    id: "fruit_yogurt",
    name: "Fruit & Yogurt",
    emoji: "\uD83C\uDF53",
    items: [{ cat: "fruits", palms: 1 }, { cat: "dairy", palms: 0.5 }],
    tags: ["light", "sweet", "healthy"],
    contains: ["dairy"],
  },
  {
    id: "egg_toast",
    name: "Eggs on Toast",
    emoji: "\uD83C\uDF73",
    items: [{ cat: "fatty-protein", palms: 1 }, { cat: "grains", palms: 1 }],
    tags: ["high_protein", "energy"],
    contains: ["gluten", "eggs"],
  },
  {
    id: "veggie_stir_fry",
    name: "Veggie Stir-Fry",
    emoji: "\uD83E\uDD66",
    items: [{ cat: "vegetables", palms: 2 }, { cat: "grains", palms: 1 }],
    tags: ["light", "healthy", "energy"],
    contains: ["gluten"],
  },
  {
    id: "protein_shake",
    name: "Protein Shake",
    emoji: "\uD83E\uDD5B",
    items: [{ cat: "lean-protein", palms: 1 }, { cat: "fruits", palms: 0.5 }],
    tags: ["high_protein", "light"],
    contains: [],
  },
  {
    id: "tuna_salad",
    name: "Tuna Salad",
    emoji: "\uD83D\uDC1F",
    items: [{ cat: "lean-protein", palms: 1 }, { cat: "vegetables", palms: 1 }, { cat: "fats", palms: 0.25 }],
    tags: ["high_protein", "light", "healthy"],
    contains: ["fish"],
  },
  {
    id: "rice_beans",
    name: "Rice & Beans",
    emoji: "\uD83C\uDF5B",
    items: [{ cat: "grains", palms: 1 }, { cat: "lean-protein", palms: 0.5 }],
    tags: ["energy", "filling"],
    contains: [],
  },
  {
    id: "cheese_crackers",
    name: "Cheese & Crackers",
    emoji: "\uD83E\uDDC0",
    items: [{ cat: "dairy", palms: 0.5 }, { cat: "grains", palms: 0.5 }],
    tags: ["light"],
    contains: ["dairy", "gluten"],
  },
  {
    id: "small_sweet",
    name: "Small Sweet Treat",
    emoji: "\uD83C\uDF70",
    items: [{ cat: "sweets", palms: 0.5 }],
    tags: ["sweet"],
    contains: ["sugar", "gluten", "dairy"],
  },
  {
    id: "fruit_snack",
    name: "Fresh Fruit",
    emoji: "\uD83C\uDF4E",
    items: [{ cat: "fruits", palms: 1 }],
    tags: ["light", "sweet", "healthy"],
    contains: [],
  },
  {
    id: "nuts_dried_fruit",
    name: "Nuts & Dried Fruit",
    emoji: "\uD83E\uDD5C",
    items: [{ cat: "fats", palms: 0.5 }, { cat: "fruits", palms: 0.5 }],
    tags: ["energy", "healthy"],
    contains: ["nuts"],
  },
  {
    id: "burger_salad",
    name: "Burger with Side Salad",
    emoji: "\uD83C\uDF54",
    items: [{ cat: "red-meat", palms: 1 }, { cat: "grains", palms: 1 }, { cat: "vegetables", palms: 1 }],
    tags: ["filling", "high_protein"],
    contains: ["meat", "red_meat", "gluten"],
  },
  {
    id: "oats_banana",
    name: "Oats & Banana",
    emoji: "\uD83E\uDD63",
    items: [{ cat: "grains", palms: 1 }, { cat: "fruits", palms: 1 }],
    tags: ["energy", "healthy", "filling"],
    contains: ["gluten"],
  },
  {
    id: "veggie_soup",
    name: "Vegetable Soup",
    emoji: "\uD83C\uDF72",
    items: [{ cat: "vegetables", palms: 2 }, { cat: "grains", palms: 0.5 }],
    tags: ["light", "healthy"],
    contains: ["gluten"],
  },
  // --- Additional templates for dietary coverage ---
  {
    id: "sweet_potato_beans",
    name: "Sweet Potato & Black Beans",
    emoji: "\uD83C\uDF60",
    items: [{ cat: "vegetables", palms: 1 }, { cat: "lean-protein", palms: 1 }],
    tags: ["filling", "energy", "healthy"],
    contains: [],
  },
  {
    id: "smoothie_bowl",
    name: "Smoothie Bowl",
    emoji: "\uD83E\uDED0",
    items: [{ cat: "fruits", palms: 1.5 }, { cat: "fats", palms: 0.25 }],
    tags: ["light", "sweet", "healthy"],
    contains: [],
  },
  {
    id: "avocado_rice",
    name: "Avocado Rice Bowl",
    emoji: "\uD83E\uDD51",
    items: [{ cat: "grains", palms: 1 }, { cat: "fats", palms: 0.5 }, { cat: "vegetables", palms: 1 }],
    tags: ["filling", "healthy", "energy"],
    contains: [],
  },
  {
    id: "chicken_sweet_potato",
    name: "Chicken & Sweet Potato",
    emoji: "\uD83C\uDF57",
    items: [{ cat: "lean-protein", palms: 1 }, { cat: "vegetables", palms: 1 }],
    tags: ["high_protein", "filling"],
    contains: ["meat"],
  },
  {
    id: "tofu_veg",
    name: "Tofu & Veggie Bowl",
    emoji: "\uD83E\uDD57",
    items: [{ cat: "lean-protein", palms: 1 }, { cat: "vegetables", palms: 1.5 }],
    tags: ["high_protein", "light", "healthy"],
    contains: [],
  },
  {
    id: "banana_pb",
    name: "Banana & Peanut Butter",
    emoji: "\uD83C\uDF4C",
    items: [{ cat: "fruits", palms: 1 }, { cat: "fats", palms: 0.5 }],
    tags: ["energy", "sweet", "filling"],
    contains: ["nuts"],
  },
];

/**
 * Preference options for the detailed planner.
 */
export const PREFERENCE_OPTIONS = [
  { key: "high_protein", label: "More Protein", emoji: "\uD83D\uDCAA" },
  { key: "light", label: "Feel Lighter", emoji: "\uD83C\uDF43" },
  { key: "sweet", label: "Sweet Snack", emoji: "\uD83C\uDF6C" },
  { key: "filling", label: "Filling Meal", emoji: "\uD83C\uDF72" },
  { key: "energy", label: "Energy Boost", emoji: "\u26A1" },
  { key: "healthy", label: "Healthy Pick", emoji: "\uD83E\uDD66" },
];

/**
 * Calculate the point cost of a meal template.
 * Accepts an optional points map for mode-aware calculation.
 */
export function getTemplateCost(template, pointsMap) {
  const map = pointsMap || getPointsMap("hybrid");
  let total = 0;
  for (const item of template.items) {
    total += (map[item.cat] || 0) * item.palms;
  }
  return Math.round(total);
}

function getSlotLabel(index, total) {
  if (total === 1) return "Next Meal";
  if (total === 2) return index === 0 ? "Next Meal" : "Later";
  return ["Next Meal", "Afternoon", "Evening"][index] || `Meal ${index + 1}`;
}

/**
 * Suggest meals for the rest of the day.
 * Filters by dietary restrictions (hard filter) and adjusts scoring by taste mode (soft boost).
 */
export function suggestMeals(remainingPoints, preferences, mealsLeft, dietaryRestrictions = [], tasteMode = "balanced", pointsMode = "hybrid") {
  // Build set of blocked allergens from dietary restrictions
  const blockedAllergens = new Set();
  for (const rKey of dietaryRestrictions) {
    const def = DIETARY_RESTRICTIONS.find((r) => r.key === rKey);
    if (def) def.blocks.forEach((b) => blockedAllergens.add(b));
  }

  const pointsMap = getPointsMap(pointsMode);

  // Hard filter: remove templates that contain blocked allergens
  const available = MEAL_TEMPLATES.filter((t) => {
    if (!t.contains || t.contains.length === 0) return true;
    return !t.contains.some((c) => blockedAllergens.has(c));
  });

  const pointsPerSlot = Math.max(1, Math.round(remainingPoints / mealsLeft));
  const slots = [];
  let budget = remainingPoints;
  const usedIds = new Set();

  for (let i = 0; i < mealsLeft; i++) {
    const slotBudget = i === mealsLeft - 1 ? budget : pointsPerSlot;
    if (slotBudget <= 0) break;

    const scored = available
      .filter((t) => !usedIds.has(t.id) && getTemplateCost(t, pointsMap) <= slotBudget + 2)
      .map((t) => {
        let score = 0;
        const cost = getTemplateCost(t, pointsMap);
        // Preference match: +10 per matching tag
        for (const pref of preferences) {
          if (t.tags.includes(pref)) score += 10;
        }
        // Taste mode scoring
        if (tasteMode === "healthier") {
          if (t.tags.includes("healthy")) score += 8;
          if (t.tags.includes("light")) score += 5;
          if (t.contains?.includes("sugar")) score -= 5;
          if (cost <= 3) score += 3;
        } else if (tasteMode === "yummier") {
          if (t.tags.includes("sweet")) score += 6;
          if (t.tags.includes("filling")) score += 5;
          if (t.contains?.includes("dairy")) score += 3;
          if (t.contains?.includes("red_meat")) score += 3;
          if (cost >= 5) score += 3;
        }
        // Point fit: penalize deviation from target
        score -= Math.abs(cost - slotBudget) * 0.5;
        // Bonus for staying within budget
        if (cost <= slotBudget) score += 3;
        return { ...t, cost, score };
      })
      .sort((a, b) => b.score - a.score);

    const options = scored.slice(0, 2);
    if (options.length > 0) {
      slots.push({
        slot: getSlotLabel(i, mealsLeft),
        options,
      });
      usedIds.add(options[0].id);
      if (options[1]) usedIds.add(options[1].id);
      budget -= options[0].cost;
    }
  }

  return slots;
}
