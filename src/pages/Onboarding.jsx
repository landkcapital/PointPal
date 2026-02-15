import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { calculateDailyPoints, GOALS } from "../lib/points";

export default function Onboarding({ session, onComplete }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    gender: "male",
    age: "",
    height_cm: "",
    weight_kg: "",
    activity_level: "moderate",
    goal: "lose_steady",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const canCalculate =
    form.age && form.height_cm && form.weight_kg && form.gender;

  const previewPoints = canCalculate
    ? calculateDailyPoints({
        height_cm: Number(form.height_cm),
        weight_kg: Number(form.weight_kg),
        age: Number(form.age),
        gender: form.gender,
        activity_level: form.activity_level,
        goal: form.goal,
      })
    : null;

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const dailyPoints = calculateDailyPoints({
      height_cm: Number(form.height_cm),
      weight_kg: Number(form.weight_kg),
      age: Number(form.age),
      gender: form.gender,
      activity_level: form.activity_level,
      goal: form.goal,
    });

    const { error: insertError } = await supabase.from("pp_profiles").insert({
      id: session.user.id,
      height_cm: Number(form.height_cm),
      weight_kg: Number(form.weight_kg),
      age: Number(form.age),
      gender: form.gender,
      activity_level: form.activity_level,
      goal: form.goal,
      daily_points: dailyPoints,
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    await onComplete();
    navigate("/");
  }

  return (
    <div className="login-page">
      <div className="login-container card onboarding-card">
        <h1 className="login-logo">PointPal</h1>
        <p className="login-subtitle">
          Let's set up your profile to calculate your daily points
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-row form-row-2">
            <div className="form-group">
              <label>Gender</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div className="form-group">
              <label>Age</label>
              <input
                type="number"
                min="10"
                max="120"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                placeholder="25"
                required
              />
            </div>
          </div>

          <div className="form-row form-row-2">
            <div className="form-group">
              <label>Height (cm)</label>
              <input
                type="number"
                min="100"
                max="250"
                value={form.height_cm}
                onChange={(e) =>
                  setForm({ ...form, height_cm: e.target.value })
                }
                placeholder="175"
                required
              />
            </div>
            <div className="form-group">
              <label>Weight (kg)</label>
              <input
                type="number"
                min="30"
                max="300"
                step="0.1"
                value={form.weight_kg}
                onChange={(e) =>
                  setForm({ ...form, weight_kg: e.target.value })
                }
                placeholder="70"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Activity Level</label>
            <select
              value={form.activity_level}
              onChange={(e) =>
                setForm({ ...form, activity_level: e.target.value })
              }
            >
              <option value="sedentary">Sedentary (desk job, little exercise)</option>
              <option value="light">Light (1-3 days/week exercise)</option>
              <option value="moderate">Moderate (3-5 days/week exercise)</option>
              <option value="active">Very Active (6-7 days/week exercise)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Your Goal</label>
            <div className="goal-picker">
              {GOALS.map((g) => (
                <button
                  key={g.key}
                  type="button"
                  className={`goal-option ${form.goal === g.key ? "selected" : ""}`}
                  onClick={() => setForm({ ...form, goal: g.key })}
                >
                  <span className="goal-option-label">{g.label}</span>
                  <span className="goal-option-desc">{g.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {previewPoints && (
            <div className="points-preview">
              <span className="points-preview-label">Your daily points</span>
              <span className="points-preview-value">{previewPoints}</span>
            </div>
          )}

          {error && <p className="form-error">{error}</p>}

          <button
            type="submit"
            className="btn primary"
            disabled={saving || !canCalculate}
          >
            {saving ? "Setting up..." : "Get Started"}
          </button>
        </form>
      </div>
    </div>
  );
}
