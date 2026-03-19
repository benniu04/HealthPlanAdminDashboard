import { formatCents, COMMON_CPT_CODES, COMMON_ICD_CODES } from "@/lib/constants";
import type { Claim, Employee, Provider, Plan, ClaimAuditEntry } from "@/types";

type ClaimContext = {
  readonly claim: Claim;
  readonly employee: Employee;
  readonly provider: Provider;
  readonly plan: Plan;
  readonly auditTrail: readonly ClaimAuditEntry[];
};

export function buildClaimContext({ claim, employee, provider, plan, auditTrail }: ClaimContext): string {
  const cptInfo = claim.cptCode ? COMMON_CPT_CODES[claim.cptCode] : null;
  const icdDesc = claim.icdCode ? COMMON_ICD_CODES[claim.icdCode] : null;

  const sections = [
    `CLAIM: ${claim.claimNumber}`,
    `Status: ${claim.status}`,
    `Service Date: ${claim.serviceDate}`,
    `Claim Type: ${claim.claimType}`,
    `Service Category: ${claim.serviceCategory ?? "uncategorized"}`,
    `Description: ${claim.description ?? "N/A"}`,
    "",
    "PROCEDURE & DIAGNOSIS:",
    `CPT Code: ${claim.cptCode ?? "N/A"}${cptInfo ? ` — ${cptInfo.description} (avg cost: ${formatCents(cptInfo.avgCost)})` : ""}`,
    `ICD-10 Code: ${claim.icdCode ?? "N/A"}${icdDesc ? ` — ${icdDesc}` : ""}`,
    "",
    "FINANCIALS:",
    `Billed: ${formatCents(claim.billedAmount)}`,
    `Allowed: ${formatCents(claim.allowedAmount)}`,
    `Plan Paid: ${formatCents(claim.paidAmount)}`,
    `Member Responsibility: ${formatCents(claim.memberResponsibility)}`,
    `  Deductible Applied: ${formatCents(claim.deductibleApplied)}`,
    `  Coinsurance Applied: ${formatCents(claim.coinsuranceApplied)}`,
    `  Copay Applied: ${formatCents(claim.copayApplied)}`,
    "",
    "EMPLOYEE:",
    `Name: ${employee.firstName} ${employee.lastName}`,
    `Coverage Tier: ${employee.coverageTier}`,
    `Status: ${employee.status}`,
    "",
    "PROVIDER:",
    `Name: ${provider.name}`,
    `Type: ${provider.type}`,
    `Specialty: ${provider.specialty ?? "N/A"}`,
    `Network Status: ${provider.networkStatus}`,
    `NPI: ${provider.npi}`,
    `Cost Index: ${provider.avgCostIndex}`,
    `Quality Rating: ${provider.qualityRating ?? "N/A"}`,
    "",
    "PLAN:",
    `Name: ${plan.name} (${plan.type})`,
    `Individual Deductible: ${formatCents(plan.deductibleInd)}`,
    `Individual OOP Max: ${formatCents(plan.oopMaxInd)}`,
    `Coinsurance: ${(plan.coinsurance * 100).toFixed(0)}%`,
    `Primary Copay: ${formatCents(plan.copayPrimary)}`,
    `Specialist Copay: ${formatCents(plan.copaySpecialist)}`,
    `ER Copay: ${formatCents(plan.copayER)}`,
  ];

  if (claim.isAnomalous) {
    sections.push("", "ANOMALY FLAG:", `Reason: ${claim.anomalyReason ?? "Unknown"}`);
  }

  if (auditTrail.length > 0) {
    sections.push("", "AUDIT TRAIL:");
    auditTrail.forEach((entry) => {
      const date = new Date(entry.createdAt).toISOString().split("T")[0];
      const notes = entry.notes ? ` — ${entry.notes}` : "";
      sections.push(`  ${date}: ${entry.action.replace("_", " ")} (by ${entry.performedBy})${notes}`);
    });
  }

  return sections.join("\n");
}
