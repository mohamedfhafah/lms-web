-- Enable extensions for search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Optional: unaccent can be useful; enable later if needed
-- CREATE EXTENSION IF NOT EXISTS unaccent;

-- FTS index on Oeuvre.titre (simple config)
CREATE INDEX IF NOT EXISTS "Oeuvre_titre_tsv_idx"
  ON "public"."Oeuvre"
  USING GIN (to_tsvector('simple', COALESCE("titre", '')));

-- Trigram index to support fuzzy title search
CREATE INDEX IF NOT EXISTS "Oeuvre_titre_trgm_idx"
  ON "public"."Oeuvre"
  USING GIN ("titre" gin_trgm_ops);

-- Helpful future indices for suggestions
CREATE INDEX IF NOT EXISTS "Auteur_nom_trgm_idx"
  ON "public"."Auteur" USING GIN ("nom" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MotCle_libelle_trgm_idx"
  ON "public"."MotCle" USING GIN ("libelle" gin_trgm_ops);
