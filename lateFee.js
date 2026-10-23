// Pure late-fee engine. One policy object per college: /colleges/{collegeCode}/config/lateFeePolicy
const DAY = 864e5;

export const DEFAULT_POLICY = {
  mode: "TIERED", // DAILY | TIERED | PERCENTAGE
  graceDays: 3,
  dailyRate: 100,
  tiers: [
    { upToDay: 7, rate: 50 },
    { upToDay: 15, rate: 150 },
    { upToDay: 9999, rate: 300 },
  ],
  percentPerWeek: 1.5,
  maxCap: 5000,
  excludeHolidays: true,
  autoBlockDays: 15,
  autoBlockFine: 1500,
};

const sundays = (from, n) => {
  let c = 0;
  for (let i = 1; i <= n; i++) if (new Date(from.getTime() + i * DAY).getDay() === 0) c++;
  return c;
};

export function chargeableDays(deadline, paidOn, p) {
  const raw = Math.max(0, Math.floor((paidOn - deadline) / DAY));
  return Math.max(0, raw - p.graceDays - (p.excludeHolidays ? sundays(deadline, raw) : 0));
}

export function calcFine(days, due, p) {
  let fine = 0;
  if (days > 0) {
    if (p.mode === "DAILY") fine = days * p.dailyRate;
    else if (p.mode === "PERCENTAGE") fine = due * (p.percentPerWeek / 100) * Math.ceil(days / 7); // % of fee due after scholarship
    else {
      let prev = 0;
      for (const t of p.tiers) {
        fine += Math.max(0, Math.min(days, t.upToDay) - prev) * t.rate;
        prev = t.upToDay;
        if (days <= t.upToDay) break;
      }
    }
  }
  return Math.min(Math.round(fine), p.maxCap);
}

// Net = Base − Scholarship − Paid + min(Cap, Σ tier fine) − Waiver
export function netPayable(s, p) {
  const due = s.baseFee - s.scholarship;
  const paidOn = s.paidOn ? new Date(s.paidOn) : new Date();
  const days = chargeableDays(new Date(s.deadline), paidOn, p);
  const fine = calcFine(days, due, p);
  const net = Math.max(0, due - s.paid + fine - s.waiver);
  return { days, fine, net, blocked: days > p.autoBlockDays || fine > p.autoBlockFine };
}
