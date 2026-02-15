-- PointPal Migration (public schema with pp_ prefix)
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- Uses the public schema with pp_ prefixed tables to avoid conflicts.

-- Step 0: Drop old pointpal schema tables if they exist (from previous migration)
DROP TABLE IF EXISTS pointpal.food_logs CASCADE;
DROP TABLE IF EXISTS pointpal.profiles CASCADE;
DROP SCHEMA IF EXISTS pointpal;

-- 1. Profiles table (stores user body stats and calculated daily points)
CREATE TABLE IF NOT EXISTS pp_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  height_cm INTEGER NOT NULL,
  weight_kg NUMERIC(5,1) NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  activity_level TEXT NOT NULL DEFAULT 'moderate' CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active')),
  goal TEXT NOT NULL DEFAULT 'lose_steady' CHECK (goal IN ('lose_fast', 'lose_steady', 'maintain')),
  daily_points INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Food logs table (tracks what the user ate)
CREATE TABLE IF NOT EXISTS pp_food_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  servings NUMERIC(4,2) NOT NULL DEFAULT 1,
  points INTEGER NOT NULL,
  note TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Enable Row Level Security
ALTER TABLE pp_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pp_food_logs ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for pp_profiles (drop first so migration is re-runnable)
DROP POLICY IF EXISTS "Users can view own profile" ON pp_profiles;
CREATE POLICY "Users can view own profile" ON pp_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON pp_profiles;
CREATE POLICY "Users can insert own profile" ON pp_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON pp_profiles;
CREATE POLICY "Users can update own profile" ON pp_profiles
  FOR UPDATE USING (auth.uid() = id);

-- 5. RLS Policies for pp_food_logs (drop first so migration is re-runnable)
DROP POLICY IF EXISTS "Users can view own food logs" ON pp_food_logs;
CREATE POLICY "Users can view own food logs" ON pp_food_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own food logs" ON pp_food_logs;
CREATE POLICY "Users can insert own food logs" ON pp_food_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own food logs" ON pp_food_logs;
CREATE POLICY "Users can update own food logs" ON pp_food_logs
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own food logs" ON pp_food_logs;
CREATE POLICY "Users can delete own food logs" ON pp_food_logs
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Eating window columns on profiles
ALTER TABLE pp_profiles ADD COLUMN IF NOT EXISTS eating_window_start TIME;
ALTER TABLE pp_profiles ADD COLUMN IF NOT EXISTS eating_window_end TIME;

-- 7. Index for fast daily lookups
CREATE INDEX IF NOT EXISTS idx_pp_food_logs_user_date ON pp_food_logs (user_id, logged_at DESC);

-- 8. Macros tracking columns on profiles
ALTER TABLE pp_profiles ADD COLUMN IF NOT EXISTS macros_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE pp_profiles ADD COLUMN IF NOT EXISTS physique_goal TEXT DEFAULT NULL
  CHECK (physique_goal IN ('build_muscle', 'lose_fat', 'recomp', 'maintain'));

-- 9. Dietary restrictions (stored as JSON array text)
ALTER TABLE pp_profiles ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT DEFAULT '[]';
