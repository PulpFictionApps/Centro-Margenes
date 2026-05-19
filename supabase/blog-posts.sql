-- Blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  subtitle    text,
  image       text,
  paragraphs  jsonb NOT NULL DEFAULT '[]',
  published   boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_blog_posts_updated_at();

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Public can read published posts
CREATE POLICY "blog_posts_public_read"
  ON blog_posts FOR SELECT
  USING (published = true);

-- Admins can do everything (service role bypasses RLS anyway)
CREATE POLICY "blog_posts_admin_all"
  ON blog_posts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM therapists
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );
