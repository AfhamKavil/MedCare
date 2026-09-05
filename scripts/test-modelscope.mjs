/**
 * scripts/test-modelscope.mjs
 *
 * Single-endpoint connectivity test for ModelScope (.ai)
 * Reads credentials from .env.local — NEVER prints key values.
 * Usage: node scripts/test-modelscope.mjs
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── Load .env.local manually ─────────────────────────────────────────────────
function loadEnv(filePath) {
  try {
    const raw = readFileSync(filePath, 'utf-8');
    const env = {};
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
    }
    return env;
  } catch {
    return {};
  }
}

const env = loadEnv(resolve(process.cwd(), '.env.local'));

function isKeyUsable(k) {
  return !!(k && !k.startsWith('REPLACE_') && !k.startsWith('your_'));
}

const msKey   = env.MODEL_API_KEY;
const msModel = env.MODEL_NAME ?? 'Qwen-Ambassador/Qwen3.8-27B';
const msBase  = env.MODEL_API_BASE ?? 'https://api-inference.modelscope.ai/v1';

console.log('\n=== MedCare ModelScope Minimal Test (.ai) ===');
console.log(`MODEL_API_KEY exists : ${isKeyUsable(msKey)}`);
if (isKeyUsable(msKey)) {
    console.log(`MODEL_API_KEY length : ${msKey.length}`);
}
console.log(`MODEL_API_BASE       : ${msBase}`);
console.log(`MODEL_NAME           : ${msModel}`);
console.log('=============================================\n');

if (!isKeyUsable(msKey)) {
  console.error('❌  MODEL_API_KEY is missing or invalid.');
  process.exit(1);
}

// ── Test Function ────────────────────────────────────────────────────────────
async function testEndpoint() {
  const endpoint = `${msBase}/chat/completions`;
  const messages = [{ role: "user", content: "Reply with exactly: MODEL_OK" }];
  const body = JSON.stringify({ model: msModel, messages, temperature: 0, max_tokens: 10 });

  console.log(`--- Testing Endpoint ---`);
  console.log(`Endpoint: ${endpoint}`);

  const start = Date.now();
  let res;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${msKey}` },
      body,
      signal: AbortSignal.timeout(25_000),
    });
  } catch (err) {
    console.error(`❌  Network error: ${err.message}\n`);
    return { status: 'Network Error', auth: 'FAIL', result: err.message, requestId: 'N/A' };
  }

  const duration = Date.now() - start;
  let responseData;
  let responseText = await res.text().catch(() => '');

  try {
    responseData = JSON.parse(responseText);
  } catch {
    responseData = null;
  }

  const authPassed = res.status !== 401 && res.status !== 403;
  const authStatus = authPassed ? 'PASS' : 'FAIL';
  
  let resultText = '';
  let requestId = 'N/A';

  if (!res.ok) {
    requestId = responseData?.request_id || 'N/A';
    const errorMsg = responseData?.error?.message || responseText || 'Unknown Error';
    resultText = `API Error: ${errorMsg}`;
    console.log(`HTTP ${res.status}  (${duration}ms)`);
    console.log(`Auth: ${authStatus}`);
    console.log(`Request ID: ${requestId}`);
    console.log(`Error: ${errorMsg}\n`);
  } else {
    requestId = responseData?.id || responseData?.request_id || 'N/A';
    const content = responseData?.choices?.[0]?.message?.content;
    resultText = content || 'Empty Content';
    console.log(`HTTP ${res.status}  (${duration}ms)`);
    console.log(`Auth: ${authStatus}`);
    console.log(`Request ID: ${requestId}`);
    console.log(`Result: ${resultText}\n`);
  }

  return { status: res.status, auth: authStatus, result: resultText, requestId };
}

await testEndpoint();
console.log('\n=== Test complete ===\n');
