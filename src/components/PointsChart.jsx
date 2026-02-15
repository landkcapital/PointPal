import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

const RANGES = [
  { key: "1W", label: "1W", days: 7 },
  { key: "1M", label: "1M", days: 30 },
  { key: "2M", label: "2M", days: 60 },
  { key: "6M", label: "6M", days: 180 },
  { key: "1Y", label: "1Y", days: 365 },
];

export default function PointsChart({ dailyPoints }) {
  const [range, setRange] = useState("1W");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const rangeDays = RANGES.find((r) => r.key === range)?.days || 7;

  const fetchData = useCallback(async () => {
    setLoading(true);
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - rangeDays + 1);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const { data: logs } = await supabase
      .from("pp_food_logs")
      .select("points, logged_at")
      .gte("logged_at", start.toISOString())
      .lte("logged_at", end.toISOString())
      .order("logged_at", { ascending: true });

    // Build a map of every day in the range
    const dayMap = {};
    for (
      let d = new Date(start);
      d <= end;
      d.setDate(d.getDate() + 1)
    ) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      dayMap[key] = { date: key, total: 0 };
    }

    (logs || []).forEach((log) => {
      const dt = new Date(log.logged_at);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
      if (dayMap[key]) dayMap[key].total += log.points;
    });

    setData(Object.values(dayMap));
    setLoading(false);
  }, [rangeDays]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Chart layout
  const W = 600;
  const H = 200;
  const PAD = { top: 20, right: 30, bottom: 30, left: 36 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const maxVal =
    Math.max(dailyPoints, ...data.map((d) => d.total)) * 1.15 ||
    dailyPoints * 1.2;

  const barGap = data.length > 60 ? 0.5 : data.length > 30 ? 1 : 2;
  const totalGaps = barGap * (data.length - 1);
  const barW =
    data.length > 0
      ? Math.max(1.5, (chartW - totalGaps) / data.length)
      : 0;

  const yScale = (val) => chartH - (val / maxVal) * chartH;
  const limitY = yScale(dailyPoints);

  // Show fewer x-axis labels for longer ranges
  const labelEvery =
    data.length <= 7
      ? 1
      : data.length <= 31
        ? 7
        : data.length <= 60
          ? 14
          : 30;

  // Compute average
  const daysWithData = data.filter((d) => d.total > 0);
  const avg =
    daysWithData.length > 0
      ? Math.round(
          daysWithData.reduce((s, d) => s + d.total, 0) / daysWithData.length
        )
      : 0;
  const overDays = data.filter((d) => d.total > dailyPoints).length;

  return (
    <div className="card points-chart-card">
      <div className="chart-header">
        <h3>Points History</h3>
        <div className="chart-range-btns">
          {RANGES.map((r) => (
            <button
              key={r.key}
              className={`chart-range-btn ${range === r.key ? "active" : ""}`}
              onClick={() => setRange(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="chart-empty">Loading...</div>
      ) : daysWithData.length === 0 ? (
        <div className="chart-empty">
          No data yet. Start logging food to see your history!
        </div>
      ) : (
        <>
          <svg viewBox={`0 0 ${W} ${H}`} className="points-chart-svg">
            <g transform={`translate(${PAD.left}, ${PAD.top})`}>
              {/* Horizontal grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((p) => {
                const y = yScale(maxVal * p);
                return (
                  <g key={p}>
                    <line
                      x1={0}
                      y1={y}
                      x2={chartW}
                      y2={y}
                      stroke="var(--border)"
                      strokeWidth="0.5"
                    />
                    <text
                      x={-6}
                      y={y + 3.5}
                      textAnchor="end"
                      fontSize="9"
                      fill="var(--text-muted)"
                    >
                      {Math.round(maxVal * p)}
                    </text>
                  </g>
                );
              })}

              {/* Daily limit dashed line */}
              <line
                x1={0}
                y1={limitY}
                x2={chartW}
                y2={limitY}
                stroke="var(--primary)"
                strokeWidth="1.5"
                strokeDasharray="6 3"
                opacity="0.5"
              />
              <text
                x={chartW + 4}
                y={limitY + 3}
                fontSize="8"
                fill="var(--primary)"
                fontWeight="600"
              >
                Limit
              </text>

              {/* Bars */}
              {data.map((d, i) => {
                const x = i * (barW + barGap);
                const h = (d.total / maxVal) * chartH;
                const over = d.total > dailyPoints;
                return (
                  <g key={d.date}>
                    <rect
                      x={x}
                      y={chartH - h}
                      width={barW}
                      height={Math.max(0, h)}
                      rx={Math.min(2, barW / 3)}
                      fill={over ? "hsl(0, 72%, 50%)" : "var(--primary)"}
                      opacity={d.total === 0 ? 0.1 : 0.75}
                    />
                    {i % labelEvery === 0 && (
                      <text
                        x={x + barW / 2}
                        y={chartH + 14}
                        textAnchor="middle"
                        fontSize="8"
                        fill="var(--text-muted)"
                      >
                        {new Date(d.date + "T12:00:00").toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric" }
                        )}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          <div className="chart-stats">
            <div className="chart-stat">
              <span className="chart-stat-value">{avg}</span>
              <span className="chart-stat-label">Avg pts/day</span>
            </div>
            <div className="chart-stat">
              <span className="chart-stat-value">{daysWithData.length}</span>
              <span className="chart-stat-label">Days logged</span>
            </div>
            <div className="chart-stat">
              <span
                className="chart-stat-value"
                style={overDays > 0 ? { color: "hsl(0, 72%, 50%)" } : {}}
              >
                {overDays}
              </span>
              <span className="chart-stat-label">Over limit</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
