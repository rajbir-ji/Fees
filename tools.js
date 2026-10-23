// Gemini function-calling declarations. collegeCode is NEVER a parameter:
// the backend reads it from the verified auth token so one tenant can't touch another.
const O = (properties, required) => ({ type: "OBJECT", properties, required });
const S = { type: "STRING" };
const N = { type: "NUMBER" };
const B = { type: "BOOLEAN" };

export const toolDeclarations = [
  { name: "calculate_custom_late_fee", description: "Compute fine and net payable for a student under the college's current late-fee policy.", parameters: O({ rollNumber: S, paidOn: { ...S, description: "ISO date; defaults to today" } }, ["rollNumber"]) },
  { name: "update_college_fee_policy", description: "Update the college late-fee policy (HOD_ADMIN only) and recalculate pending ledgers.", parameters: O({ mode: { ...S, enum: ["DAILY", "TIERED", "PERCENTAGE"] }, graceDays: N, dailyRate: N, maxCap: N, autoBlockAfterDays: N, excludeHolidays: B }, ["mode"]) },
  { name: "verify_upi_utr", description: "Match a 12-digit UTR with the bank webhook and return amount and timestamp.", parameters: O({ rollNumber: S, utr: S }, ["rollNumber", "utr"]) },
  { name: "verify_cash_receipt", description: "OCR a cash receipt image and return amount and date.", parameters: O({ rollNumber: S, receiptImageUrl: S }, ["rollNumber", "receiptImageUrl"]) },
  { name: "toggle_id_card_lock", description: "Block or unblock the digital ID and exam admit card.", parameters: O({ rollNumber: S, blocked: B, reason: S }, ["rollNumber", "blocked"]) },
  { name: "escalate_to_human_operator", description: "Pause and request approval for waivers above ₹1,000 or any refund.", parameters: O({ rollNumber: S, actionType: { ...S, enum: ["WAIVER", "REFUND"] }, amount: N, reason: S }, ["rollNumber", "actionType", "amount", "reason"]) },
];
