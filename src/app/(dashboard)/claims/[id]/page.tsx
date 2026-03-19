import { db } from "@/db";
import { claims, employees, providers, plans, claimAuditTrail } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCents, CLAIM_STATUSES, COMMON_CPT_CODES, COMMON_ICD_CODES } from "@/lib/constants";
import { ClaimActions } from "@/components/claims/claim-actions";
import { ClaimChat } from "@/components/ai/claim-chat";
import { FileText, User, Building2, Calendar, DollarSign, AlertTriangle, Clock, CheckCircle, XCircle, Bot } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClaimDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [claim] = await db
    .select()
    .from(claims)
    .where(eq(claims.id, id))
    .limit(1);

  if (!claim) return notFound();

  const [employee] = await db.select().from(employees).where(eq(employees.id, claim.employeeId)).limit(1);
  const [provider] = await db.select().from(providers).where(eq(providers.id, claim.providerId)).limit(1);
  const [plan] = await db.select().from(plans).where(eq(plans.id, claim.planId)).limit(1);

  const auditTrail = await db
    .select()
    .from(claimAuditTrail)
    .where(eq(claimAuditTrail.claimId, id))
    .orderBy(asc(claimAuditTrail.createdAt));

  const statusConfig = CLAIM_STATUSES.find(s => s.value === claim.status);
  const cptInfo = claim.cptCode ? COMMON_CPT_CODES[claim.cptCode] : null;
  const icdDesc = claim.icdCode ? COMMON_ICD_CODES[claim.icdCode] : null;

  const actionIcons: Record<string, typeof CheckCircle> = {
    created: FileText,
    categorized: Bot,
    approved: CheckCircle,
    denied: XCircle,
    paid: DollarSign,
    flagged_anomaly: AlertTriangle,
    submitted_review: Clock,
    note_added: FileText,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{claim.claimNumber}</h2>
          <p className="text-muted-foreground">{claim.description}</p>
        </div>
        <div className="flex items-center gap-3">
          {claim.isAnomalous && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Anomaly Detected
            </Badge>
          )}
          <Badge className={`text-sm ${statusConfig?.color || ""}`} variant="secondary">
            {statusConfig?.label || claim.status}
          </Badge>
        </div>
      </div>

      {claim.isAnomalous && claim.anomalyReason && (
        <Card className="border-red-200 dark:border-red-700 bg-red-50/50 dark:bg-red-950/30">
          <CardContent className="flex items-start gap-3 pt-4">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <p className="font-medium text-red-900 dark:text-red-100">Anomaly Alert</p>
              <p className="text-sm text-red-700 dark:text-red-300">{claim.anomalyReason}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Claim Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Claim Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Service Date</p>
                <p className="font-medium">{claim.serviceDate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Received Date</p>
                <p className="font-medium">{claim.receivedDate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Claim Type</p>
                <p className="font-medium capitalize">{claim.claimType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Service Category</p>
                <p className="font-medium capitalize">{claim.serviceCategory?.replace("_", " ")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CPT Code</p>
                <p className="font-medium">{claim.cptCode} {cptInfo && <span className="text-muted-foreground">- {cptInfo.description}</span>}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ICD-10 Code</p>
                <p className="font-medium">{claim.icdCode} {icdDesc && <span className="text-muted-foreground">- {icdDesc}</span>}</p>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-3">Financial Summary</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex justify-between rounded-lg border p-3">
                  <span className="text-sm text-muted-foreground">Billed Amount</span>
                  <span className="font-medium">{formatCents(claim.billedAmount)}</span>
                </div>
                <div className="flex justify-between rounded-lg border p-3">
                  <span className="text-sm text-muted-foreground">Allowed Amount</span>
                  <span className="font-medium">{formatCents(claim.allowedAmount)}</span>
                </div>
                <div className="flex justify-between rounded-lg border p-3 bg-green-50 dark:bg-green-950/50">
                  <span className="text-sm text-green-700 dark:text-green-300">Plan Paid</span>
                  <span className="font-medium text-green-700 dark:text-green-300">{formatCents(claim.paidAmount)}</span>
                </div>
                <div className="flex justify-between rounded-lg border p-3 bg-amber-50 dark:bg-amber-950/50">
                  <span className="text-sm text-amber-700 dark:text-amber-300">Member Responsibility</span>
                  <span className="font-medium text-amber-700 dark:text-amber-300">{formatCents(claim.memberResponsibility)}</span>
                </div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3 text-sm">
                <div className="flex justify-between rounded border p-2">
                  <span className="text-muted-foreground">Deductible</span>
                  <span>{formatCents(claim.deductibleApplied)}</span>
                </div>
                <div className="flex justify-between rounded border p-2">
                  <span className="text-muted-foreground">Coinsurance</span>
                  <span>{formatCents(claim.coinsuranceApplied)}</span>
                </div>
                <div className="flex justify-between rounded border p-2">
                  <span className="text-muted-foreground">Copay</span>
                  <span>{formatCents(claim.copayApplied)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Employee Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" /> Employee
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p className="font-medium">{employee.firstName} {employee.lastName}</p>
              <p className="text-muted-foreground">{employee.employeeCode}</p>
              <p className="text-muted-foreground">{employee.email}</p>
              <p className="text-muted-foreground capitalize">Coverage: {employee.coverageTier}</p>
            </CardContent>
          </Card>

          {/* Provider Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Provider
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p className="font-medium">{provider.name}</p>
              <p className="text-muted-foreground">{provider.specialty}</p>
              <p className="text-muted-foreground">NPI: {provider.npi}</p>
              <Badge variant={provider.networkStatus === "in-network" ? "default" : "destructive"} className="text-[10px]">
                {provider.networkStatus}
              </Badge>
            </CardContent>
          </Card>

          {/* Plan Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" /> Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p className="font-medium">{plan.name}</p>
              <p className="text-muted-foreground">{plan.type}</p>
              <p className="text-muted-foreground">Deductible: {formatCents(plan.deductibleInd)}</p>
              <p className="text-muted-foreground">OOP Max: {formatCents(plan.oopMaxInd)}</p>
            </CardContent>
          </Card>

          {/* Actions */}
          {(claim.status === "pending" || claim.status === "in_review") && (
            <ClaimActions claimId={claim.id} currentStatus={claim.status} />
          )}
        </div>
      </div>

      <ClaimChat claimId={claim.id} claimNumber={claim.claimNumber} />

      {/* Audit Trail */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Audit Trail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-6">
              {auditTrail.map((entry, idx) => {
                const Icon = actionIcons[entry.action] || FileText;
                return (
                  <div key={entry.id} className="relative flex gap-4 pl-10">
                    <div className="absolute left-2 mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-background border">
                      <Icon className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium capitalize">{entry.action.replace("_", " ")}</p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleDateString()} {new Date(entry.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      {entry.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{entry.notes}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        By: {entry.performedBy === "system" ? "System" : entry.performedBy === "ai" ? "AI Engine" : "Reviewer"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
