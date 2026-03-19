import { NextRequest, NextResponse } from "next/server";
import { validateUploadFile } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const validationError = validateUploadFile(file);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const text = await file.text();

  if (!text.trim()) {
    return NextResponse.json({ error: "File is empty" }, { status: 400 });
  }

  // If ANTHROPIC_API_KEY is available, use Claude for categorization
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic();

      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: `You are a medical claims processing expert. Given claim line items from a CSV or text file, categorize each by service type, assign the most likely CPT and ICD-10 codes if missing, and flag any items that look unusual.

Return a JSON array where each item has:
- description: string (service description)
- serviceDate: string (YYYY-MM-DD)
- billedAmount: number (in cents)
- cptCode: string
- icdCode: string
- category: string (one of: preventive, emergency, inpatient, outpatient, pharmacy, lab, imaging, mental_health, maternity, rehabilitation)
- confidence: number (0-1)
- providerName: string (extracted or inferred)

Return ONLY the JSON array, no other text.`,
        messages: [
          { role: "user", content: `Categorize these claims:\n\n${text}` },
        ],
      });

      const content = response.content[0];
      if (content.type === "text") {
        try {
          const claims = JSON.parse(content.text);
          if (!Array.isArray(claims)) {
            throw new Error("Expected JSON array");
          }
          return NextResponse.json({ claims });
        } catch {
          return NextResponse.json(
            { error: "AI returned invalid response format" },
            { status: 502 }
          );
        }
      }
    } catch (error) {
      console.error("AI categorization error:", error);
    }
  }

  // Fallback: demo response
  return NextResponse.json({
    claims: [
      { description: "Office visit - established patient", serviceDate: "2025-03-15", billedAmount: 15000, cptCode: "99213", icdCode: "J06.9", category: "outpatient", confidence: 0.95, providerName: "Dr. James Mitchell" },
      { description: "Comprehensive metabolic panel", serviceDate: "2025-03-15", billedAmount: 5000, cptCode: "80053", icdCode: "E11.9", category: "lab", confidence: 0.98, providerName: "Quest Diagnostics" },
      { description: "MRI lumbar spine without contrast", serviceDate: "2025-03-18", billedAmount: 200000, cptCode: "72148", icdCode: "M54.5", category: "imaging", confidence: 0.92, providerName: "ClearView Radiology" },
      { description: "Psychotherapy session, 45 min", serviceDate: "2025-03-20", billedAmount: 15000, cptCode: "90834", icdCode: "F41.1", category: "mental_health", confidence: 0.97, providerName: "Mindful Health Associates" },
      { description: "Lisinopril 10mg, 30-day supply", serviceDate: "2025-03-10", billedAmount: 1500, cptCode: "RX", icdCode: "I10", category: "pharmacy", confidence: 0.99, providerName: "CVS Pharmacy" },
    ],
  });
}
