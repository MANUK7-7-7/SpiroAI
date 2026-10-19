import { applicationSchema, type Application } from "../schemas";

// Fictional fixture. Swap this module for a Prisma-backed implementation later.
const fixture = {
  id: "VR-2084",
  submittedAt: "2026-10-16T08:10:00-03:00",
  status: "in_review",
  fullName: "Dr. Elena Morales",
  licenseNumber: "MP-48291",
  institution: "Riverside Clinic",
};

export async function getCurrentApplication(): Promise<Application> {
  return applicationSchema.parse(fixture);
}
