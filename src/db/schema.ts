import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const companies = sqliteTable("companies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  industry: text("industry"),
  employeeCount: integer("employee_count"),
  planYear: text("plan_year"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const plans = sqliteTable("plans", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // PPO | HDHP | HMO | EPO
  deductibleInd: integer("deductible_ind").notNull(), // cents
  deductibleFam: integer("deductible_fam").notNull(),
  oopMaxInd: integer("oop_max_ind").notNull(),
  oopMaxFam: integer("oop_max_fam").notNull(),
  coinsurance: real("coinsurance").notNull(), // e.g., 0.80
  copayPrimary: integer("copay_primary").notNull(), // cents
  copaySpecialist: integer("copay_specialist").notNull(),
  copayER: integer("copay_er").notNull(),
  rxTier1: integer("rx_tier1").notNull(),
  rxTier2: integer("rx_tier2").notNull(),
  rxTier3: integer("rx_tier3").notNull(),
  stopLossSpec: integer("stop_loss_spec").notNull(),
  stopLossAgg: integer("stop_loss_agg").notNull(),
  status: text("status").notNull().default("active"), // active | draft | archived
  effectiveDate: text("effective_date").notNull(),
  terminationDate: text("termination_date"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const employees = sqliteTable("employees", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  planId: text("plan_id").notNull().references(() => plans.id),
  employeeCode: text("employee_code").notNull(), // e.g., EMP-0042
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  hireDate: text("hire_date").notNull(),
  coverageTier: text("coverage_tier").notNull(), // employee | employee+spouse | employee+children | family
  status: text("status").notNull().default("active"), // active | cobra | terminated
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const providers = sqliteTable("providers", {
  id: text("id").primaryKey(),
  npi: text("npi").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // hospital | physician | lab | pharmacy | imaging | specialist
  specialty: text("specialty"),
  networkStatus: text("network_status").notNull(), // in-network | out-of-network
  address: text("address"),
  city: text("city"),
  state: text("state"),
  avgCostIndex: real("avg_cost_index").notNull().default(1.0),
  qualityRating: real("quality_rating"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const claims = sqliteTable("claims", {
  id: text("id").primaryKey(),
  claimNumber: text("claim_number").notNull().unique(),
  employeeId: text("employee_id").notNull().references(() => employees.id),
  providerId: text("provider_id").notNull().references(() => providers.id),
  planId: text("plan_id").notNull().references(() => plans.id),
  serviceDate: text("service_date").notNull(),
  receivedDate: text("received_date").notNull(),
  claimType: text("claim_type").notNull(), // medical | pharmacy | dental | vision | behavioral
  status: text("status").notNull().default("pending"), // pending | in_review | approved | denied | appealed | paid
  billedAmount: integer("billed_amount").notNull(), // cents
  allowedAmount: integer("allowed_amount").notNull(),
  paidAmount: integer("paid_amount").notNull(),
  memberResponsibility: integer("member_responsibility").notNull(),
  deductibleApplied: integer("deductible_applied").notNull().default(0),
  coinsuranceApplied: integer("coinsurance_applied").notNull().default(0),
  copayApplied: integer("copay_applied").notNull().default(0),
  cptCode: text("cpt_code"),
  icdCode: text("icd_code"),
  serviceCategory: text("service_category"), // AI-assigned
  description: text("description"),
  aiCategoryConfidence: real("ai_category_confidence"),
  isAnomalous: integer("is_anomalous", { mode: "boolean" }).notNull().default(false),
  anomalyReason: text("anomaly_reason"),
  sourceFile: text("source_file"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const claimAuditTrail = sqliteTable("claim_audit_trail", {
  id: text("id").primaryKey(),
  claimId: text("claim_id").notNull().references(() => claims.id),
  action: text("action").notNull(), // created | categorized | flagged_anomaly | submitted_review | approved | denied | appealed | paid | note_added
  performedBy: text("performed_by").notNull(), // user id or "system" or "ai"
  previousStatus: text("previous_status"),
  newStatus: text("new_status"),
  notes: text("notes"),
  metadata: text("metadata"), // JSON
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("analyst"), // admin | analyst | reviewer
  companyId: text("company_id").notNull().references(() => companies.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
