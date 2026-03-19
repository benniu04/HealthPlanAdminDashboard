import { z } from "zod";

export const claimActionSchema = z.object({
  action: z.enum(["approve", "deny"]),
  notes: z.string().optional(),
}).refine(
  (data) => data.action === "approve" || (data.notes && data.notes.trim().length > 0),
  { message: "Notes are required when denying a claim", path: ["notes"] }
);

export const eobSummarySchema = z.object({
  employeeName: z.string().min(1, "Employee name is required"),
  planName: z.string().min(1, "Plan name is required"),
  planType: z.string().min(1, "Plan type is required"),
  deductible: z.number().int().nonnegative(),
  oopMax: z.number().int().nonnegative(),
  totalPaid: z.number().int().nonnegative(),
  totalMemberPaid: z.number().int().nonnegative(),
  claimCount: z.number().int().nonnegative(),
});

export const ALLOWED_UPLOAD_TYPES = [
  "text/csv",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/pdf",
];

export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB

export function validateUploadFile(file: File): string | null {
  if (!ALLOWED_UPLOAD_TYPES.includes(file.type) && !file.name.match(/\.(csv|txt|xlsx|pdf)$/i)) {
    return "Invalid file type. Supported: CSV, TXT, XLSX, PDF";
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    return "File too large. Maximum size is 5MB";
  }
  return null;
}
