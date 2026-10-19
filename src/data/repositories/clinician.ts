import { clinicianSchema, type Clinician } from "../schemas";
import { clinicianFixture } from "../fixtures/clinician";

export async function getCurrentClinician(): Promise<Clinician> {
  return clinicianSchema.parse(clinicianFixture);
}
