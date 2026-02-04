"use server";

import { createClient } from "@/lib/supabase/server";

export interface DailyPracticeData {
  date: string;
  minutes: number;
}

export interface PracticeStats {
  totalMinutes: number;
  sessionCount: number;
  avgMinutesPerSession: number;
  lastSessionDate: string | null;
  thisWeekMinutes: number;
  thisMonthMinutes: number;
  dailyData: DailyPracticeData[];
}

/**
 * Get practice session statistics for a user
 * Only counts sessions where did_coach_participate = true
 */
export async function getPracticeStats(
  userId: string
): Promise<PracticeStats> {
  try {
    const supabase = await createClient();

    // Fetch all practice sessions where coach participated
    const { data: sessions, error } = await supabase
      .from("practice_sessions")
      .select("call_duration_secs, created_at")
      .eq("user_id", userId)
      .eq("did_coach_participate", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching practice stats:", error);
      throw error;
    }

    // Calculate date boundaries
    const now = new Date();

    if (!sessions || sessions.length === 0) {
      // Return empty data with all 7 days at 0
      const dailyData: DailyPracticeData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        dailyData.push({
          date: date.toISOString().split('T')[0],
          minutes: 0,
        });
      }
      
      return {
        totalMinutes: 0,
        sessionCount: 0,
        avgMinutesPerSession: 0,
        lastSessionDate: null,
        thisWeekMinutes: 0,
        thisMonthMinutes: 0,
        dailyData,
      };
    }
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Initialize daily data for last 7 days
    const dailyMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      dailyMap.set(dateKey, 0);
    }

    // Calculate statistics
    let totalSeconds = 0;
    let thisWeekSeconds = 0;
    let thisMonthSeconds = 0;

    sessions.forEach((session) => {
      const duration = session.call_duration_secs || 0;
      totalSeconds += duration;

      const sessionDate = new Date(session.created_at);
      const dateKey = sessionDate.toISOString().split('T')[0];
      
      // Add to daily data if within last 7 days
      if (dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + duration);
      }
      
      if (sessionDate >= oneWeekAgo) {
        thisWeekSeconds += duration;
      }
      
      if (sessionDate >= monthStart) {
        thisMonthSeconds += duration;
      }
    });

    // Convert daily map to array
    const dailyData: DailyPracticeData[] = Array.from(dailyMap.entries()).map(
      ([date, seconds]) => ({
        date,
        minutes: Math.floor(seconds / 60),
      })
    );

    return {
      totalMinutes: Math.floor(totalSeconds / 60),
      sessionCount: sessions.length,
      avgMinutesPerSession:
        sessions.length > 0 ? Math.floor(totalSeconds / sessions.length / 60) : 0,
      lastSessionDate: sessions[0].created_at,
      thisWeekMinutes: Math.floor(thisWeekSeconds / 60),
      thisMonthMinutes: Math.floor(thisMonthSeconds / 60),
      dailyData,
    };
  } catch (error) {
    console.error("Error calculating practice stats:", error);
    const now = new Date();
    const dailyData: DailyPracticeData[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      dailyData.push({
        date: date.toISOString().split('T')[0],
        minutes: 0,
      });
    }
    return {
      totalMinutes: 0,
      sessionCount: 0,
      avgMinutesPerSession: 0,
      lastSessionDate: null,
      thisWeekMinutes: 0,
      thisMonthMinutes: 0,
      dailyData,
    };
  }
}

