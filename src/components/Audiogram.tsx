import { EarThresholds, FREQUENCIES } from "../types";

interface Props {
  title: string;
  base: EarThresholds;
  curr: EarThresholds;
}

const W = 420;
const H = 260;
const PAD_L = 40;
const PAD_R = 14;
const PAD_T = 14;
const PAD_B = 30;
const DB_TOP = -10;
const DB_BOTTOM = 120;

const x = (i: number) => PAD_L + (i * (W - PAD_L - PAD_R)) / (FREQUENCIES.length - 1);
const y = (db: number) => PAD_T + ((db - DB_TOP) / (DB_BOTTOM - DB_TOP)) * (H - PAD_T - PAD_B);
const line = (vals: number[]) => vals.map((v, i) => `${x(i)},${y(v)}`).join(" ");

const GRID_DBS = [-10, 0, 20, 40, 60, 80, 100, 120];

export default function Audiogram({ title, base, curr }: Props) {
  return (
    <figure className="audiogram">
      <figcaption>{title} 气导听力曲线</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title}听力曲线`}>
        {GRID_DBS.map((db) => (
          <g key={db}>
            <line className="grid" x1={PAD_L} x2={W - PAD_R} y1={y(db)} y2={y(db)} />
            <text className="axis" x={PAD_L - 6} y={y(db) + 4} textAnchor="end">
              {db}
            </text>
          </g>
        ))}
        {FREQUENCIES.map((f, i) => (
          <text key={f} className="axis" x={x(i)} y={H - 8} textAnchor="middle">
            {f >= 1000 ? `${f / 1000}k` : f}
          </text>
        ))}
        <polyline className="line-base" points={line(base.air)} />
        <polyline className="line-curr" points={line(curr.air)} />
        {base.air.map((v, i) => (
          <circle key={`b${i}`} className="pt-base" cx={x(i)} cy={y(v)} r={4} />
        ))}
        {curr.air.map((v, i) => (
          <circle key={`c${i}`} className="pt-curr" cx={x(i)} cy={y(v)} r={4} />
        ))}
      </svg>
      <div className="legend">
        <span className="lg-base">— 基线（初配）</span>
        <span className="lg-curr">— 当前</span>
      </div>
    </figure>
  );
}
