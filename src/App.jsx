import { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getSession, onAuthStateChange } from "./lib/auth";
import { supabase } from "./lib/supabase";
import { getDayRange, applyPointsTheme } from "./lib/points";
import Header from "./components/Header";
import ErrorBoundary from "./components/ErrorBoundary";
import Loading from "./components/Loading";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import History from "./pages/History";
import Account from "./pages/Account";
import "./styles.css";

function ProtectedRoute({ session, ready, profile, profileLoaded, children }) {
  if (!ready || !profileLoaded) return <Loading />;
  if (!session) return <Navigate to="/login" replace />;
  if (!profile) return <Navigate to="/onboarding" replace />;
  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
}

function OnboardingRoute({ session, ready, profile, profileLoaded, children }) {
  if (!ready || !profileLoaded) return <Loading />;
  if (!session) return <Navigate to="/login" replace />;
  if (profile) return <Navigate to="/" replace />;
  return children;
}

function PublicRoute({ session, ready, children }) {
  if (!ready) return <Loading />;
  if (session) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [todayUsed, setTodayUsed] = useState(0);

  const fetchTodayUsed = useCallback(async () => {
    const { start, end } = getDayRange(new Date());
    const { data } = await supabase
      .from("pp_food_logs")
      .select("points")
      .gte("logged_at", start.toISOString())
      .lte("logged_at", end.toISOString());
    const total = (data || []).reduce((sum, r) => sum + r.points, 0);
    setTodayUsed(total);
  }, []);

  // Apply dynamic color theme whenever points change
  useEffect(() => {
    if (profile) {
      const dailyPoints = profile.daily_points || 40;
      const remaining = dailyPoints - todayUsed;
      applyPointsTheme(remaining, dailyPoints);
    }
  }, [profile, todayUsed]);

  const fetchProfile = useCallback(async (userId) => {
    const { data } = await supabase
      .from("pp_profiles")
      .select("*")
      .eq("id", userId)
      .limit(1);
    setProfile(data?.[0] || null);
    setProfileLoaded(true);
  }, []);

  useEffect(() => {
    let ignore = false;

    getSession().then((s) => {
      if (!ignore) {
        setSession(s);
        setReady(true);
        if (s?.user?.id) {
          fetchProfile(s.user.id);
          fetchTodayUsed();
        } else {
          setProfileLoaded(true);
        }
      }
    });

    const subscription = onAuthStateChange((s) => {
      if (!ignore) {
        setSession(s);
        setReady(true);
        if (s?.user?.id) {
          fetchProfile(s.user.id);
          fetchTodayUsed();
        } else {
          setProfile(null);
          setProfileLoaded(true);
        }
      }
    });

    return () => {
      ignore = true;
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  const refreshProfile = useCallback(() => {
    if (session?.user?.id) {
      return fetchProfile(session.user.id);
    }
  }, [session, fetchProfile]);

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute session={session} ready={ready}>
                <Login onAuth={setSession} />
              </PublicRoute>
            }
          />
          <Route
            path="/onboarding"
            element={
              <OnboardingRoute
                session={session}
                ready={ready}
                profile={profile}
                profileLoaded={profileLoaded}
              >
                <Onboarding
                  session={session}
                  onComplete={refreshProfile}
                />
              </OnboardingRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute
                session={session}
                ready={ready}
                profile={profile}
                profileLoaded={profileLoaded}
              >
                <Home profile={profile} onFoodChange={fetchTodayUsed} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute
                session={session}
                ready={ready}
                profile={profile}
                profileLoaded={profileLoaded}
              >
                <History profile={profile} onFoodChange={fetchTodayUsed} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute
                session={session}
                ready={ready}
                profile={profile}
                profileLoaded={profileLoaded}
              >
                <Account profile={profile} onProfileUpdate={refreshProfile} />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
