import { MACRO_META, getMacroTargets, aggregateMacros } from "../lib/macros";

const MACRO_KEYS = ["protein", "carbs", "fat", "fiber"];

export default function MacrosBar({ logs, dailyPoints, physiqueGoal, onMacroClick }) {
  const targets = getMacroTargets(dailyPoints, physiqueGoal);
  const current = aggregateMacros(logs || []);

  if (!targets) return null;

  return (
    <div className="macros-bar">
      {MACRO_KEYS.map((key) => {
        const meta = MACRO_META[key];
        const cur = current[key];
        const tgt = targets[key];
        const pct = tgt > 0 ? Math.min(1, cur / tgt) : 0;

        return (
          <button
            key={key}
            className="macro-item"
            onClick={() => onMacroClick?.(key)}
            type="button"
          >
            <div className="macro-item-header">
              <span className="macro-item-icon">{meta.icon}</span>
              <span className="macro-item-label">{meta.label}</span>
            </div>
            <div className="macro-item-values">
              <span className="macro-item-current" style={{ color: meta.color }}>
                {cur}
              </span>
              <span className="macro-item-sep">/</span>
              <span className="macro-item-target">{tgt}</span>
            </div>
            <div className="macro-item-track">
              <div
                className="macro-item-fill"
                style={{
                  width: `${pct * 100}%`,
                  background: meta.color,
                }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
