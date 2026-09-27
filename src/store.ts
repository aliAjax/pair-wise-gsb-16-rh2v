import { Archive, EarSide } from "./types";

const KEY = "hxwl-fitting-archives-v1";

function ear(
  air: number[],
  bone: number[],
  speech: number,
  gains: number[],
  model: string,
  note = ""
): EarSide {
  return {
    thresholds: { air, bone, speech },
    aid: { model, style: "RIC 受话器外置式", formula: "NAL-NL2", gains, mpo: 124, note },
  };
}

function seed(): Archive[] {
  return [
    {
      id: "seed-liu-024",
      customer: "刘桂芳",
      phone: "138****2024",
      age: 68,
      gender: "女",
      lossType: "感音神经性",
      status: "初配进行中",
      createdAt: "2026-08-20",
      visits: [
        {
          id: "seed-liu-v1",
          date: "2026-08-20",
          kind: "initial",
          left: ear([25, 30, 45, 55, 65, 70], [20, 25, 40, 50, 60, 65], 72, [10, 14, 22, 28, 32, 30], "奥迪康 More 1", "双耳高频下降，2kHz 后增益提高 4dB"),
          right: ear([30, 35, 50, 60, 70, 75], [25, 30, 45, 55, 65, 70], 68, [12, 16, 24, 30, 34, 32], "奥迪康 More 1", "双耳高频下降，2kHz 后增益提高 4dB"),
          changeNote: "初配建档，记录基线听阈与增益",
          feedback: "首次戴机，需要适应期，两周后复诊",
        },
      ],
    },
    {
      id: "seed-chen-118",
      customer: "陈建军",
      phone: "139****8118",
      age: 45,
      gender: "男",
      lossType: "传导性",
      status: "复诊跟进",
      createdAt: "2026-07-10",
      visits: [
        {
          id: "seed-chen-v1",
          date: "2026-07-10",
          kind: "initial",
          left: ear([15, 15, 20, 20, 25, 30], [10, 10, 15, 15, 20, 25], 96, [0, 0, 0, 0, 0, 0], "未配机", "左耳听力基本正常，未配机"),
          right: ear([45, 50, 55, 60, 55, 50], [15, 20, 25, 25, 30, 35], 88, [18, 22, 26, 30, 26, 22], "峰力 Lumity L70", "单侧传导性损失，气骨导差明显"),
          changeNote: "初配建档，右耳单耳验配",
          feedback: "戴机后有轻微啸叫",
        },
        {
          id: "seed-chen-v2",
          date: "2026-08-05",
          kind: "followup",
          left: ear([15, 15, 20, 20, 25, 30], [10, 10, 15, 15, 20, 25], 96, [0, 0, 0, 0, 0, 0], "未配机", "左耳听力基本正常，未配机"),
          right: ear([45, 50, 55, 60, 55, 50], [15, 20, 25, 25, 30, 35], 90, [14, 18, 26, 30, 26, 22], "峰力 Lumity L70", "低频压缩略降"),
          changeNote: "低频压缩略降，反馈管理重新初始化",
          feedback: "啸叫已消失，佩戴舒适",
        },
      ],
    },
    {
      id: "seed-zhao-077",
      customer: "赵秀兰",
      phone: "137****6077",
      age: 74,
      gender: "女",
      lossType: "混合性",
      status: "复诊跟进",
      createdAt: "2026-06-15",
      visits: [
        {
          id: "seed-zhao-v1",
          date: "2026-06-15",
          kind: "initial",
          left: ear([40, 45, 55, 60, 65, 70], [30, 35, 45, 50, 55, 60], 64, [16, 20, 26, 30, 32, 30], "瑞声达 ONE 9", "老人语频区下降"),
          right: ear([45, 50, 60, 65, 70, 75], [35, 40, 50, 55, 60, 65], 62, [18, 22, 28, 32, 34, 32], "瑞声达 ONE 9", "老人语频区下降"),
          changeNote: "初配建档，双耳验配",
          feedback: "家人反映电视音量明显偏大",
        },
        {
          id: "seed-zhao-v2",
          date: "2026-09-01",
          kind: "followup",
          left: ear([40, 45, 55, 60, 65, 70], [30, 35, 45, 50, 55, 60], 76, [18, 22, 28, 32, 34, 32], "瑞声达 ONE 9", "语频区增益小幅提升"),
          right: ear([45, 50, 60, 65, 70, 75], [35, 40, 50, 55, 60, 65], 74, [20, 24, 30, 34, 36, 34], "瑞声达 ONE 9", "语频区增益小幅提升"),
          changeNote: "语频区增益 +2dB，开启降噪程序",
          feedback: "言语识别率从 64% 提升到 76%，日常对话明显轻松",
        },
      ],
    },
  ];
}

export function loadArchives(): Archive[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Archive[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // 数据损坏时回退到种子数据
  }
  const data = seed();
  saveArchives(data);
  return data;
}

export function saveArchives(archives: Archive[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(archives));
  } catch {
    // 存储不可用时静默失败，界面仍可使用
  }
}
