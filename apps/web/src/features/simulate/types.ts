export interface EngineerOverride {
  callsPerDayMin?: number;
  callsPerDayMax?: number;
  validationRate?: number;
  acceptanceRate?: number;
  agentIds?: string[];
}

export interface EngineerSimConfig {
  userId: string;
  callsPerDayMin: number;
  callsPerDayMax: number;
  validationRate: number;
  acceptanceRate: number;
  agentIds: string[];
}
