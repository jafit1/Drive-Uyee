'use strict';

const MODEL_DEFAULT = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite-preview';
const API_ROOT = 'https://generativelanguage.googleapis.com/v1beta/models/';

function getKeyFor(agent) {
  return process.env[`GEMINI_API_KEY_${agent.toUpperCase()}`] || process.env.GEMINI_API_KEY || '';
}

async function generate(agent, prompt, { signal } = {}) {
  const apiKey = getKeyFor(agent);
  if (!apiKey) throw Object.assign(new Error(`API key Gemini belum diatur untuk agen ${agent}.`), { status: 503 });
  const model = process.env[`GEMINI_MODEL_${agent.toUpperCase()}`] || MODEL_DEFAULT;
  const response = await fetch(`${API_ROOT}${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST', signal,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(payload.error?.message || `Gemini API mengembalikan HTTP ${response.status}`);
    err.status = response.status === 429 ? 429 : 502;
    throw err;
  }
  const text = payload.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim();
  if (!text) throw Object.assign(new Error('Gemini tidak mengembalikan teks.'), { status: 502 });
  return text;
}

function safeError(error) {
  return { error: error.message || 'Permintaan agen gagal.', status: error.status || 502 };
}

async function runSwarm(task) {
  if (typeof task !== 'string' || !task.trim()) throw Object.assign(new Error('Tugas harus diisi.'), { status: 400 });
  if (task.length > 12000) throw Object.assign(new Error('Tugas maksimal 12.000 karakter.'), { status: 413 });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120000);
  try {
    const plan = await generate('supervisor', `Pecah permintaan berikut menjadi tiga brief spesialisasi independen: researcher (fakta/konteks yang diperlukan), coder (desain dan implementasi), reviewer (risiko dan kriteria mutu). Keluarkan JSON dengan kunci researcher, coder, reviewer; setiap nilai string. Bila tugas tak bisa diparalelkan, beri brief komplementer.\n\nTUGAS:\n${task}`, { signal: controller.signal });
    let briefs;
    try { briefs = JSON.parse(plan.match(/\{[\s\S]*\}/)?.[0]); } catch {}
    if (!briefs || !briefs.researcher || !briefs.coder || !briefs.reviewer) {
      briefs = { researcher: `Konteks dan fakta yang dibutuhkan untuk: ${task}`, coder: `Rancang dan kerjakan aspek implementasi dari: ${task}`, reviewer: `Identifikasi risiko, kasus tepi, dan kriteria keberhasilan untuk: ${task}` };
    }
    const roles = ['researcher', 'coder', 'reviewer'];
    const results = await Promise.all(roles.map(async role => {
      try { return { agent: role, status: 'completed', result: await generate(role, `Tugas utama: ${task}\n\nBrief dari supervisor: ${briefs[role]}\n\nKerjakan bagianmu secara mandiri dan tulis hasil yang konkret.`, { signal: controller.signal }) }; }
      catch (error) { return { agent: role, status: 'failed', ...safeError(error) }; }
    }));
    const completed = results.filter(item => item.status === 'completed');
    if (!completed.length) throw Object.assign(new Error('Semua agen gagal. Periksa API key Gemini dan kuota.'), { status: 502 });
    let synthesis;
    try {
      synthesis = await generate('supervisor', `Satukan hasil agen berikut menjadi jawaban akhir yang koheren dan langsung menuntaskan tugas. Tandai keterbatasan bila ada.\n\nTUGAS: ${task}\n\n${completed.map(r => `### ${r.agent}\n${r.result}`).join('\n\n')}`, { signal: controller.signal });
    } catch {
      synthesis = completed.map(r => `## ${r.agent}\n${r.result}`).join('\n\n');
    }
    return { model: MODEL_DEFAULT, answer: synthesis, agents: results };
  } finally { clearTimeout(timer); }
}

module.exports = { runSwarm, MODEL_DEFAULT, getKeyFor };
