import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { signOut } from "../lib/auth";
import { calculateDailyPoints, GOALS, getGoalByKey } from "../lib/points";
import { PHYSIQUE_GOALS, getMacroTargets, MACRO_META } from "../lib/macros";
import { DIETARY_RESTRICTIONS } from "../lib/mealPlanner";
import PointsChart from "../components/PointsChart";
import Loading from "../components/Loading";

const GOAL_DESCRIPTIONS = {
  lose_fast:
    "With an aggressive 30% caloric deficit, you can expect to lose 0.5\u20131 kg per week. Prioritize protein and stay hydrated. This plan is great for a short-term push \u2014 consider switching to a steadier plan after a few weeks to protect your metabolism.",
  lose_steady:
    "A moderate 15% deficit is the gold standard for sustainable weight loss. You\u2019ll lose weight gradually while keeping energy levels stable. This approach is easier to maintain long-term and helps preserve muscle mass.",
  maintain:
    "Eating at maintenance keeps your weight stable while you build healthy habits. Perfect after reaching your goal weight, during high-activity periods, or when you want to focus on eating well without restriction.",
};

function MacrosSettingsCard({ profile, userId, onUpdate }) {
  const [enabled, setEnabled] = useState(!!profile.macros_enabled);
  const [goal, setGoal] = useState(profile.physique_goal || "maintain");
  const [saving, setSaving] = useState(false);

  const targets = getMacroTargets(profile.daily_points, goal);

  async function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    setSaving(true);
    await supabase
      .from("pp_profiles")
      .update({
        macros_enabled: next,
        physique_goal: next ? goal : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    await onUpdate();
    setSaving(false);
  }

  async function handleGoalChange(newGoal) {
    setGoal(newGoal);
    setSaving(true);
    await supabase
      .from("pp_profiles")
      .update({
        physique_goal: newGoal,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    await onUpdate();
    setSaving(false);
  }

  return (
    <div className="card macros-settings-card">
      <div className="eating-window-header">
        <div>
          <h3>Macro Tracking</h3>
          <p className="eating-window-desc">
            Track protein, carbs, fat & fiber alongside your points.
          </p>
        </div>
        <button
          type="button"
          className={`toggle-switch ${enabled ? "on" : ""}`}
          onClick={handleToggle}
          disabled={saving}
        >
          <span className="toggle-thumb" />
        </button>
      </div>
      {enabled && (
        <>
          <label className="rate-section-label" style={{ marginTop: "0.75rem" }}>
            What&apos;s your physique goal?
          </label>
          <div className="physique-goal-picker">
            {PHYSIQUE_GOALS.map((g) => (
              <button
                key={g.key}
                type="button"
                className={`goal-option ${goal === g.key ? "selected" : ""}`}
                onClick={() => handleGoalChange(g.key)}
                disabled={saving}
              >
                <span className="goal-option-label">{g.label}</span>
                <span className="goal-option-desc">{g.desc}</span>
              </button>
            ))}
          </div>
          {targets && (
            <div className="macros-preview">
              {Object.entries(MACRO_META).map(([key, meta]) => (
                <div key={key} className="macros-preview-item">
                  <span className="macros-preview-icon">{meta.icon}</span>
                  <span className="macros-preview-label">{meta.label}</span>
                  <span className="macros-preview-value" style={{ color: meta.color }}>
                    {targets[key]} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EatingWindowCard({ profile, userId, onUpdate }) {
  const hasWindow = profile.eating_window_start && profile.eating_window_end;
  const [enabled, setEnabled] = useState(hasWindow);
  const [start, setStart] = useState(profile.eating_window_start?.slice(0, 5) || "08:00");
  const [end, setEnd] = useState(profile.eating_window_end?.slice(0, 5) || "20:00");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await supabase
      .from("pp_profiles")
      .update({
        eating_window_start: enabled ? start + ":00" : null,
        eating_window_end: enabled ? end + ":00" : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    await onUpdate();
    setSaving(false);
  }

  async function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    if (!next) {
      setSaving(true);
      await supabase
        .from("pp_profiles")
        .update({
          eating_window_start: null,
          eating_window_end: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
      await onUpdate();
      setSaving(false);
    }
  }

  return (
    <div className="card eating-window-card">
      <div className="eating-window-header">
        <div>
          <h3>Eating Window</h3>
          <p className="eating-window-desc">
            Eat outside your window? Points are multiplied.
          </p>
        </div>
        <button
          type="button"
          className={`toggle-switch ${enabled ? "on" : ""}`}
          onClick={handleToggle}
          disabled={saving}
        >
          <span className="toggle-thumb" />
        </button>
      </div>
      {enabled && (
        <>
          <div className="eating-window-times">
            <div className="form-group">
              <label>Start</label>
              <input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="form-group">
              <label>End</label>
              <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <div className="eating-window-rules">
            <div className="eating-window-rule">
              <span className="rule-badge rule-badge-warn">2x</span>
              <span>Within 2 hours outside window</span>
            </div>
            <div className="eating-window-rule">
              <span className="rule-badge rule-badge-danger">3x</span>
              <span>More than 2 hours outside window</span>
            </div>
          </div>
          <button className="btn primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Window"}
          </button>
        </>
      )}
    </div>
  );
}

function DietaryRestrictionsCard({ profile, userId, onUpdate }) {
  const [enabled, setEnabled] = useState(() => {
    try {
      return JSON.parse(profile.dietary_restrictions || "[]").length > 0;
    } catch { return false; }
  });
  const [selected, setSelected] = useState(() => {
    try { return JSON.parse(profile.dietary_restrictions || "[]"); }
    catch { return []; }
  });
  const [saving, setSaving] = useState(false);

  async function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    if (!next) {
      setSelected([]);
      setSaving(true);
      await supabase
        .from("pp_profiles")
        .update({
          dietary_restrictions: "[]",
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
      await onUpdate();
      setSaving(false);
    }
  }

  async function toggleRestriction(key) {
    const next = selected.includes(key)
      ? selected.filter((k) => k !== key)
      : [...selected, key];
    setSelected(next);
    setSaving(true);
    await supabase
      .from("pp_profiles")
      .update({
        dietary_restrictions: JSON.stringify(next),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    await onUpdate();
    setSaving(false);
  }

  return (
    <div className="card dietary-restrictions-card">
      <div className="eating-window-header">
        <div>
          <h3>Dietary Restrictions</h3>
          <p className="eating-window-desc">
            Filter meal suggestions to match your diet.
          </p>
        </div>
        <button
          type="button"
          className={`toggle-switch ${enabled ? "on" : ""}`}
          onClick={handleToggle}
          disabled={saving}
        >
          <span className="toggle-thumb" />
        </button>
      </div>
      {enabled && (
        <div className="dietary-grid">
          {DIETARY_RESTRICTIONS.map((r) => (
            <button
              key={r.key}
              type="button"
              className={`dietary-chip ${selected.includes(r.key) ? "selected" : ""}`}
              onClick={() => toggleRestriction(r.key)}
              disabled={saving}
            >
              <span className="dietary-chip-emoji">{r.emoji}</span>
              <span className="dietary-chip-label">{r.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Account({ profile, onProfileUpdate }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signingOut, setSigningOut] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [switchingGoal, setSwitchingGoal] = useState(false);

  useEffect(() => {
    async function fetchAccount() {
      try {
        const {
          data: { user: u },
          error: userErr,
        } = await supabase.auth.getUser();
        if (userErr) throw userErr;
        setUser(u);

        const { count } = await supabase
          .from("pp_food_logs")
          .select("id", { count: "exact", head: true });

        setStats({ totalLogs: count || 0 });
      } catch (err) {
        setError(err.message || "Failed to load account");
      } finally {
        setLoading(false);
      }
    }
    fetchAccount();
  }, []);

  async function handleGoalChange(newGoal) {
    if (newGoal === profile?.goal || switchingGoal || !user) return;
    setSwitchingGoal(true);
    setError(null);

    const dailyPoints = calculateDailyPoints({
      height_cm: profile.height_cm,
      weight_kg: profile.weight_kg,
      age: profile.age,
      gender: profile.gender,
      activity_level: profile.activity_level,
      goal: newGoal,
    });

    const { error: updateError } = await supabase
      .from("pp_profiles")
      .update({
        goal: newGoal,
        daily_points: dailyPoints,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      await onProfileUpdate();
    }
    setSwitchingGoal(false);
  }

  function startEditing() {
    setForm({
      height_cm: profile?.height_cm?.toString() || "",
      weight_kg: profile?.weight_kg?.toString() || "",
      age: profile?.age?.toString() || "",
      gender: profile?.gender || "male",
      activity_level: profile?.activity_level || "moderate",
    });
    setEditing(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const dailyPoints = calculateDailyPoints({
      height_cm: Number(form.height_cm),
      weight_kg: Number(form.weight_kg),
      age: Number(form.age),
      gender: form.gender,
      activity_level: form.activity_level,
      goal: profile?.goal || "lose_steady",
    });

    const { error: updateError } = await supabase
      .from("pp_profiles")
      .update({
        height_cm: Number(form.height_cm),
        weight_kg: Number(form.weight_kg),
        age: Number(form.age),
        gender: form.gender,
        activity_level: form.activity_level,
        daily_points: dailyPoints,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setEditing(false);
    await onProfileUpdate();
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      navigate("/login");
    } catch (err) {
      setError(err.message || "Failed to sign out");
      setSigningOut(false);
    }
  }

  if (loading) return <Loading />;

  if (error && !user) {
    return (
      <div className="page account-page">
        <div
          className="card"
          style={{ padding: "1.5rem", textAlign: "center" }}
        >
          <p className="form-error">{error}</p>
          <button
            className="btn primary"
            onClick={() => window.location.reload()}
            style={{ marginTop: "1rem" }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const formatDateStr = (dateStr) => {
    if (!dateStr) return "\u2014";
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const ACTIVITY_LABELS = {
    sedentary: "Sedentary",
    light: "Light",
    moderate: "Moderate",
    active: "Very Active",
  };

  const currentGoal = profile?.goal || "lose_steady";

  return (
    <div className="page account-page">
      <div className="card account-card">
        <div className="account-avatar">
          {user?.email?.[0]?.toUpperCase() || "?"}
        </div>
        <h2 className="account-email">{user?.email}</h2>
        <div className="account-details">
          <div className="account-detail-row">
            <span className="account-detail-label">Member since</span>
            <span className="account-detail-value">
              {formatDateStr(user?.created_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Goal Switcher */}
      {profile && (
        <div className="card goal-card">
          <div className="goal-card-header">
            <h3>Your Plan</h3>
            <span className="goal-card-points">
              {profile.daily_points} pts/day
            </span>
          </div>
          <div className="goal-picker">
            {GOALS.map((g) => (
              <button
                key={g.key}
                type="button"
                className={`goal-option ${currentGoal === g.key ? "selected" : ""}`}
                onClick={() => handleGoalChange(g.key)}
                disabled={switchingGoal}
              >
                <span className="goal-option-label">{g.label}</span>
                <span className="goal-option-desc">{g.desc}</span>
              </button>
            ))}
          </div>
          <div className="goal-impact">
            {GOAL_DESCRIPTIONS[currentGoal]}
          </div>
        </div>
      )}

      {/* Points History Chart */}
      {profile && (
        <PointsChart dailyPoints={profile.daily_points} />
      )}

      {profile && !editing && (
        <div className="card profile-card">
          <div className="profile-header">
            <h3>Your Profile</h3>
            <button className="btn small" onClick={startEditing}>
              Edit
            </button>
          </div>
          <div className="profile-grid">
            <div className="profile-item">
              <span className="profile-item-label">Gender</span>
              <span className="profile-item-value">
                {profile.gender === "male" ? "Male" : "Female"}
              </span>
            </div>
            <div className="profile-item">
              <span className="profile-item-label">Age</span>
              <span className="profile-item-value">{profile.age}</span>
            </div>
            <div className="profile-item">
              <span className="profile-item-label">Height</span>
              <span className="profile-item-value">
                {profile.height_cm} cm
              </span>
            </div>
            <div className="profile-item">
              <span className="profile-item-label">Weight</span>
              <span className="profile-item-value">
                {profile.weight_kg} kg
              </span>
            </div>
            <div className="profile-item">
              <span className="profile-item-label">Activity</span>
              <span className="profile-item-value">
                {ACTIVITY_LABELS[profile.activity_level] ||
                  profile.activity_level}
              </span>
            </div>
            <div className="profile-item">
              <span className="profile-item-label">Daily Points</span>
              <span className="profile-item-value accent">
                {profile.daily_points}
              </span>
            </div>
          </div>
        </div>
      )}

      {editing && form && (
        <div className="card profile-card">
          <h3>Edit Profile</h3>
          <form onSubmit={handleSave}>
            <div className="form-row form-row-2">
              <div className="form-group">
                <label>Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) =>
                    setForm({ ...form, gender: e.target.value })
                  }
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
                  onChange={(e) =>
                    setForm({ ...form, age: e.target.value })
                  }
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
                <option value="sedentary">Sedentary</option>
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="active">Very Active</option>
              </select>
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="form-actions">
              <button type="submit" className="btn primary" disabled={saving}>
                {saving ? "Saving..." : "Save Profile"}
              </button>
              <button
                type="button"
                className="btn secondary"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Eating Window */}
      {profile && (
        <>
          <EatingWindowCard profile={profile} userId={user?.id} onUpdate={onProfileUpdate} />
          <DietaryRestrictionsCard profile={profile} userId={user?.id} onUpdate={onProfileUpdate} />
          <MacrosSettingsCard profile={profile} userId={user?.id} onUpdate={onProfileUpdate} />
        </>
      )}

      {stats && (
        <div className="card account-stats">
          <div className="account-stat">
            <span className="account-stat-value">{stats.totalLogs}</span>
            <span className="account-stat-label">Food Logs</span>
          </div>
          <div className="account-stat">
            <span className="account-stat-value">
              {profile?.daily_points || 0}
            </span>
            <span className="account-stat-label">Daily Points</span>
          </div>
        </div>
      )}

      {error && !editing && (
        <p className="form-error" style={{ margin: "0.75rem 0" }}>
          {error}
        </p>
      )}

      <div className="account-sign-out">
        <button
          className="btn danger"
          onClick={handleSignOut}
          disabled={signingOut}
        >
          {signingOut ? "Signing out..." : "Sign Out"}
        </button>
      </div>
    </div>
  );
}
