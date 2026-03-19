export const SERVICE_CATEGORIES = [
  { value: "preventive", label: "Preventive Care", color: "#22c55e" },
  { value: "emergency", label: "Emergency", color: "#ef4444" },
  { value: "inpatient", label: "Inpatient", color: "#f97316" },
  { value: "outpatient", label: "Outpatient", color: "#3b82f6" },
  { value: "pharmacy", label: "Pharmacy", color: "#8b5cf6" },
  { value: "lab", label: "Laboratory", color: "#06b6d4" },
  { value: "imaging", label: "Imaging", color: "#eab308" },
  { value: "mental_health", label: "Mental Health", color: "#ec4899" },
  { value: "maternity", label: "Maternity", color: "#14b8a6" },
  { value: "rehabilitation", label: "Rehabilitation", color: "#64748b" },
] as const;

export const CLAIM_STATUSES = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  { value: "in_review", label: "In Review", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "approved", label: "Approved", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  { value: "denied", label: "Denied", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  { value: "appealed", label: "Appealed", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  { value: "paid", label: "Paid", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
] as const;

export const COMMON_CPT_CODES: Record<string, { description: string; category: string; avgCost: number }> = {
  "99213": { description: "Office visit - established patient, low complexity", category: "outpatient", avgCost: 15000 },
  "99214": { description: "Office visit - established patient, moderate complexity", category: "outpatient", avgCost: 22000 },
  "99215": { description: "Office visit - established patient, high complexity", category: "outpatient", avgCost: 30000 },
  "99203": { description: "Office visit - new patient, low complexity", category: "outpatient", avgCost: 20000 },
  "99281": { description: "Emergency dept visit - minor", category: "emergency", avgCost: 25000 },
  "99283": { description: "Emergency dept visit - moderate", category: "emergency", avgCost: 65000 },
  "99285": { description: "Emergency dept visit - high severity", category: "emergency", avgCost: 150000 },
  "70553": { description: "MRI brain with and without contrast", category: "imaging", avgCost: 250000 },
  "72148": { description: "MRI lumbar spine without contrast", category: "imaging", avgCost: 200000 },
  "80053": { description: "Comprehensive metabolic panel", category: "lab", avgCost: 5000 },
  "85025": { description: "Complete blood count (CBC)", category: "lab", avgCost: 3000 },
  "36415": { description: "Venipuncture", category: "lab", avgCost: 1500 },
  "90834": { description: "Psychotherapy, 45 minutes", category: "mental_health", avgCost: 15000 },
  "90837": { description: "Psychotherapy, 60 minutes", category: "mental_health", avgCost: 20000 },
  "99395": { description: "Preventive visit, 18-39 years", category: "preventive", avgCost: 25000 },
  "99396": { description: "Preventive visit, 40-64 years", category: "preventive", avgCost: 30000 },
  "59400": { description: "Routine obstetric care", category: "maternity", avgCost: 500000 },
  "97110": { description: "Therapeutic exercises", category: "rehabilitation", avgCost: 8000 },
  "99232": { description: "Subsequent hospital care, moderate", category: "inpatient", avgCost: 18000 },
  "99223": { description: "Initial hospital care, high complexity", category: "inpatient", avgCost: 45000 },
};

export const COMMON_ICD_CODES: Record<string, string> = {
  "Z00.00": "General adult wellness exam",
  "J06.9": "Acute upper respiratory infection",
  "M54.5": "Low back pain",
  "E11.9": "Type 2 diabetes mellitus",
  "F41.1": "Generalized anxiety disorder",
  "I10": "Essential hypertension",
  "J45.909": "Unspecified asthma",
  "K21.0": "GERD with esophagitis",
  "M79.3": "Panniculitis",
  "R10.9": "Abdominal pain, unspecified",
  "S93.401A": "Sprained ankle, initial encounter",
  "F32.1": "Major depressive disorder, moderate",
  "E78.5": "Hyperlipidemia",
  "Z12.31": "Screening mammogram",
  "O80": "Full-term uncomplicated delivery",
};

export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}
