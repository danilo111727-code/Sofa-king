-- Executar somente no projeto lcmtaxesbctibpyggbuj.
create schema if not exists preview_private;
create table if not exists preview_private.product_drafts (
 product_id text primary key, product_data jsonb not null check(jsonb_typeof(product_data)='object'), updated_at timestamptz not null default now()
);
create table if not exists preview_private.product_configurations (
 product_id text primary key, configuration jsonb not null default '{}' check(jsonb_typeof(configuration)='object'), updated_at timestamptz not null default now()
);
create table if not exists preview_private.documents (
 collection text not null check(collection in ('products','albums','materials','settings','events','images')), id text not null,
 data jsonb not null check(jsonb_typeof(data)='object'), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), primary key(collection,id)
);
alter table preview_private.documents enable row level security;
alter table preview_private.product_drafts enable row level security;
alter table preview_private.product_configurations enable row level security;
revoke all on schema preview_private from public,anon,authenticated;
revoke all on all tables in schema preview_private from public,anon,authenticated;
