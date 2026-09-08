type TeamPlanInput = {
  goalkeeperCount: number;
  goalkeepersPerTeam: number;
  outfieldCount: number;
  outfieldPlayersPerTeam: number;
};

export function calculateTeamPlan({ goalkeeperCount, goalkeepersPerTeam, outfieldCount, outfieldPlayersPerTeam }: TeamPlanInput) {
  if (!Number.isInteger(outfieldPlayersPerTeam) || outfieldPlayersPerTeam < 1) {
    throw new Error("A quantidade de jogadores de linha por time é inválida.");
  }

  const teamsFromOutfield = Math.ceil(outfieldCount / outfieldPlayersPerTeam);
  const teamsFromGoalkeepers = goalkeepersPerTeam > 0 ? Math.ceil(goalkeeperCount / goalkeepersPerTeam) : 0;
  const teamCount = Math.max(2, teamsFromOutfield, teamsFromGoalkeepers);

  return {
    missingGoalkeepers: Math.max(0, teamCount * goalkeepersPerTeam - goalkeeperCount),
    playersPerTeam: outfieldPlayersPerTeam + goalkeepersPerTeam,
    teamCount,
  };
}
