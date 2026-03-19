import { formatCents, COMMON_CPT_CODES } from "@/lib/constants";

export const CLAIM_CHAT_SYSTEM_PROMPT = `You are a claims analyst assistant for a health plan administrator. You help plan administrators understand and investigate claims.

You have access to the full claim context below. Use it to answer questions accurately.

Guidelines:
- Be precise with dollar amounts and dates
- Explain insurance terminology in plain language when helpful
- If a claim was denied, explain possible reasons based on the data
- Reference specific data points (CPT codes, billed vs allowed amounts, etc.)
- If asked about appeal options, provide general guidance based on the claim status and type
- Compare billed amounts against average costs when relevant
- Note any anomaly flags and explain their significance
- Keep responses concise but thorough`;

type EobPromptData = {
  readonly employeeName: string;
  readonly planName: string;
  readonly planType: string;
  readonly deductible: number;
  readonly oopMax: number;
  readonly totalPaid: number;
  readonly totalMemberPaid: number;
  readonly claimCount: number;
};

export const EOB_SYSTEM_PROMPT =
  "You are a benefits communication specialist. Translate medical claims and insurance jargon into clear, empathetic language that a plan member can understand. Use analogies where helpful. Never use jargon without explaining it. Format with markdown bold for emphasis.";

export function buildEobUserPrompt(data: EobPromptData): string {
  return `Generate a plain-English benefits summary for this employee:

Employee: ${data.employeeName}
Plan: ${data.planName} (${data.planType})
Individual Deductible: ${formatCents(data.deductible)}
Individual OOP Max: ${formatCents(data.oopMax)}
Total Plan Paid: ${formatCents(data.totalPaid)}
Total Member Paid: ${formatCents(data.totalMemberPaid)}
Number of Claims: ${data.claimCount}

Write a clear, friendly summary covering:
1. What their plan has covered so far
2. What they've paid out of pocket
3. How their deductible works
4. Their safety net (OOP max)`;
}

export function buildEobFallbackSummary(data: EobPromptData): string {
  return `**Benefits Summary for ${data.employeeName}**

You're enrolled in the **${data.planName}** (${data.planType} plan), which has been covering your healthcare costs this plan year.

**What your plan has covered so far:**
Your plan has processed ${data.claimCount} claims and paid ${formatCents(data.totalPaid)} toward your medical expenses. This means your insurance has been actively working to reduce your out-of-pocket costs.

**What you've paid:**
Your total out-of-pocket responsibility has been ${formatCents(data.totalMemberPaid)}, which includes your deductible payments, coinsurance (your share after the deductible), and any copays.

**Understanding your deductible:**
Your individual deductible is ${formatCents(data.deductible)}. This is the amount you pay before your plan starts sharing costs with you. Once you meet your deductible, the plan pays 80% of covered services and you pay the remaining 20%.

**Your safety net:**
Your out-of-pocket maximum is ${formatCents(data.oopMax)}. Once you've paid this much in a plan year, your plan covers 100% of remaining covered expenses. This protects you from catastrophic medical costs.

*If you have questions about a specific claim or your coverage, please contact your HR benefits team.*`;
}

export function buildAnomalyDetectionPrompt(
  claimsData: ReadonlyArray<{
    readonly claimId: string;
    readonly claimNumber: string;
    readonly cptCode: string | null;
    readonly billedAmount: number;
    readonly allowedAmount: number;
    readonly paidAmount: number;
    readonly serviceDate: string;
    readonly providerName: string;
    readonly employeeName: string;
    readonly description: string | null;
    readonly serviceCategory: string | null;
  }>
): string {
  const cptReference = Object.entries(COMMON_CPT_CODES)
    .map(([code, info]) => `${code}: ${info.description} (avg: ${formatCents(info.avgCost)})`)
    .join("\n");

  const claimsText = claimsData
    .map(
      (c) =>
        `- ID: ${c.claimId} | #${c.claimNumber} | CPT: ${c.cptCode ?? "N/A"} | Billed: ${formatCents(c.billedAmount)} | Allowed: ${formatCents(c.allowedAmount)} | Paid: ${formatCents(c.paidAmount)} | Date: ${c.serviceDate} | Provider: ${c.providerName} | Employee: ${c.employeeName} | Category: ${c.serviceCategory ?? "N/A"} | Desc: ${c.description ?? "N/A"}`
    )
    .join("\n");

  return `Analyze these health insurance claims for anomalies. Check for:

1. **Billing anomalies**: Billed amounts significantly above average for the CPT code
2. **Duplicate billing**: Same procedure, same provider, same patient on same/close dates
3. **Coding inconsistencies**: Mismatches between service description and CPT code
4. **Unusual patterns**: Frequency of visits, escalating costs, upcoding patterns

CPT CODE REFERENCE (with average costs):
${cptReference}

CLAIMS TO ANALYZE:
${claimsText}

Respond with a JSON array. For each claim, return:
{
  "claimId": "<the claim ID>",
  "isAnomalous": true/false,
  "anomalyReason": "<specific reason or null if not anomalous>",
  "confidence": <0.0 to 1.0>
}

Only flag claims where you have reasonable confidence (>0.6) of an actual anomaly. Be specific in your reasons. Return ONLY the JSON array, no other text.`;
}
