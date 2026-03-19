import type { InferSelectModel } from "drizzle-orm";
import type {
  companies,
  plans,
  employees,
  providers,
  claims,
  claimAuditTrail,
  users,
} from "@/db/schema";

export type Company = InferSelectModel<typeof companies>;
export type Plan = InferSelectModel<typeof plans>;
export type Employee = InferSelectModel<typeof employees>;
export type Provider = InferSelectModel<typeof providers>;
export type Claim = InferSelectModel<typeof claims>;
export type ClaimAuditEntry = InferSelectModel<typeof claimAuditTrail>;
export type User = InferSelectModel<typeof users>;

export type ClaimStatus = "pending" | "in_review" | "approved" | "denied" | "appealed" | "paid";
export type ClaimType = "medical" | "pharmacy" | "dental" | "vision" | "behavioral";
export type ServiceCategory =
  | "preventive"
  | "emergency"
  | "inpatient"
  | "outpatient"
  | "pharmacy"
  | "lab"
  | "imaging"
  | "mental_health"
  | "maternity"
  | "rehabilitation";

export interface ClaimWithRelations extends Claim {
  employee?: Employee;
  provider?: Provider;
  plan?: Plan;
  auditTrail?: ClaimAuditEntry[];
}

export interface SpendingByCategory {
  category: string;
  total: number;
  count: number;
}

export interface SpendingByMonth {
  month: string;
  total: number;
  count: number;
}

export interface SpendingByProvider {
  providerId: string;
  providerName: string;
  total: number;
  count: number;
  avgCost: number;
}
