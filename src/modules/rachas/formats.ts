export const RACHA_FORMATS = ["FUTSAL", "FUT7", "FUT11", "CUSTOM"] as const;

export type RachaFormatValue = (typeof RACHA_FORMATS)[number];

type PositionDefinition = {
  name: string;
  shortName: string;
  category: "GOALKEEPER" | "DEFENDER" | "MIDFIELDER" | "ATTACKER";
};

type FormatConfig = {
  label: string;
  outfieldPlayers: number;
  goalkeepersPerTeam: number;
  teamCount: number;
  positions: PositionDefinition[];
};

const goalkeeper: PositionDefinition = {
  name: "Goleiro",
  shortName: "GOL",
  category: "GOALKEEPER",
};

export const FORMAT_CONFIGS: Record<RachaFormatValue, FormatConfig> = {
  FUTSAL: {
    label: "Futsal",
    outfieldPlayers: 4,
    goalkeepersPerTeam: 1,
    teamCount: 2,
    positions: [
      goalkeeper,
      { name: "Fixo", shortName: "FIX", category: "DEFENDER" },
      { name: "Ala", shortName: "ALA", category: "MIDFIELDER" },
      { name: "Pivô", shortName: "PIV", category: "ATTACKER" },
    ],
  },
  FUT7: {
    label: "Fut7",
    outfieldPlayers: 6,
    goalkeepersPerTeam: 1,
    teamCount: 2,
    positions: [
      goalkeeper,
      { name: "Zagueiro", shortName: "ZAG", category: "DEFENDER" },
      { name: "Lateral", shortName: "LAT", category: "DEFENDER" },
      { name: "Volante", shortName: "VOL", category: "MIDFIELDER" },
      { name: "Meia", shortName: "MEI", category: "MIDFIELDER" },
      { name: "Atacante", shortName: "ATA", category: "ATTACKER" },
    ],
  },
  FUT11: {
    label: "Fut11",
    outfieldPlayers: 10,
    goalkeepersPerTeam: 1,
    teamCount: 2,
    positions: [
      goalkeeper,
      { name: "Zagueiro", shortName: "ZAG", category: "DEFENDER" },
      { name: "Lateral Direito", shortName: "LD", category: "DEFENDER" },
      { name: "Lateral Esquerdo", shortName: "LE", category: "DEFENDER" },
      { name: "Volante", shortName: "VOL", category: "MIDFIELDER" },
      { name: "Meia", shortName: "MEI", category: "MIDFIELDER" },
      { name: "Ponta", shortName: "PON", category: "ATTACKER" },
      { name: "Atacante", shortName: "ATA", category: "ATTACKER" },
    ],
  },
  CUSTOM: {
    label: "Personalizado",
    outfieldPlayers: 6,
    goalkeepersPerTeam: 1,
    teamCount: 2,
    positions: [
      goalkeeper,
      { name: "Defensor", shortName: "DEF", category: "DEFENDER" },
      { name: "Meio-campo", shortName: "MEI", category: "MIDFIELDER" },
      { name: "Atacante", shortName: "ATA", category: "ATTACKER" },
    ],
  },
};

export function isRachaFormat(value: string): value is RachaFormatValue {
  return RACHA_FORMATS.some((format) => format === value);
}
