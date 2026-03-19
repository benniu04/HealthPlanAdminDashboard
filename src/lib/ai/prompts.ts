import { formatCents } from "@/lib/constants";

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
