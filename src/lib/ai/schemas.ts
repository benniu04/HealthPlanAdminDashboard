import { z } from "zod";

export const anomalyDetectionRequestSchema = z.object({
  claimIds: z.array(z.string().min(1)).min(1).max(100).optional(),
});

export const anomalyResultItemSchema = z.object({
  claimId: z.string(),
  isAnomalous: z.boolean(),
  anomalyReason: z.string().nullable(),
  confidence: z.number().min(0).max(1),
});

export const anomalyResultSchema = z.array(anomalyResultItemSchema);

export type AnomalyDetectionRequest = z.infer<typeof anomalyDetectionRequestSchema>;
export type AnomalyResultItem = z.infer<typeof anomalyResultItemSchema>;
