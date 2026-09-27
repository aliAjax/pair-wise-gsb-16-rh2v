import { useEffect, useMemo, useState } from "react";
import "./styles.css";
import {
  ARCHIVE_STATUSES,
  Archive,
  ArchiveStatus,
  LOSS_TYPES,
  LossType,
  Visit,
  pta,
} from "./types";
import { loadArchives, saveArchives } from "./store";
import NewArchiveForm from "./components/NewArchiveForm";
import FollowupForm from "./components/FollowupForm";
import ArchiveDetail from "./components/ArchiveDetail";

type View =
  | { name: "list" }
  | { name: "new" }
  | { name: "detail"; id: string }
  | { name: "followup"; id: string };

function lastVisit(a: Archive): Visit {
  return a.visits[a.visits.length - 1];
}

const STATUS_BADGE: Record<ArchiveStatus, string> = {
  初配进行中: "badge st-doing",
  复诊跟进: "badge st-follow",
  已结案: "badge st-closed",
};

export default function App() {
  const [archives, setArchives] = useState<Archive[]>(loadArchives);
  const [view, setView] = useState<View>({ name: "list" });
  const [statusFilter, setStatusFilter] = useState<ArchiveStatus | "全部">("全部");
  const [lossFilter, setLossFilter] = useState<LossType | "全部">("全部");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    saveArchives(archives);
  }, [archives]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3600);
    return () => clearTimeout(timer);
  }, [toast]);

  const filtered = useMemo(
    () =>
      archives
        .filter((a) => statusFilter === "全部" || a.status === statusFilter)
        .filter((a) => lossFilter === "全部" || a.lossType === lossFilter)
        .filter((a) => {
          const q = query.trim();
          return !q || a.customer.includes(q) || a.phone.includes(q);
        })
        .sort((x, y) => lastVisit(y).date.localeCompare(lastVisit(x).date)),
    [archives, statusFilter, lossFilter, query]
  );

  const metrics = useMemo(() => {
    const doing = archives.filter((a) => a.status === "初配进行中").length;
    const follow = archives.filter((a) => a.status === "复诊跟进").length;
    const gains = archives
      .filter((a) => a.visits.length > 1)
      .map((a) => {
        const b = a.visits[0];
        const c = lastVisit(a);
        return (
          (c.left.thresholds.speech + c.right.thresholds.speech -
            b.left.thresholds.speech -
            b.right.thresholds.speech) / 2
        );
      });
    const avgGain = gains.length
      ? Math.round(gains.reduce((s, v) => s + v, 0) / gains.length)
      : 0;
    return { total: archives.length, doing, follow, avgGain };
  }, [archives]);

  /** 同一客户已有进行中的初配时打开旧档案，不再新建 */
  const handleCreate = (draft: Archive) => {
    const existing = archives.find(
      (a) =>
        a.status === "初配进行中" &&
        a.customer.trim() === draft.customer.trim() &&
        (a.phone.trim() === draft.phone.trim() || !a.phone.trim() || !draft.phone.trim())
    );
    if (existing) {
      setToast(`「${existing.customer}」已有进行中的初配档案，已为你打开旧档案`);
      setView({ name: "detail", id: existing.id });
      return;
    }
    setArchives((prev) => [...prev, draft]);
    setToast(`已为「${draft.customer}」建立初配档案，本次登记已保存为基线`);
    setView({ name: "detail", id: draft.id });
  };

  const handleFollowup = (archiveId: string, visit: Visit) => {
    setArchives((prev) =>
      prev.map((a) =>
        a.id === archiveId
          ? {
              ...a,
              status: a.status === "已结案" ? a.status : "复诊跟进",
              visits: [...a.visits, visit],
            }
          : a
      )
    );
    setToast("复诊记录已追加：当前参数已更新，初配基线保持不变");
    setView({ name: "detail", id: archiveId });
  };

  const toggleStatus = (id: string) => {
    setArchives((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        if (a.status === "已结案") {
          return { ...a, status: a.visits.length > 1 ? "复诊跟进" : "初配进行中" };
        }
        return { ...a, status: "已结案" };
      })
    );
  };

  const openArchive =
    view.name === "detail" || view.name === "followup"
      ? archives.find((a) => a.id === view.id)
      : undefined;

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">hxwl-01 · 门店验配工作台</p>
          <h1>听力验配记录</h1>
          <p className="subtitle">
            登记左右耳气导、骨导、言语识别率与助听器参数；初配保存为基线，复诊追加变化，
            档案数据保存在本机浏览器，重新打开仍可查看。
          </p>
        </div>
        <div className="stack-card">
          <span>使用角色</span>
          <strong>听力师 · 门店主管 · 复诊助理</strong>
        </div>
      </section>

      <section className="metrics-grid">
        <article className="metric-card">
          <span>档案总数</span>
          <strong>{metrics.total}</strong>
          <i className="status-ok" />
        </article>
        <article className="metric-card">
          <span>初配进行中</span>
          <strong>{metrics.doing}</strong>
          <i className="status-watch" />
        </article>
        <article className="metric-card">
          <span>复诊跟进</span>
          <strong>{metrics.follow}</strong>
          <i className="status-ok" />
        </article>
        <article className="metric-card">
          <span>平均识别率变化</span>
          <strong>{metrics.avgGain > 0 ? `+${metrics.avgGain}` : metrics.avgGain}%</strong>
          <i className="status-ok" />
        </article>
      </section>

      {view.name === "list" && (
        <section className="workspace">
          <aside className="panel narrow">
            <h2>复诊状态</h2>
            <div className="chips">
              {(["全部", ...ARCHIVE_STATUSES] as const).map((s) => (
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
              {(["全部", ...LOSS_TYPES] as const).map((t) => (
                <button
                  key={t}
                  className={lossFilter === t ? "chip-active" : ""}
                  onClick={() => setLossFilter(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <h2>搜索</h2>
            <input
              placeholder="客户姓名 / 联系电话"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </aside>

          <section className="panel">
            <div className="section-heading">
              <div>
                <p>验配档案</p>
                <h2>客户档案（{filtered.length}）</h2>
              </div>
              <button className="primary-action" onClick={() => setView({ name: "new" })}>
                新增初配档案
              </button>
            </div>
            <div className="record-list">
              {filtered.map((a) => {
                const c = lastVisit(a);
                return (
                  <article
                    key={a.id}
                    className="record-card clickable"
                    onClick={() => setView({ name: "detail", id: a.id })}
                  >
                    <div className="record-index">{a.customer.slice(0, 1)}</div>
                    <div>
                      <h3>
                        {a.customer} <span className="badge badge-loss">{a.lossType}</span>{" "}
                        <span className={STATUS_BADGE[a.status]}>{a.status}</span>
                      </h3>
                      <p>
                        左耳 PTA {pta(c.left.thresholds.air)} dB · 右耳 PTA{" "}
                        {pta(c.right.thresholds.air)} dB · 最近就诊 {c.date} · 共{" "}
                        {a.visits.length} 次记录
                      </p>
                    </div>
                    <button>打开档案</button>
                  </article>
                );
              })}
              {filtered.length === 0 && (
                <div className="empty-state">没有符合条件的档案，可调整筛选或新增初配档案</div>
              )}
            </div>
          </section>
        </section>
      )}

      {view.name === "new" && (
        <NewArchiveForm onSubmit={handleCreate} onCancel={() => setView({ name: "list" })} />
      )}

      {view.name === "detail" && openArchive && (
        <ArchiveDetail
          archive={openArchive}
          onBack={() => setView({ name: "list" })}
          onAddFollowup={() => setView({ name: "followup", id: openArchive.id })}
          onToggleStatus={() => toggleStatus(openArchive.id)}
        />
      )}

      {view.name === "followup" && openArchive && (
        <FollowupForm
          archive={openArchive}
          onSave={(visit) => handleFollowup(openArchive.id, visit)}
          onCancel={() => setView({ name: "detail", id: openArchive.id })}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
