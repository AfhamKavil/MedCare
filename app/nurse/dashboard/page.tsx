'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Priority = 'red' | 'yellow' | 'green';

interface Patient {
  id: number;
  bed: string;
  name: string;
  age: number;
  condition: string;
  priority: Priority;
  vitals: { bp: string; hr: string; spo2: string; temp: string };
  pendingActions: string[];
  handoverNotes: string;
  lastChecked: string;
}

const patients: Patient[] = [
  {
    id: 1,
    bed: '01',
    name: 'John Doe',
    age: 58,
    condition: 'Post-op Appendectomy',
    priority: 'red',
    vitals: { bp: '142/90', hr: '98 bpm', spo2: '94%', temp: '38.2°C' },
    pendingActions: ['⚠️ Blood test pending', '💊 IV antibiotics due at 14:00', '📋 Wound dressing change'],
    handoverNotes: 'Patient recovering post-op day 1. Pain managed with morphine 5mg PRN. Monitor fever — started at 37.8°C this morning, now 38.2°C. Surgical team to review at 15:00. Family informed.',
    lastChecked: '11:45',
  },
  {
    id: 2,
    bed: '02',
    name: 'Sarah Mitchell',
    age: 34,
    condition: 'Asthma Exacerbation',
    priority: 'yellow',
    vitals: { bp: '118/76', hr: '88 bpm', spo2: '97%', temp: '37.1°C' },
    pendingActions: ['💨 Nebuliser due at 13:30', '📋 Spirometry review'],
    handoverNotes: 'Admitted overnight with acute wheeze. Responding well to salbutamol nebulisers. SpO2 improving. Likely discharge tomorrow if stable. Continue 4-hourly obs.',
    lastChecked: '12:00',
  },
  {
    id: 3,
    bed: '03',
    name: 'Robert Kim',
    age: 72,
    condition: 'Hip Fracture (Post-op Day 3)',
    priority: 'yellow',
    vitals: { bp: '130/82', hr: '74 bpm', spo2: '98%', temp: '36.9°C' },
    pendingActions: ['🦯 Physiotherapy at 14:30', '💊 Enoxaparin 40mg SC'],
    handoverNotes: 'Day 3 post right hemi-arthroplasty. Mobilising with zimmer frame. DVT prophylaxis ongoing. Pain score 3/10 at rest. Family meeting scheduled for tomorrow.',
    lastChecked: '10:30',
  },
  {
    id: 4,
    bed: '04',
    name: 'Priya Sharma',
    age: 45,
    condition: 'Type 2 Diabetes — Foot Ulcer',
    priority: 'green',
    vitals: { bp: '122/78', hr: '72 bpm', spo2: '99%', temp: '36.7°C' },
    pendingActions: ['🩹 Wound dressing at 15:00'],
    handoverNotes: 'Stable. Blood glucose well-controlled on insulin sliding scale. Wound nurse reviewed — healing well. Plan for discharge with community nurse follow-up.',
    lastChecked: '09:15',
  },
  {
    id: 5,
    bed: '05',
    name: 'Alan Torres',
    age: 61,
    condition: 'COPD Exacerbation',
    priority: 'red',
    vitals: { bp: '150/95', hr: '110 bpm', spo2: '88%', temp: '37.8°C' },
    pendingActions: ['🚨 O2 titration — target 88-92%', '💊 Steroids IV', '📞 Respiratory team called'],
    handoverNotes: 'Deteriorating. SpO2 dropped from 91% to 88% this hour. Increased O2 to 2L. Respiratory registrar aware and attending shortly. Escalate to senior if SpO2 < 85%.',
    lastChecked: '12:15',
  },
];

const priorityColors: Record<Priority, string> = {
  red: 'bg-red-500',
  yellow: 'bg-yellow-400',
  green: 'bg-green-400',
};

const priorityLabels: Record<Priority, string> = {
  red: 'Critical',
  yellow: 'Moderate',
  green: 'Stable',
};

const vitalCards = [
  { key: 'bp', label: 'Blood Pressure', icon: '🩸', color: 'bg-[#FAD2E1]' },
  { key: 'hr', label: 'Heart Rate', icon: '❤️', color: 'bg-[#FFCDB2]' },
  { key: 'spo2', label: 'SpO₂', icon: '💨', color: 'bg-[#A8DADC]' },
  { key: 'temp', label: 'Temperature', icon: '🌡️', color: 'bg-[#E5D9F2]' },
];

export default function NurseDashboard() {
  const router = useRouter();
  const [selectedWard, setSelectedWard] = useState('WARD 1');
  const [selectedPatient, setSelectedPatient] = useState<Patient>(patients[0]);
  const [handoverText, setHandoverText] = useState('');

  return (
    <div className="bg-[#121212] min-h-screen text-white font-sans flex flex-col">
      {/* Nav */}
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
          {/* Ward Selector */}
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="bg-[#1A1D24] border border-white/10 text-white text-sm rounded-xl px-4 py-2 appearance-none cursor-pointer focus:outline-none focus:border-[#E5D9F2]/50 font-bold"
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

      {/* Ward Summary Bar */}
      <div className="bg-[#1A1D24] border-b border-white/5 px-6 md:px-10 py-3 flex items-center gap-6">
        <div className="flex items-center gap-2 text-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-gray-400">Critical: <span className="text-white font-bold">{patients.filter(p => p.priority === 'red').length}</span></span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <span className="text-gray-400">Moderate: <span className="text-white font-bold">{patients.filter(p => p.priority === 'yellow').length}</span></span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="text-gray-400">Stable: <span className="text-white font-bold">{patients.filter(p => p.priority === 'green').length}</span></span>
        </div>
        <div className="ml-auto text-xs text-gray-600">Shift: 08:00 – 20:00</div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-0 overflow-hidden">

        {/* Left: Patient List */}
        <aside className="border-r border-white/5 overflow-y-auto md:max-h-[calc(100vh-112px)]">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">{selectedWard} — Patients</h2>
          </div>
          <ul className="flex flex-col gap-0">
            {patients.map((patient) => (
              <li key={patient.id}>
                <button
                  onClick={() => setSelectedPatient(patient)}
                  className={`w-full text-left px-4 py-4 border-b border-white/5 transition-colors flex items-start gap-3 ${
                    selectedPatient.id === patient.id
                      ? 'bg-white/5 border-l-2 border-l-[#E5D9F2]'
                      : 'hover:bg-white/3'
                  }`}
                >
                  {/* Priority Dot */}
                  <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                    <span className={`w-3 h-3 rounded-full ${priorityColors[patient.priority]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bed {patient.bed}</span>
                      <span className="text-xs text-gray-600">{patient.lastChecked}</span>
                    </div>
                    <p className="font-semibold text-sm text-white mt-0.5 truncate">{patient.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{patient.condition}</p>
                    <span className={`inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      patient.priority === 'red' ? 'bg-red-500/20 text-red-400' :
                      patient.priority === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {priorityLabels[patient.priority]}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Right: Patient Detail */}
        <main className="md:col-span-2 overflow-y-auto md:max-h-[calc(100vh-112px)] p-6 md:p-8 flex flex-col gap-6">

          {/* Patient Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Bed {selectedPatient.bed} · {selectedPatient.condition}</p>
              <h1 className="text-3xl font-bold mt-1">{selectedPatient.name}</h1>
              <p className="text-gray-400 text-sm mt-0.5">Age {selectedPatient.age} · Last checked at {selectedPatient.lastChecked}</p>
            </div>
            <span className={`inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full ${
              selectedPatient.priority === 'red' ? 'bg-red-500/15 text-red-400' :
              selectedPatient.priority === 'yellow' ? 'bg-yellow-500/15 text-yellow-400' :
              'bg-green-500/15 text-green-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${priorityColors[selectedPatient.priority]} ${selectedPatient.priority === 'red' ? 'animate-pulse' : ''}`} />
              {priorityLabels[selectedPatient.priority]}
            </span>
          </div>

          {/* Section 1: Vitals */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">Vitals</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {vitalCards.map((v) => (
                <div key={v.key} className={`${v.color} rounded-2xl p-4 flex flex-col gap-2 text-gray-900`}>
                  <span className="text-2xl">{v.icon}</span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider opacity-60">{v.label}</p>
                    <p className="text-xl font-black mt-0.5">{selectedPatient.vitals[v.key as keyof typeof selectedPatient.vitals]}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 2: Pending Actions */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">Pending Actions</h2>
            <div className="flex flex-col gap-2">
              {selectedPatient.pendingActions.map((action, i) => (
                <div
                  key={i}
                  className={`border-l-4 p-4 rounded-r-xl text-sm font-medium ${
                    action.startsWith('🚨')
                      ? 'border-red-500 bg-red-500/10 text-red-300'
                      : action.startsWith('⚠️')
                      ? 'border-yellow-500 bg-yellow-500/10 text-yellow-200'
                      : 'border-blue-500 bg-blue-500/10 text-blue-300'
                  }`}
                >
                  {action}
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: Handover Notes */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Handover Notes</h2>
              <span className="text-xs text-gray-600">Editable</span>
            </div>
            <div className="bg-[#1A1D24] border border-white/8 rounded-2xl p-5">
              <p className="text-sm text-gray-300 leading-relaxed mb-4">{selectedPatient.handoverNotes}</p>
              <div className="border-t border-white/5 pt-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">Add Handover Note</p>
                <textarea
                  rows={3}
                  value={handoverText}
                  onChange={(e) => setHandoverText(e.target.value)}
                  placeholder="Type your handover note here..."
                  className="w-full bg-[#101214] border border-white/8 rounded-xl text-sm text-white p-3 placeholder:text-gray-600 focus:outline-none focus:border-[#E5D9F2]/50 resize-none transition-all"
                />
                <button
                  onClick={() => {
                    if (handoverText.trim()) setHandoverText('');
                  }}
                  className="mt-2 px-5 py-2 rounded-xl bg-[#E5D9F2] text-gray-900 text-sm font-bold hover:bg-[#ede5f6] transition-colors"
                >
                  Save Note
                </button>
              </div>
            </div>
          </section>

          {/* Section 4: Quick Actions */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              {['Flag for Doctor Review', 'Mark Vitals Taken', 'Request Blood Draw', 'Print Handover Sheet'].map((action) => (
                <button
                  key={action}
                  className="px-4 py-2 rounded-xl bg-[#1A1D24] border border-white/8 text-sm text-gray-300 hover:text-white hover:border-white/20 transition-colors"
                >
                  {action}
                </button>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
