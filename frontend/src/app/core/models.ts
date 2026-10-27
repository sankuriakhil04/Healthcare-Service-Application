export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  qualification: string;
  experience: number;
  clinic: string;
  fee: number;
  days: string[];
  times: string[];
  image: string;
  available: boolean;
  about: string;
}
export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  available: boolean;
}
export interface Appointment {
  id: string;
  patientName: string;
  email: string;
  phone: string;
  doctorId: string;
  doctor: string;
  specialization: string;
  date: string;
  time: string;
  reason: string;
  status: string;
}
export interface MedicalRecord {
  id: string;
  patient: string;
  doctor: string;
  diagnosis: string;
  date: string;
  prescription: string;
  notes: string;
}
export interface Profile {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  address: string;
  emergencyContact: string;
}
