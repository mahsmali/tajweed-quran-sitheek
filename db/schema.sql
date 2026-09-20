-- ============================================================================
--  TAJWEED ENGINE — STORAGE SCHEMA (PostgreSQL)
-- ============================================================================
--  Design note: this schema stores DERIVED analysis, not hand-authored data.
--  `tajweed_span` rows are written by the ingestion job, never by a human, and
--  the whole table can be dropped and rebuilt by re-running the engine over
--  `quran_word`. That is what `engine_version` is for — when a rule changes,
--  bump the version, re-derive, and the stale rows are trivially identifiable.
--
--  The application itself runs fine with no database at all (it analyses on
--  demand and caches in memory). This schema is for when you want durable
--  analytics, precomputed queries across all 114 surahs, or offline export.
-- ============================================================================

BEGIN;

-- ── reference: reciters and their alignment coverage ───────────────────────
CREATE TABLE reciter (
  id             SMALLINT PRIMARY KEY,           -- quran.com recitation id
  name           TEXT        NOT NULL,
  style          TEXT        NOT NULL,           -- murattal / mujawwad
  has_segments   BOOLEAN     NOT NULL DEFAULT FALSE,
  audio_base_url TEXT        NOT NULL
);

-- ── reference: the rule catalogue (mirrors src/lib/tajweed/rules.ts) ───────
CREATE TYPE rule_family AS ENUM ('madd', 'ghunnah', 'qalqalah', 'makharij', 'silent', 'izhar');

CREATE TABLE tajweed_rule (
  id                 TEXT        PRIMARY KEY,    -- 'madd_muttasil', 'ikhfa', …
  family             rule_family NOT NULL,
  label              TEXT        NOT NULL,
  label_ar           TEXT        NOT NULL,
  counts             SMALLINT[],                 -- {4,5} for muttasil, NULL otherwise
  summary            TEXT        NOT NULL,
  detail             TEXT        NOT NULL,
  makharij           TEXT[]      NOT NULL DEFAULT '{}',
  priority           SMALLINT    NOT NULL,       -- colour wins on overlap
  introduced_on_day  SMALLINT    NOT NULL REFERENCES daily_milestone(day) DEFERRABLE INITIALLY DEFERRED
);

-- ── scripture ──────────────────────────────────────────────────────────────
CREATE TABLE chapter (
  surah            SMALLINT PRIMARY KEY CHECK (surah BETWEEN 1 AND 114),
  name_arabic      TEXT     NOT NULL,
  name_simple      TEXT     NOT NULL,
  translated_name  TEXT     NOT NULL,
  verses_count     SMALLINT NOT NULL,
  revelation_place TEXT     NOT NULL,
  bismillah_pre    BOOLEAN  NOT NULL
);

CREATE TABLE verse (
  id             BIGSERIAL PRIMARY KEY,
  surah          SMALLINT NOT NULL REFERENCES chapter(surah) ON DELETE CASCADE,
  ayah           SMALLINT NOT NULL,
  verse_key      TEXT     NOT NULL GENERATED ALWAYS AS (surah || ':' || ayah) STORED,
  text_uthmani   TEXT     NOT NULL,
  translation    TEXT,
  engine_version TEXT     NOT NULL,
  UNIQUE (surah, ayah)
);

-- ── the atomic unit: one word ──────────────────────────────────────────────
CREATE TABLE quran_word (
  id              BIGSERIAL PRIMARY KEY,
  verse_id        BIGINT   NOT NULL REFERENCES verse(id) ON DELETE CASCADE,
  surah           SMALLINT NOT NULL,
  ayah            SMALLINT NOT NULL,
  position        SMALLINT NOT NULL,            -- 1-based within the verse
  word_key        TEXT     NOT NULL GENERATED ALWAYS AS
                    (surah || ':' || ayah || ':' || position) STORED,
  text_uthmani    TEXT     NOT NULL,            -- every diacritic preserved
  text_simple     TEXT     NOT NULL,            -- marks stripped, for search
  transliteration TEXT,
  translation     TEXT,
  audio_url       TEXT,                         -- isolated word clip
  makharij        TEXT[]   NOT NULL DEFAULT '{}',
  UNIQUE (verse_id, position)
);

CREATE INDEX quran_word_key_idx    ON quran_word (word_key);
CREATE INDEX quran_word_simple_idx ON quran_word USING GIN (to_tsvector('simple', text_simple));

-- ── word timings, one row per (word, reciter) ──────────────────────────────
CREATE TYPE timing_source AS ENUM ('quran.com-segments', 'estimated', 'none');

CREATE TABLE word_timing (
  word_id     BIGINT        NOT NULL REFERENCES quran_word(id) ON DELETE CASCADE,
  reciter_id  SMALLINT      NOT NULL REFERENCES reciter(id),
  start_ms    INTEGER       NOT NULL CHECK (start_ms >= 0),
  end_ms      INTEGER       NOT NULL,
  duration_ms INTEGER       NOT NULL GENERATED ALWAYS AS (end_ms - start_ms) STORED,
  source      timing_source NOT NULL,
  PRIMARY KEY (word_id, reciter_id),
  CHECK (end_ms > start_ms)
);

-- Verse-level audio the offsets above are relative to.
CREATE TABLE verse_audio (
  verse_id    BIGINT        NOT NULL REFERENCES verse(id) ON DELETE CASCADE,
  reciter_id  SMALLINT      NOT NULL REFERENCES reciter(id),
  audio_url   TEXT          NOT NULL,
  duration_ms INTEGER,
  source      timing_source NOT NULL,
  PRIMARY KEY (verse_id, reciter_id)
);

-- ── THE DERIVED TABLE: character-level rule spans ──────────────────────────
--  char_start/char_end index into quran_word.text_uthmani (end exclusive),
--  which is what the renderer slices to build its coloured runs.
CREATE TABLE tajweed_span (
  id             BIGSERIAL PRIMARY KEY,
  word_id        BIGINT      NOT NULL REFERENCES quran_word(id) ON DELETE CASCADE,
  rule_id        TEXT        NOT NULL REFERENCES tajweed_rule(id),
  family         rule_family NOT NULL,
  char_start     SMALLINT    NOT NULL CHECK (char_start >= 0),
  char_end       SMALLINT    NOT NULL,
  text           TEXT        NOT NULL,          -- the covered substring
  trigger_letter TEXT,                          -- the letter that caused it
  counts         SMALLINT,                      -- resolved madd length
  note           TEXT        NOT NULL,          -- engine-generated explanation
  engine_version TEXT        NOT NULL,
  CHECK (char_end > char_start)
);

CREATE INDEX tajweed_span_word_idx   ON tajweed_span (word_id, char_start);
CREATE INDEX tajweed_span_rule_idx   ON tajweed_span (rule_id);
CREATE INDEX tajweed_span_family_idx ON tajweed_span (family);

-- ── curriculum ─────────────────────────────────────────────────────────────
CREATE TABLE daily_milestone (
  day               SMALLINT PRIMARY KEY CHECK (day BETWEEN 1 AND 30),
  title             TEXT     NOT NULL,
  title_ar          TEXT     NOT NULL,
  phase             TEXT     NOT NULL,
  objective         TEXT     NOT NULL,
  brief             TEXT     NOT NULL,
  focus_family      rule_family NOT NULL,
  estimated_minutes SMALLINT NOT NULL,
  checkpoints       TEXT[]   NOT NULL,
  unlocks_after     SMALLINT REFERENCES daily_milestone(day)
);

-- The join that makes the curriculum automatic: a day names rule ids, and the
-- lesson screen filters the practice verses by them. No per-day content.
CREATE TABLE milestone_rule (
  day     SMALLINT NOT NULL REFERENCES daily_milestone(day) ON DELETE CASCADE,
  rule_id TEXT     NOT NULL REFERENCES tajweed_rule(id),
  is_drill BOOLEAN NOT NULL DEFAULT FALSE,      -- also used by the quiz
  PRIMARY KEY (day, rule_id, is_drill)
);

CREATE TABLE milestone_range (
  day        SMALLINT NOT NULL REFERENCES daily_milestone(day) ON DELETE CASCADE,
  surah      SMALLINT NOT NULL REFERENCES chapter(surah),
  ayah_from  SMALLINT NOT NULL,
  ayah_to    SMALLINT NOT NULL,
  label      TEXT     NOT NULL,
  PRIMARY KEY (day, surah, ayah_from),
  CHECK (ayah_to >= ayah_from)
);

-- ── learner progress ───────────────────────────────────────────────────────
CREATE TABLE learner (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE day_progress (
  learner_id       UUID     NOT NULL REFERENCES learner(id) ON DELETE CASCADE,
  day              SMALLINT NOT NULL REFERENCES daily_milestone(day),
  completed_at     TIMESTAMPTZ,
  score            SMALLINT NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  checkpoints_done SMALLINT[] NOT NULL DEFAULT '{}',
  quiz_best_correct SMALLINT,
  quiz_best_total   SMALLINT,
  seconds_studied  INTEGER  NOT NULL DEFAULT 0,
  PRIMARY KEY (learner_id, day)
);

CREATE TABLE quiz_session (
  id          BIGSERIAL PRIMARY KEY,
  learner_id  UUID     NOT NULL REFERENCES learner(id) ON DELETE CASCADE,
  day         SMALLINT REFERENCES daily_milestone(day),
  correct     SMALLINT NOT NULL,
  total       SMALLINT NOT NULL,
  best_streak SMALLINT NOT NULL,
  finished_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Per-rule accuracy — this is what surfaces "your weakest rule".
CREATE TABLE rule_attempt (
  learner_id UUID     NOT NULL REFERENCES learner(id) ON DELETE CASCADE,
  rule_id    TEXT     NOT NULL REFERENCES tajweed_rule(id),
  seen       INTEGER  NOT NULL DEFAULT 0,
  correct    INTEGER  NOT NULL DEFAULT 0,
  PRIMARY KEY (learner_id, rule_id)
);

COMMIT;

-- ============================================================================
--  WORKED EXAMPLE — verse 1:2  ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ
--  (db/seed/verse_1_2.json holds the same verse as a document, generated by
--   `npm run seed` directly from the engine.)
-- ============================================================================

-- word 2 of 1:2 — لِلَّهِ — one word, one rule span
INSERT INTO quran_word (verse_id, surah, ayah, position, text_uthmani, text_simple,
                        transliteration, translation, audio_url, makharij)
VALUES ((SELECT id FROM verse WHERE surah = 1 AND ayah = 2),
        1, 2, 2, 'لِلَّهِ', 'لله', 'lillahi', '(be) to Allah',
        'https://audio.qurancdn.com/wbw/001_002_002.mp3',
        ARRAY['lisan_hafa_adna', 'halq_aqsa']);

INSERT INTO word_timing (word_id, reciter_id, start_ms, end_ms, source)
VALUES ((SELECT id FROM quran_word WHERE word_key = '1:2:2'), 7, 935, 1795, 'quran.com-segments');

-- The lam is LIGHT here because the preceding letter carries a kasra.
INSERT INTO tajweed_span (word_id, rule_id, family, char_start, char_end, text, counts, note, engine_version)
VALUES ((SELECT id FROM quran_word WHERE word_key = '1:2:2'),
        'lam_tarqeeq', 'makharij', 0, 4, 'لِلَّ', NULL,
        'The name of Allah after a kasra → the lam is read light.', '1.4.0');

-- ── useful queries ─────────────────────────────────────────────────────────

-- Every word in the Qur'an containing a 6-count necessary madd:
--   SELECT w.word_key, w.text_uthmani, s.text, s.note
--   FROM tajweed_span s JOIN quran_word w ON w.id = s.word_id
--   WHERE s.rule_id = 'madd_lazim_kalimi' ORDER BY w.surah, w.ayah, w.position;

-- Question pool for a curriculum day (verses that contain the day's rules and
-- at least three words that do not — the same constraint the quiz applies):
--   SELECT v.verse_key, s.rule_id, count(*) AS hits
--   FROM milestone_rule mr
--   JOIN tajweed_span s  ON s.rule_id = mr.rule_id
--   JOIN quran_word  w   ON w.id = s.word_id
--   JOIN verse       v   ON v.id = w.verse_id
--   WHERE mr.day = 5 AND mr.is_drill
--   GROUP BY v.verse_key, s.rule_id
--   HAVING count(*) >= 1;

-- Rule density per surah — drives "which surah should I practise ghunnah on?":
--   SELECT w.surah, s.family, count(*)
--   FROM tajweed_span s JOIN quran_word w ON w.id = s.word_id
--   GROUP BY w.surah, s.family ORDER BY w.surah;
