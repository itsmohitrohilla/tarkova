-- The contact form's rate limit (api/contact.js): one row per accepted message, keyed by a keyed hash of the
-- sender's address (never the address itself). Rows older than a day are deleted by the form's own endpoint.
-- Run once:  psql "$SUPABASE_DB_URL" -f scripts/contact-rate.sql
create table if not exists public.contact_rate (
  id bigint generated always as identity primary key,
  key text not null,
  created_at timestamptz not null default now()
);
create index if not exists contact_rate_created_at on public.contact_rate (created_at);

-- Only the server's own database connection may touch it: row level security with no policies shuts out the
-- public API roles, and the revoke says the same thing a second way.
alter table public.contact_rate enable row level security;
revoke all on public.contact_rate from anon, authenticated;
