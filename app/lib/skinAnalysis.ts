export type SkinMetric = { type: string; region?: string; raw_score?: number; ui_score?: number; skin_type?: string };
export type SkinAnalysis = {
  status: "starting" | "running" | "success" | "error" | "uncertain";
  apiVersion: "2.1";
  metrics?: SkinMetric[];
  message?: string;
};
export const skinMetricLabels: Record<string, string> = {
  pore: "모공", texture: "피부결", redness: "붉은기", oiliness: "유분",
};
