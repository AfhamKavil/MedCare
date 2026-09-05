export type Role = 'patient' | 'doctor' | 'nurse';
export type Status = 'urgent' | 'priority' | 'stable';

export interface User {
  id: string;
  role: Role;
  name: string;
  credentials?: string;
}

export interface Patient extends User {
  role: 'patient';
  demographics: {
    age: number;
    gender: string;
    bloodType: string;
  };
  medical_history: string[];
  allergies: string[];
  current_medications: string[];
}

export interface Ward {
  id: string;
  name: string;
  nurse_id: string;
}

export interface Admission {
  id: string;
  patient_id: string;
  ward_id: string;
  bed_number: string;
  status: Status;
  diagnosis: string;
  vitals: {
    bp: string;
    hr: number;
    spo2: number;
    temp: number;
  };
  handover_notes: string;
  pending_actions: string[];
}

export const mockPatients: Patient[] = [
  {
    id: 'p1',
    role: 'patient',
    name: 'John Doe',
    demographics: { age: 45, gender: 'Male', bloodType: 'O+' },
    medical_history: ['Hypertension', 'Diabetes Type 2'],
    allergies: ['Penicillin'],
    current_medications: ['Metformin', 'Lisinopril'],
  },
];

export const mockWards: Ward[] = [
  { id: 'w1', name: 'General Ward A', nurse_id: 'NUR-1234' },
];

export const mockAdmissions: Admission[] = [
  {
    id: 'a1',
    patient_id: 'p1',
    ward_id: 'w1',
    bed_number: '101A',
    status: 'stable',
    diagnosis: 'Observation post mild concussion',
    vitals: { bp: '120/80', hr: 72, spo2: 98, temp: 37.1 },
    handover_notes: 'Monitor neurological signs every 4 hours.',
    pending_actions: ['CT Scan review'],
  },
];
