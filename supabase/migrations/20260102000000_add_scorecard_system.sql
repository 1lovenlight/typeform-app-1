-- Add scorecard system to existing practice_sessions table
-- Migration: 20260102000000_add_scorecard_system.sql

-- 1. Add scoring_status column to practice_sessions table
ALTER TABLE practice_sessions
ADD COLUMN IF NOT EXISTS scoring_status TEXT CHECK (scoring_status IN ('scoring', 'scored', 'failed'));

COMMENT ON COLUMN practice_sessions.scoring_status IS 'Status of AI scoring workflow: null=not scored, scoring=in progress, scored=complete, failed=error';

-- 2. Insert default scorecard rubric prompt into prompts table
INSERT INTO prompts (label, template, "order")
VALUES (
  'scorecard_rubric',
  'Evaluate this coaching conversation on the following criteria:

1. **Empathy & Active Listening** (0-25 points)
   - Did the coach acknowledge the client''s feelings and emotions?
   - Were reflective listening techniques used effectively?
   - Was there genuine understanding demonstrated?

2. **Powerful Questions** (0-25 points)
   - Were open-ended questions asked to promote exploration?
   - Did questions help the client gain new insights?
   - Was curiosity demonstrated through questioning?

3. **Goal Clarity & Action Planning** (0-25 points)
   - Was a clear goal or objective established?
   - Were specific action steps identified?
   - Was there commitment to next steps?

4. **Communication & Presence** (0-25 points)
   - Was language clear, professional, and appropriate?
   - Was appropriate pacing maintained throughout?
   - Was the coach fully present and engaged?

Provide an overall score (0-100) based on the sum of criterion scores, and constructive feedback highlighting strengths and areas for improvement.',
  999
)
ON CONFLICT (label) DO UPDATE
SET template = EXCLUDED.template;

-- 3. Create scorecards table
CREATE TABLE IF NOT EXISTS scorecards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
  
  overall_score NUMERIC(5,2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  criteria_scores JSONB NOT NULL DEFAULT '[]'::jsonb,
  feedback TEXT NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_session_scorecard UNIQUE (session_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_scorecards_user_id ON scorecards(user_id);
CREATE INDEX IF NOT EXISTS idx_scorecards_activity_id ON scorecards(activity_id);
CREATE INDEX IF NOT EXISTS idx_scorecards_session_id ON scorecards(session_id);
CREATE INDEX IF NOT EXISTS idx_scorecards_created_at ON scorecards(created_at DESC);

-- Add comments
COMMENT ON TABLE scorecards IS 'AI-generated evaluation scorecards for practice sessions';
COMMENT ON COLUMN scorecards.session_id IS 'Reference to the practice session being scored';
COMMENT ON COLUMN scorecards.overall_score IS 'Overall percentage score from 0-100';
COMMENT ON COLUMN scorecards.criteria_scores IS 'Array of criterion objects with name, score, max_score, and rationale';
COMMENT ON COLUMN scorecards.feedback IS 'Constructive feedback summary from AI evaluation';

-- 4. Enable Row Level Security
ALTER TABLE scorecards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scorecards
-- Users can view their own scorecards
CREATE POLICY "Users can view own scorecards"
  ON scorecards FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own scorecards (via workflow with service role)
CREATE POLICY "Service role can insert scorecards"
  ON scorecards FOR INSERT
  WITH CHECK (true);

-- Users can update their own scorecards
CREATE POLICY "Users can update own scorecards"
  ON scorecards FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own scorecards
CREATE POLICY "Users can delete own scorecards"
  ON scorecards FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Create view for scorecards with activity data
CREATE OR REPLACE VIEW scorecards_with_activity AS
SELECT
  sc.id,
  sc.session_id,
  sc.user_id,
  sc.activity_id,
  sc.overall_score,
  sc.criteria_scores,
  sc.feedback,
  sc.created_at,
  sc.updated_at,
  a.display_name AS activity_name,
  a.internal_name AS activity_internal_name,
  a.short_description AS activity_description,
  a.difficulty AS activity_difficulty,
  a.character_name AS character_name
FROM scorecards sc
LEFT JOIN activities a ON sc.activity_id = a.id;

-- Grant access to the view
GRANT SELECT ON scorecards_with_activity TO authenticated;

COMMENT ON VIEW scorecards_with_activity IS 'Scorecards joined with activity details for easier querying';

-- 6. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_scorecards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for updated_at
CREATE TRIGGER update_scorecards_updated_at_trigger
  BEFORE UPDATE ON scorecards
  FOR EACH ROW
  EXECUTE FUNCTION update_scorecards_updated_at();

