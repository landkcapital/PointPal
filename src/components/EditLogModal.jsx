import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { getFoodCategories, GROUP_COLORS, getUserNote } from "../lib/foods";

const SERVING_OPTIONS = [
  { value: 0.25, label: "\u00BC" },
  { value: 0.5, label: "\u00BD" },
  { value: 0.75, label: "\u00BE" },
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: 5, label: "5" },
];

export default function EditLogModal({ log, onClose, onSaved, profile }) {
  const pointsMode = profile?.points_mode || "hybrid";
  const allCategories = useMemo(() => getFoodCategories(pointsMode), [pointsMode]);

  const isRatedMeal = log.category === "rated_meal";

  const [selectedKey, setSelectedKey] = useState(log.category);
  const [servings, setServings] = useState(log.servings || 1);
  const [note, setNote] = useState(getUserNote(log) || "");
  const [points, setPoints] = useState(log.points);
  const [overridePoints, setOverridePoints] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

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

  // Auto-calculate points when category or servings change
  const selectedCat = allCategories.find((c) => c.key === selectedKey);
  const autoPoints = selectedCat ? Math.round(selectedCat.points * servings) : log.points;

  useEffect(() => {
    if (!overridePoints && !isRatedMeal) {
      setPoints(autoPoints);
    }
  }, [autoPoints, overridePoints, isRatedMeal]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const updateData = {
      points: Number(points),
      note: note || null,
    };

    if (!isRatedMeal) {
      updateData.category = selectedKey;
      updateData.servings = servings;
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
          {isRatedMeal ? (
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
