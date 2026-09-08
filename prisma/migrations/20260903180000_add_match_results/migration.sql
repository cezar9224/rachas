CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

ALTER TABLE "Match"
  ADD COLUMN "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
  ADD COLUMN "championPhotoUrl" TEXT;

CREATE TABLE "MatchGame" (
  "id" TEXT NOT NULL,
  "rachaId" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "homeTeamId" TEXT NOT NULL,
  "awayTeamId" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL,
  "homeScore" INTEGER NOT NULL DEFAULT 0,
  "awayScore" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MatchGame_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MatchGoal" (
  "id" TEXT NOT NULL,
  "rachaId" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "gameId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "scorerId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MatchGoal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MatchGame_matchId_sequence_key" ON "MatchGame"("matchId", "sequence");
CREATE UNIQUE INDEX "MatchGame_rachaId_matchId_id_key" ON "MatchGame"("rachaId", "matchId", "id");
CREATE INDEX "MatchGame_rachaId_matchId_idx" ON "MatchGame"("rachaId", "matchId");
CREATE UNIQUE INDEX "MatchGoal_gameId_scorerId_key" ON "MatchGoal"("gameId", "scorerId");
CREATE INDEX "MatchGoal_rachaId_scorerId_idx" ON "MatchGoal"("rachaId", "scorerId");

ALTER TABLE "MatchGame" ADD CONSTRAINT "MatchGame_match_fkey" FOREIGN KEY ("rachaId", "matchId") REFERENCES "Match"("rachaId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MatchGame" ADD CONSTRAINT "MatchGame_homeTeam_fkey" FOREIGN KEY ("rachaId", "matchId", "homeTeamId") REFERENCES "Team"("rachaId", "matchId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MatchGame" ADD CONSTRAINT "MatchGame_awayTeam_fkey" FOREIGN KEY ("rachaId", "matchId", "awayTeamId") REFERENCES "Team"("rachaId", "matchId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MatchGoal" ADD CONSTRAINT "MatchGoal_match_fkey" FOREIGN KEY ("rachaId", "matchId") REFERENCES "Match"("rachaId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MatchGoal" ADD CONSTRAINT "MatchGoal_game_fkey" FOREIGN KEY ("rachaId", "matchId", "gameId") REFERENCES "MatchGame"("rachaId", "matchId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MatchGoal" ADD CONSTRAINT "MatchGoal_team_fkey" FOREIGN KEY ("rachaId", "matchId", "teamId") REFERENCES "Team"("rachaId", "matchId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MatchGoal" ADD CONSTRAINT "MatchGoal_scorer_fkey" FOREIGN KEY ("rachaId", "scorerId") REFERENCES "RachaMember"("rachaId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MatchGame" ADD CONSTRAINT "MatchGame_distinct_teams_check" CHECK ("homeTeamId" <> "awayTeamId");
ALTER TABLE "MatchGame" ADD CONSTRAINT "MatchGame_scores_check" CHECK ("homeScore" >= 0 AND "awayScore" >= 0);
ALTER TABLE "MatchGoal" ADD CONSTRAINT "MatchGoal_quantity_check" CHECK ("quantity" > 0);
