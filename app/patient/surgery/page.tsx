'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ─── Surgery Journey Data ─────────────────────────────────────────────────────

const surgeryJourney = [
  {
    id: 0,
    title: 'Pre-Surgery Prep',
    subtitle: 'Getting ready for your procedure',
    icon: '📋',
    color: 'bg-[#E5D9F2]',
    accentColor: 'text-[#9B72CF]',
    borderColor: 'border-[#9B72CF]',
    description:
      'Your journey begins here. Before the surgery, our team will run a series of tests to make sure you are in the best possible condition.',
    tasks: [
      { label: 'Blood tests & full panel completed', done: true },
      { label: 'Fasting from midnight before surgery', done: true },
      { label: 'Signed consent forms', done: true },
      { label: 'Allergies and medications reviewed', done: true },
      { label: 'Anaesthetic consultation', done: false },
    ],
    tip: '💡 Stop eating and drinking (including water) from midnight the night before. This is critical for anaesthetic safety.',
    duration: 'Day −1',
  },
  {
    id: 1,
    title: 'Hospital Admission',
    subtitle: 'Checking in and getting settled',
    icon: '🏥',
    color: 'bg-[#A8DADC]',
    accentColor: 'text-[#2A9D8F]',
    borderColor: 'border-[#2A9D8F]',
    description:
      'You will arrive at the hospital and be admitted to your pre-op ward. Our nursing staff will help you change, place an IV line, and answer any final questions.',
    tasks: [
      { label: 'Arrive at hospital reception by 07:00', done: true },
      { label: 'ID wristband fitted', done: true },
      { label: 'Changed into hospital gown', done: true },
      { label: 'IV cannula inserted by nurse', done: false },
      { label: 'Final vitals check (BP, HR, SpO₂)', done: false },
    ],
    tip: '💡 Bring a bag with essentials: phone charger, comfortable clothes for discharge, and any regular medications in their original packaging.',
    duration: 'Day 0 — Morning',
  },
  {
    id: 2,
    title: 'The Surgery',
    subtitle: 'Your laparoscopic appendectomy',
    icon: '⚕️',
    color: 'bg-[#FFCDB2]',
    accentColor: 'text-[#E76F51]',
    borderColor: 'border-[#E76F51]',
    description:
      'A laparoscopic (keyhole) appendectomy is a minimally invasive procedure. The surgeon makes 3 small incisions and removes the appendix using a camera and fine instruments. You will be under general anaesthetic and feel nothing.',
    tasks: [
      { label: 'Wheeled to operating theatre', done: false },
      { label: 'General anaesthetic administered', done: false },
      { label: 'Laparoscopic appendectomy performed (~45 min)', done: false },
      { label: 'Wounds closed with dissolvable sutures', done: false },
      { label: 'Transferred to recovery room', done: false },
    ],
    tip: '💡 The procedure typically takes 30–60 minutes. You will wake up in the recovery room with a nurse by your side.',
    duration: 'Day 0 — ~08:30',
  },
  {
    id: 3,
    title: 'Recovery Ward',
    subtitle: 'Waking up and monitoring',
    icon: '🛏️',
    color: 'bg-[#FAD2E1]',
    accentColor: 'text-[#E63946]',
    borderColor: 'border-[#E63946]',
    description:
      'After surgery, you will spend time in the recovery ward where our nurses will closely monitor your vitals, manage your pain, and help you take your first sips of water. Most patients are moved to the general ward within 1–2 hours.',
    tasks: [
      { label: 'Woke up from anaesthetic', done: false },
      { label: 'Pain level assessed & managed', done: false },
      { label: 'First sips of water tolerated', done: false },
      { label: 'Vitals stable for 1 hour', done: false },
      { label: 'Moved to general ward', done: false },
    ],
    tip: '💡 It is completely normal to feel groggy, nauseous, or sore. Tell your nurse your pain score — you deserve to be comfortable.',
    duration: 'Day 0 — Afternoon',
  },
  {
    id: 4,
    title: 'Going Home',
    subtitle: 'Discharge and aftercare instructions',
    icon: '🏠',
    color: 'bg-[#D8F3DC]',
    accentColor: 'text-[#2D6A4F]',
    borderColor: 'border-[#2D6A4F]',
    description:
      'Most patients are discharged the same day or the morning after. You will leave with a full aftercare plan, a prescription for pain relief, and a follow-up appointment.',
    tasks: [
      { label: 'Eating and drinking normally', done: false },
      { label: 'Pain managed on oral medication', done: false },
      { label: 'Discharge summary provided', done: false },
      { label: 'Follow-up appointment booked (7 days)', done: false },
      { label: 'Home with a responsible adult', done: false },
    ],
    tip: '💡 Avoid heavy lifting for 2 weeks. Shower normally, but keep incision sites dry for 48 hours. Call us if you develop fever > 38°C.',
    duration: 'Day 1',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function PatientSurgery() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const step = surgeryJourney[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === surgeryJourney.length - 1;

  const goNext = () => {
    if (!isLast) setCurrentStep((s) => s + 1);
  };

  const goPrev = () => {
    if (!isFirst) setCurrentStep((s) => s - 1);
  };

  return (
    <div className="bg-[#121212] min-h-screen text-white font-sans flex flex-col">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-40 bg-[#121212]/90 backdrop-blur border-b border-white/5 px-6 md:px-10 h-16 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/patient/dashboard')}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            aria-label="Back"
          >
            <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#A8DADC] flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2a10 10 0 110 20A10 10 0 0112 2zm-1 6v5H7l5 5 5-5h-4V8h-2z" />
              </svg>
            </div>
            <span className="font-bold text-base tracking-tight">MedCare</span>
          </div>
          <span className="text-xs bg-[#A8DADC]/20 text-[#A8DADC] px-2 py-0.5 rounded-full font-semibold">Surgery Journey</span>
        </div>
        <button onClick={() => router.push('/')} className="text-xs text-gray-500 hover:text-white transition-colors">
          Sign Out
        </button>
      </header>

      <main className="max-w-3xl mx-auto w-full px-6 md:px-10 py-10 flex flex-col gap-8">

        {/* ── Page Title ── */}
        <section>
          <p className="text-xs text-[#A8DADC] uppercase tracking-widest font-semibold">Appendectomy</p>
          <h1 className="text-3xl md:text-4xl font-bold mt-1 tracking-tight">My Surgery Journey</h1>
          <p className="text-gray-400 text-sm mt-1">Follow your procedure from preparation to recovery — one step at a time.</p>
        </section>

        {/* ── Progress Tracker ── */}
        <section>
          <div className="flex items-center justify-between relative">
            {/* Connecting line behind nodes */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-white/10 z-0" />

            {surgeryJourney.map((s, i) => {
              const isActive = i === currentStep;
              const isCompleted = i < currentStep;

              return (
                <button
                  key={s.id}
                  onClick={() => setCurrentStep(i)}
                  title={s.title}
                  className="relative z-10 flex flex-col items-center gap-2 group"
                >
                  {/* Node circle */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-black transition-all duration-300 shadow-lg ${
                      isActive
                        ? `${s.color} scale-125 ring-2 ring-white/30`
                        : isCompleted
                        ? 'bg-white/20 text-white'
                        : 'bg-white/5 text-gray-600'
                    }`}
                  >
                    {isCompleted ? (
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className={`text-base ${isActive ? 'text-gray-900' : ''}`}>{s.icon}</span>
                    )}
                  </div>
                  {/* Label — only show on md+ */}
                  <span
                    className={`hidden md:block text-[10px] font-bold uppercase tracking-wider text-center max-w-[64px] leading-tight transition-colors ${
                      isActive ? 'text-white' : isCompleted ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    {s.title.split(' ').slice(0, 2).join(' ')}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Step counter */}
          <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
            <span>Step {currentStep + 1} of {surgeryJourney.length}</span>
            <span>{step.duration}</span>
          </div>
        </section>

        {/* ── Step Content Card ── */}
        <section
          key={currentStep} // key forces re-mount so entry animation fires on each step change
          className={`${step.color} rounded-[2rem] p-8 text-gray-900 shadow-xl flex flex-col gap-6 animate-fadeIn`}
        >
          {/* Step header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-50">Step {currentStep + 1}</p>
              <h2 className="text-3xl font-black tracking-tight mt-1 leading-tight">{step.title}</h2>
              <p className="text-sm opacity-70 mt-1 font-medium">{step.subtitle}</p>
            </div>
            <span className="text-5xl shrink-0">{step.icon}</span>
          </div>

          {/* Description */}
          <p className="text-gray-900/80 text-base leading-relaxed">{step.description}</p>

          {/* Task checklist */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-1">Checklist</p>
            {step.tasks.map((task, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center border-2 ${
                    task.done
                      ? 'bg-gray-900 border-gray-900'
                      : 'border-gray-900/30 bg-transparent'
                  }`}
                >
                  {task.done && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`text-sm font-medium ${task.done ? 'line-through opacity-50' : 'opacity-80'}`}>
                  {task.label}
                </span>
              </div>
            ))}
          </div>

          {/* Tip box */}
          <div className="bg-gray-900/10 rounded-2xl px-5 py-4 text-sm font-medium leading-relaxed opacity-80 border border-gray-900/10">
            {step.tip}
          </div>
        </section>

        {/* ── Navigation Buttons ── */}
        <section className="flex items-center justify-between gap-4">
          <button
            onClick={goPrev}
            disabled={isFirst}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
              isFirst
                ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                : 'bg-white/10 text-white hover:bg-white/15'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          {/* Dot indicators */}
          <div className="flex items-center gap-2">
            {surgeryJourney.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? `w-6 h-2.5 ${step.color}`
                    : 'w-2.5 h-2.5 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>

          {isLast ? (
            <button
              onClick={() => router.push('/patient/dashboard')}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm bg-[#A8DADC] text-gray-900 hover:bg-[#b8e4e6] transition-colors"
            >
              Back to Dashboard
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M12 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={goNext}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all text-gray-900 hover:opacity-90 ${step.color}`}
            >
              Next Step
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </section>

        {/* ── Step Quick Nav ── */}
        <section className="bg-[#1A1D24] border border-white/5 rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Jump to step</p>
          <div className="grid grid-cols-1 gap-2">
            {surgeryJourney.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setCurrentStep(i)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-colors ${
                  i === currentStep
                    ? 'bg-white/10 text-white'
                    : i < currentStep
                    ? 'text-gray-400 hover:bg-white/5'
                    : 'text-gray-600 hover:bg-white/3'
                }`}
              >
                <span className="text-lg shrink-0">{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{s.title}</p>
                  <p className="text-xs opacity-60 truncate">{s.duration}</p>
                </div>
                {i < currentStep && (
                  <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {i === currentStep && (
                  <span className="text-xs font-bold text-[#A8DADC] shrink-0">Current</span>
                )}
              </button>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
