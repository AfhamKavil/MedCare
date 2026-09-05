'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = 'Urgent' | 'Priority' | 'Stable';

interface Vitals {
  bp: string;
  hr: string;
  spo2: string;
  temp: string;
}

interface Patient {
  id: number;
  bed: string;
  name: string;
  age: number;
  diagnosis: string;
  priority: Priority;
  vitals: Vitals;
  pending_actions: string[];
  handoverNotes: string;
  lastChecked: string;
}

// ─── Mock Data (stored in state so it is mutable) ─────────────────────────────

const INITIAL_PATIENTS: Patient[] = [
  {
    id: 1,
    bed: '01',
    name: 'John Doe',
    age: 58,
    diagnosis: 'Post-op Appendectomy',
    priority: 'Urgent',
    vitals: { bp: '142/90', hr: '98', spo2: '94', temp: '38.2' },
    pending_actions: [
      '⚠️ Blood test pending',
      '💊 IV antibiotics due at 14:00',
      '📋 Wound dressing change',
    ],
    handoverNotes:
      'Patient recovering post-op day 1. Pain managed with morphine 5mg PRN. Monitor fever — started at 37.8°C this morning, now 38.2°C. Surgical team to review at 15:00. Family informed.',
    lastChecked: '11:45',
  },
  {
    id: 2,
    bed: '02',
    name: 'Jane Smith',
    age: 34,
    diagnosis: 'Asthma Exacerbation',
    priority: 'Priority',
    vitals: { bp: '118/76', hr: '88', spo2: '97', temp: '37.1' },
    pending_actions: [
      '💨 Nebuliser due at 13:30',
      '📋 Spirometry review',
    ],
    handoverNotes:
      'Admitted overnight with acute wheeze. Responding well to salbutamol. SpO2 improving. Likely discharge tomorrow if stable. Continue 4-hourly obs.',
    lastChecked: '12:00',
  },
  {
    id: 3,
    bed: '03',
    name: 'Robert Kim',
    age: 72,
    diagnosis: 'Hip Fracture (Post-op Day 3)',
    priority: 'Priority',
    vitals: { bp: '130/82', hr: '74', spo2: '98', temp: '36.9' },
    pending_actions: [
      '🦯 Physiotherapy at 14:30',
      '💊 Enoxaparin 40mg SC',
    ],
    handoverNotes:
      'Day 3 post right hemi-arthroplasty. Mobilising with zimmer. DVT prophylaxis ongoing. Pain 3/10 at rest. Family meeting tomorrow.',
    lastChecked: '10:30',
  },
  {
    id: 4,
    bed: '04',
    name: 'Priya Sharma',
    age: 45,
    diagnosis: 'T2 Diabetes — Foot Ulcer',
    priority: 'Stable',
    vitals: { bp: '122/78', hr: '72', spo2: '99', temp: '36.7' },
    pending_actions: ['🩹 Wound dressing at 15:00'],
    handoverNotes:
      'Stable. Blood glucose well-controlled. Wound healing well. Plan discharge with community nurse follow-up.',
    lastChecked: '09:15',
  },
  {
    id: 5,
    bed: '05',
    name: 'Alan Torres',
    age: 61,
    diagnosis: 'COPD Exacerbation',
    priority: 'Urgent',
    vitals: { bp: '150/95', hr: '110', spo2: '88', temp: '37.8' },
    pending_actions: [
      '🚨 O2 titration — target 88-92%',
      '💊 Steroids IV',
      '📞 Respiratory team called',
    ],
    handoverNotes:
      'Deteriorating. SpO2 dropped to 88%. Increased O2 to 2L. Respiratory registrar attending shortly. Escalate if SpO2 < 85%.',
    lastChecked: '12:15',
  },
];

// ─── Priority Styling ─────────────────────────────────────────────────────────

const PRIORITY_DOT: Record<Priority, string> = {
  Urgent: 'bg-red-500',
  Priority: 'bg-yellow-400',
  Stable: 'bg-green-400',
};

const PRIORITY_BADGE: Record<Priority, string> = {
  Urgent: 'bg-red-500/15 text-red-400',
  Priority: 'bg-yellow-500/15 text-yellow-400',
  Stable: 'bg-green-500/15 text-green-400',
};

// ─── Vital Card Config ────────────────────────────────────────────────────────

const VITAL_META = [
  { key: 'bp' as keyof Vitals, label: 'Blood Pressure', unit: 'mmHg', icon: '🩸', color: 'bg-[#FAD2E1]' },
  { key: 'hr' as keyof Vitals, label: 'Heart Rate', unit: 'bpm', icon: '❤️', color: 'bg-[#FFCDB2]' },
  { key: 'spo2' as keyof Vitals, label: 'SpO₂', unit: '%', icon: '💨', color: 'bg-[#A8DADC]' },
  { key: 'temp' as keyof Vitals, label: 'Temperature', unit: '°C', icon: '🌡️', color: 'bg-[#E5D9F2]' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function NurseDashboard() {
  const router = useRouter();

  // All patient data lives in state so it can be mutated
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [selectedId, setSelectedId] = useState<number>(1);
  const [selectedWard, setSelectedWard] = useState('WARD 1');

  // Which vital is being edited right now (key of Vitals, or null)
  const [editingVital, setEditingVital] = useState<keyof Vitals | null>(null);
  const [editingVitalValue, setEditingVitalValue] = useState('');

  // Handover note draft
  const [notesDraft, setNotesDraft] = useState<Record<number, string>>({});
  const [savedNote, setSavedNote] = useState<number | null>(null);

  // Derived selected patient
  const selected = patients.find((p) => p.id === selectedId)!;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const selectPatient = (id: number) => {
    setSelectedId(id);
    setEditingVital(null);
  };

  // Begin editing a vital — pre-fill input with current raw value
  const startEditVital = (vitalKey: keyof Vitals) => {
    setEditingVital(vitalKey);
    setEditingVitalValue(selected.vitals[vitalKey]);
  };

  // Commit the edited vital back to state
  const commitVital = () => {
    if (!editingVital) return;
    setPatients((prev) =>
      prev.map((p) =>
        p.id === selectedId
          ? { ...p, vitals: { ...p.vitals, [editingVital]: editingVitalValue.trim() } }
          : p
      )
    );
    setEditingVital(null);
  };

  // Handle Enter or Escape in the vital input
  const handleVitalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitVital();
    if (e.key === 'Escape') setEditingVital(null);
  };

  // Save handover notes for the selected patient
  const saveHandoverNotes = () => {
    const draft = notesDraft[selectedId];
    if (draft === undefined) return; // nothing typed yet
    setPatients((prev) =>
      prev.map((p) =>
        p.id === selectedId ? { ...p, handoverNotes: draft } : p
      )
    );
    setSavedNote(selectedId);
    setTimeout(() => setSavedNote(null), 2000);
  };

  // Current draft for this patient (fall back to saved notes)
  const currentNotesDraft = notesDraft[selectedId] ?? selected.handoverNotes;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="bg-[#121212] min-h-screen text-white font-sans flex flex-col">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-40 bg-[#121212]/90 backdrop-blur border-b border-white/5 px-6 md:px-10 h-16 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#E5D9F2] flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <span className="font-bold text-base tracking-tight">MedCare</span>
          <span className="ml-2 text-xs bg-[#E5D9F2]/20 text-[#E5D9F2] px-2 py-0.5 rounded-full font-semibold">Nurse</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Ward dropdown */}
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="bg-[#1A1D24] border border-white/10 text-white text-sm rounded-xl px-4 py-2 cursor-pointer focus:outline-none focus:border-[#E5D9F2]/50 font-bold"
          >
            <option>WARD 1</option>
            <option>WARD 2</option>
            <option>WARD 3</option>
            <option>ICU</option>
          </select>

          <span className="text-sm text-gray-400 hidden md:flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            {patients.length} Patients Active
          </span>

          <div className="w-9 h-9 rounded-full bg-[#E5D9F2] flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.7 0 4-1.5 4-4s-1.3-4-4-4-4 1.5-4 4 1.3 4 4 4zm0 2c-3.3 0-6 1.7-6 4v1h12v-1c0-2.3-2.7-4-6-4z" />
            </svg>
          </div>

          <button onClick={() => router.push('/')} className="text-xs text-gray-500 hover:text-white transition-colors">
            Sign Out
          </button>
        </div>
      </header>

      {/* ── Ward Summary Bar ── */}
      <div className="bg-[#1A1D24] border-b border-white/5 px-6 md:px-10 py-3 flex items-center gap-6 text-sm shrink-0">
        <span className="font-bold text-gray-300 hidden md:block">{selectedWard}</span>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-gray-400">Urgent: <span className="text-white font-bold">{patients.filter((p) => p.priority === 'Urgent').length}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <span className="text-gray-400">Priority: <span className="text-white font-bold">{patients.filter((p) => p.priority === 'Priority').length}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="text-gray-400">Stable: <span className="text-white font-bold">{patients.filter((p) => p.priority === 'Stable').length}</span></span>
        </div>
        <div className="ml-auto text-xs text-gray-600">Shift: 08:00 – 20:00</div>
      </div>

      {/* ── Main 3-col grid ── */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 overflow-hidden">

        {/* ── LEFT: Patient List Sidebar ── */}
        <aside className="border-r border-white/5 overflow-y-auto md:max-h-[calc(100vh-112px)]">
          <div className="px-4 py-3 border-b border-white/5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{selectedWard} — Patients</h2>
          </div>

          <ul className="flex flex-col">
            {patients.map((patient) => {
              const isActive = patient.id === selectedId;
              return (
                <li key={patient.id}>
                  <button
                    onClick={() => selectPatient(patient.id)}
                    className={`w-full text-left px-4 py-4 border-b border-white/5 flex items-start gap-3 transition-colors ${
                      isActive
                        ? 'bg-white/5 border-l-2 border-l-[#E5D9F2]'
                        : 'hover:bg-white/3 border-l-2 border-l-transparent'
                    }`}
                  >
                    {/* Priority dot */}
                    <span className={`mt-1.5 w-3 h-3 rounded-full shrink-0 ${PRIORITY_DOT[patient.priority]} ${patient.priority === 'Urgent' ? 'animate-pulse' : ''}`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bed {patient.bed}</span>
                        <span className="text-xs text-gray-600">{patient.lastChecked}</span>
                      </div>
                      <p className="font-semibold text-sm text-white mt-0.5 truncate">{patient.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{patient.diagnosis}</p>
                      <span className={`inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${PRIORITY_BADGE[patient.priority]}`}>
                        {patient.priority}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* ── RIGHT: Detail View (2 cols) ── */}
        <main className="md:col-span-2 overflow-y-auto md:max-h-[calc(100vh-112px)] p-6 md:p-8 flex flex-col gap-7">

          {/* Patient header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">
                Bed {selected.bed} · {selected.diagnosis}
              </p>
              <h1 className="text-3xl font-bold mt-1">{selected.name}</h1>
              <p className="text-gray-400 text-sm mt-0.5">Age {selected.age} · Last checked {selected.lastChecked}</p>
            </div>
            <span className={`shrink-0 inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full ${PRIORITY_BADGE[selected.priority]}`}>
              <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[selected.priority]} ${selected.priority === 'Urgent' ? 'animate-pulse' : ''}`} />
              {selected.priority}
            </span>
          </div>

          {/* ── Section 1: Vitals (Editable) ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Vitals</h2>
              <p className="text-xs text-gray-600">Click any value to edit</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {VITAL_META.map((v) => {
                const isEditing = editingVital === v.key;
                const rawValue = selected.vitals[v.key];

                return (
                  <div key={v.key} className={`${v.color} rounded-2xl p-4 flex flex-col gap-2 text-gray-900`}>
                    <span className="text-2xl">{v.icon}</span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider opacity-60">{v.label}</p>

                      {isEditing ? (
                        // Inline edit input
                        <div className="flex items-center gap-1 mt-1">
                          <input
                            autoFocus
                            type="text"
                            value={editingVitalValue}
                            onChange={(e) => setEditingVitalValue(e.target.value)}
                            onBlur={commitVital}
                            onKeyDown={handleVitalKeyDown}
                            className="w-full bg-white/60 border border-gray-900/30 rounded-lg text-gray-900 font-black text-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-gray-900/30"
                          />
                        </div>
                      ) : (
                        // Display value — click to edit
                        <button
                          onClick={() => startEditVital(v.key)}
                          className="group flex items-baseline gap-1 mt-1"
                          title="Click to edit"
                        >
                          <span className="text-xl font-black group-hover:underline decoration-dotted">
                            {rawValue}
                          </span>
                          <span className="text-xs opacity-50">{v.unit}</span>
                          <svg
                            className="w-3 h-3 opacity-0 group-hover:opacity-50 ml-1 shrink-0"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Section 2: Pending Actions ── */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">Pending Actions</h2>
            <div className="flex flex-col gap-2">
              {selected.pending_actions.map((action, i) => (
                <div
                  key={i}
                  className={`border-l-4 p-4 rounded-r-xl text-sm font-medium ${
                    action.startsWith('🚨')
                      ? 'border-red-500 bg-red-500/10 text-red-300'
                      : action.startsWith('⚠️')
                      ? 'border-yellow-500 bg-yellow-500/10 text-yellow-200'
                      : 'border-blue-400 bg-blue-500/10 text-blue-300'
                  }`}
                >
                  {action}
                </div>
              ))}
            </div>
          </section>

          {/* ── Section 3: Handover Notes (editable + save) ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Handover Notes</h2>
              {savedNote === selectedId && (
                <span className="text-xs text-green-400 font-semibold flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Saved!
                </span>
              )}
            </div>

            <div className="bg-[#1A1D24] border border-white/8 rounded-2xl p-5 flex flex-col gap-4">
              <textarea
                rows={5}
                value={currentNotesDraft}
                onChange={(e) =>
                  setNotesDraft((prev) => ({ ...prev, [selectedId]: e.target.value }))
                }
                className="w-full bg-[#101214] border border-white/8 rounded-xl text-sm text-white p-3 placeholder:text-gray-600 focus:outline-none focus:border-[#E5D9F2]/50 resize-none transition-all leading-relaxed"
                placeholder="Type handover notes here..."
              />

              <div className="flex items-center gap-3">
                <button
                  onClick={saveHandoverNotes}
                  className="px-5 py-2.5 rounded-xl bg-[#E5D9F2] text-gray-900 text-sm font-bold hover:bg-[#ede5f6] transition-colors"
                >
                  Save Handover Notes
                </button>
                <button
                  onClick={() =>
                    setNotesDraft((prev) => ({ ...prev, [selectedId]: selected.handoverNotes }))
                  }
                  className="px-4 py-2.5 rounded-xl bg-white/5 text-gray-400 text-sm hover:bg-white/10 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </section>

          {/* ── Section 4: Quick Actions ── */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              {['Flag for Doctor Review', 'Mark Vitals Taken', 'Request Blood Draw', 'Print Handover Sheet'].map(
                (action) => (
                  <button
                    key={action}
                    className="px-4 py-2 rounded-xl bg-[#1A1D24] border border-white/8 text-sm text-gray-300 hover:text-white hover:border-white/20 transition-colors"
                  >
                    {action}
                  </button>
                )
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
