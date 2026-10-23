import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Check, X, Calculator, QrCode, RotateCcw, Lock, LockOpen, Brain, Wrench, Eye, Save, Sun, Calendar, Layers, Percent, ShieldCheck } from "lucide-react";
import { DEFAULT_POLICY, netPayable } from "./lib/lateFee";
import { runScenario } from "./lib/agent";

const DAY = 864e5;
const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
const fresh = () => ({ name: "Aarav Sharma", roll: "CS21047", baseFee: 45000, scholarship: 5000, paid: 25000, waiver: 0, deadline: new Date(Date.now() - 12 * DAY).toISOString() });
const ICON = { THOUGHT: Brain, TOOL: Wrench, OBSERVATION: Eye, EXECUTED: Zap };

const Btn = ({ cls = "", children, ...p }) => (
  <motion.button whileTap={{ scale: 0.88 }} whileHover={{ y: -2 }} className={`btn ${cls}`} aria-label={p.title} {...p}>{children}</motion.button>
);

const Slider = ({ icon: I, label, v, min, max, step = 1, on, fmt = (x) => x }) => (
  <label className="row">
    <I size={16} /><span>{label}</span>
    <input type="range" min={min} max={max} step={step} value={v} onChange={(e) => on(+e.target.value)} />
    <b>{fmt(v)}</b>
  </label>
);

function Gauge({ value, max }) {
  const r = 52, c = 2 * Math.PI * r, pct = max ? Math.min(1, value / max) : 0;
  return (
    <svg viewBox="0 0 130 130" className="gauge" role="img" aria-label={`Fine ${value}`}>
      <circle cx="65" cy="65" r={r} className="g-bg" />
      <motion.circle cx="65" cy="65" r={r} className="g-fg" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct) }} transition={{ type: "spring", stiffness: 60 }} />
      <text x="65" y="70" textAnchor="middle" className="g-txt">{inr(value)}</text>
    </svg>
  );
}

export default function App() {
  const [draft, setDraft] = useState(DEFAULT_POLICY);
  const [applied, setApplied] = useState(DEFAULT_POLICY);
  const [s, setS] = useState(fresh);
  const [trace, setTrace] = useState([]);
  const [ask, setAsk] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [calcOpen, setCalcOpen] = useState(true);

  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 3000); };
  const dirty = JSON.stringify(draft) !== JSON.stringify(applied);
  const ledger = netPayable(s, applied);
  const preview = netPayable(s, draft);
  const blocked = ledger.net > 0 && ledger.blocked;
  const put = (k) => (v) => setDraft((d) => ({ ...d, [k]: v }));

  const run = async (id) => {
    setBusy(true);
    setTrace([]);
    await runScenario(id, {
      policy: applied, fresh, set: setS, notify: flash,
      emit: (e) => setTrace((t) => [...t, { ...e, id: t.length }]),
      ask: (text) => new Promise((resolve) => setAsk({ text, resolve })),
    });
    setBusy(false);
  };
  const decide = (ok) => { ask.resolve(ok); setAsk(null); };

  return (
    <div className="app">
      <header className="dock glass">
        {[1, 2, 3].map((n) => (
          <Btn key={n} cls="cyan" title={`Demo ${n}`} disabled={busy} onClick={() => run(n)}><Zap size={18} />{n}</Btn>
        ))}
        <Btn cls="ghost" title="Reset" disabled={busy} onClick={() => { setS(fresh()); setTrace([]); }}><RotateCcw size={18} /></Btn>
        <Btn cls="ghost" title="Calculator" onClick={() => setCalcOpen(!calcOpen)}><Calculator size={18} /></Btn>
        <a className="btn ghost" title="Pay by UPI" aria-label="Pay by UPI" href={`upi://pay?pa=college@upi&pn=College%20Fee&am=${ledger.net}&cu=INR`}><QrCode size={18} /></a>
      </header>

      <main className="grid">
        <section className="glass panel">
          <h2><Brain size={18} /></h2>
          <AnimatePresence>
            {trace.map((t) => {
              const I = ICON[t.type];
              return (
                <motion.div key={t.id} className={`pill ${t.type}`} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
                  <I size={14} /><span>{t.text}</span>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {!trace.length && <p className="muted">Tap a ⚡ to run the agent.</p>}
        </section>

        <section className="glass panel">
          <motion.div className="card" style={{ transformPerspective: 800 }} whileHover={{ rotateX: 4, rotateY: -4 }}>
            <div className="who"><b>{s.name}</b><small>{s.roll}</small></div>
            <div className="badges">
              <span className={`badge ${ledger.net ? "red" : "green"}`}>{ledger.net ? "PENDING" : "PAID"}</span>
              <span className={`badge ${blocked ? "red" : "green"}`} title={blocked ? "ID blocked" : "ID active"}>{blocked ? <Lock size={14} /> : <LockOpen size={14} />}</span>
            </div>
            <div className="nums">
              {[["Due", s.baseFee - s.scholarship], ["Paid", s.paid], ["Fine", ledger.fine], ["Waiver", s.waiver], ["Net", ledger.net]].map(([k, v]) => (
                <div key={k}><small>{k}</small><b>{inr(v)}</b></div>
              ))}
            </div>
          </motion.div>

          {calcOpen && (
            <div className="calc">
              <small className="muted">Net = Base − Aid − Paid + min(Cap, Σ fine) − Waiver</small>
              <Gauge value={preview.fine} max={draft.maxCap} />
              <div className="modes">
                {[["DAILY", Calendar], ["TIERED", Layers], ["PERCENTAGE", Percent]].map(([m, I]) => (
                  <Btn key={m} title={m} cls={draft.mode === m ? "cyan" : "ghost"} onClick={() => put("mode")(m)}><I size={18} /></Btn>
                ))}
                <Btn title="Skip Sundays" cls={draft.excludeHolidays ? "green" : "ghost"} onClick={() => put("excludeHolidays")(!draft.excludeHolidays)}><Sun size={18} /></Btn>
              </div>
              <Slider icon={Calendar} label="Grace" v={draft.graceDays} min={0} max={30} on={put("graceDays")} fmt={(x) => `${x}d`} />
              {draft.mode === "DAILY" && <Slider icon={Calendar} label="Rate" v={draft.dailyRate} min={0} max={500} step={10} on={put("dailyRate")} fmt={inr} />}
              {draft.mode === "PERCENTAGE" && <Slider icon={Percent} label="Week" v={draft.percentPerWeek} min={0} max={5} step={0.5} on={put("percentPerWeek")} fmt={(x) => `${x}%`} />}
              {draft.mode === "TIERED" && draft.tiers.map((t, i) => (
                <Slider key={i} icon={Layers} label={i === draft.tiers.length - 1 ? "Rest" : `≤${t.upToDay}d`} v={t.rate} min={0} max={500} step={10} fmt={inr}
                  on={(v) => setDraft((d) => ({ ...d, tiers: d.tiers.map((x, j) => (j === i ? { ...x, rate: v } : x)) }))} />
              ))}
              <Slider icon={ShieldCheck} label="Cap" v={draft.maxCap} min={0} max={20000} step={500} on={put("maxCap")} fmt={inr} />
              <Slider icon={Lock} label="Block" v={draft.autoBlockDays} min={0} max={60} on={put("autoBlockDays")} fmt={(x) => `>${x}d`} />
              <div className="sync">
                <span className="pillnet">Net {inr(preview.net)}</span>
                <Btn cls="cyan" title="Sync policy" disabled={!dirty} onClick={() => { setApplied(draft); flash("Policy synced · ledgers recalculated"); }}><Save size={18} /><Zap size={14} /></Btn>
              </div>
            </div>
          )}
        </section>

        <section className="glass panel">
          <h2><ShieldCheck size={18} /></h2>
          {ask ? (
            <motion.div className="hitl" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <b>{ask.text}</b>
              <div className="yn">
                <Btn cls="green" title="Approve" onClick={() => decide(true)}><Check size={30} /></Btn>
                <Btn cls="red" title="Reject" onClick={() => decide(false)}><X size={30} /></Btn>
              </div>
            </motion.div>
          ) : <p className="muted">No approvals waiting.</p>}
        </section>
      </main>

      <AnimatePresence>{toast && <motion.div className="toast glass" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}>{toast}</motion.div>}</AnimatePresence>
    </div>
  );
}
