import { useState } from "react";
import { supabase } from "../lib/supabase";
import { getCategoryByKey } from "../lib/foods";

export default function EditLogModal({ log, onClose, onSaved }) {
  const [points, setPoints] = useState(log.points);
  const [note, setNote] = useState(log.note || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const cat = getCategoryByKey(log.category);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("pp_food_logs")
      .update({ points: Number(points), note: note || null })
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

        <div className="edit-log-preview">
          <span className="food-log-emoji">{cat?.emoji || "?"}</span>
          <span className="edit-log-name">{cat?.name || log.category}</span>
        </div>

        <form onSubmit={handleSave}>
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
          <div className="form-group">
            <label>Note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note..."
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
