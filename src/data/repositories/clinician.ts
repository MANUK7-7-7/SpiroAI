import { clinicianSchema, type Clinician } from "../schemas";
import { clinicianFixture } from "../fixtures/clinician";
import { openAlertCount } from "./alerts";

export async function getCurrentClinician(): Promise<Clinician> {
  return clinicianSchema.parse({ ...clinicianFixture, unreadAlerts: openAlertCount() });
}
