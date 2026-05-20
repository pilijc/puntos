const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://fszbregjequrutbkwgar.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzemJyZWdqZXF1cnV0Ymt3Z2FyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjM3NDQ2NiwiZXhwIjoyMDkxOTUwNDY2fQ.lm9_FuZ89vR-mG3G2ebeiolzreQoW-1HRZFha0624Qw';

const supabase = createClient(supabaseUrl, supabaseKey);

const USER_STREAK_SELECT = `
  id, user_id, store_id, streak_days, last_activity_date,
  total_earned_days, points_earned, completion_bonus_awarded,
  completed_at, status, store_streak_id,
  store_streaks (
    id, title, streak_length, max_days_cap,
    fixed_points_per_day, points_mode, starting_points, increment_value,
    completion_bonus_points, reward_description, status, start_at, end_date
  ),
  streak_events (
    earned_date
  ),
  stores (
    name, logo, address, status, is_active, radius, location
  )
`;

async function main() {
  console.log('Fetching a random user_id and store_id from user_streaks...');
  const { data: streaks, error: fetchErr } = await supabase
    .from('user_streaks')
    .select('user_id, store_id')
    .limit(1);
    
  if (fetchErr || !streaks || streaks.length === 0) {
    console.error('Error or no streaks found:', fetchErr);
    return;
  }
  
  const userId = streaks[0].user_id;
  const storeId = streaks[0].store_id;
  console.log(`Testing query for userId=${userId}, storeId=${storeId}...`);

  const startTime = Date.now();

  const [
    { data: streakRows, error: streakError },
    { data: store, error: storeError },
    { data: featureRow, error: featureError },
    { data: programRow, error: programError },
  ] = await Promise.all([
    supabase
      .from("user_streaks")
      .select(USER_STREAK_SELECT)
      .eq("user_id", userId)
      .eq("store_id", storeId)
      .order("updated_at", { ascending: false })
      .order("earned_date", { foreignTable: "streak_events", ascending: false })
      .limit(90, { foreignTable: "streak_events" }),
    supabase.from("stores").select("name, logo, address, status, is_active").eq("id", storeId).maybeSingle(),
    supabase.from("store_feature").select("streak_enabled").eq("store_id", storeId).maybeSingle(),
    supabase.from("store_streaks").select("id, title, streak_length, end_date").eq("store_id", storeId).eq("status", "active").maybeSingle()
  ]);

  const endTime = Date.now();

  if (streakError) {
    console.error('Query failed:', streakError);
  } else {
    console.log(`Query completed successfully in ${endTime - startTime}ms!`);
  }
}

main().catch(console.error);
