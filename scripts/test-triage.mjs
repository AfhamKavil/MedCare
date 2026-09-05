/**
 * MedCare Triage API — Backend Test Suite
 * Run: node scripts/test-triage.mjs
 * (Dev server must be running on port 3000)
 */

const BASE = 'http://localhost:3000/api/triage';

const TESTS = [
  // ── Hard Rule Tests ──────────────────────────────────────────────────────
  {
    name: 'HR-001: Cardiac arrest (ESCALATE)',
    body: { symptoms: 'Patient is unconscious and not breathing' },
    expect: { triggered_by: 'HARD_RULE', urgency: 'ESCALATE' },
  },
  {
    name: 'HR-002: Chest pain + breathing difficulty (URGENT)',
    body: { symptoms: 'chest pain starting 10 minutes ago with difficulty breathing' },
    expect: { triggered_by: 'HARD_RULE', urgency: 'URGENT' },
  },
  {
    name: 'HR-003: Stroke (URGENT)',
    body: { symptoms: 'face drooping on left side and speech slurred since 5 minutes ago' },
    expect: { triggered_by: 'HARD_RULE', urgency: 'URGENT' },
  },
  {
    name: 'HR-002 variant: chest tightness + shortness of breath',
    body: { symptoms: 'Severe chest tightness and shortness of breath for the last 5 minutes' },
    expect: { triggered_by: 'HARD_RULE', urgency: 'URGENT' },
  },

  // ── AI Council Tests ─────────────────────────────────────────────────────
  {
    name: 'AI Council: Severe headache (URGENT via Vishwamitra)',
    body: { symptoms: 'sudden severe headache worst of my life started suddenly', age: 45 },
    expect: { triggered_by: 'AI_COUNCIL', urgency: 'URGENT' },
  },
  {
    name: 'AI Council: Mild cough (NON-URGENT)',
    body: { symptoms: 'I have a mild cough and sore throat for two days', age: 30 },
    expect: { triggered_by: 'AI_COUNCIL', urgency: 'NON-URGENT' },
  },
  {
    name: 'AI Council: Worsening back pain (PRIORITY)',
    body: { symptoms: 'back pain getting worse over the last 3 days not improving', age: 52 },
    expect: { triggered_by: 'AI_COUNCIL', urgency: 'PRIORITY' },
  },
  {
    name: 'AI Council: Chanakya veto — pregnant patient',
    body: { symptoms: 'I am pregnant and have a high fever', age: 28 },
    expect: { triggered_by: 'AI_COUNCIL', urgency: 'ESCALATE' },
  },
  {
    // HR-007 sepsis rule fires first (baby + very high fever = sepsis pattern)
    // This is correct clinical behaviour — URGENT is appropriate here
    name: 'AI Council: Chanakya veto — paediatric (no sepsis keywords)',
    body: { symptoms: 'My infant has a rash and runny nose and has been crying a lot', age: 0 },
    expect: { triggered_by: 'AI_COUNCIL', urgency: 'ESCALATE' },
  },
  {
    name: 'AI Council: Bhishma clarity fail — too short',
    body: { symptoms: 'bad' },
    expect: { triggered_by: 'AI_COUNCIL', urgency: 'NON-URGENT' },
  },

  // ── Edge Cases ───────────────────────────────────────────────────────────
  {
    name: 'Validation: empty symptoms',
    body: { symptoms: '' },
    expect: { httpStatus: 400 },
  },
  {
    name: 'GET: health check',
    method: 'GET',
    body: null,
    expect: { service: 'MedCare AI Triage Council' },
  },
];

// ── Test runner ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

async function runTest(test) {
  const method = test.method ?? 'POST';
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(method === 'POST' && test.body !== null ? { body: JSON.stringify(test.body) } : {}),
  };

  let res, data;
  try {
    res = await fetch(BASE, opts);
    data = await res.json();
  } catch (err) {
    console.error(`  ❌ ${test.name} — FETCH ERROR: ${err.message}`);
    failed++;
    return;
  }

  const issues = [];

  if (test.expect.httpStatus && res.status !== test.expect.httpStatus) {
    issues.push(`Expected HTTP ${test.expect.httpStatus}, got ${res.status}`);
  }
  if (test.expect.urgency && data.urgency !== test.expect.urgency) {
    issues.push(`Expected urgency "${test.expect.urgency}", got "${data.urgency}"`);
  }
  if (test.expect.triggered_by && data.triggered_by !== test.expect.triggered_by) {
    issues.push(`Expected triggered_by "${test.expect.triggered_by}", got "${data.triggered_by}"`);
  }
  if (test.expect.service && data.service !== test.expect.service) {
    issues.push(`Expected service field "${test.expect.service}"`);
  }

  if (issues.length === 0) {
    console.log(`  ✅ ${test.name}`);
    if (data.urgency) {
      console.log(`     → urgency: ${data.urgency} | triggered_by: ${data.triggered_by} | ${data.processing_ms}ms`);
    }
    if (data.recommended_action) {
      console.log(`     → action: ${data.recommended_action.slice(0, 90)}`);
    }
    passed++;
  } else {
    console.log(`  ❌ ${test.name}`);
    issues.forEach((i) => console.log(`     → FAIL: ${i}`));
    console.log(`     → Full response: ${JSON.stringify(data).slice(0, 200)}`);
    failed++;
  }
}

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  MedCare AI Triage Council — Backend Test Suite');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  for (const test of TESTS) {
    await runTest(test);
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Results: ${passed} passed, ${failed} failed out of ${TESTS.length} tests`);
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  if (failed > 0) process.exit(1);
}

main();
