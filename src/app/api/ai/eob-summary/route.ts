import { NextRequest, NextResponse } from "next/server";
import { formatCents } from "@/lib/constants";
import { eobSummarySchema } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = eobSummarySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { employeeName, planName, planType, deductible, oopMax, totalPaid, totalMemberPaid, claimCount } = parsed.data;

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic();

      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: `You are a benefits communication specialist. Translate medical claims and insurance jargon into clear, empathetic language that a plan member can understand. Use analogies where helpful. Never use jargon without explaining it. Format with markdown bold for emphasis.`,
        messages: [
          {
            role: "user",
            content: `Generate a plain-English benefits summary for this employee:

Employee: ${employeeName}
Plan: ${planName} (${planType})
Individual Deductible: ${formatCents(deductible)}
Individual OOP Max: ${formatCents(oopMax)}
Total Plan Paid: ${formatCents(totalPaid)}
Total Member Paid: ${formatCents(totalMemberPaid)}
Number of Claims: ${claimCount}

Write a clear, friendly summary covering:
1. What their plan has covered so far
2. What they've paid out of pocket
3. How their deductible works
4. Their safety net (OOP max)`,
          },
        ],
      });

      const content = response.content[0];
      if (content.type === "text") {
        return NextResponse.json({ summary: content.text });
      }
    } catch (error) {
      console.error("EOB summary error:", error);
    }
  }

  // Fallback demo summary
  const summary = `**Benefits Summary for ${employeeName}**\n\nYou're enrolled in the **${planName}** (${planType} plan), which has been covering your healthcare costs this plan year.\n\n**What your plan has covered so far:**\nYour plan has processed ${claimCount} claims and paid ${formatCents(totalPaid)} toward your medical expenses. This means your insurance has been actively working to reduce your out-of-pocket costs.\n\n**What you've paid:**\nYour total out-of-pocket responsibility has been ${formatCents(totalMemberPaid)}, which includes your deductible payments, coinsurance (your share after the deductible), and any copays.\n\n**Understanding your deductible:**\nYour individual deductible is ${formatCents(deductible)}. This is the amount you pay before your plan starts sharing costs with you. Once you meet your deductible, the plan pays 80% of covered services and you pay the remaining 20%.\n\n**Your safety net:**\nYour out-of-pocket maximum is ${formatCents(oopMax)}. Once you've paid this much in a plan year, your plan covers 100% of remaining covered expenses. This protects you from catastrophic medical costs.\n\n*If you have questions about a specific claim or your coverage, please contact your HR benefits team.*`;

  return NextResponse.json({ summary });
}
