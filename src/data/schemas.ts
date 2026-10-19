import { z } from "zod";

export const verificationStatus = z.enum(["submitted", "in_review", "approved", "rejected"]);

export const applicationSchema = z.object({
  id: z.string(),
  submittedAt: z.string().datetime(),
  status: verificationStatus,
  fullName: z.string(),
  licenseNumber: z.string(),
  institution: z.string(),
});
export type Application = z.infer<typeof applicationSchema>;
