-- CreateEnum
CREATE TYPE "RachaRole" AS ENUM ('OWNER', 'ADMIN', 'PLAYER');

-- CreateEnum
CREATE TYPE "RachaFormat" AS ENUM ('FUTSAL', 'FUT7', 'FUT11', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('CONFIRMED', 'WAITING_LIST');

-- CreateEnum
CREATE TYPE "PositionCategory" AS ENUM ('GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'ATTACKER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Racha" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "venue" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "inviteCode" TEXT NOT NULL,
    "format" "RachaFormat" NOT NULL,
    "outfieldPlayers" INTEGER NOT NULL,
    "goalkeepersPerTeam" INTEGER NOT NULL DEFAULT 1,
    "defaultTeamCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Racha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RachaMember" (
    "id" TEXT NOT NULL,
    "rachaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "RachaRole" NOT NULL DEFAULT 'PLAYER',
    "initialRating" DECIMAL(3,1),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RachaMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerProfile" (
    "id" TEXT NOT NULL,
    "rachaId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "nickname" TEXT,
    "photoUrl" TEXT,
    "primaryPositionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "rachaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "category" "PositionCategory" NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerSecondaryPosition" (
    "rachaId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,

    CONSTRAINT "PlayerSecondaryPosition_pkey" PRIMARY KEY ("rachaId","profileId","positionId")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "rachaId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "venue" TEXT NOT NULL,
    "maxPlayers" INTEGER NOT NULL,
    "teamCount" INTEGER NOT NULL,
    "format" "RachaFormat" NOT NULL,
    "outfieldPlayers" INTEGER NOT NULL,
    "goalkeepersPerTeam" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchParticipant" (
    "id" TEXT NOT NULL,
    "rachaId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "status" "ParticipantStatus" NOT NULL,
    "queueOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerRating" (
    "id" TEXT NOT NULL,
    "rachaId" TEXT NOT NULL,
    "authorMemberId" TEXT NOT NULL,
    "targetMemberId" TEXT NOT NULL,
    "value" DECIMAL(3,1) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "rachaId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "averageRating" DECIMAL(4,2) NOT NULL,
    "balanceScore" DECIMAL(10,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamPlayer" (
    "id" TEXT NOT NULL,
    "rachaId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "positionId" TEXT,
    "coordX" DECIMAL(5,2),
    "coordY" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Racha_inviteCode_key" ON "Racha"("inviteCode");

-- CreateIndex
CREATE INDEX "RachaMember_userId_idx" ON "RachaMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RachaMember_rachaId_userId_key" ON "RachaMember"("rachaId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "RachaMember_rachaId_id_key" ON "RachaMember"("rachaId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerProfile_memberId_key" ON "PlayerProfile"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerProfile_rachaId_id_key" ON "PlayerProfile"("rachaId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerProfile_rachaId_memberId_key" ON "PlayerProfile"("rachaId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "Position_rachaId_name_key" ON "Position"("rachaId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Position_rachaId_id_key" ON "Position"("rachaId", "id");

-- CreateIndex
CREATE INDEX "Match_rachaId_startsAt_idx" ON "Match"("rachaId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Match_rachaId_id_key" ON "Match"("rachaId", "id");

-- CreateIndex
CREATE INDEX "MatchParticipant_rachaId_matchId_status_queueOrder_idx" ON "MatchParticipant"("rachaId", "matchId", "status", "queueOrder");

-- CreateIndex
CREATE UNIQUE INDEX "MatchParticipant_matchId_memberId_key" ON "MatchParticipant"("matchId", "memberId");

-- CreateIndex
CREATE INDEX "PlayerRating_rachaId_targetMemberId_idx" ON "PlayerRating"("rachaId", "targetMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerRating_rachaId_authorMemberId_targetMemberId_key" ON "PlayerRating"("rachaId", "authorMemberId", "targetMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_matchId_name_key" ON "Team"("matchId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Team_rachaId_id_key" ON "Team"("rachaId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Team_rachaId_matchId_id_key" ON "Team"("rachaId", "matchId", "id");

-- CreateIndex
CREATE INDEX "TeamPlayer_rachaId_memberId_idx" ON "TeamPlayer"("rachaId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamPlayer_matchId_memberId_key" ON "TeamPlayer"("matchId", "memberId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RachaMember" ADD CONSTRAINT "RachaMember_rachaId_fkey" FOREIGN KEY ("rachaId") REFERENCES "Racha"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RachaMember" ADD CONSTRAINT "RachaMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerProfile" ADD CONSTRAINT "PlayerProfile_rachaId_memberId_fkey" FOREIGN KEY ("rachaId", "memberId") REFERENCES "RachaMember"("rachaId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerProfile" ADD CONSTRAINT "PlayerProfile_rachaId_primaryPositionId_fkey" FOREIGN KEY ("rachaId", "primaryPositionId") REFERENCES "Position"("rachaId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_rachaId_fkey" FOREIGN KEY ("rachaId") REFERENCES "Racha"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerSecondaryPosition" ADD CONSTRAINT "PlayerSecondaryPosition_rachaId_profileId_fkey" FOREIGN KEY ("rachaId", "profileId") REFERENCES "PlayerProfile"("rachaId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerSecondaryPosition" ADD CONSTRAINT "PlayerSecondaryPosition_rachaId_positionId_fkey" FOREIGN KEY ("rachaId", "positionId") REFERENCES "Position"("rachaId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_rachaId_fkey" FOREIGN KEY ("rachaId") REFERENCES "Racha"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchParticipant" ADD CONSTRAINT "MatchParticipant_rachaId_matchId_fkey" FOREIGN KEY ("rachaId", "matchId") REFERENCES "Match"("rachaId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchParticipant" ADD CONSTRAINT "MatchParticipant_rachaId_memberId_fkey" FOREIGN KEY ("rachaId", "memberId") REFERENCES "RachaMember"("rachaId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerRating" ADD CONSTRAINT "PlayerRating_rachaId_authorMemberId_fkey" FOREIGN KEY ("rachaId", "authorMemberId") REFERENCES "RachaMember"("rachaId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerRating" ADD CONSTRAINT "PlayerRating_rachaId_targetMemberId_fkey" FOREIGN KEY ("rachaId", "targetMemberId") REFERENCES "RachaMember"("rachaId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_rachaId_matchId_fkey" FOREIGN KEY ("rachaId", "matchId") REFERENCES "Match"("rachaId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPlayer" ADD CONSTRAINT "TeamPlayer_rachaId_matchId_teamId_fkey" FOREIGN KEY ("rachaId", "matchId", "teamId") REFERENCES "Team"("rachaId", "matchId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPlayer" ADD CONSTRAINT "TeamPlayer_rachaId_memberId_fkey" FOREIGN KEY ("rachaId", "memberId") REFERENCES "RachaMember"("rachaId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPlayer" ADD CONSTRAINT "TeamPlayer_rachaId_positionId_fkey" FOREIGN KEY ("rachaId", "positionId") REFERENCES "Position"("rachaId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Domain invariants not expressible in the Prisma schema.
ALTER TABLE "Racha"
  ADD CONSTRAINT "Racha_player_counts_check" CHECK ("outfieldPlayers" > 0 AND "goalkeepersPerTeam" >= 0 AND "defaultTeamCount" > 1);

ALTER TABLE "RachaMember"
  ADD CONSTRAINT "RachaMember_initialRating_check" CHECK ("initialRating" IS NULL OR "initialRating" BETWEEN 0 AND 10);

ALTER TABLE "Match"
  ADD CONSTRAINT "Match_time_range_check" CHECK ("endsAt" > "startsAt"),
  ADD CONSTRAINT "Match_capacity_check" CHECK ("maxPlayers" > 0 AND "teamCount" > 1 AND "outfieldPlayers" > 0 AND "goalkeepersPerTeam" >= 0);

ALTER TABLE "MatchParticipant"
  ADD CONSTRAINT "MatchParticipant_queue_status_check" CHECK (
    ("status" = 'CONFIRMED' AND "queueOrder" IS NULL)
    OR ("status" = 'WAITING_LIST' AND "queueOrder" > 0)
  );

ALTER TABLE "PlayerRating"
  ADD CONSTRAINT "PlayerRating_value_check" CHECK ("value" BETWEEN 0 AND 10),
  ADD CONSTRAINT "PlayerRating_not_self_check" CHECK ("authorMemberId" <> "targetMemberId");

ALTER TABLE "Team"
  ADD CONSTRAINT "Team_rating_check" CHECK ("averageRating" BETWEEN 0 AND 10),
  ADD CONSTRAINT "Team_balanceScore_check" CHECK ("balanceScore" >= 0);

ALTER TABLE "TeamPlayer"
  ADD CONSTRAINT "TeamPlayer_coordinates_check" CHECK (
    ("coordX" IS NULL AND "coordY" IS NULL)
    OR ("coordX" BETWEEN 0 AND 100 AND "coordY" BETWEEN 0 AND 100)
  );

CREATE UNIQUE INDEX "RachaMember_one_owner_per_racha"
  ON "RachaMember" ("rachaId")
  WHERE "role" = 'OWNER';

CREATE UNIQUE INDEX "MatchParticipant_waiting_queue_order_key"
  ON "MatchParticipant" ("matchId", "queueOrder")
  WHERE "status" = 'WAITING_LIST';

