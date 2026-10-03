-- ============================================================================
-- Interactive School Website System - Sto. Nino Catholic School Inc.
-- Database Schema - LEAN version (PostgreSQL / Supabase)   18 tables
-- Team Chimera - SSYADD1
--
-- Every table traces to a use case in the panel-approved use case diagram.
-- Files (PDFs, applicant documents) live in Supabase Storage; tables keep the path.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS btree_gist;   -- needed by the no-double-booking rule

-- ============================================================================
-- 1. ACCOUNTS  (Login, Manage Accounts, Assign User Roles, Reset Password,
--               Deactivate Account)
-- ============================================================================

CREATE TABLE users (
    id                     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email                  TEXT NOT NULL,
    password_hash          TEXT NOT NULL,
    full_name              TEXT NOT NULL,
    role                   TEXT NOT NULL CHECK (role IN ('teacher', 'registrar', 'admin')),  -- one role per account
    account_status         TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'inactive')),
    manage_staff_accounts  BOOLEAN NOT NULL DEFAULT FALSE,   -- only these Admins can manage accounts
    must_change_password   BOOLEAN NOT NULL DEFAULT FALSE,   -- after a temporary-password reset
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_users_email ON users (lower(email));

CREATE TABLE sessions (                       -- lets Deactivate Account log the user out everywhere
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked_at  TIMESTAMPTZ                   -- session_valid = not revoked and not expired
);

CREATE TABLE audit_logs (                     -- account changes + application status changes
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor_user_id  BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action         TEXT NOT NULL,             -- e.g. role.change, account.deactivate, application.status_change
    entity_type    TEXT NOT NULL,             -- users, enrollment_applications ...
    entity_id      BIGINT,
    old_value      JSONB,
    new_value      JSONB,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 2. WEBSITE CONTENT  (Manage Website Content, Create/Update Website Content,
--    View Public Content, Search Public Content, Modify Downloadable Resources,
--    Access Downloadable Resources, Preview Document)
-- ============================================================================

CREATE TABLE cms_content (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    content_type  TEXT NOT NULL CHECK (content_type IN ('announcement', 'event', 'page')),
    title         TEXT NOT NULL,
    slug          TEXT NOT NULL UNIQUE,
    body          TEXT NOT NULL,
    event_date    TIMESTAMPTZ,
    status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_by    BIGINT NOT NULL REFERENCES users(id),
    updated_by    BIGINT REFERENCES users(id),
    published_at  TIMESTAMPTZ,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (content_type <> 'event' OR event_date IS NOT NULL)
);

CREATE TABLE resources (                      -- downloadable PDFs
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title            TEXT NOT NULL,
    category         TEXT NOT NULL,           -- e.g. Admission Forms, DepEd References
    storage_path     TEXT NOT NULL,
    file_size_bytes  INTEGER NOT NULL CHECK (file_size_bytes BETWEEN 1 AND 10485760),  -- max 10 MB
    status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    uploaded_by      BIGINT NOT NULL REFERENCES users(id),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 3. ENROLLMENT  (Submit Enrollment Application, Verify Application Data,
--    Verify Submission, Manage Enrollment Applications, Review Application
--    Details, Update Application Status, Print Enrollment Application)
--    Fields follow the school's online registration forms.
-- ============================================================================

CREATE TABLE enrollment_periods (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    school_year  TEXT NOT NULL,               -- '2026-2027'
    status       TEXT NOT NULL DEFAULT 'closed' CHECK (status IN ('open', 'closed')),
    opened_by    BIGINT REFERENCES users(id),
    opened_at    TIMESTAMPTZ,
    closed_at    TIMESTAMPTZ
);
CREATE UNIQUE INDEX uq_one_open_period ON enrollment_periods ((status)) WHERE status = 'open';

CREATE TABLE enrollment_applications (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    reference_no        TEXT NOT NULL UNIQUE,
    period_id           BIGINT NOT NULL REFERENCES enrollment_periods(id),
    -- enrollment details
    department          TEXT NOT NULL CHECK (department IN ('preschool', 'grade_school', 'jhs', 'shs')),
    applicant_type      TEXT NOT NULL CHECK (applicant_type IN ('new', 'old', 'returnee')),
    grade_level         TEXT NOT NULL,        -- Nursery ... Grade 12
    strand              TEXT,                 -- Grades 11-12 only
    mode_of_payment     TEXT NOT NULL CHECK (mode_of_payment IN ('full_cash', 'monthly', 'quarterly', 'semi_annual')),
    -- Section 1: student information
    surname             TEXT NOT NULL,
    first_name          TEXT NOT NULL,
    middle_name         TEXT,
    birth_date          DATE NOT NULL,        -- age is computed from this
    gender              TEXT NOT NULL CHECK (gender IN ('male', 'female')),
    place_of_birth      TEXT NOT NULL,
    religion            TEXT NOT NULL,
    complete_address    TEXT NOT NULL,
    contact_numbers     TEXT NOT NULL,
    email               TEXT NOT NULL,
    parent_email        TEXT,
    guardian_messenger  TEXT NOT NULL,
    -- Section 5: last school attended  (assumed fields - confirm with the form)
    last_school_name    TEXT,
    last_school_address TEXT,
    -- processing
    status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'for_review', 'complete', 'incomplete')),
    registrar_remarks   TEXT,
    privacy_consent_at  TIMESTAMPTZ NOT NULL,  -- Data Privacy Act consent
    submitter_ip_hash   TEXT NOT NULL,         -- for the 5-per-hour rate limit
    submitted_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK ((grade_level IN ('Grade 11', 'Grade 12')) = (strand IS NOT NULL))
);

CREATE TABLE application_guardians (          -- Sections 2-4: Father, Mother, Guardian (assumed fields)
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    application_id  BIGINT NOT NULL REFERENCES enrollment_applications(id) ON DELETE CASCADE,
    relationship    TEXT NOT NULL CHECK (relationship IN ('father', 'mother', 'guardian')),
    full_name       TEXT NOT NULL,
    occupation      TEXT,
    contact_number  TEXT,
    UNIQUE (application_id, relationship)
);

CREATE TABLE application_documents (          -- uploaded requirements (US-05, Review Application Details)
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    application_id  BIGINT NOT NULL REFERENCES enrollment_applications(id) ON DELETE CASCADE,
    document_type   TEXT NOT NULL,
    storage_path    TEXT NOT NULL,
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 4. SCHEDULING  (Configure Scheduling Data, Upload Teacher's Load Excel File,
--    Validate Scheduling Data, Generate / Regenerate Schedule, View Class Schedule)
--    Mirrors the sheets of the SNCS Teaching Load Template.
-- ============================================================================

CREATE TABLE terms (
    id           SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    school_year  TEXT NOT NULL,               -- '2026-2027'
    name         TEXT NOT NULL,               -- 'Term 2'
    is_active    BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (school_year, name)
);

CREATE TABLE teachers (                       -- Teachers sheet
    id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    teacher_code          TEXT NOT NULL UNIQUE,   -- 'T01' (upload matches by ID, not name)
    full_name             TEXT NOT NULL,
    user_id               BIGINT UNIQUE REFERENCES users(id) ON DELETE SET NULL,  -- their portal login
    load_limit_minutes    SMALLINT NOT NULL DEFAULT 1500,  -- overload = minutes above this
    teaches_elementary    BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE sections (                       -- Sections sheet
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    term_id             SMALLINT NOT NULL REFERENCES terms(id),
    grade_level         SMALLINT NOT NULL CHECK (grade_level BETWEEN 7 AND 12),
    name                TEXT NOT NULL,        -- 'G7 - Our Lady of Guadalupe'
    strands             TEXT,                 -- 'STEM', or 'ABM, ICT' for a combined class
    recess_group        TEXT NOT NULL CHECK (recess_group IN ('7-8', '9-10', '11-12')),
    adviser_teacher_id  BIGINT REFERENCES teachers(id) ON DELETE SET NULL,
    UNIQUE (term_id, name)
);

CREATE TABLE subjects (                       -- Subjects sheet
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name          TEXT NOT NULL UNIQUE,       -- 'Filipino 7'
    grade_level   SMALLINT,                   -- NULL = any grade (Homeroom Guidance)
    subject_type  TEXT NOT NULL CHECK (subject_type IN ('core', 'strand', 'homeroom'))
);

CREATE TABLE teacher_loads (                  -- Teaching Loads sheet: one teacher + subject + section
    id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    term_id               SMALLINT NOT NULL REFERENCES terms(id),
    teacher_id            BIGINT NOT NULL REFERENCES teachers(id),
    subject_id            BIGINT NOT NULL REFERENCES subjects(id),
    section_id            BIGINT NOT NULL REFERENCES sections(id),
    strand_only           TEXT,               -- e.g. 'ABM' when only that strand of a combined class takes it
    meetings_60_per_week  SMALLINT NOT NULL DEFAULT 0 CHECK (meetings_60_per_week BETWEEN 0 AND 10),
    meetings_45_per_week  SMALLINT NOT NULL DEFAULT 0 CHECK (meetings_45_per_week BETWEEN 0 AND 10),
    weekly_minutes        SMALLINT GENERATED ALWAYS AS (meetings_60_per_week * 60 + meetings_45_per_week * 45) STORED,
    CHECK (meetings_60_per_week + meetings_45_per_week > 0),
    UNIQUE NULLS NOT DISTINCT (term_id, subject_id, section_id, strand_only)   -- one teacher per class
);

CREATE TABLE teacher_unavailability (         -- Unavailable Times sheet (e.g. elementary classes)
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    term_id      SMALLINT NOT NULL REFERENCES terms(id),
    teacher_id   BIGINT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    day_of_week  SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 6),   -- 1 = Monday
    start_time   TIME NOT NULL,
    end_time     TIME NOT NULL CHECK (end_time > start_time),
    reason       TEXT
);

CREATE TABLE time_slots (                     -- Bell Schedule sheet: different recess per group
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    term_id       SMALLINT NOT NULL REFERENCES terms(id),
    recess_group  TEXT NOT NULL CHECK (recess_group IN ('7-8', '9-10', '11-12')),
    days          TEXT NOT NULL CHECK (days IN ('Mon-Thu', 'Fri', 'Mon-Fri')),
    slot_order    SMALLINT NOT NULL,
    slot_type     TEXT NOT NULL CHECK (slot_type IN ('class', 'recess', 'lunch')),
    start_time    TIME NOT NULL,
    end_time      TIME NOT NULL CHECK (end_time > start_time),
    UNIQUE (term_id, recess_group, days, slot_order)
);

CREATE TABLE schedule_runs (                  -- each click of Generate / Regenerate
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    term_id        SMALLINT NOT NULL REFERENCES terms(id),
    status         TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'superseded', 'failed')),
    solver_result  TEXT,                      -- OPTIMAL / FEASIBLE / INFEASIBLE
    unresolved     JSONB,                     -- classes the solver could not place
    generated_by   BIGINT NOT NULL REFERENCES users(id),
    generated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_at   TIMESTAMPTZ
);
CREATE UNIQUE INDEX uq_one_published_run ON schedule_runs (term_id) WHERE status = 'published';

CREATE TABLE schedule_entries (               -- one class meeting in the timetable
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    run_id           BIGINT NOT NULL REFERENCES schedule_runs(id) ON DELETE CASCADE,
    teacher_load_id  BIGINT NOT NULL REFERENCES teacher_loads(id) ON DELETE CASCADE,
    teacher_id       BIGINT NOT NULL REFERENCES teachers(id),   -- copied from the load for the overlap rule
    day_of_week      SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 6),
    start_time       TIME NOT NULL,
    end_time         TIME NOT NULL CHECK (end_time > start_time),
    -- the database itself refuses to put a teacher in two classes at the same time
    CONSTRAINT no_teacher_double_booking EXCLUDE USING gist (
        run_id WITH =, teacher_id WITH =, day_of_week WITH =,
        tsrange('2000-01-01'::date + start_time, '2000-01-01'::date + end_time) WITH &&)
);

-- ============================================================================
-- 5. SECURITY: turn on Row Level Security for every table
--    Blocks Supabase's public API (anon key) from reading these tables.
--    The Express backend connects as the database owner, so it still works.
-- ============================================================================
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;
