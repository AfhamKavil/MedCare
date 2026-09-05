'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Option {
  id: 'A' | 'B' | 'C' | 'D';
  text: string;
  correct: boolean;
  dhamu_reaction: string;      // Dhamu's emotional reaction when this option is selected
  adv_explanation: string;     // Adv's medico-legal explanation
  image_label: string;         // Placeholder image label
  image_emoji: string;         // Visual emoji to represent the scene
  image_bg: string;            // Tailwind bg color for the placeholder
}

interface Scenario {
  id: number;
  title: string;
  situation: string;
  question: string;
  dhamu_reaction: string;      // Dhamu's initial emotional reaction to the situation
  options: Option[];
}

// ─── Data — all 5 scenarios ───────────────────────────────────────────────────
// The quiz engine is fully data-driven. Add new scenarios here without touching UI.

const SCENARIOS: Scenario[] = [
  {
    id: 1,
    title: 'Dhamu Wants His Medical Records',
    situation:
      'Dhamu was treated at a hospital. He wants copies of his medical records. The receptionist says: "Why do you need all that? Just go home. Everything is fine."',
    question: 'What should Dhamu do?',
    dhamu_reaction: '😤 "MY RECORDS! GIVE ME MY RECORDS! I HAVE RIGHTS!"',
    options: [
      {
        id: 'A',
        text: 'Grab the receptionist\'s chair and demand the records immediately. Nobody can stop Dhamu!',
        correct: false,
        dhamu_reaction: '🪑 Dhamu lifts the chair. Everyone ducks. A ceiling fan falls down.',
        adv_explanation:
          'Threatening hospital staff is not an appropriate way to obtain records. Patients have a legal right to medical records, but exercising that right requires following established institutional processes — not physical intimidation.',
        image_label: 'OPTION A — Dhamu and the Chair Incident',
        image_emoji: '🪑💥😤',
        image_bg: 'bg-red-900/40',
      },
      {
        id: 'B',
        text: 'Calm down, make a formal written request for the records, and keep proof of the request.',
        correct: true,
        dhamu_reaction: '📝 Dhamu takes a deep breath. Adv appears from behind a ficus plant and winks.',
        adv_explanation:
          'Patients have the right to access their medical records. Submit a written request to the Medical Records department, note the date, and retain a copy of the request. If refused, escalate through the hospital\'s grievance mechanism.',
        image_label: 'OPTION B — Dhamu Discovers Paperwork',
        image_emoji: '📋✅😌',
        image_bg: 'bg-green-900/40',
      },
      {
        id: 'C',
        text: 'Break the hospital\'s glass door. The records will probably fly out.',
        correct: false,
        dhamu_reaction: '🔨 Glass everywhere. Records do not fly out. Security arrives in 4 seconds.',
        adv_explanation:
          'Damaging hospital property constitutes criminal mischief and can result in arrest and prosecution — which is even less fun than not having your records.',
        image_label: 'OPTION C — Physics Lesson with Dhamu',
        image_emoji: '🔨🪟😬',
        image_bg: 'bg-orange-900/40',
      },
      {
        id: 'D',
        text: 'Upload a video calling the hospital a criminal organization and tag every celebrity.',
        correct: false,
        dhamu_reaction: '📱 Video goes viral. Dhamu gets a defamation notice instead of his records.',
        adv_explanation:
          'Public accusations of criminality without evidence can constitute defamation. Social media is not a substitute for the formal complaint process. Document your facts first, then use appropriate channels.',
        image_label: 'OPTION D — Dhamu Goes Viral (Wrong Kind)',
        image_emoji: '📱⚠️😰',
        image_bg: 'bg-purple-900/40',
      },
    ],
  },
  {
    id: 2,
    title: 'The Consent Form',
    situation:
      'A doctor explains a procedure. The nurse gives Dhamu a consent form. Dhamu stares at it and says: "This has more words than my entire school textbook!"',
    question: 'What should Dhamu do before signing?',
    dhamu_reaction: '😵 "I signed! Wait — what did I just agree to? Did I give them a kidney?!"',
    options: [
      {
        id: 'A',
        text: 'Sign it immediately. If there are too many words, they must all be important.',
        correct: false,
        dhamu_reaction: '✍️ Dhamu signs at supersonic speed. He has now legally agreed to write a 5-star review.',
        adv_explanation:
          'Signing without understanding defeats the entire purpose of informed consent. A patient who does not understand what they are signing has not given meaningful, voluntary consent — which is a cornerstone of medical ethics and law.',
        image_label: 'OPTION A — Dhamu Signs Everything',
        image_emoji: '✍️💨😦',
        image_bg: 'bg-yellow-900/40',
      },
      {
        id: 'B',
        text: 'Throw the form at the doctor and run out of the hospital.',
        correct: false,
        dhamu_reaction: '🏃 Dhamu is halfway to the parking lot. The doctor is still holding the pen.',
        adv_explanation:
          'Avoiding communication is not making an informed decision. Leaving without understanding your options can delay necessary treatment and doesn\'t protect your rights.',
        image_label: 'OPTION B — The Great Escape',
        image_emoji: '🏃📄😅',
        image_bg: 'bg-red-900/40',
      },
      {
        id: 'C',
        text: 'Ask the doctor to explain the procedure, risks, benefits, and alternatives in plain language before deciding.',
        correct: true,
        dhamu_reaction: '🤔 Dhamu asks questions. The doctor respects this. Adv is on a beach sipping juice, at peace.',
        adv_explanation:
          'Informed consent requires that the patient receive material information about the procedure — risks, benefits, alternatives, and what happens if they decline — in language they can understand. You have every right to ask until you understand.',
        image_label: 'OPTION C — Dhamu Learns Things',
        image_emoji: '🤝📋✅',
        image_bg: 'bg-green-900/40',
      },
      {
        id: 'D',
        text: 'Make the hospital watch a 47-minute speech proving Dhamu is smarter than the doctor.',
        correct: false,
        dhamu_reaction: '🎤 Dhamu\'s presentation has 83 slides. The doctor falls asleep on slide 2.',
        adv_explanation:
          'The goal is understanding your own treatment — not winning an argument. Use the time to ask clear, focused questions instead.',
        image_label: 'OPTION D — The TED Talk Nobody Asked For',
        image_emoji: '🎤📊😴',
        image_bg: 'bg-purple-900/40',
      },
    ],
  },
  {
    id: 3,
    title: 'Something Went Wrong',
    situation:
      'After a procedure, Dhamu believes something went wrong and thinks the doctor was negligent. He is furious and wants "revenge."',
    question: 'What is the sensible first response?',
    dhamu_reaction: '🔥 "REVENGE! JUSTICE! Also I don\'t know the difference between the two!"',
    options: [
      {
        id: 'A',
        text: 'Beat the doctor. That will definitely improve the medical outcome.',
        correct: false,
        dhamu_reaction: '🥊 Dhamu goes to find the doctor. Security finds Dhamu first. Outcome: worse.',
        adv_explanation:
          'Violence is a criminal offence. It destroys your credibility, results in your prosecution, and does absolutely nothing to prove or remedy negligence. Courts do not award damages to people who committed assault.',
        image_label: 'OPTION A — Dhamu vs. Logic',
        image_emoji: '🥊⚖️❌',
        image_bg: 'bg-red-900/40',
      },
      {
        id: 'B',
        text: 'Collect all medical records, get a second medical opinion, and use proper complaint mechanisms.',
        correct: true,
        dhamu_reaction: '📂 Dhamu collects evidence. Adv appears with a briefcase and nods respectfully.',
        adv_explanation:
          'Not every adverse outcome is negligence. Negligence requires proving duty, breach, causation, and harm. Your first step is documentation: request all records, obtain an independent clinical opinion, and then consult a lawyer or regulatory body if appropriate.',
        image_label: 'OPTION B — Dhamu Becomes Strategic',
        image_emoji: '📂🔬⚖️',
        image_bg: 'bg-green-900/40',
      },
      {
        id: 'C',
        text: 'Post "MY DOCTOR IS THE WORST" and tag every celebrity you follow.',
        correct: false,
        dhamu_reaction: '📱 Dhamu\'s post gets 7 likes. He receives a legal notice in 48 hours.',
        adv_explanation:
          'Posting unverified accusations of medical negligence publicly can expose you to a defamation claim. Establish facts first through proper documentation before making any public statement.',
        image_label: 'OPTION C — The Tweet Heard Round the Ward',
        image_emoji: '📱⚠️😰',
        image_bg: 'bg-orange-900/40',
      },
      {
        id: 'D',
        text: "Destroy the doctor's car so everyone knows Dhamu is serious.",
        correct: false,
        dhamu_reaction: '🚗 Dhamu damages the car. He is now the defendant in two cases instead of one.',
        adv_explanation:
          "Criminal damage to property is a separate offence from the original complaint. You have now created a situation where you are legally worse off than before. The doctor's car has nothing to do with your medical outcome.",
        image_label: "OPTION D — Dhamu's Parking Lot Decision",
        image_emoji: '🚗💥😬',
        image_bg: 'bg-red-900/40',
      },
    ],
  },
  {
    id: 4,
    title: 'The Hospital Bill Surprise',
    situation:
      'Dhamu receives a hospital bill with charges he doesn\'t recognise. He holds it up and says: "This bill has more numbers than my phone contacts!"',
    question: 'What should Dhamu do about the mystery charges?',
    dhamu_reaction: '💸 "WHAT IS A \'CONSUMABLE FEE\'?! DID THEY CHARGE ME FOR AIR?!"',
    options: [
      {
        id: 'A',
        text: 'Refuse to pay anything and declare personal independence from hospital billing.',
        correct: false,
        dhamu_reaction: '🏳️ Dhamu signs the Declaration of Freedom from Bills. The collections department is unimpressed.',
        adv_explanation:
          'Refusing all payment isn\'t legally sound. Identify and question specific disputed charges in writing. Pay undisputed amounts and formally contest only the unclear items.',
        image_label: 'OPTION A — The Dhamu Independence Movement',
        image_emoji: '🏳️💸😤',
        image_bg: 'bg-yellow-900/40',
      },
      {
        id: 'B',
        text: 'Request an itemized bill, clarify each disputed charge in writing, and use the grievance process if unresolved.',
        correct: true,
        dhamu_reaction: '📊 Dhamu gets the itemized bill. He finds three errors. Adv is unsurprised.',
        adv_explanation:
          'You have the right to receive an itemized breakdown of all charges. Document disputed items in writing, request written responses, and escalate through the hospital\'s billing grievance process or relevant consumer protection authority if needed.',
        image_label: 'OPTION B — Dhamu Audits His Own Bill',
        image_emoji: '📊✅🔍',
        image_bg: 'bg-green-900/40',
      },
      {
        id: 'C',
        text: "Break the billing department's computer to settle the score.",
        correct: false,
        dhamu_reaction: "💻 Dhamu smashes the computer. The bill is now the least of his problems.",
        adv_explanation:
          'Destruction of property is a criminal offence. The bill still exists — it is just now accompanied by criminal charges. Computers make backup copies.',
        image_label: 'OPTION C — IT Security Incident Report #4471',
        image_emoji: '💻💥⚖️',
        image_bg: 'bg-red-900/40',
      },
      {
        id: 'D',
        text: 'Challenge the cashier to a wrestling match to resolve the billing dispute.',
        correct: false,
        dhamu_reaction: '🤼 Dhamu assumes the stance. The cashier calmly calls HR. Dhamu is banned from the premises.',
        adv_explanation:
          'Intimidation, whether theatrical or literal, does not constitute a valid dispute mechanism. It also triggers trespass and potentially assault laws. Write a letter instead.',
        image_label: "OPTION D — Dhamu's WWE Billing Debut",
        image_emoji: '🤼💳😬',
        image_bg: 'bg-purple-900/40',
      },
    ],
  },
  {
    id: 5,
    title: 'The Complaint',
    situation:
      'Dhamu feels he was treated unfairly by a hospital. His friend advises: "Just shout at everyone until someone listens."',
    question: 'What is the better approach to filing a complaint?',
    dhamu_reaction: '📣 "SHOUT LOUDER! SHOUT IN DIFFERENT LANGUAGES! SHOUT IN MORSE CODE!"',
    options: [
      {
        id: 'A',
        text: 'Shout at the reception desk until someone gives Dhamu a trophy for persistence.',
        correct: false,
        dhamu_reaction: '📣 Dhamu shouts for 47 minutes. No trophy arrives. Security does.',
        adv_explanation:
          'Aggressive behavior weakens a legitimate complaint by shifting focus from the issue to your conduct. Use official written complaint procedures — they create a paper trail and obligate a formal response.',
        image_label: 'OPTION A — The World Record Attempt',
        image_emoji: '📣⏰😤',
        image_bg: 'bg-orange-900/40',
      },
      {
        id: 'B',
        text: 'Throw the complaint box through the window for emphasis.',
        correct: false,
        dhamu_reaction: '📦💨 The complaint box goes through the window. So does Dhamu\'s credibility.',
        adv_explanation:
          'Destroying hospital property is a criminal act. It also transforms you from complainant to defendant, which is a significant downgrade in legal status.',
        image_label: 'OPTION B — The Complaint Box\'s Last Flight',
        image_emoji: '📦🪟💥',
        image_bg: 'bg-red-900/40',
      },
      {
        id: 'C',
        text: "Write a 900-page complaint beginning with Dhamu's childhood and how this moment was inevitable.",
        correct: false,
        dhamu_reaction: "📖 Volume 1 of 12 is submitted. Nobody has finished reading Chapter 1.",
        adv_explanation:
          'An effective complaint is factual, specific, chronological, and supported by documentary evidence. Include: date, incident description, names, what remedy you seek. Brevity and evidence are your strongest tools.',
        image_label: "OPTION C — Dhamu's Magnum Opus",
        image_emoji: '📖📚😴',
        image_bg: 'bg-yellow-900/40',
      },
      {
        id: 'D',
        text: 'Write a clear factual complaint with dates, evidence, and the remedy sought. Submit it properly and keep proof.',
        correct: true,
        dhamu_reaction: '✉️ Dhamu submits a 2-page complaint with attachments. Adv frames a copy and hangs it on his wall.',
        adv_explanation:
          'A well-documented complaint creates an official record, compels a formal institutional response, and forms the foundation for any escalation — to a regulator, ombudsman, or court. Keep a copy of everything you submit.',
        image_label: 'OPTION D — Dhamu Graduates from the School of Process',
        image_emoji: '✉️📎✅',
        image_bg: 'bg-green-900/40',
      },
    ],
  },
];

// ─── Score result config ──────────────────────────────────────────────────────

function getScoreResult(score: number, total: number): { title: string; subtitle: string; color: string; emoji: string } {
  if (score === total)     return { title: 'Adv is Genuinely Impressed.', subtitle: 'Dhamu has achieved full legal self-awareness. Celebrate responsibly.', color: 'bg-[#A8DADC]', emoji: '🏆' };
  if (score >= total - 1) return { title: 'Almost Legally Responsible.', subtitle: 'One moment of weakness. Adv has noted it. You are still mostly safe to operate in society.', color: 'bg-[#D8F3DC]', emoji: '✅' };
  if (score >= total - 3) return { title: 'Adv Needs a Long Conversation.', subtitle: 'There is potential here. It is buried very deeply, but Adv can see it.', color: 'bg-[#FFCDB2]', emoji: '⚖️' };
  return { title: 'Dhamu Has Been Banned From Making Decisions Without Adv.', subtitle: 'For everyone\'s safety. Please re-read. Perhaps twice.', color: 'bg-[#FAD2E1]', emoji: '🚨' };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DhamuAvatar({ expression }: { expression?: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-16 h-16 rounded-full bg-[#FFCDB2] border-4 border-[#FFCDB2]/50 flex items-center justify-center text-3xl shadow-lg">
        😤
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#FFCDB2]">Dhamu</span>
      {expression && (
        <div className="max-w-xs bg-[#1A1D24] border border-[#FFCDB2]/20 rounded-2xl rounded-tl-none px-4 py-3 text-sm text-gray-200 italic leading-snug mt-1">
          {expression}
        </div>
      )}
    </div>
  );
}

function AdvAvatar({ explanation }: { explanation?: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-16 h-16 rounded-full bg-[#A8DADC] border-4 border-[#A8DADC]/50 flex items-center justify-center text-3xl shadow-lg">
        🧑‍⚖️
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#A8DADC]">Adv</span>
      {explanation && (
        <div className="max-w-md bg-[#0D1821] border border-[#A8DADC]/30 rounded-2xl rounded-tl-none px-5 py-4 text-sm text-gray-200 leading-relaxed mt-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#A8DADC] mb-2">Medico-Legal Note</p>
          {explanation}
        </div>
      )}
    </div>
  );
}

function ImagePlaceholder({ label, emoji, bg, visible }: { label: string; emoji: string; bg: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <div className={`${bg} border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 min-h-[160px] w-full`}>
      <span className="text-5xl">{emoji}</span>
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 text-center">{label}</p>
      <p className="text-[10px] text-gray-600 italic">[ Image Placeholder — replace with actual illustration ]</p>
    </div>
  );
}

// ─── Quiz Engine Component ────────────────────────────────────────────────────

type QuizPhase = 'start' | 'question' | 'revealed' | 'end';

export default function MedicoLegalityPage() {
  const router = useRouter();

  const [phase, setPhase]               = useState<QuizPhase>('start');
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [score, setScore]               = useState(0);
  const [answers, setAnswers]           = useState<{ scenarioId: number; correct: boolean }[]>([]);

  const currentScenario = SCENARIOS[scenarioIndex];
  const totalScenarios  = SCENARIOS.length;

  // ── Handlers ──

  const handleStart = () => {
    setPhase('question');
    setScenarioIndex(0);
    setSelectedOption(null);
    setScore(0);
    setAnswers([]);
  };

  const handleOptionSelect = (opt: Option) => {
    if (selectedOption) return; // already answered
    setSelectedOption(opt);
    if (opt.correct) setScore((s) => s + 1);
    setAnswers((a) => [...a, { scenarioId: currentScenario.id, correct: opt.correct }]);
    setPhase('revealed');
  };

  const handleNext = () => {
    if (scenarioIndex + 1 >= totalScenarios) {
      setPhase('end');
    } else {
      setScenarioIndex((i) => i + 1);
      setSelectedOption(null);
      setPhase('question');
    }
  };

  const handleRestart = () => {
    setPhase('start');
    setScenarioIndex(0);
    setSelectedOption(null);
    setScore(0);
    setAnswers([]);
  };

  const scoreResult = getScoreResult(score, totalScenarios);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="bg-[#121212] min-h-screen text-white font-sans flex flex-col">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-40 bg-[#121212]/90 backdrop-blur border-b border-white/5 px-6 md:px-10 h-16 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/patient/dashboard')}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FFCDB2] flex items-center justify-center text-sm">⚖️</div>
            <span className="font-bold text-base">MedCare</span>
          </div>
          <span className="text-xs bg-[#FFCDB2]/20 text-[#FFCDB2] px-2 py-0.5 rounded-full font-semibold">Medico-Legal</span>
        </div>
        {phase !== 'start' && phase !== 'end' && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">
              Scenario <span className="text-white font-bold">{scenarioIndex + 1}</span>/{totalScenarios}
            </span>
            <div className="flex gap-1">
              {SCENARIOS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i < scenarioIndex ? 'w-5 bg-[#A8DADC]' :
                    i === scenarioIndex ? 'w-8 bg-[#FFCDB2]' :
                    'w-5 bg-white/10'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-bold text-[#A8DADC]">{score} pts</span>
          </div>
        )}
        <button onClick={() => router.push('/')} className="text-xs text-gray-500 hover:text-white transition-colors">Sign Out</button>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 md:px-10 py-10 flex flex-col gap-8">

        {/* ══════════════════════════════ START SCREEN ══════════════════════ */}
        {phase === 'start' && (
          <div className="flex flex-col items-center text-center gap-8">
            {/* Hero */}
            <div className="flex flex-col items-center gap-4 mt-6">
              <div className="flex items-center justify-center gap-6">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-24 h-24 rounded-full bg-[#FFCDB2] border-4 border-[#FFCDB2]/30 flex items-center justify-center text-5xl shadow-2xl">😤</div>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#FFCDB2] mt-1">Dhamu</span>
                </div>
                <div className="text-4xl font-black text-gray-600">vs</div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-24 h-24 rounded-full bg-[#A8DADC] border-4 border-[#A8DADC]/30 flex items-center justify-center text-5xl shadow-2xl">🧑‍⚖️</div>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#A8DADC] mt-1">Adv</span>
                </div>
              </div>

              <div className="mt-2">
                <p className="text-xs text-[#FFCDB2] uppercase tracking-widest font-bold mb-2">A MedCare Medico-Legal Experience</p>
                <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-tight">
                  Dhamu vs<br />
                  <span className="text-[#A8DADC]">The Law</span>
                </h1>
                <p className="text-gray-400 text-lg mt-4 max-w-md mx-auto">
                  5 situations. 20 questionable decisions.<br />
                  Can Dhamu survive the healthcare system?
                </p>
              </div>
            </div>

            {/* What to expect */}
            <div className="bg-[#1A1D24] border border-white/5 rounded-3xl p-6 text-left w-full max-w-lg">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">How it works</p>
              <div className="flex flex-col gap-3">
                {[
                  ['😤', 'Dhamu faces a real medico-legal situation and reacts emotionally.'],
                  ['🤔', 'You choose from 4 options. Only one is legally sound.'],
                  ['🧑‍⚖️', 'Adv explains the actual medico-legal principle. No judgment. (Some judgment.)'],
                  ['🏆', 'Get scored. See if Dhamu would be allowed out unsupervised.'],
                ].map(([icon, text]) => (
                  <div key={text} className="flex items-start gap-3">
                    <span className="text-xl shrink-0 mt-0.5">{icon}</span>
                    <p className="text-sm text-gray-300 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-yellow-500/8 border border-yellow-500/20 rounded-2xl px-5 py-4 text-left w-full max-w-lg">
              <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-1">⚖️ Disclaimer</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                This is educational entertainment, not formal legal advice. Medico-legal situations vary by jurisdiction.
                Consult a qualified legal professional for specific advice. Dhamu&apos;s decisions should not be replicated in real life.
              </p>
            </div>

            <button
              onClick={handleStart}
              className="bg-[#FFCDB2] text-gray-900 font-black text-lg px-10 py-4 rounded-2xl hover:bg-[#ffdec4] hover:scale-105 transition-all duration-200 shadow-xl"
            >
              Begin Dhamu&apos;s Journey →
            </button>
          </div>
        )}

        {/* ══════════════════════════════ QUESTION / REVEALED ═══════════════ */}
        {(phase === 'question' || phase === 'revealed') && (
          <div className="flex flex-col gap-6">

            {/* Scenario Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-widest text-[#FFCDB2]">Scenario {scenarioIndex + 1}</span>
                <span className="text-gray-600">·</span>
                <span className="text-xs text-gray-500">{currentScenario.title}</span>
              </div>
              <div className="bg-[#1A1D24] border border-white/5 rounded-2xl px-5 py-4 text-sm text-gray-300 leading-relaxed">
                {currentScenario.situation}
              </div>
            </div>

            {/* Dhamu's initial reaction */}
            <div className="flex items-start gap-4">
              <DhamuAvatar
                expression={phase === 'revealed' && selectedOption ? selectedOption.dhamu_reaction : currentScenario.dhamu_reaction}
              />
            </div>

            {/* Question */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-4">
                {currentScenario.question}
              </p>

              <div className="grid grid-cols-1 gap-3">
                {currentScenario.options.map((opt) => {
                  const isSelected = selectedOption?.id === opt.id;
                  const isRevealed = phase === 'revealed';

                  let optionStyle = 'bg-[#1A1D24] border-white/8 text-gray-200 hover:bg-white/5 hover:border-white/20 cursor-pointer';
                  if (isRevealed && isSelected && opt.correct)  optionStyle = 'bg-green-900/40 border-green-500/50 text-green-200 cursor-default';
                  if (isRevealed && isSelected && !opt.correct) optionStyle = 'bg-red-900/40 border-red-500/50 text-red-200 cursor-default';
                  if (isRevealed && !isSelected && opt.correct) optionStyle = 'bg-green-900/20 border-green-500/30 text-green-300 cursor-default';
                  if (isRevealed && !isSelected && !opt.correct) optionStyle = 'bg-[#1A1D24] border-white/5 text-gray-600 opacity-50 cursor-default';

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleOptionSelect(opt)}
                      disabled={isRevealed}
                      className={`border rounded-2xl px-5 py-4 text-left flex items-start gap-4 transition-all duration-200 ${optionStyle}`}
                    >
                      <span className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black transition-colors ${
                        isRevealed && isSelected && opt.correct  ? 'bg-green-500 text-white' :
                        isRevealed && isSelected && !opt.correct ? 'bg-red-500 text-white' :
                        isRevealed && !isSelected && opt.correct ? 'bg-green-900 text-green-300' :
                        'bg-white/5 text-gray-400'
                      }`}>
                        {isRevealed && isSelected && opt.correct  ? '✓' :
                         isRevealed && isSelected && !opt.correct ? '✗' :
                         isRevealed && !isSelected && opt.correct ? '✓' :
                         opt.id}
                      </span>
                      <span className="text-sm leading-relaxed pt-0.5">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Post-answer reveal ── */}
            {phase === 'revealed' && selectedOption && (
              <div className="flex flex-col gap-5 animate-pulse-none">

                {/* Image placeholder */}
                <ImagePlaceholder
                  label={selectedOption.image_label}
                  emoji={selectedOption.image_emoji}
                  bg={selectedOption.image_bg}
                  visible={true}
                />

                {/* Result badge */}
                <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl font-bold text-sm ${
                  selectedOption.correct
                    ? 'bg-green-500/15 border border-green-500/30 text-green-300'
                    : 'bg-red-500/15 border border-red-500/30 text-red-300'
                }`}>
                  <span className="text-2xl">{selectedOption.correct ? '✅' : '❌'}</span>
                  <span>{selectedOption.correct ? 'Correct! Dhamu has chosen wisely.' : 'Incorrect. Dhamu has chosen characteristically.'}</span>
                </div>

                {/* Adv explanation */}
                <div className="flex items-start gap-4">
                  <AdvAvatar explanation={selectedOption.adv_explanation} />
                </div>

                {/* Next button */}
                <button
                  onClick={handleNext}
                  className="w-full bg-[#A8DADC] text-gray-900 font-black text-base py-4 rounded-2xl hover:bg-[#b8e4e6] hover:scale-[1.01] transition-all duration-200 shadow-lg"
                >
                  {scenarioIndex + 1 >= totalScenarios ? 'See Dhamu\'s Final Score →' : `Next Scenario (${scenarioIndex + 2}/${totalScenarios}) →`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════ END SCREEN ════════════════════════ */}
        {phase === 'end' && (
          <div className="flex flex-col items-center gap-8">

            {/* Score display */}
            <div className="flex flex-col items-center gap-3 mt-4">
              <div className="flex items-center justify-center gap-4">
                <DhamuAvatar />
                <div className="flex flex-col items-center gap-1">
                  <div className="text-7xl font-black">{score}</div>
                  <div className="text-gray-500 text-sm font-semibold">out of {totalScenarios}</div>
                </div>
                <AdvAvatar />
              </div>
            </div>

            {/* Result card */}
            <div className={`${scoreResult.color} rounded-3xl p-8 text-gray-900 text-center w-full max-w-lg`}>
              <span className="text-5xl">{scoreResult.emoji}</span>
              <h2 className="text-2xl font-black mt-3 tracking-tight leading-tight">{scoreResult.title}</h2>
              <p className="text-gray-900/70 text-sm mt-2 leading-relaxed">{scoreResult.subtitle}</p>
            </div>

            {/* Per-scenario breakdown */}
            <div className="bg-[#1A1D24] border border-white/5 rounded-3xl p-6 w-full">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Dhamu&apos;s Report Card</p>
              <div className="flex flex-col gap-3">
                {SCENARIOS.map((s, i) => {
                  const answer = answers[i];
                  return (
                    <div key={s.id} className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                        answer?.correct ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {answer?.correct ? '✓' : '✗'}
                      </span>
                      <span className="text-sm text-gray-300 leading-snug">{s.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-yellow-500/8 border border-yellow-500/20 rounded-2xl px-5 py-4 text-left w-full max-w-lg">
              <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-1">⚖️ Reminder</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                This quiz is educational entertainment. It is not legal advice. For real medico-legal concerns, consult a qualified advocate or legal professional.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
              <button
                onClick={handleRestart}
                className="flex-1 bg-[#FFCDB2] text-gray-900 font-black py-4 rounded-2xl hover:bg-[#ffdec4] transition-colors text-base"
              >
                Try Again with Dhamu
              </button>
              <button
                onClick={() => router.push('/patient/dashboard')}
                className="flex-1 bg-[#1A1D24] border border-white/10 text-gray-300 font-bold py-4 rounded-2xl hover:bg-white/5 transition-colors text-base"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
