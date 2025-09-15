CREATE TABLE IF NOT EXISTS follows (
    id SERIAL PRIMARY KEY,
    follower_id INTEGER NOT NULL,
    following_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id),
    CHECK(follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows (following_id);