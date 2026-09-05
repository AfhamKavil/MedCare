'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useClinicalStore,
  calculateDeltas,
  generateSBAR,
  type ClinicalPatient,
} from '@/lib/store';

// ─── Calculator definitions ───────────────────────────────────────────────────

type CalcKey = 'BMI' | 'MAP' | 'BSA' | 'eGFR' | 'CrCl' | 'BMR';

interface CalcField { key: string; label: string; placeholder: string }
interface CalcResult { value: string; unit: string }

interface CalcDef {
  key: CalcKey;
  title: string;
  full: string;
  icon: string;
  color: string;
  fields: CalcField[];
  calc: (v: Record<string, string>, patient?: ClinicalPatient) => CalcResult;
  interpret: (val: string) => string;
  autoFill?: (p: ClinicalPatient) => Record<string, string>;
}

const CALCULATORS: CalcDef[] = [
  {
    key: 'BMI', title: 'BMI', full: 'Body Mass Index', icon: '⚖️', color: 'bg-[#A8DADC]',
    fields: [
      { key: 'weight', label: 'Weight (kg)', placeholder: '70' },
      { key: 'height', label: 'Height (cm)', placeholder: '175' },
    ],
    autoFill: (p) => ({ weight: String(p.weight), height: String(p.height) }),
    calc: (v) => {
      const w = parseFloat(v.weight), h = parseFloat(v.height) / 100;
      if (!w || !h) return { value: '—', unit: 'kg/m²' };
      return { value: (w / (h * h)).toFixed(1), unit: 'kg/m²' };
    },
    interpret: (val) => {
      const n = parseFloat(val);
      if (isNaN(n)) return '';
      if (n < 18.5) return '🟡 Underweight';
      if (n < 25)   return '🟢 Normal weight';
      if (n < 30)   return '🟡 Overweight';
      return '🔴 Obese';
    },
  },
  {
    key: 'MAP', title: 'MAP', full: 'Mean Arterial Pressure', icon: '🩸', color: 'bg-[#FFCDB2]',
    fields: [
      { key: 'systolic',  label: 'Systolic (mmHg)',  placeholder: '120' },
      { key: 'diastolic', label: 'Diastolic (mmHg)', placeholder: '80'  },
    ],
    autoFill: (p) => {
      const [s, d] = p.vitals.bp.split('/');
      return { systolic: s ?? '', diastolic: d ?? '' };
    },
    calc: (v) => {
      const s = parseFloat(v.systolic), d = parseFloat(v.diastolic);
      if (!s || !d) return { value: '—', unit: 'mmHg' };
      return { value: ((s + 2 * d) / 3).toFixed(1), unit: 'mmHg' };
    },
    interpret: (val) => {
      const n = parseFloat(val);
      if (isNaN(n)) return '';
      if (n < 70)  return '🔴 Low — Risk of hypoperfusion';
      if (n <= 100) return '🟢 Normal range';
      return '🟡 High — monitor closely';
    },
  },
  {
    key: 'BSA', title: 'BSA', full: 'Body Surface Area', icon: '📐', color: 'bg-[#E5D9F2]',
    fields: [
      { key: 'weight', label: 'Weight (kg)', placeholder: '70' },
      { key: 'height', label: 'Height (cm)', placeholder: '175' },
    ],
    autoFill: (p) => ({ weight: String(p.weight), height: String(p.height) }),
    calc: (v) => {
      const w = parseFloat(v.weight), h = parseFloat(v.height);
      if (!w || !h) return { value: '—', unit: 'm²' };
      return { value: Math.sqrt((h * w) / 3600).toFixed(2), unit: 'm²' };
    },
    interpret: (val) => {
      const n = parseFloat(val);
      return isNaN(n) ? '' : n >= 1.5 && n <= 2.1 ? '🟢 Normal adult range' : '🟡 Outside typical range';
    },
  },
  {
    key: 'eGFR', title: 'eGFR', full: 'Estimated GFR (CKD-EPI)', icon: '🫘', color: 'bg-[#D8F3DC]',
    fields: [
      { key: 'creatinine', label: 'Creatinine (mg/dL)', placeholder: '1.0' },
      { key: 'age',        label: 'Age (years)',         placeholder: '40' },
      { key: 'sex',        label: 'Sex (1=M, 0=F)',      placeholder: '1'  },
    ],
    autoFill: (p) => ({ age: String(p.age), sex: p.gender === 'Male' ? '1' : '0' }),
    calc: (v) => {
      const cr = parseFloat(v.creatinine), age = parseFloat(v.age), sex = parseFloat(v.sex);
      if (!cr || !age || isNaN(sex)) return { value: '—', unit: 'mL/min/1.73m²' };
      const k = sex === 1 ? 0.9 : 0.7, alpha = sex === 1 ? -0.302 : -0.241, ratio = cr / k;
      const egfr = 142 * Math.min(ratio,1)**alpha * Math.max(ratio,1)**-1.2 * 0.9938**age * (sex===0?1.012:1);
      return { value: egfr.toFixed(0), unit: 'mL/min/1.73m²' };
    },
    interpret: (val) => {
      const n = parseFloat(val);
      if (isNaN(n)) return '';
      if (n >= 90) return '🟢 G1 — Normal';
      if (n >= 60) return '🟡 G2 — Mildly decreased';
      if (n >= 30) return '🟠 G3 — Moderately decreased';
      return '🔴 G4/G5 — Severely decreased';
    },
  },
  {
    key: 'CrCl', title: 'CrCl', full: 'Creatinine Clearance (C-G)', icon: '🧪', color: 'bg-[#FFF1C1]',
    fields: [
      { key: 'age',        label: 'Age (years)',         placeholder: '40'  },
      { key: 'weight',     label: 'Weight (kg)',         placeholder: '70'  },
      { key: 'creatinine', label: 'Creatinine (mg/dL)', placeholder: '1.0' },
      { key: 'sex',        label: 'Sex (1=M, 0=F)',      placeholder: '1'   },
    ],
    autoFill: (p) => ({ age: String(p.age), weight: String(p.weight), sex: p.gender === 'Male' ? '1' : '0' }),
    calc: (v) => {
      const age = parseFloat(v.age), w = parseFloat(v.weight), cr = parseFloat(v.creatinine), sex = parseFloat(v.sex);
      if (!age || !w || !cr || isNaN(sex)) return { value: '—', unit: 'mL/min' };
      return { value: (((140-age)*w)/(72*cr)*(sex===0?0.85:1)).toFixed(1), unit: 'mL/min' };
    },
    interpret: (val) => {
      const n = parseFloat(val);
      if (isNaN(n)) return '';
      if (n >= 90) return '🟢 Normal';
      if (n >= 60) return '🟡 Mild reduction';
      if (n >= 30) return '🟠 Moderate — dose adjust';
      return '🔴 Severe — specialist input needed';
    },
  },
  {
    key: 'BMR', title: 'BMR', full: 'Basal Metabolic Rate', icon: '🔥', color: 'bg-[#FAD2E1]',
    fields: [
      { key: 'weight', label: 'Weight (kg)', placeholder: '70'  },
      { key: 'height', label: 'Height (cm)', placeholder: '175' },
      { key: 'age',    label: 'Age (years)', placeholder: '30'  },
      { key: 'sex',    label: 'Sex (1=M, 0=F)', placeholder: '1' },
    ],
    autoFill: (p) => ({ weight: String(p.weight), height: String(p.height), age: String(p.age), sex: p.gender === 'Male' ? '1' : '0' }),
    calc: (v) => {
      const w = parseFloat(v.weight), h = parseFloat(v.height), age = parseFloat(v.age), sex = parseFloat(v.sex);
      if (!w || !h || !age || isNaN(sex)) return { value: '—', unit: 'kcal/day' };
      return { value: (sex===1 ? 10*w+6.25*h-5*age+5 : 10*w+6.25*h-5*age-161).toFixed(0), unit: 'kcal/day' };
    },
    interpret: (val) => { const n = parseFloat(val); return isNaN(n) ? '' : `Resting energy expenditure: ${n} kcal/day`; },
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function DoctorDashboard() {
  const router = useRouter();

  // ── Zustand ──
  const patients  = useClinicalStore((s) => s.patients);
  const auditLog  = useClinicalStore((s) => s.auditLog);

  // ── Local UI state ──
  const [activeCalc, setActiveCalc] = useState<CalcKey | null>(null);
  const [inputs,     setInputs]     = useState<Record<string, string>>({});
  const [result,     setResult]     = useState<CalcResult | null>(null);
  const [showSBAR,   setShowSBAR]   = useState<string | null>(null);  // patientId

  // Raj Kumar — the primary patient
  const raj = patients.find((p) => p.id === 'p1')!;
  const rajDeltas = calculateDeltas(raj.previousVitals, raj.vitals);
  const rajSBAR   = generateSBAR(raj, rajDeltas);
  const rajWorsened = rajDeltas.some((d) => d.significant && d.direction === 'down' && (d.field === 'spo2'));

  // All critical patients
  const criticalPatients = patients.filter((p) => p.priority === 'Urgent');

  const getTime = () => { const h = new Date().getHours(); return h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening'; };

  // ── Calculator handlers ──
  const openCalc = (key: CalcKey) => {
    const def = CALCULATORS.find((c) => c.key === key)!;
    const prefill = def.autoFill ? def.autoFill(raj) : {};
    setActiveCalc(key);
    setInputs(prefill);
    setResult(null);
  };

  const handleCalc = () => {
    const def = CALCULATORS.find((c) => c.key === activeCalc);
    if (!def) return;
    setResult(def.calc(inputs, raj));
  };

  const activeDef = CALCULATORS.find((c) => c.key === activeCalc);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="bg-[#121212] min-h-screen text-white font-sans">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-40 bg-[#121212]/90 backdrop-blur border-b border-white/5 px-6 md:px-10 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#FFCDB2] flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span className="font-bold text-base">MedCare</span>
          <span className="ml-2 text-xs bg-[#FFCDB2]/20 text-[#FFCDB2] px-2 py-0.5 rounded-full font-semibold">Doctor</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400 hidden md:block">Dr. Admin</span>
          <div className="w-9 h-9 rounded-full bg-[#FFCDB2] flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.7 0 4-1.5 4-4s-1.3-4-4-4-4 1.5-4 4 1.3 4 4 4zm0 2c-3.3 0-6 1.7-6 4v1h12v-1c0-2.3-2.7-4-6-4z" />
            </svg>
          </div>
          <button onClick={() => router.push('/')} className="text-xs text-gray-500 hover:text-white transition-colors">Sign Out</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 md:px-10 py-10 flex flex-col gap-8">

        {/* Welcome */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs text-[#FFCDB2] uppercase tracking-widest font-semibold">Clinical Workspace</p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mt-1">
              Good {getTime()}, <span className="text-[#FFCDB2]">Dr. Admin</span>
            </h1>
            <p className="text-gray-400 mt-1">Clinical Toolkit · Shared patient state active</p>
          </div>
          <div className="flex items-center gap-3 bg-[#1A1D24] border border-white/5 rounded-2xl px-5 py-3">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-gray-300 font-medium">On Duty — Ward 3</span>
          </div>
        </section>

        {/* ── Critical Alerts ── */}
        {criticalPatients.length > 0 && (
          <section className="flex flex-col gap-3">
            <p className="text-xs text-red-400 uppercase tracking-widest font-bold">🔴 Critical Alerts — Requires Review</p>
            {criticalPatients.map((p) => {
              const deltas = calculateDeltas(p.previousVitals, p.vitals);
              const sig = deltas.filter((d) => d.significant);
              return (
                <div key={p.id} className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold text-red-300">🔴 {p.name} — Bed {p.bed}, {p.ward}</p>
                    <p className="text-sm text-gray-400 mt-0.5">{p.diagnosis}</p>
                    <div className="flex flex-wrap gap-3 mt-2">
                      <span className="text-xs font-mono bg-white/5 px-2 py-1 rounded-lg">SpO₂ {p.vitals.spo2}%</span>
                      <span className="text-xs font-mono bg-white/5 px-2 py-1 rounded-lg">HR {p.vitals.hr} bpm</span>
                      <span className="text-xs font-mono bg-white/5 px-2 py-1 rounded-lg">O₂: {p.vitals.oxygen}</span>
                      <span className="text-xs font-mono bg-white/5 px-2 py-1 rounded-lg">Temp {p.vitals.temp}°C</span>
                    </div>
                    {sig.length > 0 && (
                      <p className="text-xs text-orange-400 mt-2">
                        ⚠️ {sig.map(d => `${d.label} ${d.direction === 'down' ? '↓' : '↑'} from ${d.previous} → ${d.current}`).join(' · ')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowSBAR(showSBAR === p.id ? null : p.id)}
                    className="shrink-0 px-4 py-2 rounded-xl bg-[#FFCDB2]/10 text-[#FFCDB2] text-xs font-bold hover:bg-[#FFCDB2]/20 transition-colors"
                  >
                    {showSBAR === p.id ? 'Hide SBAR' : 'View SBAR'}
                  </button>
                </div>
              );
            })}
          </section>
        )}

        {/* ── Raj Kumar Panel ── */}
        <section className="bg-[#1A1D24] border border-white/5 rounded-3xl p-6 flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Primary Patient · Bed {raj.bed} · {raj.ward}</p>
              <h2 className="text-2xl font-bold mt-1">{raj.name} <span className="text-base text-gray-400 font-normal">Age {raj.age}</span></h2>
              <p className="text-sm text-gray-400 mt-0.5">{raj.diagnosis} · {raj.medicalHistory.join(' · ')}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${raj.priority === 'Urgent' ? 'bg-red-500/15 text-red-400' : raj.priority === 'Priority' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-green-500/15 text-green-400'}`}>
                {raj.priority}
              </span>
              <button
                onClick={() => setShowSBAR(showSBAR === 'p1' ? null : 'p1')}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-[#FFCDB2]/10 text-[#FFCDB2] hover:bg-[#FFCDB2]/20 transition-colors"
              >
                {showSBAR === 'p1' ? 'Hide SBAR' : '📋 Auto SBAR'}
              </button>
            </div>
          </div>

          {/* Vitals read-only */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'BP', val: raj.vitals.bp, unit: 'mmHg', prev: raj.previousVitals.bp },
              { label: 'HR', val: raj.vitals.hr, unit: 'bpm', prev: raj.previousVitals.hr },
              { label: 'SpO₂', val: raj.vitals.spo2, unit: '%', prev: raj.previousVitals.spo2 },
              { label: 'Temp', val: raj.vitals.temp, unit: '°C', prev: raj.previousVitals.temp },
              { label: 'O₂', val: raj.vitals.oxygen, unit: '', prev: raj.previousVitals.oxygen },
            ].map((v) => {
              const changed = String(v.val) !== String(v.prev);
              return (
                <div key={v.label} className={`bg-[#0D0F14] rounded-xl p-3 ${changed ? 'ring-1 ring-orange-500/50' : ''}`}>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{v.label}</p>
                  <p className={`text-xl font-black mt-0.5 ${changed && rajWorsened ? 'text-red-400' : changed ? 'text-orange-400' : 'text-white'}`}>
                    {String(v.val)}<span className="text-xs font-normal text-gray-500 ml-1">{v.unit}</span>
                  </p>
                  {changed && <p className="text-[10px] text-gray-600 mt-0.5">was: {String(v.prev)}{v.unit}</p>}
                </div>
              );
            })}
          </div>

          {/* Raj SBAR */}
          {showSBAR === 'p1' && (
            <div className="bg-[#0D0F14] rounded-2xl p-6 flex flex-col gap-4 border border-[#FFCDB2]/20">
              <p className="text-xs text-[#FFCDB2] font-bold uppercase tracking-widest">Auto-generated SBAR · {new Date().toLocaleTimeString('en-GB', {hour:'2-digit',minute:'2-digit'})}</p>
              {[
                { label: 'S — Situation', text: rajSBAR.situation, color: 'border-red-400' },
                { label: 'B — Background', text: rajSBAR.background, color: 'border-blue-400' },
                { label: 'A — Assessment', text: rajSBAR.assessment, color: 'border-yellow-400' },
                { label: 'R — Recommendation', text: rajSBAR.recommendation, color: 'border-green-400' },
              ].map((row) => (
                <div key={row.label} className={`border-l-4 ${row.color} pl-4`}>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{row.label}</p>
                  <p className="text-sm text-gray-200 leading-relaxed">{row.text}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Ward overview ── */}
        <section>
          <h2 className="text-xl font-bold mb-4">Ward 3 Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {patients.map((p) => (
              <div key={p.id} className={`bg-[#1A1D24] border rounded-2xl p-4 ${p.priority === 'Urgent' ? 'border-red-500/40' : p.priority === 'Priority' ? 'border-yellow-500/30' : 'border-white/5'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase">Bed {p.bed}</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${p.priority === 'Urgent' ? 'bg-red-500/15 text-red-400' : p.priority === 'Priority' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-green-500/15 text-green-400'}`}>
                    {p.priority}
                  </span>
                </div>
                <p className="font-bold text-sm">{p.name}</p>
                <p className="text-xs text-gray-500 mb-3">{p.diagnosis}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <span className="text-xs bg-white/5 px-2 py-1 rounded-lg font-mono">SpO₂ {p.vitals.spo2}%</span>
                  <span className="text-xs bg-white/5 px-2 py-1 rounded-lg font-mono">HR {p.vitals.hr}</span>
                  <span className="text-xs bg-white/5 px-2 py-1 rounded-lg font-mono">BP {p.vitals.bp}</span>
                  <span className="text-xs bg-white/5 px-2 py-1 rounded-lg font-mono">{p.vitals.temp}°C</span>
                </div>
                <button
                  onClick={() => setShowSBAR(showSBAR === p.id ? null : p.id)}
                  className="mt-3 text-xs text-[#FFCDB2] hover:underline font-semibold"
                >
                  {showSBAR === p.id ? 'Hide SBAR ↑' : 'SBAR →'}
                </button>
                {showSBAR === p.id && (() => {
                  const d = calculateDeltas(p.previousVitals, p.vitals);
                  const s = generateSBAR(p, d);
                  return (
                    <div className="mt-3 bg-[#0D0F14] rounded-xl p-4 flex flex-col gap-3 text-xs">
                      {[['S', s.situation], ['B', s.background], ['A', s.assessment], ['R', s.recommendation]].map(([k, v]) => (
                        <div key={k}><span className="font-bold text-[#FFCDB2]">{k}:</span> <span className="text-gray-400 leading-relaxed">{v}</span></div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        </section>

        {/* ── Calculators ── */}
        <section>
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold">Clinical Calculators</h2>
              <p className="text-xs text-gray-500 mt-0.5">Auto-filled with Raj Kumar&apos;s data where available</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {CALCULATORS.map((calc) => (
              <button
                key={calc.key}
                onClick={() => openCalc(calc.key)}
                className={`${calc.color} rounded-3xl p-6 flex flex-col justify-between text-left text-gray-900 hover:scale-[1.03] transition-transform duration-200 shadow-lg min-h-[180px] relative overflow-hidden group`}
              >
                <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/20 group-hover:scale-125 transition-transform duration-500" />
                <div className="relative z-10">
                  <span className="text-3xl">{calc.icon}</span>
                  <span className="ml-2 text-xs font-bold uppercase tracking-widest opacity-50">{calc.full}</span>
                </div>
                <div className="relative z-10">
                  <h3 className="text-4xl font-black tracking-tighter">{calc.title}</h3>
                  <div className="mt-2 text-xs font-semibold opacity-50">
                    {calc.autoFill ? '⚡ Auto-filled from Raj' : 'Manual entry'}
                  </div>
                  <div className="mt-1 flex items-center gap-1 font-bold text-sm opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                    Calculate →
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── Audit Log ── */}
        <section className="bg-[#1A1D24] border border-white/5 rounded-3xl p-6">
          <h2 className="text-lg font-bold mb-4">Clinical Audit Trail</h2>
          <div className="flex flex-col divide-y divide-white/5">
            {auditLog.slice(0, 10).map((evt) => (
              <div key={evt.id} className="flex gap-3 py-3">
                <span className="text-xs font-mono text-gray-600 w-12 shrink-0 pt-0.5">{evt.timestamp}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      evt.actorRole === 'Nurse' ? 'bg-[#E5D9F2]/20 text-[#E5D9F2]'
                      : evt.actorRole === 'Doctor' ? 'bg-[#FFCDB2]/20 text-[#FFCDB2]'
                      : 'bg-white/10 text-gray-400'
                    }`}>{evt.actorRole}</span>
                    <span className="text-xs font-semibold text-gray-300">{evt.action}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{evt.details}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* ── Calculator Modal ── */}
      {activeCalc && activeDef && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => { setActiveCalc(null); setResult(null); }}>
          <div className="bg-[#1A1D24] rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className={`inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-2 ${activeDef.color} text-gray-900`}>
                  {activeDef.title}
                </div>
                <h2 className="text-2xl font-bold">{activeDef.full}</h2>
                {activeDef.autoFill && (
                  <p className="text-xs text-[#A8DADC] mt-1">⚡ Pre-filled from Raj Kumar&apos;s data</p>
                )}
              </div>
              <button onClick={() => { setActiveCalc(null); setResult(null); }} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-4 mt-4">
              {activeDef.fields.map((field) => (
                <div key={field.key} className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{field.label}</label>
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    value={inputs[field.key] ?? ''}
                    onChange={(e) => setInputs({ ...inputs, [field.key]: e.target.value })}
                    className="w-full h-11 rounded-xl bg-[#101214] border border-white/8 text-white text-sm px-4 placeholder:text-gray-600 focus:outline-none focus:border-[#FFCDB2] focus:ring-1 focus:ring-[#FFCDB2]/30 transition-all"
                  />
                </div>
              ))}

              <button onClick={handleCalc} className="mt-2 h-11 w-full rounded-xl bg-[#FFCDB2] text-gray-900 font-bold text-sm hover:bg-[#ffdec4] transition-colors">
                Calculate
              </button>

              {result && result.value !== '—' && (
                <div className={`${activeDef.color} rounded-2xl p-5 text-gray-900`}>
                  <p className="text-xs font-semibold uppercase tracking-widest opacity-60">Result</p>
                  <p className="text-4xl font-black mt-1">
                    {result.value}
                    <span className="text-sm font-medium ml-2 opacity-60">{result.unit}</span>
                  </p>
                  <p className="text-sm font-semibold mt-2 opacity-75">{activeDef.interpret(result.value)}</p>
                </div>
              )}
              {result && result.value === '—' && (
                <p className="text-sm text-red-400 bg-red-400/10 rounded-xl px-4 py-3">Please fill in all fields to calculate.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
