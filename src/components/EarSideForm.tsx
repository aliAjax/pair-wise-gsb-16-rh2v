import { AID_STYLES, EarSide, FITTING_FORMULAS, FREQUENCIES } from "../types";

interface Props {
  title: string;
  value: EarSide;
  onChange: (next: EarSide) => void;
}

function num(value: string, fallback: number): number {
  if (value === "") return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export default function EarSideForm({ title, value, onChange }: Props) {
  const setAir = (i: number, v: number) => {
    const air = [...value.thresholds.air];
    air[i] = v;
    onChange({ ...value, thresholds: { ...value.thresholds, air } });
  };
  const setBone = (i: number, v: number) => {
    const bone = [...value.thresholds.bone];
    bone[i] = v;
    onChange({ ...value, thresholds: { ...value.thresholds, bone } });
  };
  const setGain = (i: number, v: number) => {
    const gains = [...value.aid.gains];
    gains[i] = v;
    onChange({ ...value, aid: { ...value.aid, gains } });
  };
  const setAid = (patch: Partial<EarSide["aid"]>) =>
    onChange({ ...value, aid: { ...value.aid, ...patch } });

  return (
    <fieldset className="ear-form">
      <legend>{title}</legend>
      <div className="freq-table">
        <div className="freq-row freq-head">
          <span>频率 Hz</span>
          {FREQUENCIES.map((f) => (
            <span key={f}>{f}</span>
          ))}
        </div>
        <div className="freq-row">
          <span>气导 dB</span>
          {value.thresholds.air.map((v, i) => (
            <input
              key={i}
              type="number"
              min={-10}
              max={120}
              step={5}
              value={v}
              onChange={(e) => setAir(i, num(e.target.value, v))}
            />
          ))}
        </div>
        <div className="freq-row">
          <span>骨导 dB</span>
          {value.thresholds.bone.map((v, i) => (
            <input
              key={i}
              type="number"
              min={-10}
              max={120}
              step={5}
              value={v}
              onChange={(e) => setBone(i, num(e.target.value, v))}
            />
          ))}
        </div>
        <div className="freq-row">
          <span>增益 dB</span>
          {value.aid.gains.map((v, i) => (
            <input
              key={i}
              type="number"
              min={0}
              max={80}
              step={1}
              value={v}
              onChange={(e) => setGain(i, num(e.target.value, v))}
            />
          ))}
        </div>
      </div>
      <div className="field-grid">
        <label>
          <span>言语识别率 %</span>
          <input
            type="number"
            min={0}
            max={100}
            value={value.thresholds.speech}
            onChange={(e) =>
              onChange({
                ...value,
                thresholds: { ...value.thresholds, speech: num(e.target.value, value.thresholds.speech) },
              })
            }
          />
        </label>
        <label>
          <span>助听器型号</span>
          <input
            placeholder="如 奥迪康 More 1"
            value={value.aid.model}
            onChange={(e) => setAid({ model: e.target.value })}
          />
        </label>
        <label>
          <span>机型</span>
          <select value={value.aid.style} onChange={(e) => setAid({ style: e.target.value })}>
            {AID_STYLES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          <span>验配公式</span>
          <select value={value.aid.formula} onChange={(e) => setAid({ formula: e.target.value })}>
            {FITTING_FORMULAS.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </label>
        <label>
          <span>最大输出 MPO dB</span>
          <input
            type="number"
            min={80}
            max={140}
            value={value.aid.mpo}
            onChange={(e) => setAid({ mpo: num(e.target.value, value.aid.mpo) })}
          />
        </label>
        <label>
          <span>参数备注</span>
          <input
            placeholder="如 2kHz 后增益提高 4dB"
            value={value.aid.note}
            onChange={(e) => setAid({ note: e.target.value })}
          />
        </label>
      </div>
    </fieldset>
  );
}
