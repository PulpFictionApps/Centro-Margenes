-- Push Notification Subscriptions
-- Run this in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint    text        NOT NULL,
  p256dh      text        NOT NULL,
  auth        text        NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
  ON push_subscriptions(user_id);

-- RLS: each user can only manage their own subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push subscriptions"
  ON push_subscriptions
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can read all subscriptions (needed for server-side sends)
CREATE POLICY "Service role read all push subscriptions"
  ON push_subscriptions
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role delete expired push subscriptions"
  ON push_subscriptions
  FOR DELETE
  TO service_role
  USING (true);
