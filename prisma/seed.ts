/*
  Idempotent seed for Library Management System
  - Uses deterministic IDs or unique fields for upserts
  - Safe to re-run multiple times
*/
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // --- Auteurs (deterministic IDs for idempotency) ---
  const auteurs = [
    { id: "a_dumas", nom: "Alexandre Dumas" },
    { id: "a_hugo", nom: "Victor Hugo" },
  ];

  for (const a of auteurs) {
    await prisma.auteur.upsert({
      where: { id: a.id },
      update: { nom: a.nom },
      create: a,
    });
  }

  // --- Mots-clés (unique on libelle) ---
  const mots = [
    { libelle: "roman" },
    { libelle: "classique" },
    { libelle: "aventure" },
  ];
  for (const m of mots) {
    await prisma.motCle.upsert({
      where: { libelle: m.libelle },
      update: {},
      create: m,
    });
  }

  // --- Oeuvres (cote is primary key) ---
  const today = new Date();
  const oeuvres = [
    { cote: "C001", titre: "Les Trois Mousquetaires", dateParution: new Date("1844-01-01") },
    { cote: "C002", titre: "Le Comte de Monte-Cristo", dateParution: new Date("1846-01-01") },
    { cote: "C003", titre: "Les Misérables", dateParution: new Date("1862-01-01") },
  ];

  for (const o of oeuvres) {
    await prisma.oeuvre.upsert({
      where: { cote: o.cote },
      update: { titre: o.titre, dateParution: o.dateParution },
      create: o,
    });
  }

  // --- Relations Oeuvre <-> Auteur ---
  const oeuvreAuteurRows = [
    { oeuvreCote: "C001", auteurId: "a_dumas" },
    { oeuvreCote: "C002", auteurId: "a_dumas" },
    { oeuvreCote: "C003", auteurId: "a_hugo" },
  ];
  await prisma.oeuvreAuteur.createMany({
    data: oeuvreAuteurRows,
    skipDuplicates: true,
  });

  // --- Relations Oeuvre <-> MotCle ---
  const motRoman = await prisma.motCle.findUniqueOrThrow({ where: { libelle: "roman" } });
  const motClassique = await prisma.motCle.findUniqueOrThrow({ where: { libelle: "classique" } });
  const motAventure = await prisma.motCle.findUniqueOrThrow({ where: { libelle: "aventure" } });

  const oeuvreMotCleRows = [
    { oeuvreCote: "C001", motCleId: motRoman.id },
    { oeuvreCote: "C001", motCleId: motAventure.id },
    { oeuvreCote: "C002", motCleId: motRoman.id },
    { oeuvreCote: "C002", motCleId: motClassique.id },
    { oeuvreCote: "C003", motCleId: motRoman.id },
    { oeuvreCote: "C003", motCleId: motClassique.id },
  ];
  await prisma.oeuvreMotCle.createMany({
    data: oeuvreMotCleRows,
    skipDuplicates: true,
  });

  // --- Exemplaires (Livre) ---
  const livres: { id: string; numeroExemplaire: number; dateAchat: Date; oeuvreCote: string }[] = [];
  for (const o of oeuvres) {
    for (let i = 1; i <= 2; i++) {
      livres.push({
        id: `${o.cote}-E${i}`,
        numeroExemplaire: i,
        dateAchat: today,
        oeuvreCote: o.cote,
      });
    }
  }

  // createMany for performance; unique on (oeuvreCote, numeroExemplaire) prevents duplicates
  await prisma.livre.createMany({ data: livres, skipDuplicates: true });

  // --- Adherents (sync with Clerk later). clerkUserId unique ---
  type RoleLiteral = "ADHERENT" | "LIBRARIAN";
  interface AdherentSeed {
    clerkUserId: string;
    nom: string;
    adresse: string;
    dateAdhesion: Date;
    derniereCotisation: Date;
    role: RoleLiteral;
  }
  const adherents: AdherentSeed[] = [
    {
      clerkUserId: "dev-user-1",
      nom: "Dev User",
      adresse: "1 Rue de Test",
      dateAdhesion: today,
      derniereCotisation: today,
      role: "ADHERENT",
    },
    {
      clerkUserId: "dev-librarian-1",
      nom: "Dev Librarian",
      adresse: "2 Rue de Test",
      dateAdhesion: today,
      derniereCotisation: today,
      role: "LIBRARIAN",
    },
  ];

  for (const a of adherents) {
    await prisma.adherent.upsert({
      where: { clerkUserId: a.clerkUserId },
      update: {
        nom: a.nom,
        adresse: a.adresse,
        derniereCotisation: a.derniereCotisation,
        // Prisma v6 enum typing differs across configs; cast locally to satisfy types
        role: (a.role as unknown) as any,
      },
      create: { ...a, role: (a.role as unknown) as any },
    });
  }

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
