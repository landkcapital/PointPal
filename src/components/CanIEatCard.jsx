import { useState } from "react";
import { FOOD_CATEGORIES, GROUP_COLORS } from "../lib/foods";

export default function CanIEatCard({ remaining, dailyPoints }) {
  const [selectedKey, setSelectedKey] = useState(FOOD_CATEGORIES[0]?.key || "");
  const [servings, setServings] = useState("");

  const selectedCat = FOOD_CATEGORIES.find((c) => c.key === selectedKey);
  const amount = parseInt(servings) || 0;
  const cost = selectedCat ? selectedCat.points * amount : 0;
  const newRemaining = remaining - cost;

  return (
    <div className="card afford-card">
      <h3>Can I Eat This?</h3>
      <div className="afford-form">
        <div className="form-group">
          <label>Food</label>
          <select
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
          >
            {FOOD_CATEGORIES.map((cat) => (
              <option key={cat.key} value={cat.key}>
                {cat.emoji} {cat.name} ({cat.points === 0 ? "Free" : `${cat.points} pts/palm`})
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Palm Servings</label>
          <input
            type="number"
            min="1"
            max="10"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            placeholder="1"
          />
        </div>
      </div>
      {amount > 0 && (
        <div className="afford-results">
          <div className="afford-row">
            <span>This would cost:</span>
            <span style={{ fontWeight: 800, color: GROUP_COLORS[selectedCat?.group] }}>
              {cost === 0 ? "Free!" : `${cost} points`}
            </span>
          </div>
          <div className="afford-row">
            <span>Points remaining after:</span>
            <span className={newRemaining >= 0 ? "positive" : "negative"}>
              {newRemaining} pts
            </span>
          </div>
          {newRemaining < 0 && (
            <div className="eat-warning">
              This would put you {Math.abs(newRemaining)} points over your daily limit!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
