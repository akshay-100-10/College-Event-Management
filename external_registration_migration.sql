-- ============================================================
-- External Registration Tracking (Self-Report)
-- Safe to re-run: uses DROP IF EXISTS before recreating policies
-- ============================================================

CREATE TABLE IF NOT EXISTS external_registrations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    status          TEXT NOT NULL DEFAULT 'self_reported'
                        CHECK (status IN ('self_reported', 'verified', 'rejected')),
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

-- RLS
ALTER TABLE external_registrations ENABLE ROW LEVEL SECURITY;

-- Drop policies first so this script is idempotent (safe to re-run)
DROP POLICY IF EXISTS "Users can manage own external registrations" ON external_registrations;
DROP POLICY IF EXISTS "Organizers can view and verify external registrations" ON external_registrations;

-- Students can insert/view their own records
CREATE POLICY "Users can manage own external registrations"
    ON external_registrations
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- College organisers can view AND update registrations for their events
CREATE POLICY "Organizers can view and verify external registrations"
    ON external_registrations
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = external_registrations.event_id
              AND events.organizer_id = auth.uid()
        )
    );

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_external_registrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists before recreating
DROP TRIGGER IF EXISTS trg_external_registrations_updated_at ON external_registrations;

CREATE TRIGGER trg_external_registrations_updated_at
    BEFORE UPDATE ON external_registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_external_registrations_updated_at();

-- ─── CRITICAL: Add FK to public.profiles so PostgREST can join for nested selects ───
-- This lets the dashboard query profiles(full_name, email) via user_id
ALTER TABLE external_registrations
    DROP CONSTRAINT IF EXISTS external_registrations_profile_fk;

ALTER TABLE external_registrations
    ADD CONSTRAINT external_registrations_profile_fk
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

