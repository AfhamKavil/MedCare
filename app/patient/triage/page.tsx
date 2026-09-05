'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClinicalStore, type TriageResult } from '@/lib/store';
import type { ChatApiResponse, ChatMessage, CollectedInformation } from '@/app/api/triage/chat/route';

// ─── Urgency display config ───────────────────────────────────────────────────

const URGENCY_CONFIG = {
  URGENT: {
    label: 'URGENT',
    icon: '🚨',
    card: 'bg-red-900/30 border-red-500/40',
    badge: 'bg-red-500 text-white',
    text: 'text-red-300',
    glow: 'shadow-red-900/50',
    heading: 'Seek immediate medical attention.',
  },
  ESCALATE: {
    label: 'URGENT — ESCALATE',
    icon: '🚨',
    card: 'bg-red-900/40 border-red-500/60',
    badge: 'bg-red-600 text-white',
    text: 'text-red-200',
    glow: 'shadow-red-900/60',
    heading: 'Seek immediate emergency care.',
  },
  PRIORITY: {
    label: 'PRIORITY',
    icon: '⚠️',
    card: 'bg-yellow-900/30 border-yellow-500/40',
    badge: 'bg-yellow-500 text-gray-900',
    text: 'text-yellow-300',
    glow: 'shadow-yellow-900/40',
    heading: 'Contact your GP or call 111 today.',
  },
  'NON-URGENT': {
    label: 'NON-URGENT',
    icon: '✅',
    card: 'bg-green-900/20 border-green-500/30',
    badge: 'bg-green-600 text-white',
    text: 'text-green-300',
    glow: 'shadow-green-900/30',
    heading: 'Your symptoms appear non-urgent.',
  },
} as const;

// Humanise reason codes from backend (never shown raw to patient — only cleaned labels)
function humaniseCode(code: string): string {
  const part = code.split(':').pop() ?? code;
  return part.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 px-4">
      <div className="w-8 h-8 rounded-full bg-[#A8DADC]/20 flex items-center justify-center text-base shrink-0">
        🩺
      </div>
      <div className="bg-[#1A1D24] border border-white/8 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function AssistantBubble({ content }: { content: string }) {
  return (
    <div className="flex items-end gap-3 px-4">
      <div className="w-8 h-8 rounded-full bg-[#A8DADC]/20 flex items-center justify-center text-base shrink-0">
        🩺
      </div>
      <div className="max-w-[78%] bg-[#1A1D24] border border-white/8 rounded-2xl rounded-bl-sm px-4 py-3">
        <p className="text-sm text-gray-200 leading-relaxed">{content}</p>
      </div>
    </div>
  );
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex items-end justify-end gap-3 px-4">
      <div className="max-w-[78%] bg-[#FAD2E1]/15 border border-[#FAD2E1]/20 rounded-2xl rounded-br-sm px-4 py-3">
        <p className="text-sm text-gray-100 leading-relaxed">{content}</p>
      </div>
      <div className="w-8 h-8 rounded-full bg-[#FAD2E1]/20 flex items-center justify-center text-base shrink-0">
        👤
      </div>
    </div>
  );
}

function ResultCard({
  result,
  onReset,
  onDashboard,
}: {
  result: NonNullable<ChatApiResponse['triage_result']>;
  onReset: () => void;
  onDashboard: () => void;
}) {
  const conf = URGENCY_CONFIG[result.urgency as keyof typeof URGENCY_CONFIG] ?? URGENCY_CONFIG['PRIORITY'];
  const displayCodes = result.reason_codes.filter(
    (c) =>
      !c.startsWith('COUNCIL:') &&
      !c.startsWith('CHANAKYA:') &&
      c !== 'IMMEDIATE_999'
  );

  return (
    <div className="mx-4 flex flex-col gap-4">
      {/* Main result card */}
      <div className={`border rounded-3xl p-6 flex flex-col gap-5 shadow-xl ${conf.card} ${conf.glow}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
              Triage Assessment
            </p>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{conf.icon}</span>
              <span className={`text-2xl font-black tracking-tight ${conf.text}`}>
                {conf.label}
              </span>
            </div>
            <p className={`text-base font-semibold mt-2 ${conf.text}`}>{conf.heading}</p>
          </div>
        </div>

        {/* Recommended action */}
        <div className="bg-black/20 rounded-2xl px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">
            What to do
          </p>
          <p className="text-sm text-gray-200 leading-relaxed">{result.recommended_action}</p>
        </div>

        {/* Why this result — only structured codes, never agent internals */}
        {displayCodes.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
              Why this result?
            </p>
            <ul className="flex flex-col gap-1.5">
              {displayCodes.map((code) => (
                <li key={code} className="flex items-center gap-2 text-sm text-gray-300">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 bg-current ${conf.text}`} />
                  {humaniseCode(code)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Disclaimer — always visible */}
      <div className="bg-yellow-500/8 border border-yellow-500/20 rounded-2xl px-5 py-3 flex items-start gap-3">
        <span className="text-yellow-400 text-lg shrink-0">⚠️</span>
        <p className="text-xs text-gray-400 leading-relaxed">
          <span className="font-semibold text-yellow-300">
            This is a screening tool, not a clinical diagnosis.
          </span>{' '}
          If you are experiencing a medical emergency, call{' '}
          <span className="font-bold text-white">999</span> immediately.
        </p>
      </div>

      {/* Care team notification */}
      <div className="bg-[#1A1D24] border border-white/5 rounded-2xl px-5 py-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#E5D9F2]/10 flex items-center justify-center text-xl shrink-0">
          🔔
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Your care team has been notified</p>
          <p className="text-xs text-gray-400 mt-0.5">
            A nurse will review your triage result and follow up with you.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pb-6">
        <button
          onClick={onReset}
          className="flex-1 bg-white/8 border border-white/10 text-gray-300 font-bold py-3.5 rounded-2xl hover:bg-white/12 transition-colors text-sm"
        >
          New Assessment
        </button>
        <button
          onClick={onDashboard}
          className="flex-1 bg-[#FAD2E1] text-gray-900 font-bold py-3.5 rounded-2xl hover:bg-[#f8c4d6] transition-colors text-sm"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const INITIAL_MESSAGE: ChatMessage = {
  role: 'assistant',
  content:
    "Hi, I'm here to help understand what you're experiencing. What is bothering you today?",
};

function emptyCollectedInfo(): CollectedInformation {
  return {
    primary_symptom: null,
    duration: null,
    severity: null,
    onset: null,
    associated_symptoms: [],
    temperature: null,
    chest_pain: null,
    breathing_difficulty: null,
    consciousness_normal: null,
    additional_context: null,
  };
}

export default function PatientTriagePage() {
  const router = useRouter();
  const recordTriageResult = useClinicalStore((s) => s.recordTriageResult);

  // ── Chat state ──
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [collectedInfo, setCollectedInfo] = useState<CollectedInformation>(emptyCollectedInfo());
  const [triageResult, setTriageResult] = useState<ChatApiResponse['triage_result'] | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // ── Scroll ref ──
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, triageResult]);

  // ── Send message ──────────────────────────────────────────────────────────

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || isLoading || triageResult) return;

    setErrorMsg('');
    const userMessage: ChatMessage = { role: 'user', content: text };
    const updatedMessages: ChatMessage[] = [...messages, userMessage];

    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);

    const newTurnCount = turnCount + 1;
    setTurnCount(newTurnCount);

    try {
      const res = await fetch('/api/triage/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          collected_information: collectedInfo,
          turn_count: newTurnCount,
        }),
      });

      if (res.status === 429) {
        setErrorMsg('Too many requests — please wait a moment before trying again.');
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(
          (data as { error?: string }).error ??
            'The triage service is temporarily unavailable. Please try again.'
        );
        setIsLoading(false);
        return;
      }

      const data: ChatApiResponse = await res.json();

      // Update collected info from agent
      if (data.collected_information) {
        setCollectedInfo(data.collected_information);
      }

      // Add assistant message
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // If result is ready, write to Zustand and show result card
      if (data.phase === 'result' && data.triage_result) {
        const now = new Date().toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
        });

        const storeResult: TriageResult = {
          urgency: data.triage_result.urgency as TriageResult['urgency'],
          reason_codes: data.triage_result.reason_codes,
          recommended_action: data.triage_result.recommended_action,
          diagnosis: null,
          triggered_by: data.triage_result.triggered_by,
          timestamp: now,
          source: 'triage',
        };

        // ── Write to shared Zustand store — Nurse Dashboard reads this ──
        recordTriageResult('p1', storeResult);
        setTriageResult(data.triage_result);
      }
    } catch {
      setErrorMsg('Network error — please check your connection and try again.');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleReset = () => {
    setMessages([INITIAL_MESSAGE]);
    setInputText('');
    setIsLoading(false);
    setTurnCount(0);
    setCollectedInfo(emptyCollectedInfo());
    setTriageResult(null);
    setErrorMsg('');
    inputRef.current?.focus();
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="bg-[#121212] h-screen text-white font-sans flex flex-col overflow-hidden">

      {/* ── Navbar ── */}
      <header className="shrink-0 bg-[#121212]/90 backdrop-blur border-b border-white/5 px-6 md:px-10 h-14 flex items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/patient/dashboard')}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            aria-label="Back"
          >
            <svg
              className="w-4 h-4 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FAD2E1] flex items-center justify-center text-sm">
              🩺
            </div>
            <span className="font-bold text-base">MedCare</span>
          </div>
          <span className="text-xs bg-[#FAD2E1]/20 text-[#FAD2E1] px-2 py-0.5 rounded-full font-semibold">
            Triage
          </span>
        </div>
        <div className="flex items-center gap-3">
          {turnCount > 0 && !triageResult && (
            <span className="text-xs text-gray-500">
              Turn {turnCount}/{7}
            </span>
          )}
          <button
            onClick={() => router.push('/')}
            className="text-xs text-gray-500 hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* ── Disclaimer banner ── */}
      <div className="shrink-0 bg-yellow-500/8 border-b border-yellow-500/15 px-6 py-2 flex items-center gap-2">
        <span className="text-yellow-400 text-sm">⚠️</span>
        <p className="text-xs text-gray-500">
          <span className="text-yellow-300 font-semibold">Screening tool only — not a clinical diagnosis.</span>
          {' '}For emergencies, call <span className="font-bold text-white">999</span> immediately.
        </p>
      </div>

      {/* ── Scrollable messages area ── */}
      <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-4 max-w-2xl w-full mx-auto">

        {messages.map((msg, idx) =>
          msg.role === 'assistant' ? (
            <AssistantBubble key={idx} content={msg.content} />
          ) : (
            <UserBubble key={idx} content={msg.content} />
          )
        )}

        {/* Typing indicator */}
        {isLoading && <TypingIndicator />}

        {/* Error message */}
        {errorMsg && !isLoading && (
          <div className="mx-4 bg-red-900/20 border border-red-500/30 rounded-2xl px-4 py-3 flex items-start gap-3">
            <span className="text-red-400 text-lg shrink-0">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-red-300">Something went wrong</p>
              <p className="text-xs text-red-400/80 mt-0.5">{errorMsg}</p>
              <button
                onClick={() => setErrorMsg('')}
                className="text-xs text-red-400 hover:text-red-200 mt-1.5 underline"
              >
                Dismiss and try again
              </button>
            </div>
          </div>
        )}

        {/* Result card inline in conversation */}
        {triageResult && (
          <div className="mt-2">
            <ResultCard
              result={triageResult}
              onReset={handleReset}
              onDashboard={() => router.push('/patient/dashboard')}
            />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input area — hidden when result is shown ── */}
      {!triageResult && (
        <div className="shrink-0 border-t border-white/5 bg-[#121212] px-4 py-4 max-w-2xl w-full mx-auto">
          <div className="flex items-end gap-3">
            <textarea
              ref={inputRef}
              rows={1}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                // Auto-grow (max 5 rows)
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Type your reply…"
              className="flex-1 bg-[#1A1D24] border border-white/10 rounded-2xl text-white text-sm px-4 py-3 placeholder:text-gray-600 focus:outline-none focus:border-[#FAD2E1]/50 focus:ring-1 focus:ring-[#FAD2E1]/20 resize-none leading-relaxed transition-all disabled:opacity-50 overflow-hidden"
              style={{ minHeight: '48px' }}
              autoFocus
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputText.trim()}
              className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-150 ${
                inputText.trim() && !isLoading
                  ? 'bg-[#FAD2E1] text-gray-900 hover:bg-[#f8c4d6] hover:scale-105 shadow-md'
                  : 'bg-white/5 text-gray-600 cursor-not-allowed'
              }`}
              aria-label="Send"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            </button>
          </div>
          <p className="text-[10px] text-gray-700 text-center mt-2">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      )}
    </div>
  );
}
