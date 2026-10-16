-- Cambios aditivos: PostgreSQL conserva sus relaciones y puede representar cada dato del Firestore v9.
ALTER TABLE review_likes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
ALTER TABLE review_likes ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE comment_likes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
ALTER TABLE comment_likes ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE review_bookmarks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
ALTER TABLE review_bookmarks ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- Las copias que el v9 sí conserva tienen columnas propias para no sustituirlas por valores diferentes.
ALTER TABLE comments ADD COLUMN IF NOT EXISTS user_username TEXT;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS user_profile_image_url TEXT;
ALTER TABLE article_stores ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE article_stores ADD COLUMN IF NOT EXISTS website_url TEXT;

CREATE TABLE IF NOT EXISTS product_requests (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  product_name TEXT NOT NULL,
  image_url TEXT,
  category TEXT,
  brand TEXT,
  release_date TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL
);
