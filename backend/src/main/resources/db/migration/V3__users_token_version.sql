-- Per-user JWT invalidation: bump on logout; claim "tv" must match this column.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;
