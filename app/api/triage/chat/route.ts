import { NextRequest, NextResponse } from 'next/server';
import { evaluateHardRules, type UrgencyLevel } from '@/lib/triage-rules';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
}

/** Structured information gathered from the patient conversation. */
export interface CollectedInformation {
  primary_symptom: string | null;
  duration: string | null;
  severity: string | null;
  onset: 'sudden' | 'gradual' | null;
  associated_symptoms: string[];
  temperature: string | null;
  chest_pain: boolean | null;
  breathing_difficulty: boolean | null;
  consciousness_normal: boolean | null;
  additional_context: string | null;
}

/** What the Conversation Agent returns each turn. */
interface ConversationAgentResponse {
  type: 'question' | 'ready';
  message: string;
  collected_information: CollectedInformation;
  missing_information: string[];
  ready_for_triage: boolean;
  red_flags_detected: string[];
}

/** Dhanvantari + Vishwamitra combined (one parallel call). */
interface ClinicalUrgencyResponse {
  clinical_features: string[];
  red_flags: string[];
  urgency_estimate: UrgencyLevel;
  reasoning: string;
}

/** Chanakya — safety veto (one parallel call). */
interface SafetyResponse {
  veto: boolean;
  safety_concern: string | null;
}

/** Final shape returned to the browser. */
export interface ChatApiResponse {
  /** 'turn' = still gathering info | 'result' = triage decision made */
  phase: 'turn' | 'result';
  /** Next assistant message (for phase=turn) OR result summary message */
  message: string;
  collected_information: CollectedInformation;
  missing_information: string[];
  ready_for_triage: boolean;
  /** Populated only when phase=result */
  triage_result?: {
    urgency: UrgencyLevel;
    reason_codes: string[];
    recommended_action: string;
    diagnosis: null;
    triggered_by: 'HARD_RULE' | 'AI_COUNCIL';
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider config — primary: ModelScope, fallback: Groq
// ─────────────────────────────────────────────────────────────────────────────

const MAX_TURNS = 7;
const MAX_INPUT_LENGTH = 1000;

/** A configured inference provider (OpenAI-compatible). */
interface Provider {
  name: string;
  apiKey: string;
  baseURL: string;
  model: string;
}

function isKeyUsable(k: string | undefined): k is string {
  return !!(k && !k.startsWith('REPLACE_') && !k.startsWith('your_'));
}

/** Returns the list of providers to try, in priority order. */
function getProviders(): Provider[] {
  const providers: Provider[] = [];

  // Primary — ModelScope
  const msKey  = process.env.MODEL_API_KEY;
  const msBase = process.env.MODEL_API_BASE ?? 'https://api-inference.modelscope.ai/v1';
  const msModel= process.env.MODEL_NAME    ?? 'Qwen-Ambassador/Qwen3.8-27B';
  if (isKeyUsable(msKey)) {
    providers.push({ name: 'ModelScope', apiKey: msKey, baseURL: msBase, model: msModel });
  }

  // Fallback — Groq
  const groqKey  = process.env.GROQ_API_KEY;
  const groqBase = process.env.GROQ_API_BASE  ?? 'https://api.groq.com/openai/v1';
  const groqModel= process.env.GROQ_MODEL     ?? 'qwen/qwen3.8-27b';
  if (isKeyUsable(groqKey)) {
    providers.push({ name: 'Groq', apiKey: groqKey, baseURL: groqBase, model: groqModel });
  }

  return providers;
}

// ─────────────────────────────────────────────────────────────────────────────
// OpenAI-compatible single-provider caller
// ─────────────────────────────────────────────────────────────────────────────

type OAIMessage = { role: 'system' | 'user' | 'assistant'; content: string };

/** Call one specific provider. Throws a typed error on any failure. */
async function callProvider(
  provider: Provider,
  messages: OAIMessage[],
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const endpoint = `${provider.baseURL}/chat/completions`;

  // Dev diagnostic — never prints the key
  console.log('[TRIAGE] provider request', JSON.stringify({
    provider: provider.name,
    model: provider.model,
    endpoint,
    messages: messages.length,
  }));

  const body = {
    model: provider.model,
    messages,
    temperature: options.temperature ?? 0,
    max_tokens: options.maxTokens ?? 256,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (fetchErr) {
    clearTimeout(timeout);
    const isAbort = fetchErr instanceof Error && fetchErr.name === 'AbortError';
    console.error('[TRIAGE] provider network error', { provider: provider.name, isAbort, msg: (fetchErr as Error).message });
    throw new Error(isAbort
      ? `${provider.name}: request timed out after 25s`
      : `${provider.name}: network error — ${(fetchErr as Error).message}`);
  }
  clearTimeout(timeout);

  if (!res.ok) {
    const errText = await res.text().catch(() => '(unreadable)');
    console.error('[TRIAGE] provider HTTP error', { provider: provider.name, status: res.status, body: errText.slice(0, 400) });
    throw new Error(`${provider.name}: HTTP ${res.status} — ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const text: string | undefined = data?.choices?.[0]?.message?.content;
  if (!text) {
    console.error('[TRIAGE] provider empty response', { provider: provider.name, keys: Object.keys(data ?? {}) });
    throw new Error(`${provider.name}: empty content in response`);
  }

  console.log('[TRIAGE] provider success', { provider: provider.name, chars: text.length });
  return text;
}

/**
 * Try each configured provider in order (ModelScope → Groq).
 * On any failure, logs the error and tries the next provider.
 * Throws only if ALL providers fail.
 */
async function callModel(
  systemPrompt: string,
  conversationMessages: OAIMessage[],
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const providers = getProviders();

  if (providers.length === 0) {
    throw new Error('No AI providers are configured. Add MODEL_API_KEY or GROQ_API_KEY to .env.local.');
  }

  const messages: OAIMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversationMessages,
  ];

  if (messages.length > 0) {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === 'user') {
      lastMsg.content += '\n\nIMPORTANT: Return ONLY a valid JSON object matching the requested schema. No prose.';
    }
  }

  const errors: string[] = [];

  for (const provider of providers) {
    try {
      return await callProvider(provider, messages, options);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`[${provider.name}] ${msg}`);
      console.warn(`[TRIAGE] provider failed, trying next. Error: ${msg}`);
    }
  }

  // All providers exhausted
  throw new Error(`All AI providers failed:\n${errors.join('\n')}`);
}




/**
 * Robustly extract and parse JSON from model output.
 * Handles:
 *   - Clean JSON strings
 *   - Markdown code fences (```json ... ```)
 *   - Qwen3 <think>...</think> reasoning blocks before JSON
 *   - Prose wrapping: "Here is the JSON: {...}"
 * Throws if no valid JSON object/array is found.
 */
function safeParseJSON<T>(raw: string): T {
  // 1. Strip <think>...</think> blocks (Qwen3 chain-of-thought)
  let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // 2. Strip markdown code fences
  cleaned = cleaned
    .replace(/^```json\s*/m, '')
    .replace(/^```\s*/m, '')
    .replace(/```\s*$/m, '')
    .trim();

  // 3. Try direct parse first (happy path)
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // fall through to extraction
  }

  // 4. Extract first {...} block from anywhere in the string
  const objMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      return JSON.parse(objMatch[0]) as T;
    } catch {
      // fall through
    }
  }

  // 5. Extract first [...] block
  const arrMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrMatch) {
    try {
      return JSON.parse(arrMatch[0]) as T;
    } catch {
      // fall through
    }
  }

  console.error('[TRIAGE] safeParseJSON failed. Raw (first 300):', cleaned.slice(0, 300));
  throw new SyntaxError(`Could not extract valid JSON from model response. First 100 chars: ${cleaned.slice(0, 100)}`);
}

/** Convert our ChatMessage[] into OpenAI assistant/user message format. */
function toOAIMessages(messages: ChatMessage[]): OAIMessage[] {
  return messages.map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// System Prompts
// ─────────────────────────────────────────────────────────────────────────────

const CONVERSATION_SYSTEM_PROMPT = `You are a medical triage intake assistant for MedCare, a clinical platform.

YOUR ONLY PURPOSE: Ask the minimum number of clinically relevant questions to gather enough information to safely assess symptom urgency.

STRICT RULES:
1. Return ONLY valid JSON — no markdown, no prose outside the JSON object.
2. NEVER diagnose. NEVER suggest a diagnosis or disease name.
3. NEVER invent information the patient has not provided. Unconfirmed fields must stay null.
4. Ask ONE question per response. Never bundle multiple questions.
5. Be empathetic, calm, and brief.
6. Proceed to triage (ready_for_triage: true) when you have: primary symptom + at least 2 clarifying details.
7. ALWAYS proceed after a maximum of 6 patient turns, even with incomplete information.
8. If the patient mentions clear red flags (chest pain + breathing difficulty, loss of consciousness, face drooping, throat swelling, suicidal thoughts) — set ready_for_triage: true immediately.

RETURN THIS EXACT JSON SCHEMA (no extra fields):
{
  "type": "question",
  "message": "Your brief, empathetic message and single question",
  "collected_information": {
    "primary_symptom": null,
    "duration": null,
    "severity": null,
    "onset": null,
    "associated_symptoms": [],
    "temperature": null,
    "chest_pain": null,
    "breathing_difficulty": null,
    "consciousness_normal": null,
    "additional_context": null
  },
  "missing_information": [],
  "ready_for_triage": false,
  "red_flags_detected": []
}

When ready, change type to "ready" and set ready_for_triage to true.
The collected_information object must accurately reflect ONLY what the patient has confirmed.`;

const CLINICAL_URGENCY_SYSTEM_PROMPT = `You are a clinical pattern and urgency assessment agent.

Given structured patient information from a medical intake conversation, do TWO things:

1. DHANVANTARI role: Identify clinically present features and red flags from the data.
2. VISHWAMITRA role: Estimate urgency as URGENT, PRIORITY, or NON-URGENT.

DO NOT diagnose. Extract only what is clinically documented. Be conservative — when in doubt, increase urgency.

Return ONLY this JSON:
{
  "clinical_features": ["feature1", "feature2"],
  "red_flags": ["flag1"],
  "urgency_estimate": "URGENT",
  "reasoning": "Brief clinical rationale for the urgency estimate"
}`;

const SAFETY_SYSTEM_PROMPT = `You are Chanakya, a clinical safety compliance agent. You have VETO power.

Your job is to identify cases where AI triage is insufficient and a clinician must intervene.

Consider escalation if:
- Patient is an infant or young child
- Patient is pregnant
- Patient is immunocompromised (chemotherapy, transplant, HIV)
- Symptoms are vague but patient seems distressed
- Critical information is missing that could mask a serious condition
- Elderly patient with atypical symptom presentation

Return ONLY this JSON:
{
  "veto": false,
  "safety_concern": null
}

Set veto: true and explain the safety_concern if escalation is needed.`;

// ─────────────────────────────────────────────────────────────────────────────
// AI Council — runs in parallel when ready for final decision
// ─────────────────────────────────────────────────────────────────────────────

async function runAICouncil(
  collectedInfo: CollectedInformation,
  conversationSummary: string
): Promise<{
  urgency: UrgencyLevel;
  reason_codes: string[];
  recommended_action: string;
}> {
  const patientContext = `
Patient Information from Triage Conversation:
Primary Symptom: ${collectedInfo.primary_symptom ?? 'Not specified'}
Duration: ${collectedInfo.duration ?? 'Unknown'}
Severity: ${collectedInfo.severity ?? 'Unknown'}
Onset: ${collectedInfo.onset ?? 'Unknown'}
Associated Symptoms: ${collectedInfo.associated_symptoms?.join(', ') || 'None reported'}
Temperature: ${collectedInfo.temperature ?? 'Not measured'}
Chest Pain Reported: ${collectedInfo.chest_pain === null ? 'Not asked' : collectedInfo.chest_pain ? 'Yes' : 'No'}
Breathing Difficulty: ${collectedInfo.breathing_difficulty === null ? 'Not asked' : collectedInfo.breathing_difficulty ? 'Yes' : 'No'}
Consciousness Normal: ${collectedInfo.consciousness_normal === null ? 'Not asked' : collectedInfo.consciousness_normal ? 'Yes' : 'Altered'}
Additional Context: ${collectedInfo.additional_context ?? 'None'}

Conversation Summary: ${conversationSummary}
`.trim();

  // Run clinical assessment and safety check in parallel (two model calls)
  const [clinicalRaw, safetyRaw] = await Promise.all([
    callModel(
      CLINICAL_URGENCY_SYSTEM_PROMPT,
      [{ role: 'user', content: patientContext }]
    ),
    callModel(
      SAFETY_SYSTEM_PROMPT,
      [{ role: 'user', content: patientContext }]
    ),
  ]);

  let clinical: ClinicalUrgencyResponse;
  let safety: SafetyResponse;

  try {
    clinical = safeParseJSON<ClinicalUrgencyResponse>(clinicalRaw);
  } catch {
    // Fallback if clinical agent returns malformed JSON
    clinical = {
      clinical_features: [collectedInfo.primary_symptom ?? 'Symptom reported'],
      red_flags: [],
      urgency_estimate: 'PRIORITY',
      reasoning: 'Unable to parse clinical assessment — applying conservative estimate.',
    };
  }

  try {
    safety = safeParseJSON<SafetyResponse>(safetyRaw);
  } catch {
    safety = { veto: false, safety_concern: null };
  }

  // ── Decision Engine ────────────────────────────────────────────────────────
  // Priority 1: Chanakya veto
  if (safety.veto) {
    return {
      urgency: 'URGENT',
      reason_codes: ['CHANAKYA:SAFETY_VETO', ...(safety.safety_concern ? [safety.safety_concern.slice(0, 40).replace(/\s/g, '_').toUpperCase()] : [])],
      recommended_action: `This assessment requires clinician review. ${safety.safety_concern ?? 'Please seek in-person assessment.'}`,
    };
  }

  // Priority 2: Vishwamitra urgency
  const urgency = clinical.urgency_estimate ?? 'PRIORITY';

  // Priority 3: Dhanvantari evidence → reason codes
  const reason_codes: string[] = [
    ...clinical.red_flags.map((f) => `RED_FLAG:${f.replace(/\s/g, '_').toUpperCase().slice(0, 30)}`),
    ...clinical.clinical_features.slice(0, 2).map((f) => `FEATURE:${f.replace(/\s/g, '_').toUpperCase().slice(0, 30)}`),
    `COUNCIL:${urgency}`,
  ].filter(Boolean);

  // Priority 4: Bhishma — recommended action (deterministic, no model call needed)
  let recommended_action = '';
  if (urgency === 'URGENT' || urgency === 'ESCALATE') {
    recommended_action = 'Please attend your nearest Emergency Department or call 999. Do not wait.';
  } else if (urgency === 'PRIORITY') {
    recommended_action = 'Please contact your GP or call 111 for a same-day assessment. Monitor your symptoms closely.';
  } else {
    recommended_action = 'Your symptoms do not appear immediately urgent. Please book an appointment with your GP within the next few days.';
  }

  return { urgency, reason_codes, recommended_action };
}

// ─────────────────────────────────────────────────────────────────────────────
// Rate limiter
// ─────────────────────────────────────────────────────────────────────────────

const ipCallMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipCallMap.get(ip);
  if (!entry || now > entry.resetAt) {
    ipCallMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Route Handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
  }

  // ── Parse body ──────────────────────────────────────────────────────────────
  let body: {
    messages: ChatMessage[];
    collected_information?: CollectedInformation;
    turn_count: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { messages, collected_information, turn_count } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'messages array is required.' }, { status: 400 });
  }

  // Truncate individual messages
  const sanitisedMessages: ChatMessage[] = messages.map((m) => ({
    role: m.role,
    content: String(m.content ?? '').slice(0, MAX_INPUT_LENGTH),
  }));

  // Combined user text for hard rule evaluation
  const allUserText = sanitisedMessages
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .join(' ');

  // ── Hard Safety Rules — always first ───────────────────────────────────────
  const hardRuleMatch = evaluateHardRules(allUserText);
  if (hardRuleMatch) {
    console.log(`[TRIAGE/CHAT] Hard rule hit: ${hardRuleMatch.id}`);
    const response: ChatApiResponse = {
      phase: 'result',
      message: hardRuleMatch.recommended_action,
      collected_information: collected_information ?? emptyCollectedInfo(),
      missing_information: [],
      ready_for_triage: true,
      triage_result: {
        urgency: hardRuleMatch.urgency,
        reason_codes: hardRuleMatch.reason_codes,
        recommended_action: hardRuleMatch.recommended_action,
        diagnosis: null,
        triggered_by: 'HARD_RULE',
      },
    };
    return NextResponse.json(response, { status: 200 });
  }

  // ── Turn limit — force assessment with whatever we have ────────────────────
  const forceAssessment = turn_count >= MAX_TURNS;

  // ── Conversation Agent ─────────────────────────────────────────────────────
  let agentResponse: ConversationAgentResponse;
  try {
    const oaiMessages = toOAIMessages(sanitisedMessages);
    const raw = await callModel(CONVERSATION_SYSTEM_PROMPT, oaiMessages);
    agentResponse = safeParseJSON<ConversationAgentResponse>(raw);

    // Validate required fields — fallback if model returns unexpected shape
    if (typeof agentResponse.ready_for_triage !== 'boolean') {
      agentResponse.ready_for_triage = forceAssessment;
    }
    if (!agentResponse.collected_information) {
      agentResponse.collected_information = collected_information ?? emptyCollectedInfo();
    }
    if (!Array.isArray(agentResponse.missing_information)) {
      agentResponse.missing_information = [];
    }
    if (!agentResponse.message) {
      agentResponse.message = 'Thank you for the information. Let me assess your symptoms.';
      agentResponse.ready_for_triage = true;
    }

  } catch (err) {
    console.error('[TRIAGE/CHAT] Model API error:', err);

    const errMsg = err instanceof Error ? err.message : String(err);
    if (errMsg.includes('MODEL_API_KEY')) {
      return NextResponse.json(
        {
          error: 'The AI triage service is not configured. Please add MODEL_API_KEY to .env.local.',
          phase: 'error',
        },
        { status: 503 }
      );
    }

    // Generic fallback — safe degradation
    return NextResponse.json(
      {
        error: 'The triage service is temporarily unavailable. Please try again or contact the hospital directly.',
        phase: 'error',
      },
      { status: 503 }
    );
  }

  // Force-ready if turn limit reached
  if (forceAssessment) {
    agentResponse.ready_for_triage = true;
    agentResponse.type = 'ready';
    if (!agentResponse.message) {
      agentResponse.message =
        'Thank you — I have gathered enough information to assess your situation.';
    }
  }

  // ── Not ready yet — return next question ───────────────────────────────────
  if (!agentResponse.ready_for_triage) {
    const response: ChatApiResponse = {
      phase: 'turn',
      message: agentResponse.message,
      collected_information: agentResponse.collected_information,
      missing_information: agentResponse.missing_information,
      ready_for_triage: false,
    };
    return NextResponse.json(response, { status: 200 });
  }

  // ── Ready — run AI Council ─────────────────────────────────────────────────
  let council: { urgency: UrgencyLevel; reason_codes: string[]; recommended_action: string };
  try {
    const conversationSummary = sanitisedMessages
      .map((m) => `${m.role === 'user' ? 'Patient' : 'Assistant'}: ${m.content}`)
      .join('\n');
    council = await runAICouncil(agentResponse.collected_information, conversationSummary);
  } catch (err) {
    console.error('[TRIAGE/CHAT] AI Council error:', err);
    // Safe fallback — conservative PRIORITY
    council = {
      urgency: 'PRIORITY',
      reason_codes: ['COUNCIL:FALLBACK'],
      recommended_action:
        'We were unable to complete the full assessment. Please contact your GP or call 111 for a same-day assessment.',
    };
  }

  console.log(`[TRIAGE/CHAT] Council result: ${council.urgency}`);

  const response: ChatApiResponse = {
    phase: 'result',
    message: agentResponse.message,
    collected_information: agentResponse.collected_information,
    missing_information: [],
    ready_for_triage: true,
    triage_result: {
      urgency: council.urgency,
      reason_codes: council.reason_codes,
      recommended_action: council.recommended_action,
      diagnosis: null,
      triggered_by: 'AI_COUNCIL',
    },
  };

  return NextResponse.json(response, { status: 200 });
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

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
