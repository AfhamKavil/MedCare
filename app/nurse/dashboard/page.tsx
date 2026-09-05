'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useClinicalStore,
  calculateDeltas,
  type Vitals,
  type ClinicalPatient,
} from '@/lib/store';

// ─── Vital card config ────────────────────────────────────────────────────────

const VITAL_META = [
  { key: 'bp'   as keyof Vitals, label: 'Blood Pressure', unit: 'mmHg', icon: '🩸', color: 'bg-[#FAD2E1]', numeric: false },
  { key: 'hr'   as keyof Vitals, label: 'Heart Rate',     unit: 'bpm',  icon: '❤️', color: 'bg-[#FFCDB2]', numeric: true  },
  { key: 'spo2' as keyof Vitals, label: 'SpO₂',           unit: '%',    icon: '💨', color: 'bg-[#A8DADC]', numeric: true  },
  { key: 'temp' as keyof Vitals, label: 'Temperature',    unit: '°C',   icon: '🌡️', color: 'bg-[#E5D9F2]', numeric: true  },
];

const PRIORITY_DOT: Record<string, string> = {
  Urgent:   'bg-red-500',
  Priority: 'bg-yellow-400',
  Stable:   'bg-green-400',
};
const PRIORITY_BADGE: Record<string, string> = {
  Urgent:   'bg-red-500/15 text-red-400',
  Priority: 'bg-yellow-500/15 text-yellow-400',
  Stable:   'bg-green-500/15 text-green-400',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function NurseDashboard() {
  const router = useRouter();

  // ── Zustand ──
  const patients         = useClinicalStore((s) => s.patients);
  const auditLog         = useClinicalStore((s) => s.auditLog);
  const updateVitals     = useClinicalStore((s) => s.updateVitals);
  const saveHandoverNotes= useClinicalStore((s) => s.saveHandoverNotes);
  const takeSnapshot     = useClinicalStore((s) => s.takeHandoverSnapshot);
  const removePendingAction = useClinicalStore((s) => s.removePendingAction);

  // Ward patients (all in Ward 3 for now)
  const wardPatients = patients.filter((p) => p.ward === 'Ward 3');

  // ── Local UI state ──
  const [selectedId,       setSelectedId]       = useState<string>(wardPatients[0]?.id ?? 'p1');
  const [selectedWard,     setSelectedWard]      = useState('WARD 3');
  const [editingVital,     setEditingVital]      = useState<keyof Vitals | null>(null);
  const [editingValue,     setEditingValue]      = useState('');
  const [notesDraft,       setNotesDraft]        = useState<Record<string, string>>({});
  const [savedNote,        setSavedNote]         = useState<string | null>(null);
  const [showAudit,        setShowAudit]         = useState(false);
  const [snapshotFlash,    setSnapshotFlash]     = useState<string | null>(null);

  // Derived
  const selected: ClinicalPatient = patients.find((p) => p.id === selectedId) ?? wardPatients[0];
  const deltas = calculateDeltas(selected.previousVitals, selected.vitals);
  const significantDeltas = deltas.filter((d) => d.significant);
  const patientAudit = auditLog.filter((e) => e.patientId === selectedId).slice(0, 8);

  // ── Handlers ──

  const startEditVital = (key: keyof Vitals) => {
    setEditingVital(key);
    setEditingValue(String(selected.vitals[key]));
  };

  const commitVital = () => {
    if (!editingVital || editingValue.trim() === '') { setEditingVital(null); return; }
    const meta = VITAL_META.find((m) => m.key === editingVital);
    const newVal = meta?.numeric ? parseFloat(editingValue) : editingValue.trim();
    if (meta?.numeric && isNaN(newVal as number)) { setEditingVital(null); return; }
    updateVitals(selectedId, { [editingVital]: newVal }, 'Nurse');
    setEditingVital(null);
  };

  const handleVitalKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter')  commitVital();
    if (e.key === 'Escape') setEditingVital(null);
  };

  const handleSaveNotes = () => {
    const draft = notesDraft[selectedId];
    if (draft === undefined) return;
    saveHandoverNotes(selectedId, draft, 'Nurse');
    setSavedNote(selectedId);
    setTimeout(() => setSavedNote(null), 2500);
  };

  const handleTakeSnapshot = () => {
    takeSnapshot(selectedId, 'Nurse');
    setSnapshotFlash(selectedId);
    setTimeout(() => setSnapshotFlash(null), 2500);
  };

  const currentNotesDraft = notesDraft[selectedId] ?? selected.handoverNotes;

  // ─── Render ──────────────────────────────────────────────────────────────────

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
          <span className="font-bold text-base">MedCare</span>
          <span className="ml-2 text-xs bg-[#E5D9F2]/20 text-[#E5D9F2] px-2 py-0.5 rounded-full font-semibold">Nurse</span>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="bg-[#1A1D24] border border-white/10 text-white text-sm rounded-xl px-4 py-2 cursor-pointer focus:outline-none font-bold"
          >
            <option>WARD 3</option><option>WARD 1</option><option>WARD 2</option><option>ICU</option>
          </select>
          <span className="text-sm text-gray-400 hidden md:flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            {wardPatients.length} Active
          </span>
          <button onClick={() => router.push('/')} className="text-xs text-gray-500 hover:text-white transition-colors">Sign Out</button>
        </div>
      </header>

      {/* ── Ward bar ── */}
      <div className="bg-[#1A1D24] border-b border-white/5 px-6 md:px-10 py-2.5 flex items-center gap-6 text-sm shrink-0">
        {(['Urgent','Priority','Stable'] as const).map((p) => (
          <div key={p} className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${PRIORITY_DOT[p]}`} />
            <span className="text-gray-400">{p}: <span className="text-white font-bold">{wardPatients.filter(pt => pt.priority === p).length}</span></span>
          </div>
        ))}
        <div className="ml-auto text-xs text-gray-600">Shift: 08:00–20:00 · Shared clinical state active</div>
      </div>

      {/* ── 3-col layout ── */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 overflow-hidden">

        {/* LEFT sidebar */}
        <aside className="border-r border-white/5 overflow-y-auto md:max-h-[calc(100vh-112px)]">
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{selectedWard} — Patients</p>
          </div>
          <ul>
            {wardPatients.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => { setSelectedId(p.id); setEditingVital(null); }}
                  className={`w-full text-left px-4 py-4 border-b border-white/5 flex items-start gap-3 transition-colors border-l-2 ${
                    selectedId === p.id ? 'bg-white/5 border-l-[#E5D9F2]' : 'border-l-transparent hover:bg-white/3'
                  }`}
                >
                  <span className={`mt-1.5 w-3 h-3 rounded-full shrink-0 ${PRIORITY_DOT[p.priority]} ${p.priority === 'Urgent' ? 'animate-pulse' : ''}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <span className="text-xs font-bold text-gray-500 uppercase">Bed {p.bed}</span>
                      <span className="text-xs text-gray-600">{p.lastHandoverAt}</span>
                    </div>
                    <p className="font-semibold text-sm text-white truncate mt-0.5">{p.name}</p>
                    <p className="text-xs text-gray-500 truncate">{p.diagnosis}</p>
                    <span className={`inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${PRIORITY_BADGE[p.priority]}`}>
                      {p.priority}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* RIGHT detail view */}
        <main className="md:col-span-2 overflow-y-auto md:max-h-[calc(100vh-112px)] p-6 md:p-8 flex flex-col gap-7">

          {/* Patient header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">
                Bed {selected.bed} · {selected.diagnosis}
              </p>
              <h1 className="text-3xl font-bold mt-1">{selected.name}</h1>
              <p className="text-gray-400 text-sm mt-0.5">Age {selected.age} · {selected.gender} · {selected.bloodType} · Snapshot: {selected.lastHandoverAt}</p>
            </div>
            <span className={`shrink-0 inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full ${PRIORITY_BADGE[selected.priority]}`}>
              <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[selected.priority]} ${selected.priority === 'Urgent' ? 'animate-pulse' : ''}`} />
              {selected.priority}
            </span>
          </div>

          {/* ── Triage result from Patient portal ── */}
          {selected.lastTriageResult && (
            <section className={`rounded-2xl p-5 border ${
              selected.lastTriageResult.urgency === 'URGENT' || selected.lastTriageResult.urgency === 'ESCALATE'
                ? 'bg-red-900/25 border-red-500/40'
                : selected.lastTriageResult.urgency === 'PRIORITY'
                ? 'bg-yellow-900/25 border-yellow-500/40'
                : 'bg-green-900/15 border-green-500/30'
            }`}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  🩺 Patient Self-Triage — {selected.lastTriageResult.timestamp}
                </p>
                <span className={`text-xs font-black uppercase px-3 py-1 rounded-full ${
                  selected.lastTriageResult.urgency === 'URGENT' || selected.lastTriageResult.urgency === 'ESCALATE'
                    ? 'bg-red-500 text-white'
                    : selected.lastTriageResult.urgency === 'PRIORITY'
                    ? 'bg-yellow-500 text-gray-900'
                    : 'bg-green-600 text-white'
                }`}>
                  {selected.lastTriageResult.urgency}
                </span>
              </div>
              <p className="text-sm text-gray-200 mb-3 leading-relaxed">{selected.lastTriageResult.recommended_action}</p>
              {selected.lastTriageResult.reason_codes.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Evidence from patient report</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.lastTriageResult.reason_codes.map((code) => (
                      <span key={code} className="text-xs bg-white/5 text-gray-400 px-2.5 py-1 rounded-full font-mono">
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ── Changes since last handover ── */}
          {significantDeltas.length > 0 && (
            <section className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-3">
                ⚠️ Changes since last handover ({selected.lastHandoverAt})
              </p>
              <div className="flex flex-col gap-2">
                {significantDeltas.map((d) => (
                  <div key={d.field} className="flex items-center gap-3 text-sm">
                    <span className={`font-black text-lg ${d.direction === 'down' ? 'text-red-400' : 'text-orange-400'}`}>
                      {d.direction === 'down' ? '↓' : '↑'}
                    </span>
                    <span className="text-gray-300 font-medium">{d.label}:</span>
                    <span className="text-gray-500 line-through">{String(d.previous)}{d.field === 'spo2' ? '%' : d.field === 'hr' ? ' bpm' : d.field === 'temp' ? '°C' : ''}</span>
                    <span className="text-white font-bold">→ {String(d.current)}{d.field === 'spo2' ? '%' : d.field === 'hr' ? ' bpm' : d.field === 'temp' ? '°C' : ''}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {significantDeltas.length === 0 && (
            <section className="bg-green-500/10 border border-green-500/20 rounded-2xl px-5 py-3 flex items-center gap-3">
              <span className="text-green-400 text-lg">✓</span>
              <p className="text-sm text-green-300 font-medium">No significant changes since last handover ({selected.lastHandoverAt})</p>
            </section>
          )}

          {/* ── Vitals (editable) ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Current Vitals</h2>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-600">Click value to edit</p>
                <button
                  onClick={handleTakeSnapshot}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#E5D9F2]/10 text-[#E5D9F2] hover:bg-[#E5D9F2]/20 transition-colors"
                >
                  {snapshotFlash === selectedId ? '✓ Snapshot saved' : '📸 Save Snapshot'}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {VITAL_META.map((v) => {
                const isEditing = editingVital === v.key;
                const rawVal = selected.vitals[v.key];
                const prevVal = selected.previousVitals[v.key];
                const changed = String(rawVal) !== String(prevVal);

                return (
                  <div key={v.key} className={`${v.color} rounded-2xl p-4 flex flex-col gap-2 text-gray-900 ${changed ? 'ring-2 ring-orange-400/60' : ''}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{v.icon}</span>
                      {changed && <span className="text-[9px] font-black uppercase tracking-wider bg-orange-400/30 text-orange-700 px-1.5 py-0.5 rounded-full">Changed</span>}
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider opacity-60">{v.label}</p>
                      {isEditing ? (
                        <input
                          autoFocus
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={commitVital}
                          onKeyDown={handleVitalKey}
                          className="w-full bg-white/60 border border-gray-900/30 rounded-lg text-gray-900 font-black text-lg px-2 py-0.5 focus:outline-none mt-1"
                        />
                      ) : (
                        <button onClick={() => startEditVital(v.key)} className="group flex items-baseline gap-1 mt-1">
                          <span className="text-xl font-black group-hover:underline decoration-dotted">{String(rawVal)}</span>
                          <span className="text-xs opacity-50">{v.unit}</span>
                          <svg className="w-3 h-3 opacity-0 group-hover:opacity-50 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      )}
                      <p className="text-[10px] opacity-40 mt-0.5">was: {String(prevVal)}{v.unit}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Oxygen separate */}
            <div className="mt-3 bg-[#1A1D24] border border-white/5 rounded-2xl px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">💨</span>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">O₂ Delivery</p>
                  {editingVital === 'oxygen' ? (
                    <input
                      autoFocus
                      type="text"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onBlur={commitVital}
                      onKeyDown={handleVitalKey}
                      className="bg-white/10 border border-white/20 rounded-lg text-white text-sm px-3 py-1 focus:outline-none mt-1 w-48"
                    />
                  ) : (
                    <button onClick={() => startEditVital('oxygen')} className="group flex items-center gap-2 mt-0.5">
                      <span className="text-sm font-bold text-white group-hover:underline decoration-dotted">{selected.vitals.oxygen}</span>
                      <svg className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}
                  <p className="text-[10px] text-gray-600 mt-0.5">was: {selected.previousVitals.oxygen}</p>
                </div>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${PRIORITY_BADGE[selected.priority]}`}>{selected.priority}</span>
            </div>
          </section>

          {/* ── Pending Actions ── */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">Pending Actions</h2>
            <div className="flex flex-col gap-2">
              {selected.pendingActions.map((action, i) => (
                <div key={i} className={`border-l-4 p-4 rounded-r-xl text-sm font-medium flex items-center justify-between gap-4 ${
                  action.startsWith('🚨') ? 'border-red-500 bg-red-500/10 text-red-300'
                  : action.startsWith('⚠️') ? 'border-yellow-500 bg-yellow-500/10 text-yellow-200'
                  : 'border-blue-400 bg-blue-500/10 text-blue-300'
                }`}>
                  <span>{action}</span>
                  <button
                    onClick={() => removePendingAction(selectedId, i, 'Nurse')}
                    className="shrink-0 text-xs opacity-60 hover:opacity-100 font-bold px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    Done ✓
                  </button>
                </div>
              ))}
              {selected.pendingActions.length === 0 && (
                <p className="text-sm text-gray-600 italic">All actions completed.</p>
              )}
            </div>
          </section>

          {/* ── Handover Notes ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Handover Notes</h2>
              {savedNote === selectedId && (
                <span className="text-xs text-green-400 font-semibold flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Saved to shared state
                </span>
              )}
            </div>
            <div className="bg-[#1A1D24] border border-white/8 rounded-2xl p-5 flex flex-col gap-4">
              <textarea
                rows={5}
                value={currentNotesDraft}
                onChange={(e) => setNotesDraft((prev) => ({ ...prev, [selectedId]: e.target.value }))}
                className="w-full bg-[#101214] border border-white/8 rounded-xl text-sm text-white p-3 placeholder:text-gray-600 focus:outline-none focus:border-[#E5D9F2]/50 resize-none leading-relaxed"
              />
              <div className="flex gap-3">
                <button onClick={handleSaveNotes} className="px-5 py-2.5 rounded-xl bg-[#E5D9F2] text-gray-900 text-sm font-bold hover:bg-[#ede5f6] transition-colors">
                  Save Handover Notes
                </button>
                <button onClick={() => setNotesDraft((prev) => ({ ...prev, [selectedId]: selected.handoverNotes }))}
                  className="px-4 py-2.5 rounded-xl bg-white/5 text-gray-400 text-sm hover:bg-white/10 transition-colors">
                  Reset
                </button>
              </div>
            </div>
          </section>

          {/* ── Audit Log ── */}
          <section>
            <button
              onClick={() => setShowAudit((v) => !v)}
              className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-gray-300 transition-colors mb-3"
            >
              <svg className={`w-4 h-4 transition-transform ${showAudit ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              Activity Log ({patientAudit.length})
            </button>
            {showAudit && (
              <div className="bg-[#1A1D24] border border-white/5 rounded-2xl p-5 flex flex-col divide-y divide-white/5">
                {patientAudit.length === 0 && <p className="text-sm text-gray-600 italic">No events yet.</p>}
                {patientAudit.map((evt) => (
                  <div key={evt.id} className="flex gap-3 py-3">
                    <span className="text-xs font-mono text-gray-600 w-12 shrink-0 pt-0.5">{evt.timestamp}</span>
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mr-2 ${
                        evt.actorRole === 'Nurse' ? 'bg-[#E5D9F2]/20 text-[#E5D9F2]'
                        : evt.actorRole === 'Doctor' ? 'bg-[#FFCDB2]/20 text-[#FFCDB2]'
                        : 'bg-white/10 text-gray-400'
                      }`}>{evt.actorRole}</span>
                      <span className="text-xs font-semibold text-gray-300">{evt.action}</span>
                      <p className="text-xs text-gray-500 mt-0.5">{evt.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </main>
      </div>
    </div>
  );
}
