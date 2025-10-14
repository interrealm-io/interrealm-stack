-- Nexus Gateway Database Initialization Script
-- Creates tables for RealmMesh Nexus Gateway (MVP 2)

-- Database is already created by POSTGRES_DB environment variable
-- This script runs in the nexus database context

-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: Full schema will be created by Prisma
-- This init script is for any database setup that needs to happen
-- before Prisma runs (e.g., extensions, custom functions, etc.)

-- Helper function to get realm path (for hierarchical realm navigation)
CREATE OR REPLACE FUNCTION get_realm_path(realm_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    path TEXT;
    current_id UUID;
    current_realm_id VARCHAR(255);
BEGIN
    path := '';
    current_id := realm_uuid;

    WHILE current_id IS NOT NULL LOOP
        SELECT realm_id, parent_id INTO current_realm_id, current_id
        FROM realms WHERE id = current_id;

        IF current_realm_id IS NOT NULL THEN
            IF path = '' THEN
                path := current_realm_id;
            ELSE
                path := current_realm_id || '/' || path;
            END IF;
        END IF;
    END LOOP;

    RETURN path;
END;
$$ LANGUAGE plpgsql;

-- Helper function to inherit policies from parent realms
CREATE OR REPLACE FUNCTION get_effective_policies(realm_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    all_policies JSONB;
    current_id UUID;
    realm_policies JSONB;
    inherit BOOLEAN;
BEGIN
    all_policies := '[]';
    current_id := realm_uuid;

    WHILE current_id IS NOT NULL LOOP
        SELECT r.policies, r.inherit_policies, r.parent_id
        INTO realm_policies, inherit, current_id
        FROM realms r WHERE r.id = current_id;

        IF realm_policies IS NOT NULL THEN
            -- Merge policies (realm's own policies take precedence)
            all_policies := realm_policies || all_policies;
        END IF;

        -- Stop if this realm doesn't inherit from parent
        IF NOT inherit THEN
            EXIT;
        END IF;
    END LOOP;

    RETURN all_policies;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: Triggers will be created by Prisma migrations or added here after schema is pushed
-- The actual schema (tables, indexes, etc.) will be managed by Prisma
