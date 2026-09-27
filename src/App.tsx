import { useEffect, useMemo, useState } from "react";
import "./styles.css";

/* ---------- 数据模型 ---------- */

interface FittingData {
  leftAC: number; // 左耳气导 PTA dB
  rightAC: number; // 右耳气导 PTA dB
  leftBC: number; // 左耳骨导 dB
  rightBC: number; // 右耳骨导 dB
  leftSpeech: number; // 左耳言语识别率 %
  rightSpeech: number; // 右耳言语识别率 %
  aidModel: string; // 助听器型号
  leftGain: number; // 左耳增益 dB
  rightGain: number; // 右耳增益 dB
}

interface Visit {
  id: string;
  date: string; // ISO 日期
  note: string;
  data: FittingData; // 本次参数快照
  changes: string[]; // 相对上一次的变化（初配为空）
}

interface FittingRecord {
  id: string;
  customerName: string;
  phone: string;
  lossType: string; // 听损类型
  status: "初配进行中" | "复诊跟进";
  baseline: FittingData; // 初配基线，保存后不再修改
  current: FittingData; // 当前参数，随复诊更新
  visits: Visit[]; // visits[0] 为初配
  createdAt: string;
}

const LOSS_TYPES = ["感音神经性", "传导性", "混合性"];
const STATUS_OPTIONS = ["初配进行中", "复诊跟进"];

const METRICS: { key: keyof FittingData; label: string; unit: string }[] = [
  { key: "leftAC", label: "左耳气导", unit: "dB" },
  { key: "rightAC", label: "右耳气导", unit: "dB" },
  { key: "leftBC", label: "左耳骨导", unit: "dB" },
  { key: "rightBC", label: "右耳骨导", unit: "dB" },
  { key: "leftSpeech", label: "左耳言语识别率", unit: "%" },
  { key: "rightSpeech", label: "右耳言语识别率", unit: "%" },
  { key: "leftGain", label: "左耳增益", unit: "dB" },
  { key: "rightGain", label: "右耳增益", unit: "dB" },
];

const STORAGE_KEY = "hearing-fitting-archives-v1";

const emptyFitting: FittingData = {
  leftAC: 0,
  rightAC: 0,
  leftBC: 0,
  rightBC: 0,
  leftSpeech: 0,
  rightSpeech: 0,
  aidModel: "",
  leftGain: 0,
  rightGain: 0,
};

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/** 计算两次参数之间的变化描述 */
function computeChanges(prev: FittingData, next: FittingData): string[] {
  const changes: string[] = [];
  for (const m of METRICS) {
    const a = prev[m.key] as number;
    const b = next[m.key] as number;
    if (a !== b) {
      const delta = b - a;
      changes.push(
        `${m.label}：${a} → ${b} ${m.unit}（${delta > 0 ? "+" : ""}${delta}）`
      );
    }
  }
  if (prev.aidModel !== next.aidModel) {
    changes.push(`助听器型号：${prev.aidModel || "未填写"} → ${next.aidModel || "未填写"}`);
  }
  return changes;
}

/* ---------- 示例数据（首次打开时写入） ---------- */

function seedRecords(): FittingRecord[] {
  const liuBaseline: FittingData = {
    leftAC: 55,
    rightAC: 60,
    leftBC: 50,
    rightBC: 55,
    leftSpeech: 72,
    rightSpeech: 68,
    aidModel: "瑞声达 RIC RT961",
    leftGain: 28,
    rightGain: 32,
  };
  const liuCurrent: FittingData = {
    ...liuBaseline,
    leftGain: 32,
    rightGain: 36,
    leftSpeech: 80,
    rightSpeech: 76,
  };
  return [
    {
      id: uid(),
      customerName: "刘淑华",
      phone: "138****2024",
      lossType: "感音神经性",
      status: "复诊跟进",
      baseline: liuBaseline,
      current: liuCurrent,
      createdAt: "2026-08-10",
      visits: [
        {
          id: uid(),
          date: "2026-08-10",
          note: "双耳高频下降，初次验配，双耳 RIC 机型。",
          data: liuBaseline,
          changes: [],
        },
        {
          id: uid(),
          date: "2026-09-06",
          note: "佩戴四周复诊，2kHz 后增益提高 4dB，言语识别率明显提升。",
          data: liuCurrent,
          changes: computeChanges(liuBaseline, liuCurrent),
        },
      ],
    },
    {
      id: uid(),
      customerName: "陈建国",
      phone: "139****8871",
      lossType: "传导性",
      status: "初配进行中",
      baseline: {
        leftAC: 45,
        rightAC: 30,
        leftBC: 20,
        rightBC: 15,
        leftSpeech: 84,
        rightSpeech: 92,
        aidModel: "峰力 BTE P90",
        leftGain: 26,
        rightGain: 18,
      },
      current: {
        leftAC: 45,
        rightAC: 30,
        leftBC: 20,
        rightBC: 15,
        leftSpeech: 84,
        rightSpeech: 92,
        aidModel: "峰力 BTE P90",
        leftGain: 26,
        rightGain: 18,
      },
      createdAt: "2026-09-20",
      visits: [
        {
          id: uid(),
          date: "2026-09-20",
          note: "单侧传导性损失，左耳选配 BTE，待四周后复诊。",
          data: {
            leftAC: 45,
            rightAC: 30,
            leftBC: 20,
            rightBC: 15,
            leftSpeech: 84,
            rightSpeech: 92,
            aidModel: "峰力 BTE P90",
            leftGain: 26,
            rightGain: 18,
          },
          changes: [],
        },
      ],
    },
  ];
}

function loadRecords(): FittingRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as FittingRecord[];
  } catch {
    // 数据损坏时回退到示例数据
  }
  return seedRecords();
}

/* ---------- 表单组件 ---------- */

type FittingFormState = Record<keyof FittingData, string>;

function toFormState(data: FittingData): FittingFormState {
  return {
    leftAC: String(data.leftAC),
    rightAC: String(data.rightAC),
    leftBC: String(data.leftBC),
    rightBC: String(data.rightBC),
    leftSpeech: String(data.leftSpeech),
    rightSpeech: String(data.rightSpeech),
    aidModel: data.aidModel,
    leftGain: String(data.leftGain),
    rightGain: String(data.rightGain),
  };
}

function toFittingData(form: FittingFormState): FittingData {
  const num = (v: string) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  return {
    leftAC: num(form.leftAC),
    rightAC: num(form.rightAC),
    leftBC: num(form.leftBC),
    rightBC: num(form.rightBC),
    leftSpeech: num(form.leftSpeech),
    rightSpeech: num(form.rightSpeech),
    aidModel: form.aidModel.trim(),
    leftGain: num(form.leftGain),
    rightGain: num(form.rightGain),
  };
}

function FittingFields({
  value,
  onChange,
}: {
  value: FittingFormState;
  onChange: (next: FittingFormState) => void;
}) {
  const set = (key: keyof FittingData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [key]: e.target.value });
  return (
    <div className="field-grid">
      {METRICS.map((m) => (
        <label key={m.key}>
          <span>
            {m.label}（{m.unit}）
          </span>
          <input
            type="number"
            value={value[m.key]}
            onChange={set(m.key)}
            placeholder={`填写${m.label}`}
          />
        </label>
      ))}
      <label className="span-2">
        <span>助听器型号</span>
        <input
          value={value.aidModel}
          onChange={set("aidModel")}
          placeholder="如：瑞声达 RIC RT961"
        />
      </label>
    </div>
  );
}

/* ---------- 主应用 ---------- */

type View = { type: "list" } | { type: "detail"; id: string } | { type: "new" };

function App() {
  const [records, setRecords] = useState<FittingRecord[]>(loadRecords);
  const [view, setView] = useState<View>({ type: "list" });
  const [notice, setNotice] = useState("");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [lossFilter, setLossFilter] = useState("全部");

  // 持久化：任何变更都写回 localStorage，重新打开页面仍在
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(t);
  }, [notice]);

  const filtered = useMemo(
    () =>
      records.filter(
        (r) =>
          (statusFilter === "全部" || r.status === statusFilter) &&
          (lossFilter === "全部" || r.lossType === lossFilter)
      ),
    [records, statusFilter, lossFilter]
  );

  const stats = useMemo(() => {
    const followups = records.reduce((sum, r) => sum + r.visits.length - 1, 0);
    return [
      { label: "档案总数", value: String(records.length) },
      {
        label: "初配进行中",
        value: String(records.filter((r) => r.status === "初配进行中").length),
      },
      {
        label: "复诊跟进",
        value: String(records.filter((r) => r.status === "复诊跟进").length),
      },
      { label: "累计复诊次数", value: String(followups) },
    ];
  }, [records]);

  /** 新增初配：同一客户已有进行中的初配则打开旧档案 */
  function handleCreate(customerName: string, phone: string, lossType: string, data: FittingData, note: string) {
    const name = customerName.trim();
    const existing = records.find(
      (r) => r.customerName === name && r.status === "初配进行中"
    );
    if (existing) {
      setNotice(`「${name}」已有进行中的初配档案，已为您打开旧档案，未重复新建。`);
      setView({ type: "detail", id: existing.id });
      return;
    }
    const record: FittingRecord = {
      id: uid(),
      customerName: name,
      phone: phone.trim(),
      lossType,
      status: "初配进行中",
      baseline: data,
      current: data,
      createdAt: today(),
      visits: [{ id: uid(), date: today(), note, data, changes: [] }],
    };
    setRecords((prev) => [record, ...prev]);
    setNotice(`已为「${name}」建立初配档案，本次参数已保存为基线。`);
    setView({ type: "detail", id: record.id });
  }

  /** 复诊：更新当前参数并追加变化，基线与历史复诊保持不变 */
  function handleFollowUp(recordId: string, data: FittingData, note: string) {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== recordId) return r;
        const visit: Visit = {
          id: uid(),
          date: today(),
          note,
          data,
          changes: computeChanges(r.current, data),
        };
        return {
          ...r,
          current: data,
          status: "复诊跟进",
          visits: [...r.visits, visit],
        };
      })
    );
    setNotice("复诊已保存：当前参数已更新，变化已追加到复诊记录。");
  }

  const detail =
    view.type === "detail" ? records.find((r) => r.id === view.id) : undefined;

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">hxwl-01 · 门店听力师工作台</p>
          <h1>听力验配档案</h1>
          <p className="subtitle">
            登记左右耳气导、骨导、言语识别率与助听器参数；初配保存为基线，复诊更新当前参数并追加变化，历史听阈与增益完整保留。
          </p>
        </div>
        <div className="stack-card">
          <span>今日</span>
          <strong>{fmtDate(today())}</strong>
          <span>数据保存在本机浏览器，重新打开不丢失</span>
        </div>
      </section>

      <section className="metrics-grid">
        {stats.map((s, i) => (
          <article className="metric-card" key={s.label}>
            <span>{s.label}</span>
            <strong>{s.value}</strong>
            <i className={["status-ok", "status-watch", "status-ok", "status-danger"][i]} />
          </article>
        ))}
      </section>

      {notice && <div className="notice">{notice}</div>}

      {view.type === "new" && (
        <NewRecordPanel
          onCancel={() => setView({ type: "list" })}
          onSubmit={handleCreate}
        />
      )}

      {view.type === "detail" && detail && (
        <RecordDetail
          record={detail}
          onBack={() => setView({ type: "list" })}
          onFollowUp={handleFollowUp}
        />
      )}

      {view.type === "list" && (
        <section className="workspace">
          <aside className="panel narrow">
            <button className="primary-action block" onClick={() => setView({ type: "new" })}>
              + 新增初配档案
            </button>
            <h2>复诊状态</h2>
            <div className="chips">
              {["全部", ...STATUS_OPTIONS].map((s) => (
                <button
                  key={s}
                  className={statusFilter === s ? "chip-active" : ""}
                  onClick={() => setStatusFilter(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <h2>听损类型</h2>
            <div className="chips">
              {["全部", ...LOSS_TYPES].map((t) => (
                <button
                  key={t}
                  className={lossFilter === t ? "chip-active" : ""}
                  onClick={() => setLossFilter(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </aside>

          <section className="panel">
            <div className="section-heading">
              <div>
                <p>验配档案</p>
                <h2>客户列表（{filtered.length}）</h2>
              </div>
            </div>
            <div className="record-list">
              {filtered.length === 0 && (
                <p className="empty">没有符合筛选条件的档案。</p>
              )}
              {filtered.map((r) => (
                <article
                  key={r.id}
                  className="record-card clickable"
                  onClick={() => setView({ type: "detail", id: r.id })}
                >
                  <div className="record-index">{r.customerName.slice(0, 1)}</div>
                  <div>
                    <h3>
                      {r.customerName}
                      <span className={`badge ${r.status === "初配进行中" ? "badge-warn" : "badge-ok"}`}>
                        {r.status}
                      </span>
                      <span className="badge">{r.lossType}</span>
                    </h3>
                    <p>
                      气导 左 {r.current.leftAC} / 右 {r.current.rightAC} dB ·
                      言语识别率 左 {r.current.leftSpeech}% / 右 {r.current.rightSpeech}% ·{" "}
                      {r.current.aidModel || "未填写机型"}
                    </p>
                    <p className="meta">
                      建档 {fmtDate(r.createdAt)} · 复诊 {r.visits.length - 1} 次 · 最近更新{" "}
                      {fmtDate(r.visits[r.visits.length - 1].date)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      )}
    </main>
  );
}

/* ---------- 新增初配 ---------- */

function NewRecordPanel({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (name: string, phone: string, lossType: string, data: FittingData, note: string) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [lossType, setLossType] = useState(LOSS_TYPES[0]);
  const [note, setNote] = useState("");
  const [form, setForm] = useState<FittingFormState>(toFormState(emptyFitting));
  const [error, setError] = useState("");

  function submit() {
    if (!name.trim()) {
      setError("请填写客户姓名。");
      return;
    }
    onSubmit(name, phone, lossType, toFittingData(form), note.trim());
  }

  return (
    <section className="panel form-panel">
      <div className="section-heading">
        <div>
          <p>初配登记</p>
          <h2>新增验配档案</h2>
        </div>
        <button onClick={onCancel}>返回列表</button>
      </div>
      <p className="hint">
        保存后本次参数将作为基线长期保留；若该客户已有进行中的初配，系统会直接打开旧档案而不会重复新建。
      </p>
      <div className="field-grid">
        <label>
          <span>客户姓名 *</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="填写客户姓名" />
        </label>
        <label>
          <span>联系电话</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="填写联系电话" />
        </label>
        <label>
          <span>听损类型</span>
          <select value={lossType} onChange={(e) => setLossType(e.target.value)}>
            {LOSS_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label>
          <span>验配备注</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="如：双耳高频下降，初次验配" />
        </label>
      </div>
      <h3 className="form-subtitle">听力与助听器参数</h3>
      <FittingFields value={form} onChange={setForm} />
      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        <button className="primary-action" onClick={submit}>
          保存初配（设为基线）
        </button>
        <button onClick={onCancel}>取消</button>
      </div>
    </section>
  );
}

/* ---------- 档案详情 ---------- */

function RecordDetail({
  record,
  onBack,
  onFollowUp,
}: {
  record: FittingRecord;
  onBack: () => void;
  onFollowUp: (recordId: string, data: FittingData, note: string) => void;
}) {
  const [showFollowUp, setShowFollowUp] = useState(false);

  return (
    <section className="panel form-panel">
      <div className="section-heading">
        <div>
          <p>验配档案 · 建档 {fmtDate(record.createdAt)}</p>
          <h2>
            {record.customerName}
            <span className={`badge ${record.status === "初配进行中" ? "badge-warn" : "badge-ok"}`}>
              {record.status}
            </span>
            <span className="badge">{record.lossType}</span>
          </h2>
          <p className="meta">联系电话：{record.phone || "未填写"}</p>
        </div>
        <div className="form-actions">
          <button className="primary-action" onClick={() => setShowFollowUp((v) => !v)}>
            {showFollowUp ? "收起复诊表单" : "+ 新增复诊"}
          </button>
          <button onClick={onBack}>返回列表</button>
        </div>
      </div>

      {showFollowUp && (
        <FollowUpForm
          record={record}
          onSubmit={(data, note) => {
            onFollowUp(record.id, data, note);
            setShowFollowUp(false);
          }}
        />
      )}

      <h3 className="form-subtitle">基线 / 当前对照</h3>
      <div className="table-wrap">
        <table className="compare-table">
          <thead>
            <tr>
              <th>项目</th>
              <th>初配基线</th>
              <th>当前值</th>
              <th>较基线变化</th>
            </tr>
          </thead>
          <tbody>
            {METRICS.map((m) => {
              const base = record.baseline[m.key] as number;
              const cur = record.current[m.key] as number;
              const delta = cur - base;
              return (
                <tr key={m.key}>
                  <td>{m.label}</td>
                  <td>
                    {base} {m.unit}
                  </td>
                  <td>
                    {cur} {m.unit}
                  </td>
                  <td className={delta === 0 ? "" : delta > 0 ? "delta-up" : "delta-down"}>
                    {delta === 0 ? "—" : `${delta > 0 ? "+" : ""}${delta} ${m.unit}`}
                  </td>
                </tr>
              );
            })}
            <tr>
              <td>助听器型号</td>
              <td>{record.baseline.aidModel || "未填写"}</td>
              <td>{record.current.aidModel || "未填写"}</td>
              <td className={record.baseline.aidModel === record.current.aidModel ? "" : "delta-up"}>
                {record.baseline.aidModel === record.current.aidModel ? "—" : "已更换"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 className="form-subtitle">复诊记录（{record.visits.length}）</h3>
      <div className="visit-list">
        {[...record.visits].reverse().map((v, idx) => {
          const isBaseline = v.id === record.visits[0].id;
          const seq = record.visits.length - idx;
          return (
            <article key={v.id} className="visit-item">
              <div className="visit-head">
                <strong>{isBaseline ? "初配（基线）" : `第 ${seq - 1} 次复诊`}</strong>
                <span>{fmtDate(v.date)}</span>
              </div>
              {v.note && <p>{v.note}</p>}
              <p className="meta">
                气导 左 {v.data.leftAC} / 右 {v.data.rightAC} dB · 骨导 左 {v.data.leftBC} / 右{" "}
                {v.data.rightBC} dB · 言语识别率 左 {v.data.leftSpeech}% / 右 {v.data.rightSpeech}% ·
                增益 左 {v.data.leftGain} / 右 {v.data.rightGain} dB · {v.data.aidModel || "未填写机型"}
              </p>
              {v.changes.length > 0 && (
                <div className="chips">
                  {v.changes.map((c) => (
                    <span key={c} className="change-chip">
                      {c}
                    </span>
                  ))}
                </div>
              )}
              {!isBaseline && v.changes.length === 0 && (
                <p className="meta">本次参数与上次一致，无变化。</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function FollowUpForm({
  record,
  onSubmit,
}: {
  record: FittingRecord;
  onSubmit: (data: FittingData, note: string) => void;
}) {
  // 以当前参数为起点，避免重抄未变项目
  const [form, setForm] = useState<FittingFormState>(toFormState(record.current));
  const [note, setNote] = useState("");

  return (
    <div className="followup-form">
      <h3 className="form-subtitle">新增复诊（{fmtDate(today())}）</h3>
      <p className="hint">保存后将更新当前参数并追加一条复诊记录；初配基线与历史复诊不受影响。</p>
      <FittingFields value={form} onChange={setForm} />
      <label className="followup-note">
        <span>复诊备注</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="如：佩戴四周复诊，反馈啸叫已消失"
        />
      </label>
      <div className="form-actions">
        <button className="primary-action" onClick={() => onSubmit(toFittingData(form), note.trim())}>
          保存复诊
        </button>
      </div>
    </div>
  );
}

export default App;
