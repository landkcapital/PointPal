import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { getFoodCategories, GROUP_COLORS, getUserNote, STANDARD_MEALS, getStandardMealCost } from "../lib/foods";

const SERVING_OPTIONS = [
  { value: 0.25, label: "\u00BC" },
  { value: 0.5, label: "\u00BD" },
  { value: 0.75, label: "\u00BE" },
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: 5, label: "5" },
  { value: 6, label: "6" },
  { value: 7, label: "7" },
  { value: 8, label: "8" },
  { value: 9, label: "9" },
  { value: 10, label: "10" },
];

export default function EditLogModal({ log, onClose, onSaved, profile }) {
  const pointsMode = profile?.points_mode || "hybrid";
  const allCategories = useMemo(() => getFoodCategories(pointsMode), [pointsMode]);

  const isRatedMeal = log.category === "rated_meal";
  const isStandardMeal = log.category === "standard_meal";

  // For standard meals, extract meal name and try to match template
  const stdMealName = isStandardMeal ? (log.note || "Meal").split(" \u2022 ")[0] : "";
  const stdMealMatch = isStandardMeal
    ? STANDARD_MEALS.find((m) => log.note?.startsWith(m.name))
    : null;

  const [selectedKey, setSelectedKey] = useState(log.category);
  const [servings, setServings] = useState(log.servings || 1);
  const [note, setNote] = useState(getUserNote(log) || "");
  const [points, setPoints] = useState(log.points);
  const [overridePoints, setOverridePoints] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Standard meal size state
  const [stdEditSize, setStdEditSize] = useState(() => {
    if (!isStandardMeal) return "medium";
    if ((log.servings || 1) <= 0.75) return "small";
    if ((log.servings || 1) >= 1.25) return "large";
    return "medium";
  });

  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.classList.add("modal-open");
    document.body.style.top = `-${scrollY}px`;
    return () => {
      document.body.classList.remove("modal-open");
      document.body.style.top = "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Auto-calculate points for regular food categories
  const selectedCat = allCategories.find((c) => c.key === selectedKey);
  const autoPoints = selectedCat ? Math.round(selectedCat.points * servings) : log.points;

  // Auto-calculate points for standard meals
  const stdSizeMultiplier = stdEditSize === "small" ? 0.7 : stdEditSize === "large" ? 1.5 : 1;
  const stdAutoPoints = stdMealMatch
    ? Math.round(getStandardMealCost(stdMealMatch, pointsMode) * stdSizeMultiplier)
    : log.points;

  useEffect(() => {
    if (!overridePoints) {
      if (isStandardMeal && stdMealMatch) {
        setPoints(stdAutoPoints);
      } else if (!isRatedMeal && !isStandardMeal) {
        setPoints(autoPoints);
      }
    }
  }, [autoPoints, stdAutoPoints, overridePoints, isRatedMeal, isStandardMeal, stdMealMatch]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const updateData = {
      points: Number(points),
    };

    if (isStandardMeal) {
      updateData.servings = stdSizeMultiplier;
      updateData.note = note ? `${stdMealName} \u2022 ${note}` : stdMealName;
    } else if (isRatedMeal) {
      updateData.note = note || null;
    } else {
      updateData.category = selectedKey;
      updateData.servings = servings;
      updateData.note = note || null;
    }

    const { error: updateError } = await supabase
      .from("pp_food_logs")
      .update(updateData)
      .eq("id", log.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }
    onSaved();
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Entry</h2>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSave}>
          {isStandardMeal ? (
            <>
              <div className="edit-log-preview">
                <span className="food-log-emoji">{stdMealMatch?.emoji || "\uD83C\uDF7D\uFE0F"}</span>
                <span className="edit-log-name">{stdMealName}</span>
              </div>

              <label className="edit-section-label">Portion Size</label>
              <div className="std-meal-sizes">
                <button
                  type="button"
                  className={`std-meal-size-btn ${stdEditSize === "small" ? "active" : ""}`}
                  onClick={() => setStdEditSize("small")}
                >
                  Small
                </button>
                <button
                  type="button"
                  className={`std-meal-size-btn ${stdEditSize === "medium" ? "active" : ""}`}
                  onClick={() => setStdEditSize("medium")}
                >
                  Regular
                </button>
                <button
                  type="button"
                  className={`std-meal-size-btn ${stdEditSize === "large" ? "active" : ""}`}
                  onClick={() => setStdEditSize("large")}
                >
                  Large
                </button>
              </div>

              <div className="edit-auto-points">
                {stdAutoPoints === 0 ? "Free!" : `${stdAutoPoints} point${stdAutoPoints !== 1 ? "s" : ""}`}
                {!overridePoints && (
                  <button
                    type="button"
                    className="override-link"
                    onClick={() => setOverridePoints(true)}
                  >
                    Override
                  </button>
                )}
              </div>
            </>
          ) : isRatedMeal ? (
            <div className="edit-log-preview">
              <span className="food-log-emoji">{"\uD83C\uDF7D\uFE0F"}</span>
              <span className="edit-log-name">Rated Meal</span>
            </div>
          ) : (
            <>
              <label className="edit-section-label">Category</label>
              <div className="edit-category-scroll">
                {allCategories.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    className={`edit-cat-btn ${selectedKey === cat.key ? "selected" : ""}`}
                    onClick={() => setSelectedKey(cat.key)}
                    style={
                      selectedKey === cat.key
                        ? {
                            borderColor: GROUP_COLORS[cat.group],
                            background: `${GROUP_COLORS[cat.group]}0D`,
                          }
                        : {}
                    }
                  >
                    <span className="edit-cat-emoji">{cat.emoji}</span>
                    <span className="edit-cat-name">{cat.name}</span>
                  </button>
                ))}
              </div>

              <label className="edit-section-label">Servings (palms)</label>
              <div className="servings-buttons servings-buttons-wrap">
                {SERVING_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`servings-btn ${servings === opt.value ? "active" : ""}`}
                    onClick={() => setServings(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="edit-auto-points">
                {autoPoints === 0 ? "Free!" : `${autoPoints} point${autoPoints !== 1 ? "s" : ""}`}
                {!overridePoints && (
                  <button
                    type="button"
                    className="override-link"
                    onClick={() => setOverridePoints(true)}
                  >
                    Override
                  </button>
                )}
              </div>
            </>
          )}

          {(overridePoints || isRatedMeal) && (
            <div className="form-group">
              <label>Points</label>
              <input
                type="number"
                min="0"
                max="100"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What did you eat? e.g. Chicken stir-fry..."
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            <button type="submit" className="btn primary" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button type="button" className="btn secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
