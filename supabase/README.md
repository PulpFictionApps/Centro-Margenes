# Supabase SQL Files

These SQL files should be kept in the repository.

Why keep them:
- They act as migration history and setup documentation.
- They make production/staging recovery reproducible.
- They document schema and policy changes over time.

Practical guidance:
- `schema.sql` is the base schema.
- Other `*.sql` files are incremental migrations or one-off setup scripts.
- Run only the migration(s) you need in Supabase SQL Editor.

Do not delete SQL files unless you are sure they are fully obsolete and merged into a newer canonical migration flow.
