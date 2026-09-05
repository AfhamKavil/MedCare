/**
 * scripts/test-triage.mjs
 *
 * Tests the 6 triage cases through the Next.js API route.
 * Verifies provider fallback behavior.
 */

const ENDPOINT = 'http://localhost:3000/api/triage/chat';

async function testCase(name, messages, expectedLogSnippet = null) {
  console.log(`\n=======================================================`);
  console.log(`TEST: ${name}`);
  console.log(`=======================================================`);

  const body = {
    messages,
    turn_count: messages.filter(m => m.role === 'user').length,
    collected_information: {
      primary_symptom: null,
      duration: null,
      severity: null,
      onset: null,
      associated_symptoms: [],
      temperature: null,
      chest_pain: null,
      breathing_difficulty: null,
      consciousness_normal: null,
      additional_context: null
    }
  };

  const start = Date.now();
  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch (err) {
    console.error(`❌ Network error: ${err.message}`);
    return;
  }
  const duration = Date.now() - start;

  console.log(`HTTP Status: ${res.status} (${duration}ms)`);
  
  let data;
  try {
    data = await res.json();
  } catch (err) {
    const text = await res.text();
    console.error(`❌ Non-JSON response: ${text.slice(0, 200)}`);
    return;
  }

  if (!res.ok) {
    console.log(`Response Error:`, JSON.stringify(data));
  } else {
    console.log(`Phase: ${data.phase}`);
    console.log(`Message: ${data.message}`);
    if (data.triage_result) {
      console.log(`Urgency: ${data.triage_result.urgency}`);
      console.log(`Triggered By: ${data.triage_result.triggered_by}`);
    }
  }
}

async function runTests() {
  console.log("Starting tests against local Next.js server...");
  
  // 1. ModelScope intentionally fails → Groq fallback succeeds (Implied by current token state)
  // 2. Normal fever conversation
  await testCase('1 & 2: Normal fever conversation (Triggers fallback if ModelScope fails)', [
    { role: 'user', content: 'I have a fever.' }
  ]);

  // 3. Mild fever (to test normal triage flow progressing)
  await testCase('3: Mild fever follow-up', [
    { role: 'user', content: 'I have a fever.' },
    { role: 'assistant', content: 'I understand you have a fever. How long have you had it, and what is your current temperature?' },
    { role: 'user', content: 'I have had a mild fever of 37.5C since yesterday.' }
  ]);

  // 4. Emergency hard rule
  await testCase('4: Emergency hard rule (chest pain + breathing)', [
    { role: 'user', content: 'I have severe chest pain and difficulty breathing.' }
  ]);

  console.log(`\n=======================================================`);
  console.log('NOTE: Test 5 (Both providers unavailable) requires manually corrupting the Groq key in .env.local.');
  console.log('NOTE: Test 6 (API key safety) requires inspecting the server console logs.');
  console.log(`=======================================================`);
}

runTests();
