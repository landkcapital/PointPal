import { useEffect } from "react";
import { getGoalByKey } from "../lib/points";
import { PHYSIQUE_GOALS, getMacroTargets, MACRO_META } from "../lib/macros";

const ACTIVITY_LABELS = {
  sedentary: "Sedentary",
  light: "Light",
  moderate: "Moderate",
  active: "Very Active",
};

export default function PointsExplainPopup({ type, profile, onClose, onNavigate }) {
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

  const physiqueGoal = PHYSIQUE_GOALS.find((g) => g.key === profile?.physique_goal);
  const macroTargets = getMacroTargets(profile?.daily_points || 0, profile?.physique_goal);

  const explanations = {
    daily: {
      title: "Daily Points",
      direction: "Counts down from your daily budget",
      what: "Your total calorie budget for the day, expressed as points. Each point is roughly 50 calories. Points decrease as you log food.",
      why: `Based on your profile: ${profile?.gender === "male" ? "Male" : "Female"}, age ${profile?.age}, ${profile?.height_cm}cm, ${profile?.weight_kg}kg, ${ACTIVITY_LABELS[profile?.activity_level] || profile?.activity_level} activity, ${getGoalByKey(profile?.goal).label} plan.`,
      formula: "BMR \u00D7 Activity \u00D7 Goal \u00F7 50",
      navigateLabel: "Edit Profile & Goal",
    },
    protein: {
      title: "Protein Points",
      direction: "Counts up toward your target",
      what: "Tracks your protein intake. Higher protein supports muscle maintenance and satiety. Lean meats, fish, eggs, and tofu are protein-rich.",
      why: physiqueGoal
        ? `Target: ${macroTargets?.protein || 0} pts (${Math.round((physiqueGoal.split.protein) * 100)}% of ${profile?.daily_points} daily pts) \u2014 ${physiqueGoal.label} goal.`
        : "Enable macro tracking in settings to see your target.",
      navigateLabel: "Change Physique Goal",
    },
    carbs: {
      title: "Carbs Points",
      direction: "Counts up toward your target",
      what: "Tracks your carbohydrate intake. Carbs are your body\u2019s primary energy source. Grains, fruits, and starchy foods are carb-rich.",
      why: physiqueGoal
        ? `Target: ${macroTargets?.carbs || 0} pts (${Math.round((physiqueGoal.split.carbs) * 100)}% of ${profile?.daily_points} daily pts) \u2014 ${physiqueGoal.label} goal.`
        : "Enable macro tracking in settings to see your target.",
      navigateLabel: "Change Physique Goal",
    },
    fat: {
      title: "Fat Points",
      direction: "Counts up toward your target",
      what: "Tracks your fat intake. Healthy fats support hormones and nutrient absorption. Oils, nuts, avocado, and fatty fish are fat-rich.",
      why: physiqueGoal
        ? `Target: ${macroTargets?.fat || 0} pts (${Math.round((physiqueGoal.split.fat) * 100)}% of ${profile?.daily_points} daily pts) \u2014 ${physiqueGoal.label} goal.`
        : "Enable macro tracking in settings to see your target.",
      navigateLabel: "Change Physique Goal",
    },
    fiber: {
      title: "Fiber Points",
      direction: "Counts up toward your target",
      what: "Tracks your fiber intake. Fiber aids digestion and keeps you feeling full. Vegetables, fruits, and whole grains are fiber-rich.",
      why: physiqueGoal
        ? `Target: ${macroTargets?.fiber || 0} pts (${Math.round((physiqueGoal.split.fiber) * 100)}% of ${profile?.daily_points} daily pts) \u2014 ${physiqueGoal.label} goal.`
        : "Enable macro tracking in settings to see your target.",
      navigateLabel: "Change Physique Goal",
    },
  };

  const info = explanations[type];
  if (!info) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card explain-popup" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{info.title}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="explain-content">
          <div className="explain-badge">
            {info.direction}
          </div>

          <div className="explain-section">
            <h4>What it tracks</h4>
            <p>{info.what}</p>
          </div>

          <div className="explain-section">
            <h4>Why this number</h4>
            <p>{info.why}</p>
          </div>

          {info.formula && (
            <div className="explain-formula">
              {info.formula}
            </div>
          )}
        </div>

        <button
          className="btn primary"
          onClick={() => {
            onNavigate("/account");
            onClose();
          }}
        >
          {info.navigateLabel}
        </button>
      </div>
    </div>
  );
}
