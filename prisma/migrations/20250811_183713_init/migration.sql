-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADHERENT', 'LIBRARIAN');

-- CreateEnum
CREATE TYPE "public"."ReservationStatus" AS ENUM ('PENDING', 'NOTIFIED', 'EXPIRED', 'CANCELLED', 'FULFILLED');

-- CreateTable
CREATE TABLE "public"."Oeuvre" (
    "cote" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "dateParution" DATE,

    CONSTRAINT "Oeuvre_pkey" PRIMARY KEY ("cote")
);

-- CreateTable
CREATE TABLE "public"."Auteur" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "Auteur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MotCle" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,

    CONSTRAINT "MotCle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Livre" (
    "id" TEXT NOT NULL,
    "numeroExemplaire" INTEGER NOT NULL,
    "dateAchat" DATE NOT NULL,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "oeuvreCote" TEXT NOT NULL,

    CONSTRAINT "Livre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Adherent" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "dateAdhesion" DATE NOT NULL,
    "derniereCotisation" DATE,
    "clerkUserId" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'ADHERENT',

    CONSTRAINT "Adherent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Pret" (
    "id" TEXT NOT NULL,
    "adherentId" INTEGER NOT NULL,
    "livreId" TEXT NOT NULL,
    "dateEmprunt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateEcheance" TIMESTAMP(3) NOT NULL,
    "dateRetourEffective" TIMESTAMP(3),
    "renouvellements" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Pret_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Reservation" (
    "id" TEXT NOT NULL,
    "adherentId" INTEGER NOT NULL,
    "oeuvreCote" TEXT NOT NULL,
    "status" "public"."ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OeuvreAuteur" (
    "oeuvreCote" TEXT NOT NULL,
    "auteurId" TEXT NOT NULL,

    CONSTRAINT "OeuvreAuteur_pkey" PRIMARY KEY ("oeuvreCote","auteurId")
);

-- CreateTable
CREATE TABLE "public"."OeuvreMotCle" (
    "oeuvreCote" TEXT NOT NULL,
    "motCleId" TEXT NOT NULL,

    CONSTRAINT "OeuvreMotCle_pkey" PRIMARY KEY ("oeuvreCote","motCleId")
);

-- CreateIndex
CREATE UNIQUE INDEX "MotCle_libelle_key" ON "public"."MotCle"("libelle");

-- CreateIndex
CREATE INDEX "Livre_oeuvreCote_idx" ON "public"."Livre"("oeuvreCote");

-- CreateIndex
CREATE UNIQUE INDEX "Livre_oeuvreCote_numeroExemplaire_key" ON "public"."Livre"("oeuvreCote", "numeroExemplaire");

-- CreateIndex
CREATE UNIQUE INDEX "Adherent_clerkUserId_key" ON "public"."Adherent"("clerkUserId");

-- CreateIndex
CREATE INDEX "Pret_adherentId_idx" ON "public"."Pret"("adherentId");

-- CreateIndex
CREATE INDEX "Pret_livreId_idx" ON "public"."Pret"("livreId");

-- CreateIndex
CREATE INDEX "Reservation_oeuvreCote_createdAt_idx" ON "public"."Reservation"("oeuvreCote", "createdAt");

-- CreateIndex
CREATE INDEX "OeuvreAuteur_auteurId_idx" ON "public"."OeuvreAuteur"("auteurId");

-- CreateIndex
CREATE INDEX "OeuvreMotCle_motCleId_idx" ON "public"."OeuvreMotCle"("motCleId");

-- AddForeignKey
ALTER TABLE "public"."Livre" ADD CONSTRAINT "Livre_oeuvreCote_fkey" FOREIGN KEY ("oeuvreCote") REFERENCES "public"."Oeuvre"("cote") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Pret" ADD CONSTRAINT "Pret_adherentId_fkey" FOREIGN KEY ("adherentId") REFERENCES "public"."Adherent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Pret" ADD CONSTRAINT "Pret_livreId_fkey" FOREIGN KEY ("livreId") REFERENCES "public"."Livre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reservation" ADD CONSTRAINT "Reservation_adherentId_fkey" FOREIGN KEY ("adherentId") REFERENCES "public"."Adherent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reservation" ADD CONSTRAINT "Reservation_oeuvreCote_fkey" FOREIGN KEY ("oeuvreCote") REFERENCES "public"."Oeuvre"("cote") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OeuvreAuteur" ADD CONSTRAINT "OeuvreAuteur_oeuvreCote_fkey" FOREIGN KEY ("oeuvreCote") REFERENCES "public"."Oeuvre"("cote") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OeuvreAuteur" ADD CONSTRAINT "OeuvreAuteur_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "public"."Auteur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OeuvreMotCle" ADD CONSTRAINT "OeuvreMotCle_oeuvreCote_fkey" FOREIGN KEY ("oeuvreCote") REFERENCES "public"."Oeuvre"("cote") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OeuvreMotCle" ADD CONSTRAINT "OeuvreMotCle_motCleId_fkey" FOREIGN KEY ("motCleId") REFERENCES "public"."MotCle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

