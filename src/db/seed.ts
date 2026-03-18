import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { ulid } from "ulid";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "health-plan.db");
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const db = drizzle(sqlite, { schema });

// ── Create tables ────────────────────────────────────────
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    industry TEXT,
    employee_count INTEGER,
    plan_year TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    deductible_ind INTEGER NOT NULL,
    deductible_fam INTEGER NOT NULL,
    oop_max_ind INTEGER NOT NULL,
    oop_max_fam INTEGER NOT NULL,
    coinsurance REAL NOT NULL,
    copay_primary INTEGER NOT NULL,
    copay_specialist INTEGER NOT NULL,
    copay_er INTEGER NOT NULL,
    rx_tier1 INTEGER NOT NULL,
    rx_tier2 INTEGER NOT NULL,
    rx_tier3 INTEGER NOT NULL,
    stop_loss_spec INTEGER NOT NULL,
    stop_loss_agg INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    effective_date TEXT NOT NULL,
    termination_date TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id),
    plan_id TEXT NOT NULL REFERENCES plans(id),
    employee_code TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    date_of_birth TEXT NOT NULL,
    hire_date TEXT NOT NULL,
    coverage_tier TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS providers (
    id TEXT PRIMARY KEY,
    npi TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    specialty TEXT,
    network_status TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    avg_cost_index REAL NOT NULL DEFAULT 1.0,
    quality_rating REAL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS claims (
    id TEXT PRIMARY KEY,
    claim_number TEXT NOT NULL UNIQUE,
    employee_id TEXT NOT NULL REFERENCES employees(id),
    provider_id TEXT NOT NULL REFERENCES providers(id),
    plan_id TEXT NOT NULL REFERENCES plans(id),
    service_date TEXT NOT NULL,
    received_date TEXT NOT NULL,
    claim_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    billed_amount INTEGER NOT NULL,
    allowed_amount INTEGER NOT NULL,
    paid_amount INTEGER NOT NULL,
    member_responsibility INTEGER NOT NULL,
    deductible_applied INTEGER NOT NULL DEFAULT 0,
    coinsurance_applied INTEGER NOT NULL DEFAULT 0,
    copay_applied INTEGER NOT NULL DEFAULT 0,
    cpt_code TEXT,
    icd_code TEXT,
    service_category TEXT,
    description TEXT,
    ai_category_confidence REAL,
    is_anomalous INTEGER NOT NULL DEFAULT 0,
    anomaly_reason TEXT,
    source_file TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS claim_audit_trail (
    id TEXT PRIMARY KEY,
    claim_id TEXT NOT NULL REFERENCES claims(id),
    action TEXT NOT NULL,
    performed_by TEXT NOT NULL,
    previous_status TEXT,
    new_status TEXT,
    notes TEXT,
    metadata TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS ai_insights (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id),
    insight_type TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    detail TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'info',
    estimated_savings INTEGER,
    status TEXT NOT NULL DEFAULT 'new',
    related_claim_ids TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'analyst',
    company_id TEXT NOT NULL REFERENCES companies(id),
    created_at INTEGER NOT NULL
  );
`);

// ── Helpers ──────────────────────────────────────────────
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function dateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function daysAgo(d: string): number {
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}

// ── Company ──────────────────────────────────────────────
const companyId = ulid();
db.insert(schema.companies).values({
  id: companyId,
  name: "Meridian Technologies, Inc.",
  industry: "Technology",
  employeeCount: 200,
  planYear: "2025-2026",
  createdAt: new Date("2024-01-01"),
}).run();

// ── Plans ──────────────────────────────────────────────
const goldPlanId = ulid();
const silverPlanId = ulid();

db.insert(schema.plans).values([
  {
    id: goldPlanId,
    companyId,
    name: "Meridian Gold PPO",
    type: "PPO",
    deductibleInd: 50000,      // $500
    deductibleFam: 100000,     // $1,000
    oopMaxInd: 400000,         // $4,000
    oopMaxFam: 800000,         // $8,000
    coinsurance: 0.80,
    copayPrimary: 2500,        // $25
    copaySpecialist: 5000,     // $50
    copayER: 25000,            // $250
    rxTier1: 1000,             // $10
    rxTier2: 3500,             // $35
    rxTier3: 7500,             // $75
    stopLossSpec: 15000000,    // $150,000
    stopLossAgg: 300000000,    // $3,000,000
    status: "active",
    effectiveDate: "2025-01-01",
    terminationDate: "2025-12-31",
    createdAt: new Date("2024-11-01"),
  },
  {
    id: silverPlanId,
    companyId,
    name: "Meridian Silver HDHP",
    type: "HDHP",
    deductibleInd: 150000,     // $1,500
    deductibleFam: 300000,     // $3,000
    oopMaxInd: 700000,         // $7,000
    oopMaxFam: 1400000,        // $14,000
    coinsurance: 0.80,
    copayPrimary: 0,
    copaySpecialist: 0,
    copayER: 0,
    rxTier1: 0,
    rxTier2: 0,
    rxTier3: 0,
    stopLossSpec: 20000000,    // $200,000
    stopLossAgg: 400000000,    // $4,000,000
    status: "active",
    effectiveDate: "2025-01-01",
    terminationDate: "2025-12-31",
    createdAt: new Date("2024-11-01"),
  },
]).run();

// ── Users (demo accounts) ───────────────────────────────
const adminUserId = ulid();
const analystUserId = ulid();
const reviewerUserId = ulid();

db.insert(schema.users).values([
  { id: adminUserId, email: "admin@meridiantech.com", name: "Sarah Chen", role: "admin", companyId, createdAt: new Date() },
  { id: analystUserId, email: "analyst@meridiantech.com", name: "Marcus Johnson", role: "analyst", companyId, createdAt: new Date() },
  { id: reviewerUserId, email: "reviewer@meridiantech.com", name: "Elena Rodriguez", role: "reviewer", companyId, createdAt: new Date() },
]).run();

// ── Providers ─────────────────────────────────────────────
const providerData = [
  { name: "Regional Medical Center", type: "hospital", specialty: "General Hospital", network: "in-network", city: "Austin", state: "TX", costIndex: 1.1, rating: 4.2 },
  { name: "University Health System", type: "hospital", specialty: "Academic Medical Center", network: "in-network", city: "Austin", state: "TX", costIndex: 1.3, rating: 4.5 },
  { name: "St. Mary's Hospital", type: "hospital", specialty: "General Hospital", network: "in-network", city: "Round Rock", state: "TX", costIndex: 0.9, rating: 3.8 },
  { name: "Pinnacle Imaging Center", type: "imaging", specialty: "Diagnostic Imaging", network: "in-network", city: "Austin", state: "TX", costIndex: 2.8, rating: 3.5 },
  { name: "ClearView Radiology", type: "imaging", specialty: "Diagnostic Imaging", network: "in-network", city: "Cedar Park", state: "TX", costIndex: 0.9, rating: 4.1 },
  { name: "Quest Diagnostics", type: "lab", specialty: "Clinical Laboratory", network: "in-network", city: "Austin", state: "TX", costIndex: 0.8, rating: 4.0 },
  { name: "LabCorp", type: "lab", specialty: "Clinical Laboratory", network: "in-network", city: "Austin", state: "TX", costIndex: 0.85, rating: 3.9 },
  { name: "Dr. James Mitchell, MD", type: "physician", specialty: "Family Medicine", network: "in-network", city: "Austin", state: "TX", costIndex: 1.0, rating: 4.6 },
  { name: "Dr. Priya Patel, MD", type: "physician", specialty: "Internal Medicine", network: "in-network", city: "Austin", state: "TX", costIndex: 1.0, rating: 4.4 },
  { name: "Dr. Robert Kim, MD", type: "physician", specialty: "Family Medicine", network: "in-network", city: "Round Rock", state: "TX", costIndex: 0.95, rating: 4.3 },
  { name: "Dr. Amanda Foster, MD", type: "specialist", specialty: "Orthopedics", network: "in-network", city: "Austin", state: "TX", costIndex: 1.2, rating: 4.5 },
  { name: "Dr. David Chen, MD", type: "specialist", specialty: "Cardiology", network: "in-network", city: "Austin", state: "TX", costIndex: 1.4, rating: 4.7 },
  { name: "Dr. Lisa Nakamura, MD", type: "specialist", specialty: "Dermatology", network: "in-network", city: "Austin", state: "TX", costIndex: 1.1, rating: 4.2 },
  { name: "Dr. Michael Torres, MD", type: "specialist", specialty: "Gastroenterology", network: "in-network", city: "Austin", state: "TX", costIndex: 1.3, rating: 4.1 },
  { name: "Mindful Health Associates", type: "specialist", specialty: "Psychiatry", network: "in-network", city: "Austin", state: "TX", costIndex: 1.0, rating: 4.3 },
  { name: "Serenity Counseling Center", type: "specialist", specialty: "Psychology", network: "in-network", city: "Austin", state: "TX", costIndex: 0.9, rating: 4.4 },
  { name: "Austin Physical Therapy", type: "specialist", specialty: "Physical Therapy", network: "in-network", city: "Austin", state: "TX", costIndex: 0.85, rating: 4.6 },
  { name: "CVS Pharmacy", type: "pharmacy", specialty: "Retail Pharmacy", network: "in-network", city: "Austin", state: "TX", costIndex: 1.0, rating: 3.8 },
  { name: "Walgreens", type: "pharmacy", specialty: "Retail Pharmacy", network: "in-network", city: "Austin", state: "TX", costIndex: 1.0, rating: 3.7 },
  { name: "HEB Pharmacy", type: "pharmacy", specialty: "Retail Pharmacy", network: "in-network", city: "Austin", state: "TX", costIndex: 0.9, rating: 4.0 },
  { name: "Lone Star Surgical Center", type: "hospital", specialty: "Ambulatory Surgery", network: "in-network", city: "Austin", state: "TX", costIndex: 1.5, rating: 4.0 },
  { name: "Texas Spine & Joint", type: "specialist", specialty: "Orthopedic Surgery", network: "out-of-network", city: "Dallas", state: "TX", costIndex: 1.8, rating: 4.3 },
  { name: "Premier Oncology Associates", type: "specialist", specialty: "Oncology", network: "in-network", city: "Austin", state: "TX", costIndex: 1.6, rating: 4.5 },
  { name: "Dr. Sarah Williams, DO", type: "physician", specialty: "Family Medicine", network: "out-of-network", city: "San Antonio", state: "TX", costIndex: 1.1, rating: 4.0 },
  { name: "Hill Country Urgent Care", type: "physician", specialty: "Urgent Care", network: "in-network", city: "Lakeway", state: "TX", costIndex: 1.2, rating: 3.9 },
  { name: "Austin Eye Associates", type: "specialist", specialty: "Ophthalmology", network: "in-network", city: "Austin", state: "TX", costIndex: 1.1, rating: 4.2 },
  { name: "Bluebonnet OB/GYN", type: "specialist", specialty: "Obstetrics & Gynecology", network: "in-network", city: "Austin", state: "TX", costIndex: 1.0, rating: 4.6 },
  { name: "Capital Allergy & Asthma", type: "specialist", specialty: "Allergy & Immunology", network: "in-network", city: "Austin", state: "TX", costIndex: 1.0, rating: 4.1 },
  { name: "Precision MRI Center", type: "imaging", specialty: "Diagnostic Imaging", network: "out-of-network", city: "Houston", state: "TX", costIndex: 1.5, rating: 4.0 },
  { name: "Dr. Kevin Brown, DDS", type: "specialist", specialty: "Dentistry", network: "in-network", city: "Austin", state: "TX", costIndex: 1.0, rating: 4.3 },
];

const providerIds: string[] = [];
for (const p of providerData) {
  const id = ulid();
  providerIds.push(id);
  db.insert(schema.providers).values({
    id,
    npi: `1${String(randInt(100000000, 999999999))}`,
    name: p.name,
    type: p.type,
    specialty: p.specialty,
    networkStatus: p.network,
    address: `${randInt(100, 9999)} ${pick(["Main St", "Congress Ave", "Lamar Blvd", "Research Blvd", "Guadalupe St", "Medical Pkwy"])}`,
    city: p.city,
    state: p.state,
    avgCostIndex: p.costIndex,
    qualityRating: p.rating,
    createdAt: new Date("2024-01-01"),
  }).run();
}

// Provider index map for specific anomaly providers
const pinnacleIdx = providerData.findIndex(p => p.name === "Pinnacle Imaging Center");

// ── Employees ─────────────────────────────────────────────
const firstNames = ["James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Christopher", "Karen", "Charles", "Lisa", "Daniel", "Nancy", "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley", "Steven", "Emily", "Paul", "Donna", "Andrew", "Michelle", "Joshua", "Carol", "Kenneth", "Amanda", "Kevin", "Dorothy", "Brian", "Melissa", "George", "Deborah", "Timothy", "Stephanie", "Ronald", "Rebecca", "Jason", "Sharon", "Jeffrey", "Laura", "Ryan", "Cynthia", "Jacob", "Kathleen", "Gary", "Amy", "Nicholas", "Angela", "Eric", "Shirley", "Jonathan", "Anna", "Stephen", "Brenda", "Larry", "Pamela", "Justin", "Emma", "Scott", "Nicole", "Brandon", "Helen", "Benjamin", "Samantha", "Samuel", "Katherine", "Raymond", "Christine", "Gregory", "Debra", "Frank", "Rachel", "Alexander", "Carolyn", "Patrick", "Janet", "Jack", "Catherine", "Dennis", "Maria", "Jerry", "Heather", "Tyler", "Diane"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts", "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker", "Cruz", "Edwards", "Collins", "Reyes", "Stewart", "Morris", "Morales", "Murphy", "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan", "Cooper", "Peterson", "Bailey", "Reed", "Kelly", "Howard", "Ramos", "Kim", "Cox", "Ward", "Richardson", "Watson", "Brooks", "Chavez", "Wood", "James", "Bennett", "Gray", "Mendoza", "Ruiz", "Hughes", "Price", "Alvarez", "Castillo", "Sanders", "Patel", "Myers", "Long", "Ross", "Foster", "Jimenez"];

const employeeIds: string[] = [];
const employeePlanMap: Record<string, string> = {};

for (let i = 0; i < 200; i++) {
  const id = ulid();
  employeeIds.push(id);
  const planId = Math.random() < 0.6 ? goldPlanId : silverPlanId;
  employeePlanMap[id] = planId;
  const fn = pick(firstNames);
  const ln = pick(lastNames);
  const tierRoll = Math.random();
  const tier = tierRoll < 0.4 ? "employee" : tierRoll < 0.65 ? "employee+spouse" : tierRoll < 0.8 ? "employee+children" : "family";

  db.insert(schema.employees).values({
    id,
    companyId,
    planId,
    employeeCode: `EMP-${String(i + 1).padStart(4, "0")}`,
    firstName: fn,
    lastName: ln,
    email: `${fn.toLowerCase()}.${ln.toLowerCase()}@meridiantech.com`,
    dateOfBirth: dateStr(randInt(1965, 2000), randInt(1, 12), randInt(1, 28)),
    hireDate: dateStr(randInt(2018, 2024), randInt(1, 12), randInt(1, 28)),
    coverageTier: tier,
    status: Math.random() < 0.95 ? "active" : pick(["cobra", "terminated"]),
    createdAt: new Date("2024-01-01"),
  }).run();
}

// ── Claims generation ─────────────────────────────────────
interface ClaimTemplate {
  cptCode: string;
  icdCode: string;
  description: string;
  category: string;
  claimType: string;
  baseCost: number; // cents
}

const claimTemplates: ClaimTemplate[] = [
  { cptCode: "99213", icdCode: "J06.9", description: "Office visit - URI symptoms", category: "outpatient", claimType: "medical", baseCost: 15000 },
  { cptCode: "99213", icdCode: "I10", description: "Office visit - hypertension follow-up", category: "outpatient", claimType: "medical", baseCost: 15000 },
  { cptCode: "99214", icdCode: "E11.9", description: "Office visit - diabetes management", category: "outpatient", claimType: "medical", baseCost: 22000 },
  { cptCode: "99214", icdCode: "M54.5", description: "Office visit - low back pain evaluation", category: "outpatient", claimType: "medical", baseCost: 22000 },
  { cptCode: "99215", icdCode: "E11.9", description: "Office visit - complex diabetes care", category: "outpatient", claimType: "medical", baseCost: 30000 },
  { cptCode: "99395", icdCode: "Z00.00", description: "Annual preventive exam (18-39)", category: "preventive", claimType: "medical", baseCost: 25000 },
  { cptCode: "99396", icdCode: "Z00.00", description: "Annual preventive exam (40-64)", category: "preventive", claimType: "medical", baseCost: 30000 },
  { cptCode: "99283", icdCode: "S93.401A", description: "ER visit - ankle sprain", category: "emergency", claimType: "medical", baseCost: 65000 },
  { cptCode: "99285", icdCode: "R10.9", description: "ER visit - severe abdominal pain", category: "emergency", claimType: "medical", baseCost: 150000 },
  { cptCode: "99281", icdCode: "J06.9", description: "ER visit - minor illness", category: "emergency", claimType: "medical", baseCost: 25000 },
  { cptCode: "70553", icdCode: "M54.5", description: "MRI brain with/without contrast", category: "imaging", claimType: "medical", baseCost: 250000 },
  { cptCode: "72148", icdCode: "M54.5", description: "MRI lumbar spine", category: "imaging", claimType: "medical", baseCost: 200000 },
  { cptCode: "80053", icdCode: "E11.9", description: "Comprehensive metabolic panel", category: "lab", claimType: "medical", baseCost: 5000 },
  { cptCode: "85025", icdCode: "Z00.00", description: "Complete blood count (CBC)", category: "lab", claimType: "medical", baseCost: 3000 },
  { cptCode: "36415", icdCode: "Z00.00", description: "Blood draw - routine", category: "lab", claimType: "medical", baseCost: 1500 },
  { cptCode: "80061", icdCode: "E78.5", description: "Lipid panel", category: "lab", claimType: "medical", baseCost: 4000 },
  { cptCode: "90834", icdCode: "F41.1", description: "Psychotherapy session (45 min)", category: "mental_health", claimType: "behavioral", baseCost: 15000 },
  { cptCode: "90837", icdCode: "F32.1", description: "Psychotherapy session (60 min)", category: "mental_health", claimType: "behavioral", baseCost: 20000 },
  { cptCode: "59400", icdCode: "O80", description: "Routine obstetric care including delivery", category: "maternity", claimType: "medical", baseCost: 500000 },
  { cptCode: "97110", icdCode: "M54.5", description: "Physical therapy - therapeutic exercises", category: "rehabilitation", claimType: "medical", baseCost: 8000 },
  { cptCode: "99223", icdCode: "R10.9", description: "Hospital admission - high complexity", category: "inpatient", claimType: "medical", baseCost: 350000 },
  { cptCode: "99232", icdCode: "R10.9", description: "Hospital follow-up care", category: "inpatient", claimType: "medical", baseCost: 18000 },
];

// Pharmacy claims
const rxTemplates: ClaimTemplate[] = [
  { cptCode: "RX", icdCode: "I10", description: "Lisinopril 10mg (30-day supply)", category: "pharmacy", claimType: "pharmacy", baseCost: 1500 },
  { cptCode: "RX", icdCode: "E11.9", description: "Metformin 500mg (30-day supply)", category: "pharmacy", claimType: "pharmacy", baseCost: 800 },
  { cptCode: "RX", icdCode: "E78.5", description: "Atorvastatin 20mg (30-day supply)", category: "pharmacy", claimType: "pharmacy", baseCost: 1200 },
  { cptCode: "RX", icdCode: "F41.1", description: "Sertraline 50mg (30-day supply)", category: "pharmacy", claimType: "pharmacy", baseCost: 1000 },
  { cptCode: "RX", icdCode: "J45.909", description: "Albuterol inhaler", category: "pharmacy", claimType: "pharmacy", baseCost: 6000 },
  { cptCode: "RX", icdCode: "K21.0", description: "Omeprazole 20mg (30-day supply)", category: "pharmacy", claimType: "pharmacy", baseCost: 900 },
  { cptCode: "RX", icdCode: "E11.9", description: "Ozempic 1mg (30-day supply)", category: "pharmacy", claimType: "pharmacy", baseCost: 95000 },
];

const allTemplates = [...claimTemplates, ...rxTemplates];

// Weight distribution: more outpatient, less emergency/inpatient
function weightedTemplate(): ClaimTemplate {
  const roll = Math.random();
  if (roll < 0.45) return pick(claimTemplates.filter(t => t.category === "outpatient" || t.category === "preventive"));
  if (roll < 0.60) return pick(rxTemplates);
  if (roll < 0.70) return pick(claimTemplates.filter(t => t.category === "lab"));
  if (roll < 0.78) return pick(claimTemplates.filter(t => t.category === "mental_health"));
  if (roll < 0.85) return pick(claimTemplates.filter(t => t.category === "imaging"));
  if (roll < 0.90) return pick(claimTemplates.filter(t => t.category === "emergency"));
  if (roll < 0.95) return pick(claimTemplates.filter(t => t.category === "rehabilitation"));
  if (roll < 0.98) return pick(claimTemplates.filter(t => t.category === "inpatient"));
  return pick(claimTemplates.filter(t => t.category === "maternity"));
}

function providerForCategory(category: string): string {
  const typeMap: Record<string, string[]> = {
    outpatient: ["physician"],
    preventive: ["physician"],
    emergency: ["hospital"],
    inpatient: ["hospital"],
    imaging: ["imaging"],
    lab: ["lab"],
    mental_health: ["specialist"],
    maternity: ["specialist", "hospital"],
    rehabilitation: ["specialist"],
    pharmacy: ["pharmacy"],
  };
  const types = typeMap[category] || ["physician"];
  const matching = providerData
    .map((p, i) => ({ ...p, id: providerIds[i] }))
    .filter(p => types.includes(p.type));
  return matching.length > 0 ? pick(matching).id : pick(providerIds);
}

const claimIds: string[] = [];
let claimCounter = 0;

// Generate ~2500 claims across 12 months (Mar 2025 - Feb 2026, but we'll use Jan 2025 - Dec 2025 for a full year)
for (let month = 1; month <= 12; month++) {
  // Seasonal variation: more claims in winter (flu), slightly fewer in summer
  let monthClaims = randInt(180, 230);
  if (month === 1 || month === 2 || month === 12) monthClaims += randInt(20, 40); // winter bump
  if (month === 6 || month === 7) monthClaims -= randInt(10, 20); // summer dip

  // Behavioral health spike in month 8 (August) - intentional anomaly
  const extraBehavioral = month === 8 ? 30 : 0;

  for (let i = 0; i < monthClaims + extraBehavioral; i++) {
    const id = ulid();
    claimIds.push(id);
    claimCounter++;

    let template: ClaimTemplate;
    if (i >= monthClaims) {
      // Extra behavioral health claims for the anomaly
      template = pick(claimTemplates.filter(t => t.category === "mental_health"));
    } else {
      template = weightedTemplate();
    }

    const empId = pick(employeeIds);
    const planId = employeePlanMap[empId];

    // Determine provider - sometimes use the expensive Pinnacle for imaging (anomaly)
    let providerId: string;
    if (template.category === "imaging" && Math.random() < 0.4) {
      providerId = providerIds[pinnacleIdx]; // Expensive imaging center
    } else {
      providerId = providerForCategory(template.category);
    }

    // Cost calculation with provider cost index variance
    const providerIdx = providerIds.indexOf(providerId);
    const costMultiplier = providerData[providerIdx]?.costIndex || 1.0;
    const variance = 0.8 + Math.random() * 0.4; // 80% to 120%
    const billedAmount = Math.round(template.baseCost * costMultiplier * variance);
    const networkDiscount = providerData[providerIdx]?.network === "in-network" ? (0.4 + Math.random() * 0.2) : (0.1 + Math.random() * 0.15);
    const allowedAmount = Math.round(billedAmount * (1 - networkDiscount));
    const coinsurance = planId === goldPlanId ? 0.8 : 0.8;
    const paidAmount = Math.round(allowedAmount * coinsurance);
    const memberResp = allowedAmount - paidAmount;

    const serviceDay = randInt(1, 28);
    const serviceDate = dateStr(2025, month, serviceDay);
    const receivedDate = dateStr(2025, month, Math.min(serviceDay + randInt(1, 14), 28));

    // Status distribution
    const statusRoll = Math.random();
    let status: string;
    if (month <= 10) {
      status = statusRoll < 0.65 ? "paid" : statusRoll < 0.80 ? "approved" : statusRoll < 0.90 ? "denied" : statusRoll < 0.95 ? "in_review" : "pending";
    } else if (month <= 11) {
      status = statusRoll < 0.40 ? "paid" : statusRoll < 0.60 ? "approved" : statusRoll < 0.75 ? "in_review" : "pending";
    } else {
      status = statusRoll < 0.20 ? "approved" : statusRoll < 0.50 ? "in_review" : "pending";
    }

    // Anomaly flags
    let isAnomalous = false;
    let anomalyReason: string | null = null;

    // Flag expensive imaging claims
    if (template.category === "imaging" && providerId === providerIds[pinnacleIdx]) {
      isAnomalous = true;
      anomalyReason = "Provider charges 2.8x market average for imaging services";
    }

    // Random duplicate-looking claims (same employee, same day, same CPT)
    if (claimCounter % 150 === 0) {
      isAnomalous = true;
      anomalyReason = "Potential duplicate claim - same service on same date";
    }

    db.insert(schema.claims).values({
      id,
      claimNumber: `CLM-2025-${String(claimCounter).padStart(5, "0")}`,
      employeeId: empId,
      providerId,
      planId,
      serviceDate,
      receivedDate,
      claimType: template.claimType as string,
      status,
      billedAmount,
      allowedAmount,
      paidAmount,
      memberResponsibility: memberResp,
      deductibleApplied: Math.round(memberResp * 0.3),
      coinsuranceApplied: Math.round(memberResp * 0.7),
      copayApplied: planId === goldPlanId ? (template.category === "outpatient" ? 2500 : template.category === "emergency" ? 25000 : 5000) : 0,
      cptCode: template.cptCode,
      icdCode: template.icdCode,
      description: template.description,
      serviceCategory: template.category,
      aiCategoryConfidence: 0.85 + Math.random() * 0.15,
      isAnomalous,
      anomalyReason,
      sourceFile: null,
      createdAt: new Date(receivedDate),
      updatedAt: new Date(receivedDate),
    }).run();

    // Create audit trail entries for processed claims
    if (status !== "pending") {
      db.insert(schema.claimAuditTrail).values({
        id: ulid(),
        claimId: id,
        action: "created",
        performedBy: "system",
        previousStatus: null,
        newStatus: "pending",
        notes: "Claim received and entered into system",
        metadata: null,
        createdAt: new Date(receivedDate),
      }).run();

      db.insert(schema.claimAuditTrail).values({
        id: ulid(),
        claimId: id,
        action: "categorized",
        performedBy: "ai",
        previousStatus: "pending",
        newStatus: "pending",
        notes: `AI categorized as ${template.category} with ${(0.85 + Math.random() * 0.15).toFixed(2)} confidence`,
        metadata: JSON.stringify({ category: template.category, cptCode: template.cptCode }),
        createdAt: new Date(new Date(receivedDate).getTime() + 60000),
      }).run();

      if (status === "approved" || status === "paid" || status === "denied") {
        db.insert(schema.claimAuditTrail).values({
          id: ulid(),
          claimId: id,
          action: status === "denied" ? "denied" : "approved",
          performedBy: pick([adminUserId, reviewerUserId]),
          previousStatus: "in_review",
          newStatus: status === "denied" ? "denied" : "approved",
          notes: status === "denied" ? pick(["Service not covered under plan", "Pre-authorization not obtained", "Out-of-network without referral"]) : "Claim approved after review",
          metadata: null,
          createdAt: new Date(new Date(receivedDate).getTime() + 86400000 * randInt(1, 5)),
        }).run();
      }

      if (status === "paid") {
        db.insert(schema.claimAuditTrail).values({
          id: ulid(),
          claimId: id,
          action: "paid",
          performedBy: "system",
          previousStatus: "approved",
          newStatus: "paid",
          notes: `Payment of ${(paidAmount / 100).toFixed(2)} processed`,
          metadata: JSON.stringify({ paidAmount }),
          createdAt: new Date(new Date(receivedDate).getTime() + 86400000 * randInt(5, 15)),
        }).run();
      }
    }
  }
}

// ── AI Insights (pre-seeded) ──────────────────────────────
const insights = [
  {
    type: "provider_switch",
    title: "Switch imaging provider to save $47,000/year",
    summary: "Pinnacle Imaging Center charges 2.8x market average for MRI and CT scans. ClearView Radiology offers identical services at standard rates.",
    detail: `## Provider Cost Analysis: Imaging Services\n\nPinnacle Imaging Center is currently charging an average of **$700** per MRI scan, compared to the market average of **$250**. Over the past 12 months, Meridian employees had 67 imaging procedures at Pinnacle.\n\n### Recommended Action\nSwitch preferred imaging provider to **ClearView Radiology** (4.1★ rating, in-network).\n\n### Estimated Impact\n- **Annual savings: $47,150**\n- No disruption to employee access\n- ClearView has shorter average wait times (3 days vs 8 days)\n\n### Claims Affected\n67 imaging claims totaling $46,900 in excess charges over the past year.`,
    severity: "critical",
    savings: 4715000,
  },
  {
    type: "trend_warning",
    title: "Behavioral health claims up 45% in Q3",
    summary: "Mental health service utilization spiked significantly in August-September. This may indicate workforce stress that could be addressed with an EAP.",
    detail: `## Trend Alert: Behavioral Health Utilization\n\nBehavioral health claims increased **45%** in Q3 2025 compared to Q2:\n- Q2 average: 18 claims/month\n- Q3 average: 26 claims/month\n- August peak: 38 claims\n\n### Root Cause Analysis\nThe spike correlates with the company's Q3 product launch period. Most claims are for anxiety (F41.1) and depression (F32.1) diagnoses.\n\n### Recommendations\n1. **Add an Employee Assistance Program (EAP)** - Estimated cost: $3/employee/month ($7,200/year)\n2. **Consider telehealth mental health benefit** - Can reduce per-session costs by 30%\n3. **Review workload policies** during major launch periods\n\n### Projected Impact\nAn EAP could reduce behavioral health claims by 20-30%, saving approximately **$18,000/year** while improving employee wellbeing.`,
    severity: "warning",
    savings: 1800000,
  },
  {
    type: "anomaly_alert",
    title: "12 potential duplicate claims detected",
    summary: "Multiple claims from the same provider on the same service date with identical charge amounts suggest possible billing errors.",
    detail: `## Duplicate Claim Analysis\n\n**12 claims** have been flagged as potential duplicates based on matching:\n- Same employee\n- Same service date\n- Same CPT code\n- Same provider\n\n### Breakdown\n- 8 claims appear to be exact duplicates (same amounts)\n- 4 claims have slight variations (may be legitimate separate services)\n\n### Recommended Action\n1. Review flagged claims individually\n2. Contact providers to confirm services rendered\n3. Request refunds for confirmed duplicates\n\n### Estimated Recovery\nIf 8 of 12 are confirmed duplicates: **$12,400** in recoverable overpayments.`,
    severity: "warning",
    savings: 1240000,
  },
  {
    type: "plan_design",
    title: "HDHP members deferring preventive care",
    summary: "Silver HDHP members are 40% less likely to complete annual preventive visits compared to Gold PPO members, potentially leading to higher costs from undetected conditions.",
    detail: `## Plan Design Insight: Preventive Care Gap\n\n### Finding\nOnly **34%** of HDHP members completed their annual preventive visit, compared to **62%** of PPO members.\n\n### Why This Matters\nDeferred preventive care leads to:\n- Late detection of chronic conditions (diabetes, hypertension)\n- Higher ER utilization for preventable issues\n- Estimated **$85,000/year** in excess claims from unmanaged conditions\n\n### Recommendation\n**Waive the deductible for preventive services** on the HDHP plan.\n- ACA already requires this for many preventive services\n- Extending to all preventive visits (including labs) costs approximately **$12,000/year**\n- ROI: $7 saved for every $1 spent on preventive care\n\n### Implementation\nThis change can be made at the next plan renewal with minimal administrative effort.`,
    severity: "info",
    savings: 8500000,
  },
  {
    type: "cost_saving",
    title: "Negotiate reference-based pricing for hospital services",
    summary: "Hospital claims at University Health System are 30% above Medicare benchmark rates. Reference-based pricing could save $62,000 annually.",
    detail: `## Cost Optimization: Hospital Pricing\n\n### Analysis\nUniversity Health System charges average **130% of Medicare** rates for inpatient and outpatient services. Industry benchmark for negotiated rates is **110-120% of Medicare**.\n\n### Current Spend\n- Total hospital claims (12 months): $890,000\n- Estimated excess over benchmark: $62,000\n\n### Recommendation\nImplement **reference-based pricing (RBP)** for hospital services:\n1. Set allowed amounts at 120% of Medicare rates\n2. Negotiate with UHS for an in-network RBP arrangement\n3. Alternatively, steer to Regional Medical Center (currently at 110% Medicare)\n\n### Risks\n- Provider pushback (mitigated by market competition)\n- Member balance billing (mitigated by state surprise billing protections)\n\n### Estimated Annual Savings: $62,000`,
    severity: "info",
    savings: 6200000,
  },
];

for (const insight of insights) {
  db.insert(schema.aiInsights).values({
    id: ulid(),
    companyId,
    insightType: insight.type,
    title: insight.title,
    summary: insight.summary,
    detail: insight.detail,
    severity: insight.severity,
    estimatedSavings: insight.savings,
    status: "new",
    relatedClaimIds: null,
    createdAt: new Date(),
  }).run();
}

// ── High utilization employee anomaly ─────────────────────
// Pick one employee and give them excessive claims
const highUtilEmpId = employeeIds[42];
for (let i = 0; i < 30; i++) {
  const id = ulid();
  claimCounter++;
  const template = pick(allTemplates);
  const month = randInt(1, 12);
  const serviceDate = dateStr(2025, month, randInt(1, 28));

  db.insert(schema.claims).values({
    id,
    claimNumber: `CLM-2025-${String(claimCounter).padStart(5, "0")}`,
    employeeId: highUtilEmpId,
    providerId: providerForCategory(template.category),
    planId: employeePlanMap[highUtilEmpId],
    serviceDate,
    receivedDate: serviceDate,
    claimType: template.claimType,
    status: "paid",
    billedAmount: template.baseCost,
    allowedAmount: Math.round(template.baseCost * 0.6),
    paidAmount: Math.round(template.baseCost * 0.6 * 0.8),
    memberResponsibility: Math.round(template.baseCost * 0.6 * 0.2),
    deductibleApplied: 0,
    coinsuranceApplied: Math.round(template.baseCost * 0.6 * 0.2),
    copayApplied: 0,
    cptCode: template.cptCode,
    icdCode: template.icdCode,
    description: template.description,
    serviceCategory: template.category,
    aiCategoryConfidence: 0.92,
    isAnomalous: true,
    anomalyReason: "Unusually high utilization - employee has 3x average number of claims",
    sourceFile: null,
    createdAt: new Date(serviceDate),
    updatedAt: new Date(serviceDate),
  }).run();
}

console.log(`✅ Seeded database at ${dbPath}`);
console.log(`   - 1 company (Meridian Technologies)`);
console.log(`   - 2 plans (Gold PPO, Silver HDHP)`);
console.log(`   - 3 demo users`);
console.log(`   - ${providerData.length} providers`);
console.log(`   - 200 employees`);
console.log(`   - ${claimCounter} claims`);
console.log(`   - ${insights.length} AI insights`);
console.log(`   - Audit trail entries for processed claims`);

sqlite.close();
