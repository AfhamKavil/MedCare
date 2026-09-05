import { create } from 'zustand';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Priority = 'Urgent' | 'Priority' | 'Stable';
export type ActorRole = 'Nurse' | 'Doctor' | 'Patient' | 'System';
export type TriageUrgency = 'URGENT' | 'PRIORITY' | 'NON-URGENT' | 'ESCALATE';

export interface TriageResult {
  urgency: TriageUrgency;
  reason_codes: string[];
  recommended_action: string;
  diagnosis: null;
  triggered_by: 'HARD_RULE' | 'AI_COUNCIL';
  timestamp: string;         // HH:MM from ts()
  source: 'triage';          // discriminator so Nurse can identify these events
}

export interface Vitals {
  bp: string;       // "128/76"
  hr: number;       // beats per minute
  spo2: number;     // percentage
  temp: number;     // Celsius
  oxygen: string;   // "Room air" | "2L O2" etc.
}

export interface ClinicalPatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  bloodType: string;
  diagnosis: string;
  ward: string;
  bed: string;
  priority: Priority;
  vitals: Vitals;
  previousVitals: Vitals;       // snapshot from last handover
  handoverNotes: string;
  previousHandoverNotes: string;
  pendingActions: string[];
  medications: string[];
  allergies: string[];
  medicalHistory: string[];
  weight: number;   // kg — for calculator pre-fill
  height: number;   // cm — for calculator pre-fill
  lastHandoverAt: string;       // ISO timestamp
  lastTriageResult?: TriageResult; // set by Patient Triage page; read by Nurse Dashboard
}

export interface AuditEvent {
  id: string;
  patientId: string;
  timestamp: string;            // ISO string
  actorRole: ActorRole;
  action: string;
  details: string;
}

// ─── Delta helpers ─────────────────────────────────────────────────────────────

export interface VitalDelta {
  field: string;
  label: string;
  previous: string | number;
  current: string | number;
  direction: 'up' | 'down' | 'unchanged';
  significant: boolean;
}

export function calculateDeltas(prev: Vitals, curr: Vitals): VitalDelta[] {
  const deltas: VitalDelta[] = [];

  const numericFields: { key: keyof Vitals; label: string; warnThreshold: number }[] = [
    { key: 'spo2', label: 'SpO₂', warnThreshold: 2 },
    { key: 'hr',   label: 'Heart Rate', warnThreshold: 10 },
    { key: 'temp', label: 'Temperature', warnThreshold: 0.5 },
  ];

  for (const { key, label, warnThreshold } of numericFields) {
    const p = prev[key] as number;
    const c = curr[key] as number;
    const diff = c - p;
    deltas.push({
      field: key,
      label,
      previous: p,
      current: c,
      direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'unchanged',
      significant: Math.abs(diff) >= warnThreshold,
    });
  }

  // BP — string comparison
  if (prev.bp !== curr.bp) {
    deltas.push({
      field: 'bp',
      label: 'Blood Pressure',
      previous: prev.bp,
      current: curr.bp,
      direction: 'up', // directional meaning is ambiguous for BP string
      significant: true,
    });
  }

  // Oxygen
  if (prev.oxygen !== curr.oxygen) {
    deltas.push({
      field: 'oxygen',
      label: 'O₂ Delivery',
      previous: prev.oxygen,
      current: curr.oxygen,
      direction: 'up',
      significant: true,
    });
  }

  return deltas;
}

// ─── SBAR generator ───────────────────────────────────────────────────────────

export function generateSBAR(patient: ClinicalPatient, deltas: VitalDelta[]): {
  situation: string;
  background: string;
  assessment: string;
  recommendation: string;
} {
  const worsening = deltas.filter((d) => d.significant);
  const spo2Drop = deltas.find((d) => d.field === 'spo2' && d.direction === 'down' && d.significant);
  const hrRise = deltas.find((d) => d.field === 'hr' && d.direction === 'up' && d.significant);
  const tempRise = deltas.find((d) => d.field === 'temp' && d.direction === 'up' && d.significant);

  const situation =
    worsening.length > 0
      ? `${patient.name} (${patient.age}yo), Bed ${patient.bed}, ${patient.ward} — has ${worsening.length} worsening vital(s) since last handover at ${patient.lastHandoverAt}.`
      : `${patient.name} (${patient.age}yo), Bed ${patient.bed}, ${patient.ward} — vitals stable since last handover.`;

  const background = `Known diagnosis: ${patient.diagnosis}. Medical history: ${patient.medicalHistory.join(', ')}. Allergies: ${patient.allergies.join(', ')}. Current medications: ${patient.medications.join(', ')}.`;

  const assessmentParts: string[] = [];
  if (spo2Drop) assessmentParts.push(`SpO₂ has dropped from ${spo2Drop.previous}% to ${spo2Drop.current}% (↓${Number(spo2Drop.previous) - Number(spo2Drop.current)}%)`);
  if (hrRise) assessmentParts.push(`HR has increased from ${hrRise.previous} to ${hrRise.current} bpm`);
  if (tempRise) assessmentParts.push(`Temperature has risen from ${tempRise.previous}°C to ${tempRise.current}°C`);
  if (assessmentParts.length === 0) assessmentParts.push('No significant vital changes detected since last handover.');

  const assessment = assessmentParts.join('. ') + '.';

  const recParts: string[] = [];
  if (spo2Drop) recParts.push(`Review O₂ therapy — current delivery: ${patient.vitals.oxygen}`);
  if (hrRise) recParts.push('Consider ECG and fluid status review');
  if (tempRise) recParts.push('Consider repeat blood cultures and antipyretic review');
  if (recParts.length === 0) recParts.push('Continue current management plan and routine monitoring.');

  const recommendation = recParts.join('. ') + '.';

  return { situation, background, assessment, recommendation };
}

// ─── Initial Data ─────────────────────────────────────────────────────────────

const INITIAL_VITALS_RAJ: Vitals = {
  bp: '128/76', hr: 92, spo2: 96, temp: 37.2, oxygen: 'Room air',
};

const INITIAL_PATIENTS: ClinicalPatient[] = [
  {
    id: 'p1',
    name: 'Raj Kumar',
    age: 58,
    gender: 'Male',
    bloodType: 'B+',
    diagnosis: 'Community-acquired Pneumonia',
    ward: 'Ward 3',
    bed: '12',
    priority: 'Stable',
    vitals: { ...INITIAL_VITALS_RAJ },
    previousVitals: { ...INITIAL_VITALS_RAJ },
    handoverNotes: 'Day 2 of IV amoxicillin. Chest X-ray reviewed — right lower lobe consolidation improving. Afebrile overnight. Continue O2 monitoring.',
    previousHandoverNotes: 'Day 1 post-admission. Commenced IV antibiotics. SpO2 stable on room air.',
    pendingActions: ['📋 Repeat CXR at 48h', '💊 IV Amoxicillin 1g TDS due 14:00', '🩸 FBC + CRP at 08:00'],
    medications: ['Amoxicillin IV 1g TDS', 'Paracetamol 1g QDS', 'Salbutamol inhaler PRN'],
    allergies: ['Penicillin — mild rash (document)'],
    medicalHistory: ['Type 2 Diabetes', 'Hypertension', 'Ex-smoker (20 pack-years)'],
    weight: 74,
    height: 168,
    lastHandoverAt: '08:00',
  },
  {
    id: 'p2',
    name: 'Meena Pillai',
    age: 43,
    gender: 'Female',
    bloodType: 'A+',
    diagnosis: 'Acute Pyelonephritis',
    ward: 'Ward 3',
    bed: '14',
    priority: 'Priority',
    vitals: { bp: '106/68', hr: 104, spo2: 98, temp: 38.6, oxygen: 'Room air' },
    previousVitals: { bp: '110/72', hr: 98, spo2: 98, temp: 38.2, oxygen: 'Room air' },
    handoverNotes: 'Spiking temps. Blood cultures x2 sent. Urine MC&S pending. IV Ceftriaxone commenced.',
    previousHandoverNotes: 'Admitted with flank pain and dysuria. Started PO antibiotics initially.',
    pendingActions: ['🩸 Blood cultures result review', '🧪 Urine MC&S', '💊 IV Ceftriaxone 1g OD due 16:00'],
    medications: ['Ceftriaxone IV 1g OD', 'Paracetamol 1g QDS', 'IV Fluids 0.9% NaCl'],
    allergies: ['None known'],
    medicalHistory: ['Recurrent UTIs', 'Hypothyroidism'],
    weight: 62,
    height: 160,
    lastHandoverAt: '08:00',
  },
  {
    id: 'p3',
    name: 'David Osei',
    age: 67,
    gender: 'Male',
    bloodType: 'O-',
    diagnosis: 'Heart Failure Exacerbation',
    ward: 'Ward 3',
    bed: '15',
    priority: 'Urgent',
    vitals: { bp: '156/98', hr: 112, spo2: 91, temp: 36.8, oxygen: '4L O2 via mask' },
    previousVitals: { bp: '148/90', hr: 105, spo2: 94, temp: 36.9, oxygen: '2L O2 nasal cannula' },
    handoverNotes: 'Worsening SOB overnight. O2 escalated to 4L mask. Cardiologist contacted. Echo requested.',
    previousHandoverNotes: 'Admitted with ankle oedema and SOB. 2L O2 maintaining sats. Started furosemide.',
    pendingActions: ['🚨 Cardiology review pending', '💊 Furosemide 40mg IV done — monitor urine output', '📋 Echo scheduled 14:30'],
    medications: ['Furosemide IV 40mg', 'Ramipril 5mg OD', 'Bisoprolol 2.5mg OD', 'GTN spray PRN'],
    allergies: ['Aspirin — bronchospasm'],
    medicalHistory: ['Ischaemic Heart Disease', 'CKD Stage 3', 'AF on anticoagulation'],
    weight: 88,
    height: 174,
    lastHandoverAt: '07:30',
  },
];

// ─── Store ────────────────────────────────────────────────────────────────────

interface ClinicalStore {
  patients: ClinicalPatient[];
  auditLog: AuditEvent[];

  // Actions
  updateVitals: (patientId: string, vitals: Partial<Vitals>, actorRole: ActorRole) => void;
  takeHandoverSnapshot: (patientId: string, actorRole: ActorRole) => void;
  saveHandoverNotes: (patientId: string, notes: string, actorRole: ActorRole) => void;
  updatePriority: (patientId: string, priority: Priority, actorRole: ActorRole) => void;
  addPendingAction: (patientId: string, action: string) => void;
  removePendingAction: (patientId: string, index: number, actorRole: ActorRole) => void;
  // Triage — called after POST /api/triage succeeds
  recordTriageResult: (patientId: string, result: TriageResult) => void;
}

let _eventCounter = 0;
const uid = () => `evt-${Date.now()}-${_eventCounter++}`;
const ts = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

export const useClinicalStore = create<ClinicalStore>((set, get) => ({
  patients: INITIAL_PATIENTS,
  auditLog: [
    {
      id: uid(),
      patientId: 'p1',
      timestamp: '08:00',
      actorRole: 'System',
      action: 'Handover snapshot taken',
      details: 'Shift start 08:00. Baseline vitals recorded: SpO₂ 96%, HR 92, Temp 37.2°C, BP 128/76.',
    },
    {
      id: uid(),
      patientId: 'p3',
      timestamp: '07:30',
      actorRole: 'Nurse',
      action: 'O₂ escalated',
      details: 'David Osei — O₂ increased from 2L nasal cannula to 4L mask. SpO₂ dropped from 94% to 91%.',
    },
  ],

  updateVitals: (patientId, partialVitals, actorRole) => {
    const patient = get().patients.find((p) => p.id === patientId);
    if (!patient) return;

    const oldVitals = { ...patient.vitals };
    const newVitals = { ...patient.vitals, ...partialVitals };

    // Build detail string from changed fields
    const changedFields = Object.entries(partialVitals).map(([key, val]) => {
      const labelMap: Record<string, string> = {
        spo2: 'SpO₂', hr: 'HR', temp: 'Temp', bp: 'BP', oxygen: 'O₂',
      };
      const label = labelMap[key] ?? key;
      const oldVal = oldVitals[key as keyof Vitals];
      const unit = key === 'spo2' ? '%' : key === 'hr' ? ' bpm' : key === 'temp' ? '°C' : '';
      return `${label} ${oldVal}${unit} → ${val}${unit}`;
    });

    // Determine new priority
    let priority: Priority = patient.priority;
    if (typeof newVitals.spo2 === 'number') {
      if (newVitals.spo2 < 92) priority = 'Urgent';
      else if (newVitals.spo2 < 95) priority = 'Priority';
      else priority = 'Stable';
    }

    set((state) => ({
      patients: state.patients.map((p) =>
        p.id === patientId ? { ...p, vitals: newVitals, priority } : p
      ),
      auditLog: [
        {
          id: uid(),
          patientId,
          timestamp: ts(),
          actorRole,
          action: 'Vitals updated',
          details: `${patient.name} — ${changedFields.join(', ')}`,
        },
        ...state.auditLog,
      ],
    }));
  },

  takeHandoverSnapshot: (patientId, actorRole) => {
    const patient = get().patients.find((p) => p.id === patientId);
    if (!patient) return;

    set((state) => ({
      patients: state.patients.map((p) =>
        p.id === patientId
          ? {
              ...p,
              previousVitals: { ...p.vitals },
              previousHandoverNotes: p.handoverNotes,
              lastHandoverAt: ts(),
            }
          : p
      ),
      auditLog: [
        {
          id: uid(),
          patientId,
          timestamp: ts(),
          actorRole,
          action: 'Handover snapshot taken',
          details: `${patient.name} — new baseline recorded. SpO₂ ${patient.vitals.spo2}%, HR ${patient.vitals.hr}, Temp ${patient.vitals.temp}°C.`,
        },
        ...state.auditLog,
      ],
    }));
  },

  saveHandoverNotes: (patientId, notes, actorRole) => {
    const patient = get().patients.find((p) => p.id === patientId);
    if (!patient) return;

    set((state) => ({
      patients: state.patients.map((p) =>
        p.id === patientId ? { ...p, handoverNotes: notes } : p
      ),
      auditLog: [
        {
          id: uid(),
          patientId,
          timestamp: ts(),
          actorRole,
          action: 'Handover notes updated',
          details: `${patient.name} — notes saved by ${actorRole}.`,
        },
        ...state.auditLog,
      ],
    }));
  },

  updatePriority: (patientId, priority, actorRole) => {
    const patient = get().patients.find((p) => p.id === patientId);
    if (!patient) return;

    set((state) => ({
      patients: state.patients.map((p) =>
        p.id === patientId ? { ...p, priority } : p
      ),
      auditLog: [
        {
          id: uid(),
          patientId,
          timestamp: ts(),
          actorRole,
          action: 'Priority updated',
          details: `${patient.name} — priority changed to ${priority}.`,
        },
        ...state.auditLog,
      ],
    }));
  },

  addPendingAction: (patientId, action) => {
    set((state) => ({
      patients: state.patients.map((p) =>
        p.id === patientId ? { ...p, pendingActions: [...p.pendingActions, action] } : p
      ),
    }));
  },

  recordTriageResult: (patientId, result) => {
    const patient = get().patients.find((p) => p.id === patientId);
    if (!patient) return;

    // Map API urgency → store Priority (case-sensitive)
    const priorityMap: Record<TriageUrgency, Priority> = {
      URGENT: 'Urgent',
      PRIORITY: 'Priority',
      'NON-URGENT': 'Stable',
      ESCALATE: 'Urgent',
    };
    const newPriority = priorityMap[result.urgency];

    // Pending action text for Nurse dashboard
    const urgencyEmoji = result.urgency === 'URGENT' || result.urgency === 'ESCALATE'
      ? '🚨' : result.urgency === 'PRIORITY' ? '⚠️' : '📋';
    const pendingText = `${urgencyEmoji} Review triage result for ${patient.name} — ${result.urgency} (submitted ${result.timestamp})`;

    set((state) => ({
      patients: state.patients.map((p) =>
        p.id === patientId
          ? {
              ...p,
              lastTriageResult: result,
              priority: newPriority,
              pendingActions: [pendingText, ...p.pendingActions],
            }
          : p
      ),
      auditLog: [
        {
          id: uid(),
          patientId,
          timestamp: result.timestamp,
          actorRole: 'Patient',
          action: 'Triage completed',
          details: `${patient.name} — Assessment: ${result.urgency}. Codes: ${result.reason_codes.slice(0, 3).join(', ')}.`,
        },
        ...state.auditLog,
      ],
    }));
  },

  removePendingAction: (patientId, index, actorRole) => {
    const patient = get().patients.find((p) => p.id === patientId);
    if (!patient) return;
    const action = patient.pendingActions[index];

    set((state) => ({
      patients: state.patients.map((p) =>
        p.id === patientId
          ? { ...p, pendingActions: p.pendingActions.filter((_, i) => i !== index) }
          : p
      ),
      auditLog: [
        {
          id: uid(),
          patientId,
          timestamp: ts(),
          actorRole,
          action: 'Action completed',
          details: `${patient.name} — "${action}" marked done.`,
        },
        ...state.auditLog,
      ],
    }));
  },
}));
