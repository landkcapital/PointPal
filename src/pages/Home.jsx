import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getDayRange, getPointsGradient, getPointsGlow, getPointsColor } from "../lib/points";
import { getCategoryByKey, formatLogDetail, getUserNote } from "../lib/foods";
import LogFoodModal from "../components/LogFoodModal";
import EditLogModal from "../components/EditLogModal";
import CanIEatCard from "../components/CanIEatCard";
import MacrosBar from "../components/MacrosBar";
import PointsExplainPopup from "../components/PointsExplainPopup";
import SuggestMealsCard from "../components/SuggestMealsCard";
import Loading from "../components/Loading";

export default function Home({ profile, onFoodChange }) {
  const navigate = useNavigate();
  const [todayLogs, setTodayLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [explainType, setExplainType] = useState(null);
  const [mealPlan, setMealPlan] = useState(null);
  const [showPlanPrompt, setShowPlanPrompt] = useState(false);

  const fetchToday = useCallback(async () => {
    try {
      const { start, end } = getDayRange(new Date());

      const { data, error: fetchError } = await supabase
        .from("pp_food_logs")
        .select("*")
        .gte("logged_at", start.toISOString())
        .lte("logged_at", end.toISOString())
        .order("logged_at", { ascending: false });

      if (fetchError) throw fetchError;
      setTodayLogs(data || []);
      setError(null);
      onFoodChange?.();
    } catch (err) {
      setError(err.message || "Failed to load today's data");
    } finally {
      setLoading(false);
    }
  }, [onFoodChange]);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  async function handleDelete(logId) {
    if (!window.confirm("Delete this entry?")) return;
    await supabase.from("pp_food_logs").delete().eq("id", logId);
    fetchToday();
  }

  if (loading) return <Loading />;

  const totalUsed = todayLogs.reduce((sum, log) => sum + log.points, 0);
  const dailyPoints = profile?.daily_points || 40;
  const remaining = dailyPoints - totalUsed;
  const pct = dailyPoints > 0 ? Math.max(0, remaining / dailyPoints) : 1;

  const gradient = getPointsGradient(remaining, dailyPoints);
  const glow = getPointsGlow(remaining, dailyPoints);
  const color = getPointsColor(remaining, dailyPoints);

  return (
    <div className="page home-page">
      {error && (
        <div className="card" style={{ padding: "1.5rem", textAlign: "center", marginBottom: "1.25rem" }}>
          <p className="form-error">{error}</p>
          <button className="btn primary" onClick={fetchToday} style={{ marginTop: "1rem" }}>
            Retry
          </button>
        </div>
      )}

      <button
        className="spend-btn"
        onClick={() => {
          if (mealPlan && mealPlan.length > 0) {
            setShowPlanPrompt(true);
          } else {
            setShowModal(true);
          }
        }}
        style={{
          background: gradient,
          boxShadow: `0 4px 20px ${glow}, 0 8px 32px ${glow}`,
        }}
      >
        <span className="spend-btn-icon-ring">
          <span className="spend-btn-icon">+</span>
        </span>
        <span className="spend-btn-text">I Ate</span>
      </button>

      <div
        className="points-hero"
        style={{
          background: gradient,
          boxShadow: `0 4px 20px ${glow}`,
          cursor: "pointer",
        }}
        onClick={() => setExplainType("daily")}
      >
        <div className="points-hero-numbers">
          <span className="points-hero-remaining">{remaining}</span>
          <span className="points-hero-sep">/</span>
          <span className="points-hero-total">{dailyPoints}</span>
        </div>
        <span className="points-hero-label">points remaining</span>
        <div className="points-hero-track">
          <div
            className="points-hero-fill"
            style={{ width: `${pct * 100}%` }}
          />
        </div>
      </div>

      {profile?.macros_enabled && profile?.physique_goal && (
        <MacrosBar
          logs={todayLogs}
          dailyPoints={dailyPoints}
          physiqueGoal={profile.physique_goal}
          onMacroClick={(key) => setExplainType(key)}
        />
      )}

      <CanIEatCard remaining={remaining} dailyPoints={dailyPoints} />

      <SuggestMealsCard remaining={remaining} onPlanSet={setMealPlan} profile={profile} />

      <h3 className="section-title">Today's Log</h3>
      {todayLogs.length === 0 ? (
        <div className="empty-state card">
          <p>Nothing logged yet today. Tap "I Ate" to get started!</p>
        </div>
      ) : (
        <div className="food-log-list">
          {todayLogs.map((log) => {
            const cat = getCategoryByKey(log.category);
            return (
              <div key={log.id} className="card food-log-item">
                <div className="food-log-left">
                  <span className="food-log-emoji">{cat?.emoji || "?"}</span>
                  <div className="food-log-info">
                    <span className="food-log-name">
                      {cat?.name || log.category}
                    </span>
                    <span className="food-log-detail">
                      {formatLogDetail(log)}
                    </span>
                    {getUserNote(log) && (
                      <span className="food-log-note">{getUserNote(log)}</span>
                    )}
                  </div>
                </div>
                <div className="food-log-right">
                  <span className="food-log-points">-{log.points} pts</span>
                  <span className="food-log-time">
                    {new Date(log.logged_at).toLocaleTimeString(undefined, {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                  <div className="food-log-actions">
                    <button
                      className="log-action-btn"
                      onClick={() => setEditingLog(log)}
                      title="Edit"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button
                      className="log-action-btn log-action-delete"
                      onClick={() => handleDelete(log.id)}
                      title="Delete"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showPlanPrompt && (
        <div className="modal-overlay" onClick={() => setShowPlanPrompt(false)}>
          <div className="modal card plan-prompt" onClick={(e) => e.stopPropagation()}>
            <h3>Follow your plan?</h3>
            <p className="plan-prompt-desc">You have a meal plan set. Would you like to follow it or log your own food?</p>
            <div className="plan-prompt-actions">
              <button
                className="btn primary"
                onClick={() => {
                  setShowPlanPrompt(false);
                  setShowModal(true);
                }}
              >
                Log My Own
              </button>
              <button
                className="btn secondary"
                onClick={() => {
                  setShowPlanPrompt(false);
                  setMealPlan(null);
                  setShowModal(true);
                }}
              >
                Clear Plan & Log
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <LogFoodModal
          onClose={() => setShowModal(false)}
          onAdded={fetchToday}
          profile={profile}
        />
      )}

      {editingLog && (
        <EditLogModal
          log={editingLog}
          onClose={() => setEditingLog(null)}
          onSaved={fetchToday}
          profile={profile}
        />
      )}

      {explainType && (
        <PointsExplainPopup
          type={explainType}
          profile={profile}
          onClose={() => setExplainType(null)}
          onNavigate={(path) => navigate(path)}
        />
      )}
    </div>
  );
}
