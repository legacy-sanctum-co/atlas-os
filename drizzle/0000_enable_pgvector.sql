-- Enable pgvector before any vector(N) column is created.
-- On Neon and local Postgres 17 this succeeds for the database owner.
CREATE EXTENSION IF NOT EXISTS vector;
