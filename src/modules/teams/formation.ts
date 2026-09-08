import type { RachaFormatValue } from "@/modules/rachas/formats";

type FormationPlayer = {
  id: string;
  primaryPosition: string | null;
};

export type PlayerCoordinate = {
  id: string;
  x: number;
  y: number;
};

const FORMAT_COLUMNS: Record<RachaFormatValue, number> = {
  FUTSAL: 3,
  FUT7: 4,
  FUT11: 5,
  CUSTOM: 4,
};
export function assignFormationCoordinates(players: FormationPlayer[], format: RachaFormatValue): PlayerCoordinate[] {
  const groups = new Map<string, FormationPlayer[]>([
    ["GOALKEEPER", []],
    ["DEFENDER", []],
    ["MIDFIELDER", []],
    ["ATTACKER", []],
  ]);

  for (const player of players) {
    const category = groups.has(player.primaryPosition ?? "") ? player.primaryPosition! : "MIDFIELDER";
    groups.get(category)!.push(player);
  }

  return [
    ...placeGroup(groups.get("GOALKEEPER")!, 89, 10, Math.max(2, FORMAT_COLUMNS[format] - 1)),
    ...placeGroup(groups.get("DEFENDER")!, 69, 12, FORMAT_COLUMNS[format]),
    ...placeGroup(groups.get("MIDFIELDER")!, 47, 12, FORMAT_COLUMNS[format]),
    ...placeGroup(groups.get("ATTACKER")!, 23, 12, FORMAT_COLUMNS[format]),
  ];
}

function placeGroup(players: FormationPlayer[], centerY: number, rowGap: number, maxColumns: number) {
  if (!players.length) return [];
  const rowCount = Math.ceil(players.length / maxColumns);
  const coordinates: PlayerCoordinate[] = [];

  for (let row = 0; row < rowCount; row += 1) {
    const rowPlayers = players.slice(row * maxColumns, (row + 1) * maxColumns);
    const y = centerY + (row - (rowCount - 1) / 2) * rowGap;
    rowPlayers.forEach((player, index) => {
      coordinates.push({
        id: player.id,
        x: ((index + 1) * 100) / (rowPlayers.length + 1),
        y: Math.min(94, Math.max(8, y)),
      });
    });
  }

  return coordinates;
}
