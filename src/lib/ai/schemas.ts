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

export const eobSectionSchema = z.object({
  heading: z.string(),
  icon: z.enum(["clipboard", "dollar", "shield", "heart"]),
  body: z.string(),
  highlight: z.object({ label: z.string(), value: z.string() }).optional(),
});

export const eobResponseSchema = z.object({
  title: z.string(),
  sections: z.array(eobSectionSchema),
  footer: z.string().optional(),
});

export type EobResponse = z.infer<typeof eobResponseSchema>;
export type EobSection = z.infer<typeof eobSectionSchema>;
