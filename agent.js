// Local ReAct simulator. Swap each `say("TOOL", ...)` for a real Gemini function-call
// using the schemas in tools.js — the UI contract (THOUGHT/TOOL/OBSERVATION/EXECUTED) stays the same.
import { netPayable } from "./lateFee";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");

export async function runScenario(id, { policy, fresh, set, emit, ask, notify }) {
  let s = fresh();
  set(s);
  const patch = (p) => { s = { ...s, ...p }; set(s); };
  const say = async (type, text) => { emit({ type, text }); await wait(700); };
  const before = netPayable(s, policy);

  if (id === 1) {
    await say("THOUGHT", "UTR received. Compare payment date with deadline + grace window.");
    await say("TOOL", "verify_upi_utr({ utr: '6291048812' })");
    await say("OBSERVATION", `Bank match ✓ · paid inside ${policy.graceDays}-day grace`);
    await say("TOOL", "calculate_custom_late_fee()");
    patch({ paid: s.baseFee - s.scholarship, paidOn: new Date(new Date(s.deadline).getTime() + policy.graceDays * 864e5).toISOString() });
    await say("OBSERVATION", `Fine ${inr(before.fine)} → ${inr(netPayable(s, policy).fine)}`);
    await say("EXECUTED", "Ledger PAID · ID & admit card unlocked");
  }

  if (id === 2) {
    await say("THOUGHT", `Apply this college's ${policy.mode} rule, then read the cash receipt.`);
    await say("TOOL", "calculate_custom_late_fee()");
    await say("OBSERVATION", `${before.days} chargeable days → fine ${inr(before.fine)} (cap ${inr(policy.maxCap)})`);
    await say("TOOL", "verify_cash_receipt({ receiptImageUrl: 'scan.jpg' })");
    await say("OBSERVATION", "OCR read: ₹15,000 · dated today");
    patch({ paid: s.paid + 15000, paidOn: new Date().toISOString() });
    const net = netPayable(s, policy).net;
    await say("EXECUTED", `Net payable ${inr(net)} · FCM reminder sent`);
    notify(`Fee reminder: ${inr(net)} pending`);
  }

  if (id === 3) {
    await say("THOUGHT", "Waiver ₹6,500 is above the ₹1,000 auto-limit → human approval required.");
    await say("TOOL", "escalate_to_human_operator({ actionType: 'WAIVER', amount: 6500 })");
    await say("OBSERVATION", "Paused · waiting for HOD");
    const ok = await ask(`Waive ${inr(6500)} · medical · ${s.roll}`);
    await say("OBSERVATION", ok ? "HOD approved ✓" : "HOD rejected ✕");
    if (ok) patch({ waiver: 6500 });
    await say("EXECUTED", ok ? `Waiver applied · net ${inr(netPayable(s, policy).net)}` : "Request closed · no change");
  }
}
