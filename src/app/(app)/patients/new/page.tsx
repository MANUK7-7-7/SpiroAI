import { AddPatientModal } from "@/components/patients/add-patient-modal";
import PatientsPage from "../page";

/** S07 opens as a modal over the patient panel. */
export default function NewPatient() {
  return (
    <>
      <PatientsPage searchParams={Promise.resolve({})} />
      <AddPatientModal />
    </>
  );
}
