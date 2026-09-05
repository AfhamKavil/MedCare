'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type CalculatorKey = 'BMI' | 'MAP' | 'BSA' | 'eGFR' | 'CrCl' | 'BMR';

interface CalculatorResult {
  value: string;
  unit: string;
}

interface CalcState {
  [key: string]: string;
}

const calculators = [
  {
    key: 'BMI' as CalculatorKey,
    title: 'BMI',
    full: 'Body Mass Index',
    icon: '⚖️',
    color: 'bg-[#A8DADC]',
    fields: [
      { key: 'weight', label: 'Weight (kg)', placeholder: '70' },
      { key: 'height', label: 'Height (cm)', placeholder: '175' },
    ],
    calc: (v: CalcState): CalculatorResult => {
      const w = parseFloat(v.weight);
      const h = parseFloat(v.height) / 100;
      if (!w || !h) return { value: '—', unit: 'kg/m²' };
      return { value: (w / (h * h)).toFixed(1), unit: 'kg/m²' };
    },
    interpret: (val: string) => {
      const n = parseFloat(val);
      if (isNaN(n)) return '';
      if (n < 18.5) return 'Underweight';
      if (n < 25) return 'Normal';
      if (n < 30) return 'Overweight';
      return 'Obese';
    },
  },
  {
    key: 'MAP' as CalculatorKey,
    title: 'MAP',
    full: 'Mean Arterial Pressure',
    icon: '🩸',
    color: 'bg-[#FFCDB2]',
    fields: [
      { key: 'systolic', label: 'Systolic (mmHg)', placeholder: '120' },
      { key: 'diastolic', label: 'Diastolic (mmHg)', placeholder: '80' },
    ],
    calc: (v: CalcState): CalculatorResult => {
      const s = parseFloat(v.systolic);
      const d = parseFloat(v.diastolic);
      if (!s || !d) return { value: '—', unit: 'mmHg' };
      return { value: ((s + 2 * d) / 3).toFixed(1), unit: 'mmHg' };
    },
    interpret: (val: string) => {
      const n = parseFloat(val);
      if (isNaN(n)) return '';
      if (n < 70) return 'Low — Risk of Hypoperfusion';
      if (n <= 100) return 'Normal Range';
      return 'High — Monitor BP';
    },
  },
  {
    key: 'BSA' as CalculatorKey,
    title: 'BSA',
    full: 'Body Surface Area',
    icon: '📐',
    color: 'bg-[#E5D9F2]',
    fields: [
      { key: 'weight', label: 'Weight (kg)', placeholder: '70' },
      { key: 'height', label: 'Height (cm)', placeholder: '175' },
    ],
    calc: (v: CalcState): CalculatorResult => {
      const w = parseFloat(v.weight);
      const h = parseFloat(v.height);
      if (!w || !h) return { value: '—', unit: 'm²' };
      return { value: Math.sqrt((h * w) / 3600).toFixed(2), unit: 'm²' };
    },
    interpret: (val: string) => {
      const n = parseFloat(val);
      if (isNaN(n)) return '';
      return n >= 1.5 && n <= 2.1 ? 'Normal Adult Range' : 'Outside typical range';
    },
  },
  {
    key: 'eGFR' as CalculatorKey,
    title: 'eGFR',
    full: 'Estimated GFR (CKD-EPI)',
    icon: '🫘',
    color: 'bg-[#D8F3DC]',
    fields: [
      { key: 'creatinine', label: 'Creatinine (mg/dL)', placeholder: '1.0' },
      { key: 'age', label: 'Age (years)', placeholder: '40' },
      { key: 'sex', label: 'Sex (1=M, 0=F)', placeholder: '1' },
    ],
    calc: (v: CalcState): CalculatorResult => {
      const cr = parseFloat(v.creatinine);
      const age = parseFloat(v.age);
      const sex = parseFloat(v.sex);
      if (!cr || !age || isNaN(sex)) return { value: '—', unit: 'mL/min/1.73m²' };
      const k = sex === 1 ? 0.9 : 0.7;
      const alpha = sex === 1 ? -0.302 : -0.241;
      const ratio = cr / k;
      const egfr =
        142 *
        Math.min(ratio, 1) ** alpha *
        Math.max(ratio, 1) ** -1.2 *
        0.9938 ** age *
        (sex === 0 ? 1.012 : 1);
      return { value: egfr.toFixed(0), unit: 'mL/min/1.73m²' };
    },
    interpret: (val: string) => {
      const n = parseFloat(val);
      if (isNaN(n)) return '';
      if (n >= 90) return 'G1 — Normal';
      if (n >= 60) return 'G2 — Mildly decreased';
      if (n >= 30) return 'G3 — Moderately decreased';
      return 'G4/G5 — Severely decreased';
    },
  },
  {
    key: 'CrCl' as CalculatorKey,
    title: 'CrCl',
    full: 'Creatinine Clearance (Cockcroft-Gault)',
    icon: '🧪',
    color: 'bg-[#FFF1C1]',
    fields: [
      { key: 'age', label: 'Age (years)', placeholder: '40' },
      { key: 'weight', label: 'Weight (kg)', placeholder: '70' },
      { key: 'creatinine', label: 'Creatinine (mg/dL)', placeholder: '1.0' },
      { key: 'sex', label: 'Sex (1=M, 0=F)', placeholder: '1' },
    ],
    calc: (v: CalcState): CalculatorResult => {
      const age = parseFloat(v.age);
      const w = parseFloat(v.weight);
      const cr = parseFloat(v.creatinine);
      const sex = parseFloat(v.sex);
      if (!age || !w || !cr || isNaN(sex)) return { value: '—', unit: 'mL/min' };
      const factor = sex === 0 ? 0.85 : 1;
      return { value: (((140 - age) * w) / (72 * cr)) * factor + '', unit: 'mL/min' };
    },
    interpret: (val: string) => {
      const n = parseFloat(val);
      if (isNaN(n)) return '';
      if (n >= 90) return 'Normal';
      if (n >= 60) return 'Mild reduction';
      if (n >= 30) return 'Moderate reduction';
      return 'Severe reduction — dose adjust';
    },
  },
  {
    key: 'BMR' as CalculatorKey,
    title: 'BMR',
    full: 'Basal Metabolic Rate',
    icon: '🔥',
    color: 'bg-[#FAD2E1]',
    fields: [
      { key: 'weight', label: 'Weight (kg)', placeholder: '70' },
      { key: 'height', label: 'Height (cm)', placeholder: '175' },
      { key: 'age', label: 'Age (years)', placeholder: '30' },
      { key: 'sex', label: 'Sex (1=M, 0=F)', placeholder: '1' },
    ],
    calc: (v: CalcState): CalculatorResult => {
      const w = parseFloat(v.weight);
      const h = parseFloat(v.height);
      const age = parseFloat(v.age);
      const sex = parseFloat(v.sex);
      if (!w || !h || !age || isNaN(sex)) return { value: '—', unit: 'kcal/day' };
      const bmr =
        sex === 1
          ? 10 * w + 6.25 * h - 5 * age + 5
          : 10 * w + 6.25 * h - 5 * age - 161;
      return { value: bmr.toFixed(0), unit: 'kcal/day' };
    },
    interpret: (val: string) => {
      const n = parseFloat(val);
      if (isNaN(n)) return '';
      return n > 0 ? `Resting energy: ${n} kcal/day` : '';
    },
  },
];

export default function DoctorDashboard() {
  const router = useRouter();
  const [activeCalc, setActiveCalc] = useState<CalculatorKey | null>(null);
  const [inputs, setInputs] = useState<CalcState>({});
  const [result, setResult] = useState<CalculatorResult | null>(null);

  const openCalc = (key: CalculatorKey) => {
    setActiveCalc(key);
    setInputs({});
    setResult(null);
  };

  const closeCalc = () => {
    setActiveCalc(null);
    setInputs({});
    setResult(null);
  };

  const handleCalc = () => {
    const def = calculators.find((c) => c.key === activeCalc);
    if (!def) return;
    setResult(def.calc(inputs));
  };

  const activeDef = calculators.find((c) => c.key === activeCalc);

  const getTime = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Morning';
    if (h < 17) return 'Afternoon';
    return 'Evening';
  };

  return (
    <div className="bg-[#121212] min-h-screen text-white font-sans">
      {/* Nav */}
      <header className="sticky top-0 z-40 bg-[#121212]/90 backdrop-blur border-b border-white/5 px-6 md:px-10 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#FFCDB2] flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span className="font-bold text-base tracking-tight">MedCare</span>
          <span className="ml-2 text-xs bg-[#FFCDB2]/20 text-[#FFCDB2] px-2 py-0.5 rounded-full font-semibold">Doctor</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400 hidden md:block">Dr. Admin</span>
          <div className="w-9 h-9 rounded-full bg-[#FFCDB2] flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.7 0 4-1.5 4-4s-1.3-4-4-4-4 1.5-4 4 1.3 4 4 4zm0 2c-3.3 0-6 1.7-6 4v1h12v-1c0-2.3-2.7-4-6-4z" />
            </svg>
          </div>
          <button onClick={() => router.push('/')} className="text-xs text-gray-500 hover:text-white transition-colors">
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 md:px-10 py-10 flex flex-col gap-10">

        {/* Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs text-[#FFCDB2] uppercase tracking-widest font-semibold">Clinical Workspace</p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mt-1">
              Good {getTime()},<br />
              <span className="text-[#FFCDB2]">Dr. Admin</span>
            </h1>
            <p className="text-gray-400 mt-2">Clinical Toolkit &amp; Calculators</p>
          </div>
          <div className="flex items-center gap-3 bg-[#1A1D24] border border-white/5 rounded-2xl px-5 py-3">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-gray-300 font-medium">On Duty — Ward 2</span>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Today's Patients", value: '14', color: 'text-[#FFCDB2]' },
            { label: 'Pending Reports', value: '3', color: 'text-[#FAD2E1]' },
            { label: 'Consults Done', value: '8', color: 'text-[#A8DADC]' },
            { label: 'Critical Alerts', value: '1', color: 'text-red-400' },
          ].map((s) => (
            <div key={s.label} className="bg-[#1A1D24] border border-white/5 rounded-2xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{s.label}</p>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </section>

        {/* Calculator Grid */}
        <section>
          <div className="flex items-end justify-between mb-5">
            <h2 className="text-xl font-bold">Clinical Calculators</h2>
            <p className="text-xs text-gray-500">Click any card to calculate</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {calculators.map((calc) => (
              <button
                key={calc.key}
                onClick={() => openCalc(calc.key)}
                className={`${calc.color} rounded-3xl p-6 flex flex-col justify-between text-left text-gray-900 hover:scale-[1.03] transition-transform duration-200 shadow-lg min-h-[200px] relative overflow-hidden group`}
              >
                <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/20 group-hover:scale-125 transition-transform duration-500" />
                <div className="relative z-10">
                  <span className="text-3xl">{calc.icon}</span>
                  <span className="ml-2 text-xs font-bold uppercase tracking-widest opacity-50">{calc.full}</span>
                </div>
                <div className="relative z-10">
                  <h3 className="text-4xl font-black tracking-tighter">{calc.title}</h3>
                  <div className="mt-3 flex items-center gap-1 font-bold text-sm opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                    Calculate →
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="bg-[#1A1D24] border border-white/5 rounded-3xl p-6">
          <h2 className="text-lg font-bold mb-4">Recent Activity</h2>
          <div className="flex flex-col divide-y divide-white/5">
            {[
              { time: '09:14', action: 'Viewed chart — John Doe (Bed 3)', type: 'chart' },
              { time: '09:45', action: 'Prescribed Amoxicillin 500mg — Jane Smith', type: 'rx' },
              { time: '10:20', action: 'BMI calculation — Patient #2041', type: 'calc' },
              { time: '11:02', action: 'Critical alert acknowledged — Bed 7', type: 'alert' },
            ].map((item) => (
              <div key={item.time} className="flex items-center gap-4 py-3">
                <span className="text-xs font-mono text-gray-500 w-12 shrink-0">{item.time}</span>
                <div className={`w-2 h-2 rounded-full shrink-0 ${item.type === 'alert' ? 'bg-red-400' : item.type === 'calc' ? 'bg-[#FFCDB2]' : item.type === 'rx' ? 'bg-[#A8DADC]' : 'bg-gray-500'}`} />
                <p className="text-sm text-gray-300">{item.action}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Calculator Modal */}
      {activeCalc && activeDef && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={closeCalc}
        >
          <div
            className="bg-[#1A1D24] rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className={`inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-2 ${activeDef.color} text-gray-900`}>
                  {activeDef.title}
                </div>
                <h2 className="text-2xl font-bold">{activeDef.full}</h2>
              </div>
              <button
                onClick={closeCalc}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {activeDef.fields.map((field) => (
                <div key={field.key} className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{field.label}</label>
                  <input
                    type="number"
                    placeholder={field.placeholder}
                    value={inputs[field.key] || ''}
                    onChange={(e) => setInputs({ ...inputs, [field.key]: e.target.value })}
                    className="w-full h-11 rounded-xl bg-[#101214] border border-white/8 text-white text-sm px-4 placeholder:text-gray-600 focus:outline-none focus:border-[#FFCDB2] focus:ring-1 focus:ring-[#FFCDB2]/30 transition-all"
                  />
                </div>
              ))}

              <button
                onClick={handleCalc}
                className="mt-2 h-11 w-full rounded-xl bg-[#FFCDB2] text-gray-900 font-bold text-sm hover:bg-[#ffdec4] transition-colors"
              >
                Calculate
              </button>

              {result && (
                <div className={`${activeDef.color} rounded-2xl p-5 text-gray-900 flex flex-col gap-1`}>
                  <p className="text-xs font-semibold uppercase tracking-widest opacity-60">Result</p>
                  <p className="text-4xl font-black">
                    {parseFloat(result.value) ? parseFloat(result.value).toFixed(isNaN(parseFloat(result.value)) ? 0 : 1) : result.value}
                    <span className="text-sm font-medium ml-2 opacity-60">{result.unit}</span>
                  </p>
                  <p className="text-sm font-semibold mt-1 opacity-75">
                    {activeDef.interpret(result.value)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
