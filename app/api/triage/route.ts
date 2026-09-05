import { NextRequest, NextResponse } from 'next/server';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type UrgencyLevel = 'URGENT' | 'PRIORITY' | 'NON-URGENT' | 'ESCALATE';

export interface TriageRequest {
  symptoms: string;
  patientId?: string;
  age?: number;
  context?: string; // additional clinical context
}

export interface TriageResponse {
  urgency: UrgencyLevel;
  reason_codes: string[];
  recommended_action: string;
  diagnosis: null;                      // always null — no AI diagnoses
  triggered_by: 'HARD_RULE' | 'AI_COUNCIL';
  agents?: AgentOutputs;
  processing_ms: number;
}

// Individual agent response shapes
interface DhanvantariOutput {
  clinical_features: string[];
  red_flags: string[];
}
interface VishwamitraOutput {
  urgency_estimate: UrgencyLevel;
  reasoning: string;
}
interface ChanakyaOutput {
  veto: boolean;
  safety_concern: string;
}
interface BhishmaOutput {
  clarity: 'PASS' | 'FAIL';
  panic_risk: 'LOW' | 'MEDIUM' | 'HIGH';
  communication_note: string;
}
interface AgentOutputs {
  dhanvantari: DhanvantariOutput;
  vishwamitra: VishwamitraOutput;
  chanakya: ChanakyaOutput;
  bhishma: BhishmaOutput;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. HARD SAFETY RULES — deterministic, no AI involved
// ─────────────────────────────────────────────────────────────────────────────

interface HardRule {
  id: string;
  label: string;
  patterns: RegExp[];      // ALL patterns must match (AND logic)
  urgency: UrgencyLevel;
  reason_codes: string[];
  recommended_action: string;
}

// Rules are evaluated top-to-bottom; first match wins.
const HARD_RULES: HardRule[] = [
  {
    id: 'HR-001',
    label: 'Cardiac / Respiratory Arrest',
    patterns: [/\b(unconscious|unresponsive|not breathing|cardiac arrest|no pulse)\b/i],
    urgency: 'ESCALATE',
    reason_codes: ['HR-001:ARREST', 'IMMEDIATE_999'],
    recommended_action: 'Call emergency services (999/112) immediately. Begin CPR if trained.',
  },
  {
    id: 'HR-002',
    label: 'Chest Pain + Breathing Difficulty',
    patterns: [
      /\bchest (pain|tightness|pressure|discomfort)\b/i,
      /\b(breath|breathing|breath|shortness of breath|can'?t breathe|difficulty breath)\b/i,
    ],
    urgency: 'URGENT',
    reason_codes: ['HR-002:CHEST_PAIN', 'HR-002:DYSPNOEA', 'POSSIBLE_ACS'],
    recommended_action: 'Attend Emergency Department immediately. Do not drive yourself.',
  },
  {
    id: 'HR-003',
    label: 'Stroke Signs (FAST)',
    patterns: [/\b(face drooping|face droop|arm weakness|arm weak|speech slurred|slurred speech|sudden confusion|sudden vision loss|worst headache|thunderclap headache)\b/i],
    urgency: 'URGENT',
    reason_codes: ['HR-003:STROKE_FAST', 'TIME_CRITICAL'],
    recommended_action: 'Call 999 immediately. Time to treatment is critical for stroke outcomes.',
  },
  {
    id: 'HR-004',
    label: 'Severe Allergic Reaction',
    patterns: [/\b(anaphylaxis|throat swelling|swollen throat|epipen|severe allergy|tongue swelling)\b/i],
    urgency: 'URGENT',
    reason_codes: ['HR-004:ANAPHYLAXIS'],
    recommended_action: 'Use EpiPen if available. Call 999. Lie flat with legs raised unless breathing is difficult.',
  },
  {
    id: 'HR-005',
    label: 'Severe Bleeding',
    patterns: [/\b(uncontrolled bleeding|won'?t stop bleeding|arterial bleed|spurting blood|major blood loss)\b/i],
    urgency: 'URGENT',
    reason_codes: ['HR-005:HAEMORRHAGE'],
    recommended_action: 'Apply firm direct pressure. Call 999. Do not remove embedded objects.',
  },
  {
    id: 'HR-006',
    label: 'Suicidal / Self-harm Crisis',
    patterns: [/\b(suicidal|want to die|kill myself|self.harm|overdose intentional)\b/i],
    urgency: 'ESCALATE',
    reason_codes: ['HR-006:MENTAL_HEALTH_CRISIS', 'SAFEGUARDING'],
    recommended_action: 'Contact crisis line (116 123 Samaritans). Go to ED or call 999 if immediate danger.',
  },
  {
    id: 'HR-007',
    label: 'Sepsis Signs',
    patterns: [/\b(very high fever|extreme shivering|confused and fever|sepsis|mottled skin|purple rash non.blanching)\b/i],
    urgency: 'URGENT',
    reason_codes: ['HR-007:SEPSIS_SIGNS'],
    recommended_action: 'Attend ED immediately. Mention possible sepsis on arrival.',
  },
];

/**
 * Evaluate hard safety rules. Returns first matching rule or null.
 */
function evaluateHardRules(symptoms: string): HardRule | null {
  for (const rule of HARD_RULES) {
    const allMatch = rule.patterns.every((pattern) => pattern.test(symptoms));
    if (allMatch) return rule;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. AI COUNCIL — 4 parallel mock agents
//    Each agent function simulates what an LLM call would return.
//    Swap the body of each for a real fetch() to OpenAI/Anthropic when ready.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Dhanvantari — Clinical Pattern Recognition Agent
 * Identifies clinical features and red flags in the symptom text.
 * Returns structured features, NEVER a diagnosis.
 */
async function runDhanvantari(symptoms: string): Promise<DhanvantariOutput> {
  // --- MOCK IMPLEMENTATION ---
  // In production: POST to OpenAI with a system prompt instructing the model
  // to return ONLY { clinical_features: [], red_flags: [] } and nothing else.
  const lower = symptoms.toLowerCase();

  const clinical_features: string[] = [];
  const red_flags: string[] = [];

  // Feature extraction (deterministic approximation of LLM output)
  if (/chest/.test(lower))           clinical_features.push('Chest involvement reported');
  if (/pain|ache|hurt/.test(lower))  clinical_features.push('Pain symptom present');
  if (/fever|temperature|hot/.test(lower)) clinical_features.push('Pyrexia possible');
  if (/cough/.test(lower))           clinical_features.push('Respiratory symptom: cough');
  if (/dizzy|lightheaded/.test(lower)) clinical_features.push('Dizziness/presyncope reported');
  if (/nausea|vomit/.test(lower))    clinical_features.push('GI symptom: nausea/vomiting');
  if (/headache/.test(lower))        clinical_features.push('Cephalgia reported');
  if (/sudden|severe|worst|extreme/.test(lower)) red_flags.push('Sudden or severe onset');
  if (/10 min|minutes ago|just started|started now/.test(lower)) red_flags.push('Acute onset < 30 minutes');
  if (/radiating|spreading|moving/.test(lower)) red_flags.push('Radiating symptom pattern');
  if (/left arm|jaw|shoulder/.test(lower)) red_flags.push('Possible referred pain pattern');

  if (clinical_features.length === 0) clinical_features.push('Non-specific symptoms reported');

  return { clinical_features, red_flags };
}

/**
 * Vishwamitra — Urgency Classification Agent
 * Estimates urgency purely from linguistic and clinical signals.
 */
async function runVishwamitra(symptoms: string, dhanvantari: DhanvantariOutput): Promise<VishwamitraOutput> {
  const lower = symptoms.toLowerCase();
  const redFlagCount = dhanvantari.red_flags.length;

  let urgency_estimate: UrgencyLevel = 'NON-URGENT';
  let reasoning = '';

  if (
    redFlagCount >= 2 ||
    /severe|worst|sudden|crushing|tearing|can'?t/.test(lower) ||
    /chest/.test(lower)
  ) {
    urgency_estimate = 'URGENT';
    reasoning = `${redFlagCount} red flag(s) detected. Symptom severity language suggests urgent evaluation.`;
  } else if (
    redFlagCount === 1 ||
    /getting worse|worsening|not improving|3 days|several days/.test(lower)
  ) {
    urgency_estimate = 'PRIORITY';
    reasoning = 'Moderate red flags or worsening trajectory. Same-day clinical review recommended.';
  } else {
    reasoning = 'Symptom profile does not meet urgent or priority criteria based on available information.';
  }

  return { urgency_estimate, reasoning };
}

/**
 * Chanakya — Safety and Compliance Agent (has VETO power)
 * Raises a veto if the case contains any red flags that AI should not handle alone.
 * Conservative by design — safety-first.
 */
async function runChanakya(symptoms: string, dhanvantari: DhanvantariOutput): Promise<ChanakyaOutput> {
  const lower = symptoms.toLowerCase();

  // Veto conditions — any of these trigger ESCALATE
  const vetoTriggers: string[] = [];

  if (dhanvantari.red_flags.some((r) => r.toLowerCase().includes('acute onset'))) {
    vetoTriggers.push('Acute onset flag raised by Dhanvantari — warrants in-person assessment');
  }
  if (/child|infant|baby|newborn|toddler/.test(lower)) {
    vetoTriggers.push('Paediatric patient — AI triage insufficient; requires clinician review');
  }
  if (/pregnant|pregnancy/.test(lower)) {
    vetoTriggers.push('Pregnancy mentioned — specialist pathway required');
  }
  if (/immunocompromised|chemotherapy|hiv|transplant/.test(lower)) {
    vetoTriggers.push('Immunocompromised state — atypical presentations possible; escalate');
  }

  const veto = vetoTriggers.length > 0;
  const safety_concern = veto
    ? vetoTriggers.join(' | ')
    : 'No compliance concerns identified. AI council recommendation may proceed.';

  return { veto, safety_concern };
}

/**
 * Bhishma — Communication and Clarity Agent
 * Evaluates whether the symptom description is clear enough for triage
 * and estimates panic risk to calibrate response tone.
 */
async function runBhishma(symptoms: string): Promise<BhishmaOutput> {
  const lower = symptoms.toLowerCase();
  const wordCount = symptoms.trim().split(/\s+/).length;

  const clarity: 'PASS' | 'FAIL' = wordCount >= 4 ? 'PASS' : 'FAIL';

  let panic_risk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  let communication_note = 'Symptom description is clear. Standard triage communication tone appropriate.';

  if (/dying|going to die|terrified|scared|help me|please help|emergency/.test(lower)) {
    panic_risk = 'HIGH';
    communication_note = 'Patient appears distressed. Use calm, reassuring communication. Prioritise immediate acknowledgement.';
  } else if (/worried|anxious|not sure|confused|don'?t know/.test(lower)) {
    panic_risk = 'MEDIUM';
    communication_note = 'Patient shows moderate anxiety. Provide clear, step-by-step guidance.';
  }

  if (clarity === 'FAIL') {
    communication_note = 'Symptom description too brief for reliable triage. Request more detail before proceeding.';
  }

  return { clarity, panic_risk, communication_note };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. DECISION ENGINE — combines all agent outputs
// ─────────────────────────────────────────────────────────────────────────────

function runDecisionEngine(
  agents: AgentOutputs,
  symptoms: string,
): Omit<TriageResponse, 'triggered_by' | 'processing_ms' | 'agents'> {
  const { dhanvantari, vishwamitra, chanakya, bhishma } = agents;

  // Rule 1: Chanakya veto overrides everything
  if (chanakya.veto) {
    return {
      urgency: 'ESCALATE',
      reason_codes: ['CHANAKYA_VETO', ...chanakya.safety_concern.split(' | ').map((s) => s.slice(0, 40).replace(/\s/g, '_').toUpperCase())],
      recommended_action: `This case requires immediate clinician review. Reason: ${chanakya.safety_concern}`,
      diagnosis: null,
    };
  }

  // Rule 2: Bhishma clarity fail — insufficient data
  if (bhishma.clarity === 'FAIL') {
    return {
      urgency: 'NON-URGENT',
      reason_codes: ['BHISHMA:INSUFFICIENT_DATA'],
      recommended_action: 'Please describe your symptoms in more detail so we can provide appropriate guidance.',
      diagnosis: null,
    };
  }

  // Rule 3: Use Vishwamitra's urgency estimate
  const urgency = vishwamitra.urgency_estimate;

  // Compile reason codes
  const reason_codes: string[] = [
    ...dhanvantari.red_flags.map((f) => `DHANVANTARI:${f.replace(/\s/g, '_').toUpperCase()}`),
    `VISHWAMITRA:${urgency}`,
    `PANIC_RISK:${bhishma.panic_risk}`,
  ];

  // Recommended action based on urgency
  let recommended_action = '';
  if (urgency === 'URGENT') {
    recommended_action = 'Please attend your nearest Emergency Department or call 999. Do not wait.';
  } else if (urgency === 'PRIORITY') {
    recommended_action = 'Please contact your GP or call 111 for same-day assessment. Monitor symptoms closely.';
  } else {
    recommended_action = 'Your symptoms do not appear immediately urgent. Book an appointment with your GP within the next few days.';
  }

  // High panic risk — prepend reassurance
  if (bhishma.panic_risk === 'HIGH') {
    recommended_action = `We hear you. ${recommended_action}`;
  }

  return { urgency, reason_codes, recommended_action, diagnosis: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. RATE LIMIT (simple in-memory, resets on server restart)
// ─────────────────────────────────────────────────────────────────────────────

const ipCallMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // calls per window
const RATE_WINDOW_MS = 60_000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipCallMap.get(ip);
  if (!entry || now > entry.resetAt) {
    ipCallMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true; // allowed
  }
  if (entry.count >= RATE_LIMIT) return false; // blocked
  entry.count++;
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. NEXT.JS ROUTE HANDLER
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  // Rate limiting
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait before submitting again.' },
      { status: 429 }
    );
  }

  // Parse and validate body
  let body: TriageRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { symptoms, patientId, age, context } = body;

  if (!symptoms || typeof symptoms !== 'string' || symptoms.trim().length < 3) {
    return NextResponse.json(
      { error: 'symptoms field is required and must be at least 3 characters.' },
      { status: 400 }
    );
  }

  // Sanitise input — strip HTML/script tags
  const sanitised = symptoms.replace(/<[^>]*>/g, '').trim().slice(0, 2000);
  const fullInput = context ? `${sanitised}. Context: ${context}` : sanitised;

  // ── Step 1: Hard rules ─────────────────────────────────────────────────────
  const hardRuleMatch = evaluateHardRules(fullInput);
  if (hardRuleMatch) {
    const response: TriageResponse = {
      urgency: hardRuleMatch.urgency,
      reason_codes: hardRuleMatch.reason_codes,
      recommended_action: hardRuleMatch.recommended_action,
      diagnosis: null,
      triggered_by: 'HARD_RULE',
      processing_ms: Date.now() - startTime,
    };

    console.log(`[TRIAGE] HARD_RULE hit: ${hardRuleMatch.id} (${hardRuleMatch.label})`);
    console.log(`[TRIAGE] Input: "${sanitised.slice(0, 80)}…"`);
    console.log(`[TRIAGE] Output urgency: ${hardRuleMatch.urgency}`);

    return NextResponse.json(response, { status: 200 });
  }

  // ── Step 2: AI Council — all 4 agents run in parallel ─────────────────────
  const dhanvantari = await runDhanvantari(fullInput);
  const [vishwamitra, chanakya, bhishma] = await Promise.all([
    runVishwamitra(fullInput, dhanvantari),
    runChanakya(fullInput, dhanvantari),
    runBhishma(fullInput),
  ]);

  const agents: AgentOutputs = { dhanvantari, vishwamitra, chanakya, bhishma };

  // ── Step 3: Decision Engine ────────────────────────────────────────────────
  const decision = runDecisionEngine(agents, fullInput);

  const response: TriageResponse = {
    ...decision,
    triggered_by: 'AI_COUNCIL',
    agents,
    processing_ms: Date.now() - startTime,
  };

  console.log(`[TRIAGE] AI_COUNCIL result: ${decision.urgency} | patientId: ${patientId ?? 'anonymous'} | age: ${age ?? 'unknown'}`);
  console.log(`[TRIAGE] Reason codes: ${decision.reason_codes.join(', ')}`);

  return NextResponse.json(response, { status: 200 });
}

// GET — health check / API documentation
export async function GET() {
  return NextResponse.json({
    service: 'MedCare AI Triage Council',
    version: '1.0.0',
    status: 'operational',
    endpoint: 'POST /api/triage',
    agents: ['Dhanvantari (Clinical)', 'Vishwamitra (Urgency)', 'Chanakya (Safety)', 'Bhishma (Communication)'],
    hard_rules: HARD_RULES.length,
    request_schema: {
      symptoms: 'string (required, max 2000 chars)',
      patientId: 'string (optional)',
      age: 'number (optional)',
      context: 'string (optional clinical context)',
    },
    disclaimer: 'For demonstration only. Not a substitute for professional medical advice.',
  });
}
