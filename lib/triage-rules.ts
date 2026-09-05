/**
 * lib/triage-rules.ts
 *
 * Shared deterministic hard-safety rules used by BOTH:
 *   - /api/triage       (symptom-string endpoint, existing + tested)
 *   - /api/triage/chat  (conversational endpoint, new)
 *
 * These rules are evaluated BEFORE any AI is involved.
 * They are pattern-matched against raw text — no model required.
 */

export type UrgencyLevel = 'URGENT' | 'PRIORITY' | 'NON-URGENT' | 'ESCALATE';

export interface HardRule {
  id: string;
  label: string;
  /** ALL patterns must match the text (AND logic). First matching rule wins. */
  patterns: RegExp[];
  urgency: UrgencyLevel;
  reason_codes: string[];
  recommended_action: string;
}

export const HARD_RULES: HardRule[] = [
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
      /\b(shortness of breath|can'?t breathe|difficulty breath|difficulty breathing|breathing difficulty)\b/i,
    ],
    urgency: 'URGENT',
    reason_codes: ['HR-002:CHEST_PAIN', 'HR-002:DYSPNOEA', 'POSSIBLE_ACS'],
    recommended_action: 'Attend Emergency Department immediately. Do not drive yourself.',
  },
  {
    id: 'HR-003',
    label: 'Stroke Signs (FAST)',
    patterns: [
      /\b(face drooping|face droop|arm weakness|arm weak|speech slurred|slurred speech|sudden confusion|sudden vision loss|worst headache|thunderclap headache)\b/i,
    ],
    urgency: 'URGENT',
    reason_codes: ['HR-003:STROKE_FAST', 'TIME_CRITICAL'],
    recommended_action: 'Call 999 immediately. Time to treatment is critical for stroke outcomes.',
  },
  {
    id: 'HR-004',
    label: 'Severe Allergic Reaction',
    patterns: [
      /\b(anaphylaxis|throat swelling|swollen throat|epipen|severe allergy|tongue swelling)\b/i,
    ],
    urgency: 'URGENT',
    reason_codes: ['HR-004:ANAPHYLAXIS'],
    recommended_action: 'Use EpiPen if available. Call 999. Lie flat with legs raised unless breathing is difficult.',
  },
  {
    id: 'HR-005',
    label: 'Severe Bleeding',
    patterns: [
      /\b(uncontrolled bleeding|won'?t stop bleeding|arterial bleed|spurting blood|major blood loss)\b/i,
    ],
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
    recommended_action:
      'Contact crisis line (116 123 Samaritans). Go to ED or call 999 if immediate danger.',
  },
  {
    id: 'HR-007',
    label: 'Sepsis Signs',
    patterns: [
      /\b(very high fever|extreme shivering|confused and fever|sepsis|mottled skin|purple rash non.blanching)\b/i,
    ],
    urgency: 'URGENT',
    reason_codes: ['HR-007:SEPSIS_SIGNS'],
    recommended_action: 'Attend ED immediately. Mention possible sepsis on arrival.',
  },
];

/**
 * Evaluate all hard rules against `text`.
 * Returns the first matching rule, or null if none match.
 * Text should be the full combined input from the patient.
 */
export function evaluateHardRules(text: string): HardRule | null {
  for (const rule of HARD_RULES) {
    const allMatch = rule.patterns.every((pattern) => pattern.test(text));
    if (allMatch) return rule;
  }
  return null;
}
