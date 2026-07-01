/**
 * AI Engine Service — Multi-provider fallback orchestrator
 *
 * Chain:  OpenRouter (10 free models) → Gemini multi-model chain → Static fallback
 * All logs are fire-and-forget (non-blocking). Every call has a hard timeout.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "../db.js";

// ── Provider Detection ────────────────────────────────────────────────────
const hasOpenRouter =
  process.env.OPENROUTER_API_KEY &&
  !process.env.OPENROUTER_API_KEY.includes("your-");

const hasGemini =
  process.env.GEMINI_API_KEY &&
  !process.env.GEMINI_API_KEY.includes("your-");

const genAI = hasGemini
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// ── OpenRouter Free Models ────────────────────────────────────────────────
// Priority order: fastest & most reliable free models first
export const OPENROUTER_MODELS = [
  { id: "google/gemma-4-26b-a4b-it:free",                     label: "Gemma 4 26B",                      priority: 1,  enabled: true },
  { id: "liquid/lfm-2.5-1.2b-thinking:free",                  label: "LFM 2.5 1.2B Thinking",            priority: 2,  enabled: true },
  { id: "cohere/north-mini-code:free",                        label: "Cohere North Mini Code",            priority: 3,  enabled: true },
  { id: "poolside/laguna-xs.2:free",                          label: "Poolside Laguna XS",                priority: 4,  enabled: true },
  { id: "nvidia/nemotron-3-ultra-550b-a55b:free",              label: "NVIDIA Nemotron Ultra 550B",       priority: 5,  enabled: true },
  { id: "meta-llama/llama-3.3-70b-instruct:free",              label: "Llama 3.3 70B Instruct",          priority: 6,  enabled: true },
  { id: "openai/gpt-oss-120b:free",                           label: "GPT OSS 120B",                     priority: 7,  enabled: true },
  { id: "qwen/qwen3-next-80b-a3b-instruct:free",               label: "Qwen3 Next 80B",                   priority: 8,  enabled: true },
  { id: "nousresearch/hermes-3-llama-3.1-405b:free",          label: "Hermes 3 Llama 405B",              priority: 9, enabled: true },
  { id: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free", label: "Dolphin Mistral 24B",   priority: 10, enabled: true },
];

// ── Gemini Models (priority by free-tier quota — best limits first) ───────
// RPM / Tokens-per-min / RPD from the API dashboard
export const GEMINI_MODELS = [
  // Confirmed working public model first for standard keys
  { id: "gemini-flash-latest",           label: "Gemini 1.5 Flash",          tier: "legacy",    priority: 1,  enabled: true },
  // 15 RPM, Unlimited tokens, 1.5K RPD ← BEST (if enabled/accessible on user's key)
  { id: "gemma-4-31b-it",                label: "Gemma 4 31B",               tier: "unlimited", priority: 2,  enabled: true },
  { id: "gemma-4-26b-it",                label: "Gemma 4 26B",               tier: "unlimited", priority: 3,  enabled: true },
  // 15 RPM, 250K tokens, 500 RPD ← Very good
  { id: "gemini-3.1-flash-lite",         label: "Gemini 3.1 Flash Lite",     tier: "high",      priority: 4,  enabled: true },
  // 10 RPM, 250K tokens, 20 RPD
  { id: "gemini-2.5-flash-lite",         label: "Gemini 2.5 Flash Lite",     tier: "standard",  priority: 5,  enabled: true },
  // 5 RPM, 250K tokens, 20 RPD
  { id: "gemini-3.5-flash",              label: "Gemini 3.5 Flash",          tier: "standard",  priority: 6,  enabled: true },
  { id: "gemini-3-flash",                label: "Gemini 3 Flash",            tier: "standard",  priority: 7,  enabled: true },
  { id: "gemini-2.5-flash",              label: "Gemini 2.5 Flash",          tier: "standard",  priority: 8,  enabled: true },
  { id: "gemini-2.0-flash",              label: "Gemini 2 Flash",            tier: "standard",  priority: 9,  enabled: true },
  { id: "gemini-2.0-flash-lite",         label: "Gemini 2 Flash Lite",       tier: "standard",  priority: 10, enabled: true },
];

// In-memory queues (can be reordered by Tech Admin)
let modelQueue      = [...OPENROUTER_MODELS].filter((m) => m.enabled);
let geminiQueue     = [...GEMINI_MODELS].filter((m) => m.enabled);

// In-memory provider toggles (can be disabled by Tech Admin)
let openRouterActive = true;
let geminiActive     = true;
let staticActive     = true;

export const getModelQueue       = () => modelQueue;
export const setModelQueue       = (q) => { modelQueue = q; };
export const getGeminiModelQueue = () => geminiQueue;
export const setGeminiModelQueue = (q) => { geminiQueue = q; };

export const getProvidersActive  = () => ({
  openrouter: openRouterActive,
  gemini: geminiActive,
  static: staticActive,
});

export const setProvidersActive  = ({ openrouter, gemini, static: stat }) => {
  if (openrouter !== undefined) openRouterActive = !!openrouter;
  if (gemini !== undefined)     geminiActive     = !!gemini;
  if (stat !== undefined)       staticActive     = !!stat;
};

// ── Non-blocking log ──────────────────────────────────────────────────────
function logAsync(data) {
  prisma.aiLog.create({ data }).catch((e) =>
    console.warn("[AI Engine] Log write failed:", e.message)
  );
}

// ── Fetch with timeout ────────────────────────────────────────────────────
async function fetchWithTimeout(url, options, ms = 10000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

// ── OpenRouter Call ────────────────────────────────────────────────────────
async function callOpenRouter(modelId, messages) {
  const res = await fetchWithTimeout(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://havisdesign.com",
        "X-Title": "HAVI Design AI Assistant",
      },
      body: JSON.stringify({
        model: modelId,
        messages,
        max_tokens: 350,
        temperature: 0.7,
      }),
    },
    6000 // 6s per OpenRouter model
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenRouter HTTP ${res.status}`);
  }

  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error("Empty response from OpenRouter");
  return { reply, tokens: data.usage?.total_tokens ?? null };
}

// ── Gemini Call (accepts any model ID) ────────────────────────────────────
async function callGemini(systemPrompt, history, userMessage, modelId) {
  const model = genAI.getGenerativeModel({
    model: modelId,
    systemInstruction: systemPrompt,
  });

  const geminiHistory = history
    .filter((m) => m.content?.trim())
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const timeout = new Promise((_, rej) =>
    setTimeout(() => rej(new Error(`Gemini timeout (${modelId})`)), 6000)
  );

  const chat = model.startChat({ history: geminiHistory });
  const result = await Promise.race([chat.sendMessage(userMessage), timeout]);
  const reply = result.response.text()?.trim();
  if (!reply) throw new Error(`Empty response from Gemini/${modelId}`);
  return { reply };
}

// ── Static Fallback ────────────────────────────────────────────────────────
const STATIC_FALLBACKS = [
  "Thank you for reaching out to HAVI'S DESIGN! We specialize in premium interior design and renovation in Addis Ababa. Would you like to book a free consultation at /booking?",
  "Great question! Our team would love to help with your design project. Our services start from ETB 15,000 per room. Book a free consultation to get an accurate quote!",
  "We offer interior design, renovation, office design, and commercial construction across Addis Ababa. Visit /booking to schedule your free first consultation!",
  "HAVI'S DESIGN has over 10 years of experience delivering beautiful spaces. Contact us or use our booking page to discuss your project with our team.",
  "Our expert designers are ready to transform your space! From concept to completion, we handle everything. Book your free consultation at /booking to get started.",
];

const getStaticFallback = () =>
  STATIC_FALLBACKS[Math.floor(Math.random() * STATIC_FALLBACKS.length)];

// ── Core: Generate Reply ────────────────────────────────────────────────────
export async function generateReply(systemPrompt, history, userMessage, sessionId = null) {
  const errors = [];

  // ─── Step 1: OpenRouter — try top 3 enabled models ───────────────────
  if (openRouterActive && hasOpenRouter && modelQueue.length > 0) {
    const tryModels = modelQueue.filter((m) => m.enabled).slice(0, 3);

    const orMessages = [
      { role: "system", content: systemPrompt },
      ...history
        .filter((m) => m.content?.trim())
        .map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        })),
      { role: "user", content: userMessage },
    ];

    for (const model of tryModels) {
      const start = Date.now();
      try {
        const { reply, tokens } = await callOpenRouter(model.id, orMessages);
        const latencyMs = Date.now() - start;

        logAsync({
          provider: "openrouter", model: model.id,
          prompt: userMessage.slice(0, 500), response: reply.slice(0, 1000),
          tokens, latencyMs, success: true, sessionId,
        });

        return { reply, provider: "openrouter", model: model.id };
      } catch (err) {
        const latencyMs = Date.now() - start;
        errors.push(`OR/${model.id}: ${err.message}`);
        logAsync({
          provider: "openrouter", model: model.id,
          prompt: userMessage.slice(0, 500), latencyMs,
          success: false, errorMsg: err.message.slice(0, 400), sessionId,
        });
      }
    }
  }

  // ─── Step 2: Gemini — try top 2 enabled models ────────────────────
  if (geminiActive && hasGemini && geminiQueue.length > 0) {
    const tryGemini = geminiQueue.filter((m) => m.enabled).slice(0, 2);

    for (const gModel of tryGemini) {
      const start = Date.now();
      try {
        const { reply } = await callGemini(systemPrompt, history, userMessage, gModel.id);
        const latencyMs = Date.now() - start;

        logAsync({
          provider: "gemini", model: gModel.id,
          prompt: userMessage.slice(0, 500), response: reply.slice(0, 1000),
          latencyMs, success: true, sessionId,
        });

        return { reply, provider: "gemini", model: gModel.id };
      } catch (err) {
        const latencyMs = Date.now() - start;
        errors.push(`Gemini/${gModel.id}: ${err.message}`);
        logAsync({
          provider: "gemini", model: gModel.id,
          prompt: userMessage.slice(0, 500), latencyMs,
          success: false, errorMsg: err.message.slice(0, 400), sessionId,
        });
      }
    }
  }

  // ─── Step 3: Static Fallback (always works unless turned off) ─────────
  if (staticActive) {
    const reply = getStaticFallback();
    logAsync({
      provider: "static", model: "static-fallback",
      prompt: userMessage.slice(0, 500), response: reply,
      latencyMs: 0, success: true, sessionId,
    });

    if (errors.length) {
      console.warn("[AI Engine] Fallback chain exhausted → Static fallback used");
    }

    return { reply, provider: "static", model: "static-fallback" };
  } else {
    // If static is also disabled, return custom suspended status
    const reply = "Our AI Assistant support is temporarily unavailable. Please schedule a design consultation directly at /booking.";
    logAsync({
      provider: "suspended", model: "none",
      prompt: userMessage.slice(0, 500), response: reply,
      latencyMs: 0, success: true, sessionId,
    });
    return { reply, provider: "suspended", model: "none" };
  }
}

// ── Provider Status ────────────────────────────────────────────────────────
export async function getProviderStatus() {
  const results = [];

  if (hasOpenRouter) {
    const start = Date.now();
    try {
      const res = await fetchWithTimeout(
        "https://openrouter.ai/api/v1/models",
        { headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` } },
        6000
      );
      results.push({
        provider: "openrouter",
        status: res.ok ? "online" : "error",
        latencyMs: Date.now() - start,
        models: modelQueue.filter((m) => m.enabled).length,
        totalModels: OPENROUTER_MODELS.length,
        configured: true,
      });
    } catch (err) {
      results.push({
        provider: "openrouter", status: "offline",
        latencyMs: Date.now() - start, error: err.message, configured: true,
      });
    }
  } else {
    results.push({ provider: "openrouter", status: "not-configured", configured: false });
  }

  if (hasGemini) {
    const start = Date.now();
    try {
      const res = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`,
        {},
        6000
      );
      results.push({
        provider: "gemini",
        status: res.ok ? "online" : "error",
        latencyMs: Date.now() - start,
        models: geminiQueue.filter((m) => m.enabled).length,
        totalModels: GEMINI_MODELS.length,
        configured: true,
        activeModel: geminiQueue.find((m) => m.enabled)?.label ?? "none",
      });
    } catch (err) {
      results.push({
        provider: "gemini", status: "offline",
        latencyMs: Date.now() - start, error: err.message, configured: true,
      });
    }
  } else {
    results.push({ provider: "gemini", status: "not-configured", configured: false });
  }

  results.push({
    provider: "static", status: "always-online", configured: true,
    models: 5, totalModels: 5,
  });

  return results;
}

// ── AI Usage Stats ─────────────────────────────────────────────────────────
export async function getAiStats(hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const [logs, total] = await Promise.all([
    prisma.aiLog.findMany({
      where: { createdAt: { gte: since } },
      select: { provider: true, success: true, tokens: true, latencyMs: true },
    }),
    prisma.aiLog.count(),
  ]);

  const byProvider = {};
  let totalTokens = 0;
  let successCount = 0;

  for (const log of logs) {
    if (!byProvider[log.provider]) {
      byProvider[log.provider] = { calls: 0, success: 0, fail: 0, tokens: 0, totalLatency: 0 };
    }
    byProvider[log.provider].calls++;
    if (log.success) { byProvider[log.provider].success++; successCount++; }
    else { byProvider[log.provider].fail++; }
    if (log.tokens)    { byProvider[log.provider].tokens += log.tokens; totalTokens += log.tokens; }
    if (log.latencyMs) { byProvider[log.provider].totalLatency += log.latencyMs; }
  }

  return {
    period: `${hours}h`,
    totalCalls: logs.length,
    totalLogsAllTime: total,
    successRate: logs.length ? ((successCount / logs.length) * 100).toFixed(1) : "0",
    totalTokens,
    byProvider,
  };
}
