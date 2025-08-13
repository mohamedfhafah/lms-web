import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { prisma } from "../db";

const getInput = z.object({ cote: z.string().min(1) });

export const oeuvreRouter = router({
  getByCote: publicProcedure.input(getInput).query(async ({ input }) => {
    const { cote } = input;

    // Aggregate details with raw for arrays and counts
    const rows = (await prisma.$queryRaw<any>`
      WITH authors AS (
        SELECT oa."oeuvreCote", array_agg(a."nom") AS authors
          FROM "OeuvreAuteur" oa
          JOIN "Auteur" a ON a."id" = oa."auteurId"
         GROUP BY oa."oeuvreCote"
      ), mots AS (
        SELECT om."oeuvreCote", array_agg(m."libelle") AS mots
          FROM "OeuvreMotCle" om
          JOIN "MotCle" m ON m."id" = om."motCleId"
         GROUP BY om."oeuvreCote"
      ), copies AS (
        SELECT l."oeuvreCote",
               COUNT(*)::int AS total,
               COUNT(*) FILTER (WHERE l."disponible" = TRUE)::int AS available
          FROM "Livre" l
         GROUP BY l."oeuvreCote"
      )
      SELECT o."cote",
             o."titre",
             o."dateParution",
             COALESCE(a.authors, ARRAY[]::text[]) AS authors,
             COALESCE(m.mots, ARRAY[]::text[]) AS mots,
             COALESCE(c.total, 0) AS "totalCopies",
             COALESCE(c.available, 0) AS "availableCopies"
        FROM "Oeuvre" o
        LEFT JOIN authors a ON a."oeuvreCote" = o."cote"
        LEFT JOIN mots m ON m."oeuvreCote" = o."cote"
        LEFT JOIN copies c ON c."oeuvreCote" = o."cote"
       WHERE o."cote" = ${cote}
       LIMIT 1
    `) as Array<{
      cote: string;
      titre: string;
      dateParution: Date | null;
      authors: string[] | null;
      mots: string[] | null;
      totalCopies: number;
      availableCopies: number;
    }>;

    const row = rows[0];
    if (!row) return null;

    return {
      cote: row.cote,
      titre: row.titre,
      dateParution: row.dateParution,
      authors: row.authors ?? [],
      mots: row.mots ?? [],
      totalCopies: row.totalCopies,
      availableCopies: row.availableCopies,
    };
  }),
});
