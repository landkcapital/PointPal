import { useState, useMemo } from "react";
import {
  PREFERENCE_OPTIONS,
  suggestMeals,
  getTemplateCost,
} from "../lib/mealPlanner";

const MEALS_LEFT_OPTIONS = [1, 2, 3];

export default function SuggestMealsCard({ remaining, onPlanSet, profile }) {
  const [expanded, setExpanded] = useState(false);
  const [preferences, setPreferences] = useState([]);
  const [mealsLeft, setMealsLeft] = useState(2);
  const [tasteMode, setTasteMode] = useState("balanced");
  const [selections, setSelections] = useState({});

  const dietaryRestrictions = useMemo(() => {
    try { return JSON.parse(profile?.dietary_restrictions || "[]"); }
    catch { return []; }
  }, [profile?.dietary_restrictions]);

  const pointsMode = profile?.points_mode || "hybrid";

  const quickSuggestion = useMemo(
    () => suggestMeals(remaining, [], 2, dietaryRestrictions, "balanced", pointsMode),
    [remaining, dietaryRestrictions, pointsMode]
  );

  const detailedSuggestion = useMemo(
    () => suggestMeals(remaining, preferences, mealsLeft, dietaryRestrictions, tasteMode, pointsMode),
    [remaining, preferences, mealsLeft, dietaryRestrictions, tasteMode, pointsMode]
  );

  const activeSuggestion = expanded ? detailedSuggestion : quickSuggestion;

  function togglePref(key) {
    setPreferences((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
    setSelections({});
  }

  function selectOption(slotIndex, optionIndex) {
    const next = { ...selections, [slotIndex]: optionIndex };
    setSelections(next);

    // Build plan from selections
    const plan = activeSuggestion.map((slot, i) => {
      const picked = next[i] ?? 0;
      return slot.options[picked] || slot.options[0];
    });
    onPlanSet?.(plan);
  }

  if (remaining <= 0) return null;

  return (
    <div className="card suggest-card">
      <div className="suggest-header">
        <h3>Suggest Rest of Day</h3>
        {!expanded && (
          <button
            type="button"
            className="suggest-detail-btn"
            onClick={() => setExpanded(true)}
          >
            More detail
          </button>
        )}
        {expanded && (
          <button
            type="button"
            className="suggest-detail-btn"
            onClick={() => { setExpanded(false); setSelections({}); }}
          >
            Simple view
          </button>
        )}
      </div>

      {expanded && (
        <>
          {/* Preference Chips */}
          <div className="preference-grid">
            {PREFERENCE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                className={`preference-chip ${preferences.includes(opt.key) ? "selected" : ""}`}
                onClick={() => togglePref(opt.key)}
              >
                <span className="preference-chip-emoji">{opt.emoji}</span>
                <span className="preference-chip-label">{opt.label}</span>
              </button>
            ))}
          </div>

          {/* Taste Mode Toggle */}
          <div className="taste-mode-section">
            <label className="meals-left-label">Meal style</label>
            <div className="taste-mode-toggle">
              <button
                type="button"
                className={`taste-mode-btn ${tasteMode === "healthier" ? "active" : ""}`}
                onClick={() => { setTasteMode("healthier"); setSelections({}); }}
              >
                🥗 Healthier
              </button>
              <button
                type="button"
                className={`taste-mode-btn ${tasteMode === "balanced" ? "active" : ""}`}
                onClick={() => { setTasteMode("balanced"); setSelections({}); }}
              >
                ⚖️ Balanced
              </button>
              <button
                type="button"
                className={`taste-mode-btn ${tasteMode === "yummier" ? "active" : ""}`}
                onClick={() => { setTasteMode("yummier"); setSelections({}); }}
              >
                😋 Yummier
              </button>
            </div>
          </div>

          {/* Meals Remaining */}
          <div className="meals-left-section">
            <label className="meals-left-label">Meals remaining today</label>
            <div className="meals-left-toggle">
              {MEALS_LEFT_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`meals-left-btn ${mealsLeft === n ? "active" : ""}`}
                  onClick={() => { setMealsLeft(n); setSelections({}); }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Dietary notice */}
      {expanded && dietaryRestrictions.length > 0 && (
        <p className="dietary-notice">Filtered for your dietary restrictions</p>
      )}

      {/* Suggestion Grid */}
      <div className="suggest-slots">
        {activeSuggestion.map((slot, si) => (
          <div key={si} className="meal-slot">
            <span className="meal-slot-label">{slot.slot}</span>
            <div className="meal-slot-options">
              {slot.options.map((opt, oi) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`meal-option ${(selections[si] ?? 0) === oi ? "selected" : ""}`}
                  onClick={() => selectOption(si, oi)}
                >
                  <span className="meal-option-emoji">{opt.emoji}</span>
                  <span className="meal-option-name">{opt.name}</span>
                  <span className="meal-option-cost">{opt.cost} pts</span>
                </button>
              ))}
            </div>
          </div>
        ))}
        {activeSuggestion.length === 0 && (
          <p className="suggest-empty">Not enough points for suggestions.</p>
        )}
      </div>
    </div>
  );
}
