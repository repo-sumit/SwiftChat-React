-- SwiftChat RAG schema (Supabase / Postgres + pgvector).
-- Run once in the Supabase SQL editor before ingesting.

create extension if not exists vector;

-- ── Knowledge chunks table ─────────────────────────────────────────────────
create table if not exists knowledge_chunks (
  id          uuid primary key default gen_random_uuid(),
  content     text not null,
  source      text not null,            -- e.g. "namo_saraswati_policy.md"
  section     text,                     -- e.g. "Eligibility"
  module      text,                     -- one of: attendance | xamta | class_dashboard | digivritti | reports | parent_alerts | null
  role_scope  text[] default '{}',      -- empty = all roles
  embedding   vector(768),              -- text-embedding-004 = 768 dims
  created_at  timestamptz default now()
);

-- ── Indexes ────────────────────────────────────────────────────────────────
-- Cosine-similarity ANN index. Re-run `analyze knowledge_chunks;` after big
-- ingests to keep ivfflat lists balanced.
create index if not exists knowledge_chunks_embedding_idx
  on knowledge_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create index if not exists knowledge_chunks_source_idx on knowledge_chunks(source);
create index if not exists knowledge_chunks_module_idx on knowledge_chunks(module);

-- ── Retrieval RPC ──────────────────────────────────────────────────────────
-- Cosine similarity = 1 - <=> distance. Higher is more similar.
-- role_filter: pass the caller's role; chunks with empty role_scope are
-- considered global. module_filter: optional narrowing to one module.
create or replace function match_knowledge_chunks(
  query_embedding vector(768),
  match_count     int default 5,
  role_filter     text default null,
  module_filter   text default null
)
returns table (
  id         uuid,
  content    text,
  source     text,
  section    text,
  module     text,
  role_scope text[],
  similarity float
)
language sql stable
as $$
  select
    kc.id,
    kc.content,
    kc.source,
    kc.section,
    kc.module,
    kc.role_scope,
    1 - (kc.embedding <=> query_embedding) as similarity
  from knowledge_chunks kc
  where
    (role_filter   is null or kc.role_scope = '{}'::text[] or role_filter = any(kc.role_scope))
    and (module_filter is null or kc.module = module_filter)
  order by kc.embedding <=> query_embedding
  limit match_count;
$$;
