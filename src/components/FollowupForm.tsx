import { useState } from "react";
import { Archive, EarSide, Visit, cloneEarSide, today, uid } from "../types";
import EarSideForm from "./EarSideForm";

interface Props {
  archive: Archive;
  onSave: (visit: Visit) => void;
  onCancel: () => void;
}

export default function FollowupForm({ archive, onSave, onCancel }: Props) {
  const last = archive.visits[archive.visits.length - 1];
  const [date, setDate] = useState(today());
  const [left, setLeft] = useState<EarSide>(() => cloneEarSide(last.left));
  const [right, setRight] = useState<EarSide>(() => cloneEarSide(last.right));
  const [changeNote, setChangeNote] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (!changeNote.trim()) {
      setError("请填写本次调整说明，便于追踪参数变化");
      return;
    }
    onSave({
      id: uid(),
      date,
      kind: "followup",
      left,
      right,
      changeNote: changeNote.trim(),
      feedback: feedback.trim(),
    });
  };

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p>{archive.customer} · 第 {archive.visits.length + 1} 次就诊</p>
          <h2>新增复诊记录</h2>
        </div>
        <button onClick={onCancel}>返回档案</button>
      </div>
      <p className="hint">
        表单已预填上次就诊的听阈与参数，请在此基础上修改；保存后追加为新的当前值，初配基线不会改动。
      </p>

      <div className="field-grid">
        <label>
          <span>复诊日期</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
      </div>

      <EarSideForm title="左耳" value={left} onChange={setLeft} />
      <EarSideForm title="右耳" value={right} onChange={setRight} />

      <div className="field-grid">
        <label>
          <span>本次调整说明 *</span>
          <textarea
            value={changeNote}
            onChange={(e) => setChangeNote(e.target.value)}
            placeholder="如 低频压缩略降，语频区增益 +2dB"
          />
        </label>
        <label>
          <span>用户反馈</span>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="佩戴感受、主诉变化等"
          />
        </label>
      </div>

      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        <button onClick={onCancel}>取消</button>
        <button className="primary-action" onClick={submit}>
          保存复诊记录
        </button>
      </div>
    </section>
  );
}
