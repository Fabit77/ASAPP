CREATE TABLE IF NOT EXISTS users (
 id uuid PRIMARY KEY, email text NOT NULL UNIQUE, username text UNIQUE,
 display_name text, avatar_url text, bio text, city text, is_public boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE organizations (
 id uuid PRIMARY KEY, name text NOT NULL, slug text NOT NULL UNIQUE, description text NOT NULL DEFAULT '',
 avatar_url text, cover_url text, owner_id uuid NOT NULL REFERENCES users(id),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE organization_members (
 id uuid PRIMARY KEY, organization_id uuid NOT NULL REFERENCES organizations(id), user_id uuid NOT NULL REFERENCES users(id),
 role text NOT NULL CHECK (role IN ('OWNER','ADMIN','EDITOR','VIEWER')), UNIQUE(organization_id,user_id)
);
CREATE TABLE collections (
 id uuid PRIMARY KEY, organization_id uuid NOT NULL REFERENCES organizations(id), name text NOT NULL, slug text NOT NULL UNIQUE,
 description text NOT NULL DEFAULT '', cover_image_url text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(id,organization_id)
);
CREATE TABLE drops (
 id uuid PRIMARY KEY, organization_id uuid NOT NULL REFERENCES organizations(id), collection_id uuid,
 title text NOT NULL, slug text NOT NULL UNIQUE, description text NOT NULL DEFAULT '', artwork_url text NOT NULL,
 date date NOT NULL, start_date_time timestamptz NOT NULL, end_date_time timestamptz,
 venue_name text, city text, country text, latitude double precision, longitude double precision,
 max_supply integer CHECK(max_supply>0), claim_count integer NOT NULL DEFAULT 0 CHECK(claim_count>=0),
 visibility text NOT NULL CHECK(visibility IN ('PUBLIC','UNLISTED','PRIVATE')),
 status text NOT NULL CHECK(status IN ('DRAFT','PUBLISHED','ENDED','ARCHIVED')),
 claims_paused boolean NOT NULL DEFAULT false, position integer NOT NULL DEFAULT 0,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(collection_id,organization_id) REFERENCES collections(id,organization_id),
 CHECK(max_supply IS NULL OR claim_count<=max_supply), CHECK(end_date_time IS NULL OR end_date_time>=start_date_time)
);
CREATE TABLE claim_methods (
 id uuid PRIMARY KEY, drop_id uuid NOT NULL REFERENCES drops(id), type text NOT NULL CHECK(type IN ('QR','SECRET_WORD','GPS')),
 config jsonb NOT NULL DEFAULT '{}', code text UNIQUE, active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(drop_id,type)
);
CREATE TABLE claims (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id), drop_id uuid NOT NULL REFERENCES drops(id),
 claim_method text NOT NULL CHECK(claim_method IN ('QR','SECRET_WORD','GPS')),
 claimed_at timestamptz NOT NULL DEFAULT now(), metadata jsonb,
 external_ownership_id text, external_transaction_id text, external_network text, external_address text,
 UNIQUE(user_id,drop_id)
);
CREATE TABLE rate_limits (key text PRIMARY KEY, attempts integer NOT NULL, expires_at timestamptz NOT NULL);
CREATE INDEX claims_drop_idx ON claims(drop_id,claimed_at);
CREATE INDEX drops_org_idx ON drops(organization_id);
CREATE INDEX drops_public_idx ON drops(status,visibility,date);
CREATE INDEX members_user_idx ON organization_members(user_id);
CREATE INDEX rate_limits_expiry_idx ON rate_limits(expires_at);
-- App tables are intentionally inaccessible through the Supabase Data API.
-- The server repository connects using DATABASE_URL and authorizes each operation.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE drops ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
