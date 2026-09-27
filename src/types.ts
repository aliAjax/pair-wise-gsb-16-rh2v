export const FREQUENCIES = [250, 500, 1000, 2000, 4000, 8000];

export interface EarThresholds {
  /** 气导听阈 dB HL，按 FREQUENCIES 顺序 */
  air: number[];
  /** 骨导听阈 dB HL */
  bone: number[];
  /** 言语识别率 % */
  speech: number;
}

export interface AidParams {
  model: string;
  style: string;
  formula: string;
  /** 各频率增益 dB */
  gains: number[];
  /** 最大输出 dB */
  mpo: number;
  note: string;
}

export interface EarSide {
  thresholds: EarThresholds;
  aid: AidParams;
}

export type VisitKind = "initial" | "followup";

export interface Visit {
  id: string;
  date: string;
  kind: VisitKind;
  left: EarSide;
  right: EarSide;
  /** 本次调整说明 */
  changeNote: string;
  /** 用户反馈 */
  feedback: string;
}

export type LossType = "感音神经性" | "传导性" | "混合性";
export const LOSS_TYPES: LossType[] = ["感音神经性", "传导性", "混合性"];

export type ArchiveStatus = "初配进行中" | "复诊跟进" | "已结案";
export const ARCHIVE_STATUSES: ArchiveStatus[] = ["初配进行中", "复诊跟进", "已结案"];

export interface Archive {
  id: string;
  customer: string;
  phone: string;
  age: number;
  gender: "男" | "女";
  lossType: LossType;
  status: ArchiveStatus;
  createdAt: string;
  /** 第一条为初配基线，之后依次为复诊记录 */
  visits: Visit[];
}

export const AID_STYLES = ["RIC 受话器外置式", "BTE 耳背式", "ITE 耳内式", "CIC 深耳道式", "定制耳内式"];
export const FITTING_FORMULAS = ["NAL-NL2", "DSL v5", "厂家默认", "经验公式"];

/** 500/1000/2000/4000 Hz 平均听阈 */
export function pta(air: number[]): number {
  const idx = [1, 2, 3, 4];
  return Math.round(idx.reduce((sum, i) => sum + (air[i] ?? 0), 0) / idx.length);
}

export function emptyEarSide(): EarSide {
  return {
    thresholds: {
      air: [20, 20, 20, 20, 20, 20],
      bone: [15, 15, 15, 15, 15, 15],
      speech: 80,
    },
    aid: {
      model: "",
      style: AID_STYLES[0],
      formula: FITTING_FORMULAS[0],
      gains: [0, 0, 0, 0, 0, 0],
      mpo: 120,
      note: "",
    },
  };
}

export function cloneEarSide(ear: EarSide): EarSide {
  return JSON.parse(JSON.stringify(ear)) as EarSide;
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
