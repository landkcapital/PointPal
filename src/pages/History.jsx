import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import {
  getDayRange,
  formatDate,
  isToday,
  getPointsColor,
  getPointsGradient,
} from "../lib/points";
import { getCategoryByKey, formatLogDetail, getUserNote } from "../lib/foods";
import EditLogModal from "../components/EditLogModal";
import Loading from "../components/Loading";

export default function History({ profile, onFoodChange }) {
  const [refDate, setRefDate] = useState(new Date());
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingLog, setEditingLog] = useState(null);

  const dailyPoints = profile?.daily_points || 40;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { start: s, end: e } = getDayRange(refDate);

      const { data, error: fetchError } = await supabase
        .from("pp_food_logs")
        .select("*")
        .gte("logged_at", s.toISOString())
        .lte("logged_at", e.toISOString())
        .order("logged_at", { ascending: false });

      if (fetchError) throw fetchError;
      setLogs(data || []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [refDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handlePrev() {
    const d = new Date(refDate);
    d.setDate(d.getDate() - 1);
    setRefDate(d);
  }

  function handleNext() {
    const d = new Date(refDate);
    d.setDate(d.getDate() + 1);
    setRefDate(d);
  }

  async function handleDelete(logId) {
    if (!window.confirm("Delete this entry?")) return;
    await supabase.from("pp_food_logs").delete().eq("id", logId);
    fetchData();
    onFoodChange?.();
  }

  const totalUsed = logs.reduce((sum, log) => sum + log.points, 0);
  const remaining = dailyPoints - totalUsed;
  const color = getPointsColor(remaining, dailyPoints);
  const gradient = getPointsGradient(remaining, dailyPoints);
  const pct = dailyPoints > 0 ? Math.max(0, remaining / dailyPoints) : 1;

  const isFutureDay = (() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const ref = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
    return ref > today;
  })();

  return (
    <div className="page history-page">
      <div className="card history-controls">
        <div className="history-nav">
          <button className="btn small" onClick={handlePrev}>
            &larr;
          </button>
          <span className="history-range-label">
            {isToday(refDate) ? "Today" : formatDate(refDate)}
          </span>
          <button
            className="btn small"
            onClick={handleNext}
            disabled={isFutureDay}
          >
            &rarr;
          </button>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <div
          className="card"
          style={{ padding: "1.5rem", textAlign: "center" }}
        >
          <p className="form-error">{error}</p>
          <button
            className="btn primary"
            onClick={fetchData}
            style={{ marginTop: "1rem" }}
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <div
            className="card history-summary"
            style={{ borderTop: `3px solid ${color}` }}
          >
            <div className="points-bar-track" style={{ marginBottom: "1rem" }}>
              <div
                className="points-bar-fill"
                style={{
                  width: `${pct * 100}%`,
                  background: gradient,
                }}
              />
            </div>
            <div className="summary-bar summary-bar-3">
              <div className="summary-item">
                <span className="summary-label">Used</span>
                <span className="summary-value">{totalUsed}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Daily Points</span>
                <span className="summary-value">{dailyPoints}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Remaining</span>
                <span
                  className="summary-value"
                  style={{ color }}
                >
                  {remaining}
                </span>
              </div>
            </div>
          </div>

          <h3 className="section-title">Food Log</h3>
          {logs.length === 0 ? (
            <div className="empty-state card">
              <p>
                {isToday(refDate)
                  ? "Nothing logged yet today."
                  : "No food logged this day."}
              </p>
            </div>
          ) : (
            <div className="food-log-list">
              {logs.map((log) => {
                const cat = getCategoryByKey(log.category);
                return (
                  <div key={log.id} className="card food-log-item">
                    <div className="food-log-left">
                      <span className="food-log-emoji">
                        {cat?.emoji || "?"}
                      </span>
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
                      <span className="food-log-points">
                        -{log.points} pts
                      </span>
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
        </>
      )}

      {editingLog && (
        <EditLogModal
          log={editingLog}
          onClose={() => setEditingLog(null)}
          onSaved={() => { fetchData(); onFoodChange?.(); }}
          profile={profile}
        />
      )}
    </div>
  );
}
