import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { FOOD_CATEGORIES, GROUP_COLORS } from "../lib/foods";

const PALM_OPTIONS = [
  { value: 0.25, label: "\u00BC" },
  { value: 0.5, label: "\u00BD" },
  { value: 0.75, label: "\u00BE" },
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: 5, label: "5" },
];

const SPOON_OPTIONS = [
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: 5, label: "5" },
];

const MEAL_SIZES = [
  { key: "taste", label: "Taste", desc: "A spoonful or two" },
  { key: "small", label: "Small", desc: "Snack or light bite", multiplier: 0.7 },
  { key: "medium", label: "Medium", desc: "Normal meal", multiplier: 1.0 },
  { key: "large", label: "Large", desc: "Big / second helpings", multiplier: 1.5 },
];

const HEALTH_RATINGS = [
  { value: 5, label: "Very Healthy", base: 4, color: "#16a34a" },
  { value: 4, label: "Healthy", base: 7, color: "#65a30d" },
  { value: 3, label: "Average", base: 10, color: "#ca8a04" },
  { value: 2, label: "Unhealthy", base: 14, color: "#ea580c" },
  { value: 1, label: "Very Unhealthy", base: 18, color: "#dc2626" },
];

const HEALTH_QUESTIONS = [
  { id: "homemade", question: "Was it home-cooked?", yesAdj: -2 },
  { id: "veggies", question: "Did it include vegetables?", yesAdj: -2 },
  { id: "fried", question: "Was it fried or greasy?", yesAdj: 3 },
  { id: "processed", question: "Processed or fast food?", yesAdj: 3 },
  { id: "sugary", question: "Sugary drink or dessert included?", yesAdj: 2 },
];

function getWindowPenalty(profile, logDate) {
  if (!profile?.eating_window_start || !profile?.eating_window_end) return 1;
  const d = logDate || new Date();
  const mins = d.getHours() * 60 + d.getMinutes();
  const [sh, sm] = profile.eating_window_start.split(":").map(Number);
  const [eh, em] = profile.eating_window_end.split(":").map(Number);
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  if (mins >= startMins && mins <= endMins) return 1;
  const before = startMins - mins;
  const after = mins - endMins;
  const outside = Math.min(
    before > 0 ? before : Infinity,
    after > 0 ? after : Infinity
  );
  return outside > 120 ? 3 : 2;
}

export default function LogFoodModal({ onClose, onAdded, profile }) {
  const [mode, setMode] = useState("pick"); // "pick" or "rate"

  // --- Pick Food state ---
  const [selectedKey, setSelectedKey] = useState(null);
  const [unit, setUnit] = useState("palms"); // "palms" or "spoonfuls"
  const [servings, setServings] = useState(1);
  const [note, setNote] = useState("");

  // --- Rate Meal state ---
  const [mealSize, setMealSize] = useState("medium");
  const [tasteSpoonfuls, setTasteSpoonfuls] = useState(1);
  const [rating, setRating] = useState(null);
  const [showQuestions, setShowQuestions] = useState(false);
  const [answers, setAnswers] = useState({});
  const [rateNote, setRateNote] = useState("");

  // --- Shared state ---
  const [logTime, setLogTime] = useState("now");
  const [customTime, setCustomTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Lock body scroll while modal is open
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

  // Build the log date for penalty calculation
  const logDate = (() => {
    if (logTime === "now") return new Date();
    const [h, m] = customTime.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  })();

  // Eating window penalty
  const penalty = getWindowPenalty(profile, logDate);

  // Pick mode calculations
  const selectedCat = FOOD_CATEGORIES.find((c) => c.key === selectedKey);
  const isDrink = selectedKey === "alcohol" || selectedKey === "sugary-drinks";
  const palmEquiv = unit === "spoonfuls" ? servings * 0.2 : servings;
  const basePickPoints = selectedCat ? Math.round(selectedCat.points * palmEquiv) : 0;
  const totalPoints = Math.round(basePickPoints * penalty);

  // Rate mode calculations
  const sizeMultiplier = mealSize === "taste"
    ? tasteSpoonfuls * 0.15
    : (MEAL_SIZES.find((s) => s.key === mealSize)?.multiplier || 1);

  function getQuestionScore() {
    let base = 10;
    HEALTH_QUESTIONS.forEach((q) => {
      if (answers[q.id] === true) base += q.yesAdj;
    });
    return Math.max(2, Math.min(20, base));
  }

  const allQuestionsAnswered =
    HEALTH_QUESTIONS.every((q) => answers[q.id] !== undefined);

  const ratePoints = (() => {
    let base = 0;
    if (showQuestions && allQuestionsAnswered) {
      base = Math.round(getQuestionScore() * sizeMultiplier);
    } else if (rating !== null) {
      const r = HEALTH_RATINGS.find((h) => h.value === rating);
      base = r ? Math.round(r.base * sizeMultiplier) : 0;
    }
    return Math.round(base * penalty);
  })();

  const ratingObj = rating !== null
    ? HEALTH_RATINGS.find((h) => h.value === rating)
    : null;

  async function handlePickSubmit(e) {
    e.preventDefault();
    if (!selectedCat) return;
    setSaving(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();

    let logNote = note || "";
    if (unit === "spoonfuls") {
      const unitWord = isDrink ? "sip" : "spoonful";
      const unitLabel = `${servings} ${unitWord}${servings !== 1 ? "s" : ""}`;
      logNote = logNote ? `${unitLabel} \u2022 ${logNote}` : unitLabel;
    }

    const loggedAt = logTime === "now" ? new Date() : logDate;
    const { error: insertError } = await supabase
      .from("pp_food_logs")
      .insert({
        user_id: user.id,
        category: selectedCat.key,
        servings: palmEquiv,
        points: totalPoints,
        note: logNote || null,
        logged_at: loggedAt.toISOString(),
      });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }
    onAdded();
    onClose();
  }

  async function handleRateSubmit(e) {
    e.preventDefault();
    if (ratePoints === 0) return;
    setSaving(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();

    let autoNote;
    if (mealSize === "taste") {
      autoNote = `Taste (${tasteSpoonfuls} spoonful${tasteSpoonfuls !== 1 ? "s" : ""})`;
    } else {
      const sizeLabel = MEAL_SIZES.find((s) => s.key === mealSize)?.label;
      autoNote = `${sizeLabel} meal`;
    }
    if (showQuestions && allQuestionsAnswered) {
      autoNote += " (guided rating)";
    } else if (ratingObj) {
      autoNote += ` \u2022 ${ratingObj.label}`;
    }
    if (rateNote) autoNote += ` \u2022 ${rateNote}`;

    const loggedAt = logTime === "now" ? new Date() : logDate;
    const { error: insertError } = await supabase
      .from("pp_food_logs")
      .insert({
        user_id: user.id,
        category: "rated_meal",
        servings: 1,
        points: ratePoints,
        note: autoNote,
        logged_at: loggedAt.toISOString(),
      });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }
    onAdded();
    onClose();
  }

  function handleStartQuestions() {
    setRating(null);
    setShowQuestions(true);
    setAnswers({});
  }

  function handleAnswer(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{mode === "pick" ? "What did you eat?" : "Rate your meal"}</h2>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="modal-tabs">
          <button
            className={`modal-tab ${mode === "pick" ? "active" : ""}`}
            onClick={() => setMode("pick")}
          >
            Pick Food
          </button>
          <button
            className={`modal-tab ${mode === "rate" ? "active" : ""}`}
            onClick={() => setMode("rate")}
          >
            Rate Meal
          </button>
        </div>

        {/* Time Picker */}
        <div className="log-time-picker">
          <div className="log-time-toggle">
            <button
              type="button"
              className={`log-time-btn ${logTime === "now" ? "active" : ""}`}
              onClick={() => setLogTime("now")}
            >
              Now
            </button>
            <button
              type="button"
              className={`log-time-btn ${logTime === "custom" ? "active" : ""}`}
              onClick={() => setLogTime("custom")}
            >
              Earlier
            </button>
          </div>
          {logTime === "custom" && (
            <input
              type="time"
              className="log-time-input"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
            />
          )}
        </div>

        {/* ========== PICK FOOD MODE ========== */}
        {mode === "pick" && (
          <form onSubmit={handlePickSubmit}>
            <div className="food-grid">
              {FOOD_CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  className={`food-grid-item ${selectedKey === cat.key ? "selected" : ""}`}
                  onClick={() => setSelectedKey(cat.key)}
                  style={{
                    borderColor:
                      selectedKey === cat.key
                        ? GROUP_COLORS[cat.group]
                        : undefined,
                  }}
                >
                  <span className="food-grid-emoji">{cat.emoji}</span>
                  <span className="food-grid-name">{cat.name}</span>
                  <span
                    className="food-grid-pts"
                    style={{ color: GROUP_COLORS[cat.group] }}
                  >
                    {cat.points === 0 ? "Free" : `${cat.points} pts`}
                  </span>
                </button>
              ))}
            </div>

            {selectedCat && (
              <>
                <p className="food-examples">{selectedCat.examples}</p>

                <div className="servings-section">
                  <div className="unit-toggle">
                    <button
                      type="button"
                      className={`unit-toggle-btn ${unit === "palms" ? "active" : ""}`}
                      onClick={() => { setUnit("palms"); setServings(1); }}
                    >
                      {isDrink ? "Glasses" : "Palms"}
                    </button>
                    <button
                      type="button"
                      className={`unit-toggle-btn ${unit === "spoonfuls" ? "active" : ""}`}
                      onClick={() => { setUnit("spoonfuls"); setServings(1); }}
                    >
                      {isDrink ? "Sips" : "Spoonfuls"}
                    </button>
                  </div>
                  <label className="servings-label">
                    {isDrink
                      ? (unit === "palms" ? "Glass-sized servings" : "Sips (a few mouthfuls)")
                      : (unit === "palms" ? "Palm-sized servings" : "Spoonfuls (sneaky snacks)")}
                  </label>
                  <div className="servings-buttons servings-buttons-wrap">
                    {(unit === "palms" ? PALM_OPTIONS : SPOON_OPTIONS).map((opt) => (
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
                  <div className="servings-total">
                    {totalPoints === 0
                      ? "Free!"
                      : `${totalPoints} point${totalPoints !== 1 ? "s" : ""}`}
                  </div>
                  {penalty > 1 && (
                    <div className="penalty-warning">
                      {penalty}x penalty — outside eating window
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Note (optional)</label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Lunch, snack..."
                  />
                </div>

                {error && <p className="form-error">{error}</p>}

                <button
                  type="submit"
                  className="btn primary"
                  disabled={saving}
                >
                  {saving
                    ? "Logging..."
                    : `Log Food${totalPoints > 0 ? ` (${totalPoints} pts)` : ""}`}
                </button>
              </>
            )}
          </form>
        )}

        {/* ========== RATE MEAL MODE ========== */}
        {mode === "rate" && (
          <form onSubmit={handleRateSubmit}>
            {/* Meal Size */}
            <div className="rate-section">
              <label className="rate-section-label">How big was the meal?</label>
              <div className="size-picker">
                {MEAL_SIZES.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    className={`size-option ${mealSize === s.key ? "selected" : ""}`}
                    onClick={() => setMealSize(s.key)}
                  >
                    <span className="size-option-label">{s.label}</span>
                    <span className="size-option-desc">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Taste Spoonfuls */}
            {mealSize === "taste" && (
              <div className="rate-section">
                <label className="rate-section-label">How many spoonfuls?</label>
                <div className="servings-buttons">
                  {SPOON_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`servings-btn ${tasteSpoonfuls === opt.value ? "active" : ""}`}
                      onClick={() => setTasteSpoonfuls(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Health Rating OR Questions */}
            {!showQuestions ? (
              <div className="rate-section">
                <label className="rate-section-label">
                  How healthy was it?
                </label>
                <div className="rating-picker">
                  {HEALTH_RATINGS.map((h) => (
                    <button
                      key={h.value}
                      type="button"
                      className={`rating-option ${rating === h.value ? "selected" : ""}`}
                      onClick={() => setRating(h.value)}
                      style={
                        rating === h.value
                          ? { borderColor: h.color, background: `${h.color}0D` }
                          : {}
                      }
                    >
                      <span
                        className="rating-option-num"
                        style={rating === h.value ? { color: h.color } : {}}
                      >
                        {h.value}
                      </span>
                      <span className="rating-option-label">{h.label}</span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="unsure-btn"
                  onClick={handleStartQuestions}
                >
                  Not sure? Let us help
                </button>
              </div>
            ) : (
              <div className="rate-section">
                <label className="rate-section-label">
                  Answer a few questions
                </label>
                <div className="questions-list">
                  {HEALTH_QUESTIONS.map((q) => (
                    <div key={q.id} className="question-row">
                      <span className="question-text">{q.question}</span>
                      <div className="question-btns">
                        <button
                          type="button"
                          className={`question-btn ${answers[q.id] === true ? "yes" : ""}`}
                          onClick={() => handleAnswer(q.id, true)}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          className={`question-btn ${answers[q.id] === false ? "no" : ""}`}
                          onClick={() => handleAnswer(q.id, false)}
                        >
                          No
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="unsure-btn"
                  onClick={() => {
                    setShowQuestions(false);
                    setAnswers({});
                  }}
                >
                  Back to star rating
                </button>
              </div>
            )}

            {/* Result + Submit */}
            {ratePoints > 0 && (
              <>
                <div className="rate-result">
                  <span className="rate-result-label">This meal costs</span>
                  <span className="rate-result-value">
                    {ratePoints} point{ratePoints !== 1 ? "s" : ""}
                  </span>
                  {penalty > 1 && (
                    <div className="penalty-warning" style={{ marginTop: "0.5rem" }}>
                      {penalty}x penalty — outside eating window
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Note (optional)</label>
                  <input
                    type="text"
                    value={rateNote}
                    onChange={(e) => setRateNote(e.target.value)}
                    placeholder="e.g. Chicken stir-fry, pizza..."
                  />
                </div>

                {error && <p className="form-error">{error}</p>}

                <button
                  type="submit"
                  className="btn primary"
                  disabled={saving}
                >
                  {saving ? "Logging..." : `Log Meal (${ratePoints} pts)`}
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
