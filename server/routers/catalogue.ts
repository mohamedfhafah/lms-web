import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { prisma } from "../db";
import { Prisma } from "@prisma/client";

// NOTE: Uses Postgres FTS via raw SQL for search performance.
// Consider adding pg_trgm for fuzzy later and GIN indexes on a materialized tsvector.

const searchInput = z.object({
  q: z.string().min(1, "query required"),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(10),
  authors: z.array(z.string()).optional().default([]),
  keywords: z.array(z.string()).optional().default([]),
});

const searchItem = z.object({
  cote: z.string(),
  titre: z.string(),
  authors: z.array(z.string()).nullable(),
  mots: z.array(z.string()).nullable(),
  totalCopies: z.number(),
  availableCopies: z.number(),
  rank: z.number(),
});

export const catalogueRouter = router({
  search: publicProcedure.input(searchInput).query(async ({ input }) => {
    const { q, page, pageSize, authors, keywords } = input;
    const offset = (page - 1) * pageSize;
    const authorPatterns = (authors ?? []).map((a) => `%${a}%`);
    const keywordPatterns = (keywords ?? []).map((m) => `%${m}%`);

    const authorClause =
      authorPatterns.length === 0
        ? Prisma.sql`TRUE`
        : Prisma.sql`(${Prisma.join(
            authorPatterns.map((p) =>
              Prisma.sql`array_to_string(COALESCE(o.authors, ARRAY[]::text[]), ' ') ILIKE ${p}`
            ),
            ' OR '
          )})`;

    const keywordClause =
      keywordPatterns.length === 0
        ? Prisma.sql`TRUE`
        : Prisma.sql`(${Prisma.join(
            keywordPatterns.map((p) =>
              Prisma.sql`array_to_string(COALESCE(o.mots, ARRAY[]::text[]), ' ') ILIKE ${p}`
            ),
            ' OR '
          )})`;

    // Items query
    const items = (await prisma.$queryRaw<any>`
      WITH oeuvres AS (
        SELECT o."cote",
               o."titre",
               (SELECT array_agg(a."nom")
                  FROM "OeuvreAuteur" oa
                  JOIN "Auteur" a ON a."id" = oa."auteurId"
                 WHERE oa."oeuvreCote" = o."cote") AS authors,
               (SELECT array_agg(m."libelle")
                  FROM "OeuvreMotCle" om
                  JOIN "MotCle" m ON m."id" = om."motCleId"
                 WHERE om."oeuvreCote" = o."cote") AS mots,
               (SELECT COUNT(*)::int FROM "Livre" l WHERE l."oeuvreCote" = o."cote") AS total_copies,
               (SELECT COUNT(*)::int FROM "Livre" l WHERE l."oeuvreCote" = o."cote" AND l."disponible" = TRUE) AS available_copies
          FROM "Oeuvre" o
      ),
      q AS (
        SELECT plainto_tsquery('simple', ${q}) AS query
      )
      SELECT o."cote",
             o."titre",
             o.authors,
             o.mots,
             o.total_copies AS "totalCopies",
             o.available_copies AS "availableCopies",
             GREATEST(
               ts_rank_cd(
               to_tsvector('simple', COALESCE(o."titre", '') || ' ' ||
                 array_to_string(COALESCE(o.authors, ARRAY[]::text[]), ' ') || ' ' ||
                 array_to_string(COALESCE(o.mots, ARRAY[]::text[]), ' ')
               ), q.query
               ),
               similarity(o."titre", ${q})
             ) AS rank
        FROM oeuvres o, q
      WHERE (
              to_tsvector('simple', COALESCE(o."titre", '') || ' ' ||
               array_to_string(COALESCE(o.authors, ARRAY[]::text[]), ' ') || ' ' ||
               array_to_string(COALESCE(o.mots, ARRAY[]::text[]), ' ')
             ) @@ q.query
            OR similarity(o."titre", ${q}) > 0.2
          )
        AND ${authorClause}
        AND ${keywordClause}
       ORDER BY rank DESC, o."titre" ASC
       LIMIT ${pageSize} OFFSET ${offset}
    `) as unknown[];

    const parsedItems = items.map((row) => searchItem.parse(row));

    // Total count query
    const totalRows = (await prisma.$queryRaw<any>`
      WITH oeuvres AS (
        SELECT o."cote",
               o."titre",
               (SELECT array_agg(a."nom")
                  FROM "OeuvreAuteur" oa
                  JOIN "Auteur" a ON a."id" = oa."auteurId"
                 WHERE oa."oeuvreCote" = o."cote") AS authors,
               (SELECT array_agg(m."libelle")
                  FROM "OeuvreMotCle" om
                  JOIN "MotCle" m ON m."id" = om."motCleId"
                 WHERE om."oeuvreCote" = o."cote") AS mots
          FROM "Oeuvre" o
      ),
      q AS (
        SELECT plainto_tsquery('simple', ${q}) AS query
      )
      SELECT COUNT(*)::int AS count
        FROM oeuvres o, q
       WHERE (
              to_tsvector('simple', COALESCE(o."titre", '') || ' ' ||
                array_to_string(COALESCE(o.authors, ARRAY[]::text[]), ' ') || ' ' ||
                array_to_string(COALESCE(o.mots, ARRAY[]::text[]), ' ')
              ) @@ q.query
              OR similarity(o."titre", ${q}) > 0.2
            )
         AND (${authorClause})
         AND (${keywordClause})
    `) as Array<{ count: number }>;

    const total = totalRows?.[0]?.count ?? 0;

    return { items: parsedItems, total, page, pageSize };
  }),
});
