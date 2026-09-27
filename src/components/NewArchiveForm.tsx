import { useState } from "react";
import {
  Archive,
  EarSide,
  LOSS_TYPES,
  LossType,
  Visit,
  emptyEarSide,
  today,
  uid,
} from "../types";
import EarSideForm from "./EarSideForm";

interface Props {
  onSubmit: (archive: Archive) => void;
  onCancel: () => void;
}

export default function NewArchiveForm({ onSubmit, onCancel }: Props) {
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState(60);
  const [gender, setGender] = useState<"男" | "女">("女");
  const [lossType, setLossType] = useState<LossType>("感音神经性");
  const [date, setDate] = useState(today());
  const [left, setLeft] = useState<EarSide>(emptyEarSide);
  const [right, setRight] = useState<EarSide>(emptyEarSide);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (!customer.trim()) {
      setError("请填写客户姓名");
      return;
    }
    const visit: Visit = {
      id: uid(),
      date,
      kind: "initial",
      left,
      right,
      changeNote: "初配建档，记录基线听阈与增益",
      feedback: feedback.trim(),
    };
    onSubmit({
      id: uid(),
      customer: customer.trim(),
      phone: phone.trim(),
      age,
      gender,
      lossType,
      status: "初配进行中",
      createdAt: date,
      visits: [visit],
    });
  };

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p>初配建档</p>
          <h2>新增验配档案</h2>
        </div>
        <button onClick={onCancel}>返回列表</button>
      </div>
      <p className="hint">
        保存后本次登记将作为该客户的基线档案；若该客户已有进行中的初配，系统会直接打开旧档案，不会重复建档。
      </p>

      <div className="field-grid">
        <label>
          <span>客户姓名 *</span>
          <input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="如 刘桂芳" />
        </label>
        <label>
          <span>联系电话</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="用于识别同一客户" />
        </label>
        <label>
          <span>年龄</span>
          <input type="number" min={0} max={120} value={age} onChange={(e) => setAge(Number(e.target.value) || 0)} />
        </label>
        <label>
          <span>性别</span>
          <select value={gender} onChange={(e) => setGender(e.target.value as "男" | "女")}>
            <option>女</option>
            <option>男</option>
          </select>
        </label>
        <label>
          <span>听损类型</span>
          <select value={lossType} onChange={(e) => setLossType(e.target.value as LossType)}>
            {LOSS_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label>
          <span>初配日期</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
      </div>

      <EarSideForm title="左耳" value={left} onChange={setLeft} />
      <EarSideForm title="右耳" value={right} onChange={setRight} />

      <label>
        <span>用户反馈</span>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="首次戴机感受、主诉等"
        />
      </label>

      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        <button onClick={onCancel}>取消</button>
        <button className="primary-action" onClick={submit}>
          保存初配基线
        </button>
      </div>
    </section>
  );
}
