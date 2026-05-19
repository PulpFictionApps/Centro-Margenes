-- Add rich text content field to blog_posts
-- Run this in the Supabase SQL Editor

ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS content text;
