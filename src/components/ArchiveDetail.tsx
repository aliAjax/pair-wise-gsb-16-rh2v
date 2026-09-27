import { Archive, EarSide, FREQUENCIES, pta } from "../types";
import Audiogram from "./Audiogram";

interface Props {
  archive: Archive;
  onBack: () => void;
  onAddFollowup: () => void;
  onToggleStatus: () => void;
}

type RowKind = "threshold" | "speech" | "gain" | "text";

interface Row {
  label: string;
  b: number | string;
  c: number | string;
  kind: RowKind;
}

function deltaClass(kind: RowKind, delta: number): string {
  if (delta === 0) return "";
  if (kind === "threshold") return delta > 0 ? "delta-worse" : "delta-better";
  if (kind === "speech") return delta > 0 ? "delta-better" : "delta-worse";
  return "delta-neutral";
}

function CompareTable({ title, base, curr }: { title: string; base: EarSide; curr: EarSide }) {
  const rows: Row[] = [];
  FREQUENCIES.forEach((f, i) =>
    rows.push({ label: `气导 ${f}Hz (dB)`, b: base.thresholds.air[i], c: curr.thresholds.air[i], kind: "threshold" })
  );
  FREQUENCIES.forEach((f, i) =>
    rows.push({ label: `骨导 ${f}Hz (dB)`, b: base.thresholds.bone[i], c: curr.thresholds.bone[i], kind: "threshold" })
  );
  rows.push({ label: "言语识别率 (%)", b: base.thresholds.speech, c: curr.thresholds.speech, kind: "speech" });
  FREQUENCIES.forEach((f, i) =>
    rows.push({ label: `增益 ${f}Hz (dB)`, b: base.aid.gains[i], c: curr.aid.gains[i], kind: "gain" })
  );
  rows.push({ label: "最大输出 MPO (dB)", b: base.aid.mpo, c: curr.aid.mpo, kind: "gain" });
  rows.push({ label: "助听器型号", b: base.aid.model || "—", c: curr.aid.model || "—", kind: "text" });
  rows.push({
    label: "机型 / 公式",
    b: `${base.aid.style} · ${base.aid.formula}`,
    c: `${curr.aid.style} · ${curr.aid.formula}`,
    kind: "text",
  });

  return (
    <div>
      <h3 className="compare-title">{title}</h3>
      <table className="compare-table">
        <thead>
          <tr>
            <th>项目</th>
            <th>基线</th>
            <th>当前</th>
            <th>变化</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            if (row.kind === "text") {
              return (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td>{row.b}</td>
                  <td>{row.c}</td>
                  <td className={row.b === row.c ? "" : "delta-neutral"}>{row.b === row.c ? "—" : "已调整"}</td>
                </tr>
              );
            }
            const delta = Number(row.c) - Number(row.b);
            return (
              <tr key={row.label}>
                <td>{row.label}</td>
                <td>{row.b}</td>
                <td>{row.c}</td>
                <td className={deltaClass(row.kind, delta)}>
                  {delta === 0 ? "—" : `${delta > 0 ? "+" : ""}${delta}`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function ArchiveDetail({ archive, onBack, onAddFollowup, onToggleStatus }: Props) {
  const baseline = archive.visits[0];
  const current = archive.visits[archive.visits.length - 1];
  const daysSince = Math.max(
    0,
    Math.round((Date.now() - new Date(current.date).getTime()) / 86400000)
  );

  return (
    <>
      <section className="panel">
        <div className="section-heading">
          <div>
            <p>
              {archive.lossType} · {archive.status}
            </p>
            <h2>{archive.customer} 的验配档案</h2>
          </div>
          <div className="actions">
            <button onClick={onBack}>返回列表</button>
            <button onClick={onToggleStatus}>
              {archive.status === "已结案" ? "重新开启" : "结案"}
            </button>
            <button className="primary-action" onClick={onAddFollowup}>
              新增复诊
            </button>
          </div>
        </div>
        <div className="detail-meta">
          <span>
            性别 / 年龄：<strong>{archive.gender} / {archive.age} 岁</strong>
          </span>
          <span>
            联系电话：<strong>{archive.phone || "未登记"}</strong>
          </span>
          <span>
            建档日期：<strong>{archive.createdAt}</strong>
          </span>
          <span>
            最近就诊：<strong>{current.date}（{daysSince} 天前）</strong>
          </span>
          <span>
            就诊次数：<strong>{archive.visits.length}</strong>
          </span>
          <span>
            当前 PTA：<strong>左 {pta(current.left.thresholds.air)} dB / 右 {pta(current.right.thresholds.air)} dB</strong>
          </span>
        </div>
        {archive.visits.length === 1 && (
          <p className="hint">尚未复诊，当前值即初配基线；新增复诊后可在此对照基线与当前值。</p>
        )}
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p>听力曲线</p>
            <h2>基线与当前对照</h2>
          </div>
        </div>
        <div className="chart-grid">
          <Audiogram title="左耳" base={baseline.left.thresholds} curr={current.left.thresholds} />
          <Audiogram title="右耳" base={baseline.right.thresholds} curr={current.right.thresholds} />
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p>参数对照</p>
            <h2>听阈与增益明细</h2>
          </div>
        </div>
        <div className="compare-grid">
          <CompareTable title="左耳" base={baseline.left} curr={current.left} />
          <CompareTable title="右耳" base={baseline.right} curr={current.right} />
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p>就诊历史</p>
            <h2>历次就诊（{archive.visits.length}）</h2>
          </div>
        </div>
        <div className="timeline">
          {[...archive.visits].reverse().map((v) => (
            <article key={v.id} className="visit-card">
              <div className="visit-head">
                <span className={`badge ${v.kind === "initial" ? "badge-initial" : "badge-followup"}`}>
                  {v.kind === "initial" ? "初配基线" : "复诊"}
                </span>
                <strong>{v.date}</strong>
              </div>
              {v.changeNote && <p>调整：{v.changeNote}</p>}
              {v.feedback && <p>反馈：{v.feedback}</p>}
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
