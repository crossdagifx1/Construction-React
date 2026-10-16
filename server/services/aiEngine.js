/**
 * AI Engine Service ΓÇö Multi-provider fallback orchestrator
 *
 * Chain: Primary AI (DeepSeek v4.1 / v4-flash, OpenAI-compatible) ΓåÆ Gemini fallback ΓåÆ OpenRouter fallback ΓåÆ Static fallback
 * The provider base URL is kept strictly server-side and never exposed to the frontend/client.
 * Settings and models can be managed and persisted via Tech Admin.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "../db.js";

// ΓöÇΓöÇ Default Primary Models ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const DEFAULT_PRIMARY_MODELS = [
  { id: "deepseek-v4-flash", label: "DeepSeek v4 Flash", priority: 1, enabled: true, tier: "standard" },
  { id: "deepseek-v4.1",     label: "DeepSeek v4.1",     priority: 2, enabled: true, tier: "high" },
];

// ΓöÇΓöÇ Gemini Fallback Models ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const GEMINI_MODELS = [
  { id: "gemini-2.5-flash",  label: "Gemini 2.5 Flash",  tier: "standard",  priority: 1,  enabled: true },
  { id: "gemini-1.5-flash",  label: "Gemini 1.5 Flash",  tier: "standard",  priority: 2,  enabled: true },
  { id: "gemini-2.0-flash",  label: "Gemini 2.0 Flash",  tier: "legacy",    priority: 3,  enabled: true },
];

// ΓöÇΓöÇ OpenRouter Models (Optional secondary fallback) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const OPENROUTER_MODELS = [
  { id: "nex-agi/nex-n2.5-mini:free",         label: "Nex N2.5 Mini",         priority: 1, enabled: true },
  { id: "nvidia/nemotron-3.5-lightning:free", label: "Nemotron 3.5 Lightning", priority: 2, enabled: true },
  { id: "qwen/qwen3.8-27b:free",              label: "Qwen 3.8 27B",          priority: 3, enabled: true },
];

// In-memory state (synced with DB `Setting` with key="ai_config")
let primaryModels   = [...DEFAULT_PRIMARY_MODELS];
let geminiModels    = [...GEMINI_MODELS];
let customProviders = []; // [{ id, label, baseUrl, apiKey, models[], active, priority }]
let customApiKey    = null; // If set in DB/admin, overrides process.env.AI_API_KEY

// In-memory provider toggles
let primaryActive = true;
let geminiActive  = true;
let staticActive  = true;

let isInitialized = false;

// Provider base URL ΓÇö KEPT ON SERVER ONLY
const getBaseUrl = () => process.env.AI_BASE_URL || "https://vyceai.com/v1";

export const getPrimaryApiKey = async () => {
  await ensureInit();
  return customApiKey || process.env.AI_API_KEY || "";
};

// Synchronous fallback getter
export const getPrimaryApiKeySync = () => {
  return customApiKey || process.env.AI_API_KEY || "";
};

// Mask key for safe UI response (e.g. sk-86da...c87d)
export const maskKey = (key) => {
  if (!key || typeof key !== "string") return "";
  if (key.length <= 8) return "ΓÇóΓÇóΓÇóΓÇóΓÇóΓÇóΓÇóΓÇó";
  return `${key.slice(0, 7)}ΓÇóΓÇóΓÇóΓÇóΓÇóΓÇóΓÇóΓÇó${key.slice(-4)}`;
};

// ΓöÇΓöÇ Database Sync / Initialization ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export async function initAiConfig() {
  try {
    const record = await prisma.setting.findUnique({ where: { key: "ai_config" } });
    if (record && record.value && typeof record.value === "object") {
      const v = record.value;
      if (Array.isArray(v.primaryModels) && v.primaryModels.length > 0) {
        primaryModels = v.primaryModels;
      }
      if (Array.isArray(v.geminiModels) && v.geminiModels.length > 0) {
        geminiModels = v.geminiModels;
      }
      if (Array.isArray(v.customProviders)) {
        customProviders = v.customProviders;
      }
      if (typeof v.apiKey === "string" && v.apiKey.trim()) {
        customApiKey = v.apiKey.trim();
      }
      if (v.providersActive && typeof v.providersActive === "object") {
        if (v.providersActive.primary !== undefined) primaryActive = !!v.providersActive.primary;
        if (v.providersActive.gemini !== undefined)  geminiActive  = !!v.providersActive.gemini;
        if (v.providersActive.static !== undefined)  staticActive  = !!v.providersActive.static;
      }
    }
    isInitialized = true;
  } catch (err) {
    console.warn("[AI Engine] Failed to load ai_config from DB:", err.message);
  }
}

// Ensure DB config is loaded
async function ensureInit() {
  if (!isInitialized) {
    await initAiConfig();
  }
}

// Save in-memory config back to DB
async function persistConfig() {
  try {
    const payload = {
      primaryModels, geminiModels, customProviders, apiKey: customApiKey,
      providersActive: { primary: primaryActive, gemini: geminiActive, static: staticActive },
    };
    await prisma.setting.upsert({
      where: { key: "ai_config" },
      update: { value: payload },
      create: { key: "ai_config", value: payload },
    });
  } catch (err) {
    console.warn("[AI Engine] Failed to persist ai_config to DB:", err.message);
  }
}

// ── Custom Providers ──────────────────────────────────────────────────
export const getCustomProviders = async () => {
  await ensureInit();
  return customProviders.map((p) => ({ ...p, apiKey: maskKey(p.apiKey) }));
};

export const setCustomProviders = async (providers) => {
  await ensureInit();
  customProviders = providers.map((inc, i) => {
    const old = customProviders.find((e) => e.id === inc.id);
    const apiKey = (inc.apiKey && !inc.apiKey.includes("\u2022")) ? inc.apiKey : (old?.apiKey || "");
    return { id: inc.id || `cp-${Date.now()}-${i}`, label: inc.label || inc.id,
      baseUrl: inc.baseUrl || "", apiKey, models: Array.isArray(inc.models) ? inc.models : [],
      active: inc.active !== undefined ? !!inc.active : true, priority: i + 1 };
  });
  await persistConfig();
};

export const upsertCustomProvider = async (p) => {
  await ensureInit();
  const idx = customProviders.findIndex((e) => e.id === p.id);
  const old = idx >= 0 ? customProviders[idx] : null;
  const apiKey = (p.apiKey && !p.apiKey.includes("\u2022")) ? p.apiKey : (old?.apiKey || "");
  const entry = { id: p.id || `cp-${Date.now()}`, label: p.label || p.id,
    baseUrl: p.baseUrl || "", apiKey,
    models: Array.isArray(p.models) ? p.models : (old?.models || []),
    active: p.active !== undefined ? !!p.active : true,
    priority: idx >= 0 ? customProviders[idx].priority : customProviders.length + 1 };
  if (idx >= 0) { customProviders[idx] = entry; } else { customProviders.push(entry); }
  await persistConfig();
  return { ...entry, apiKey: maskKey(entry.apiKey) };
};

export const deleteCustomProvider = async (id) => {
  await ensureInit();
  customProviders = customProviders.filter((p) => p.id !== id);
  await persistConfig();
};

// Auto-fetch models from any OpenAI-compatible /models endpoint
export async function fetchProviderModels(baseUrl, apiKey) {
  const url = `${baseUrl.replace(/\/+$/, "")}/models`;
  const res = await fetchWithTimeout(url, { headers: { Authorization: `Bearer ${apiKey}` } }, 8000);
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `HTTP ${res.status}`); }
  const data = await res.json();
  return (data.data || data.models || []).map((m) => ({ id: m.id, label: m.name || m.id, enabled: true, tier: "standard" }));
}

// ΓöÇΓöÇ State Getters & Setters ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const getPrimaryModels = async () => {
  await ensureInit();
  return primaryModels;
};
export const setPrimaryModels = async (models) => {
  await ensureInit();
  primaryModels = models.map((m, i) => ({ ...m, priority: i + 1 }));
  await persistConfig();
};

export const getGeminiModelQueue = async () => {
  await ensureInit();
  return geminiModels;
};
export const setGeminiModelQueue = async (models) => {
  await ensureInit();
  geminiModels = models.map((m, i) => ({ ...m, priority: i + 1 }));
  await persistConfig();
};

export const setCustomApiKey = async (key) => {
  if (key && typeof key === "string" && key.trim()) {
    customApiKey = key.trim();
  } else if (key === null || key === "") {
    customApiKey = null;
  }
  await persistConfig();
};

export const getProvidersActive = () => ({
  primary: primaryActive,
  gemini: geminiActive,
  static: staticActive,
});

export const setProvidersActive = async ({ primary, gemini, static: stat }) => {
  if (primary !== undefined) primaryActive = !!primary;
  if (gemini !== undefined)  geminiActive  = !!gemini;
  if (stat !== undefined)    staticActive  = !!stat;
  await persistConfig();
};

// ΓöÇΓöÇ Non-blocking log ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function logAsync(data) {
  prisma.aiLog.create({ data }).catch((e) =>
    console.warn("[AI Engine] Log write failed:", e.message)
  );
}

// ΓöÇΓöÇ Fetch with timeout ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
async function fetchWithTimeout(url, options, ms = 10000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

// ΓöÇΓöÇ Primary AI Call (OpenAI-compatible) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
async function callPrimaryAI(modelId, messages) {
  const apiKey = await getPrimaryApiKey();
  if (!apiKey) throw new Error("Primary AI API key is not configured");

  const baseUrl = getBaseUrl().replace(/\/+$/, "");
  const url = `${baseUrl}/chat/completions`;

  const res = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        messages,
        max_tokens: 450,
        temperature: 0.7,
      }),
    },
    7000 // 7s timeout
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || err.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error("Empty response from AI Provider");
  return { reply, tokens: data.usage?.total_tokens ?? null };
}

// ΓöÇΓöÇ Gemini Call ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
async function callGemini(systemPrompt, history, userMessage, modelId) {
  if (!process.env.GEMINI_API_KEY) throw new Error("Gemini API key is not configured");

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
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
    setTimeout(() => rej(new Error(`Gemini timeout (${modelId})`)), 9000)
  );

  const chat = model.startChat({ history: geminiHistory });
  const result = await Promise.race([chat.sendMessage(userMessage), timeout]);
  const reply = result.response.text()?.trim();
  if (!reply) throw new Error(`Empty response from Gemini/${modelId}`);
  return { reply };
}

// ΓöÇΓöÇ Static Fallback ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const STATIC_FALLBACKS = [
  "Thank you for reaching out to HAVI'S DESIGN! We specialize in premium interior design and renovation in Addis Ababa. Would you like to book a free consultation? [Book Consultation]",
  "Great question! Our team would love to help with your design project. Our services start from ETB 15,000 per room. Let's schedule a free consultation to discuss your vision! [Book Consultation]",
  "We offer interior design, renovation, office design, and commercial construction across Addis Ababa. Click below to book your free first consultation with us! [Book Consultation]",
  "HAVI'S DESIGN has over 10 years of experience delivering beautiful spaces. Click below to schedule a chat with our design team. [Book Consultation] [Button: View Portfolio|/portfolio]",
  "Our expert designers are ready to transform your space! From concept to completion, we handle everything. Click below to book a free first session. [Book Consultation]",
];

const getStaticFallback = () =>
  STATIC_FALLBACKS[Math.floor(Math.random() * STATIC_FALLBACKS.length)];

// ΓöÇΓöÇ Core: Generate Reply ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export async function generateReply(systemPrompt, history, userMessage, sessionId = null) {
  await ensureInit();
  const errors = [];

  // Build messages once, reused across all providers
  const formattedMessages = [
    { role: "system", content: systemPrompt },
    ...history
      .filter((m) => m.content?.trim())
      .map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    { role: "user", content: userMessage },
  ];

  // ─── Step 1: Primary AI (DeepSeek v4-flash, DeepSeek v4.1, etc.) ─────────
  const apiKey = await getPrimaryApiKey();
  if (primaryActive && apiKey && primaryModels.length > 0) {
    const tryModels = primaryModels.filter((m) => m.enabled);
    for (const model of tryModels) {
      const start = Date.now();
      try {
        const { reply, tokens } = await callPrimaryAI(model.id, formattedMessages);
        const latencyMs = Date.now() - start;
        logAsync({
          provider: "primary", model: model.id,
          prompt: userMessage.slice(0, 500), response: reply.slice(0, 1000),
          tokens, latencyMs, success: true, sessionId,
        });
        return { reply, provider: "primary", model: model.id };
      } catch (err) {
        const latencyMs = Date.now() - start;
        errors.push(`Primary/${model.id}: ${err.message}`);
        logAsync({
          provider: "primary", model: model.id,
          prompt: userMessage.slice(0, 500), latencyMs,
          success: false, errorMsg: err.message.slice(0, 400), sessionId,
        });
        if (err.message?.toLowerCase().includes("balance")) break;
      }
    }
  }

  // ─── Step 2: Custom Providers (in priority order) ─────────────────────────
  const activeCustom = customProviders
    .filter((p) => p.active && p.baseUrl && p.apiKey && Array.isArray(p.models) && p.models.length > 0)
    .sort((a, b) => (a.priority || 99) - (b.priority || 99));
  for (const cp of activeCustom) {
    for (const model of cp.models.filter((m) => m.enabled)) {
      const start = Date.now();
      try {
        const res = await fetchWithTimeout(
          `${cp.baseUrl.replace(/\/+$/, "")}/chat/completions`,
          { method: "POST",
            headers: { Authorization: `Bearer ${cp.apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: model.id, messages: formattedMessages, max_tokens: 450, temperature: 0.7 }) },
          8000
        );
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `HTTP ${res.status}`); }
        const data  = await res.json();
        const reply = data.choices?.[0]?.message?.content?.trim();
        if (!reply) throw new Error("Empty response from custom provider");
        logAsync({ provider: `custom:${cp.id}`, model: model.id, prompt: userMessage.slice(0, 500),
          response: reply.slice(0, 1000), tokens: data.usage?.total_tokens ?? null,
          latencyMs: Date.now() - start, success: true, sessionId });
        return { reply, provider: `custom:${cp.id}`, model: model.id };
      } catch (err) {
        logAsync({ provider: `custom:${cp.id}`, model: model.id, prompt: userMessage.slice(0, 500),
          latencyMs: Date.now() - start, success: false, errorMsg: err.message.slice(0, 400), sessionId });
      }
    }
  }

  // ─── Step 3: Gemini Fallback ─────────────────────────────────────────────
  if (geminiActive && process.env.GEMINI_API_KEY && geminiModels.length > 0) {
    const tryGemini = geminiModels.filter((m) => m.enabled).slice(0, 2);

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

  // ΓöÇΓöÇΓöÇ Step 3: Static Fallback ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  if (staticActive) {
    const reply = getStaticFallback();
    logAsync({
      provider: "static", model: "static-fallback",
      prompt: userMessage.slice(0, 500), response: reply,
      latencyMs: 0, success: true, sessionId,
    });

    if (errors.length) {
      console.warn("[AI Engine] Fallbacks used. Errors:", errors.join(" | "));
    }

    return { reply, provider: "static", model: "static-fallback" };
  } else {
    const reply = "Our AI Assistant support is temporarily unavailable. If you would like to schedule a free design consultation, please click below. [Book Consultation]";
    logAsync({
      provider: "suspended", model: "none",
      prompt: userMessage.slice(0, 500), response: reply,
      latencyMs: 0, success: true, sessionId,
    });
    return { reply, provider: "suspended", model: "none" };
  }
}

// ΓöÇΓöÇ Provider Status (Base URL strictly hidden from output) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export async function getProviderStatus() {
  await ensureInit();
  const results = [];
  const apiKey = await getPrimaryApiKey();

  // Test Primary Provider (DeepSeek / OpenAI-compatible)
  if (apiKey) {
    const start = Date.now();
    try {
      const baseUrl = getBaseUrl().replace(/\/+$/, "");
      const res = await fetchWithTimeout(
        `${baseUrl}/models`,
        { headers: { Authorization: `Bearer ${apiKey}` } },
        6000
      );
      results.push({
        provider: "primary",
        label: "Primary AI",
        status: res.ok ? "online" : "error",
        latencyMs: Date.now() - start,
        models: primaryModels.filter((m) => m.enabled).length,
        totalModels: primaryModels.length,
        configured: true,
        activeModel: primaryModels.find((m) => m.enabled)?.label ?? "None",
        maskedApiKey: maskKey(apiKey),
      });
    } catch (err) {
      results.push({
        provider: "primary",
        label: "Primary AI",
        status: "offline",
        latencyMs: Date.now() - start,
        error: err.message,
        configured: true,
        models: primaryModels.filter((m) => m.enabled).length,
        totalModels: primaryModels.length,
        maskedApiKey: maskKey(apiKey),
      });
    }
  } else {
    results.push({
      provider: "primary",
      label: "Primary AI",
      status: "not-configured",
      configured: false,
      models: 0,
      totalModels: primaryModels.length,
      maskedApiKey: "",
    });
  }

  // Custom providers
  for (const cp of customProviders) {
    if (!cp.active) {
      results.push({ provider: `custom:${cp.id}`, label: cp.label, status: "disabled",
        configured: !!cp.apiKey, models: (cp.models||[]).filter((m) => m.enabled).length,
        totalModels: (cp.models||[]).length, isCustom: true, customId: cp.id }); continue;
    }
    if (!cp.apiKey || !cp.baseUrl) {
      results.push({ provider: `custom:${cp.id}`, label: cp.label, status: "not-configured",
        configured: false, models: 0, totalModels: (cp.models||[]).length, isCustom: true, customId: cp.id }); continue;
    }
    const cpStart = Date.now();
    try {
      const cpRes = await fetchWithTimeout(`${cp.baseUrl.replace(/\/+$/, "")}/models`,
        { headers: { Authorization: `Bearer ${cp.apiKey}` } }, 6000);
      results.push({ provider: `custom:${cp.id}`, label: cp.label,
        status: cpRes.ok ? "online" : "error", latencyMs: Date.now() - cpStart,
        models: (cp.models||[]).filter((m) => m.enabled).length, totalModels: (cp.models||[]).length,
        configured: true, activeModel: (cp.models||[]).find((m) => m.enabled)?.label ?? "None",
        isCustom: true, customId: cp.id });
    } catch (err) {
      results.push({ provider: `custom:${cp.id}`, label: cp.label, status: "offline",
        latencyMs: Date.now() - cpStart, error: err.message, configured: true,
        models: (cp.models||[]).filter((m) => m.enabled).length, totalModels: (cp.models||[]).length,
        isCustom: true, customId: cp.id });
    }
  }

  // Test Gemini
  if (process.env.GEMINI_API_KEY) {
    const start = Date.now();
    try {
      const res = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`,
        {},
        6000
      );
      results.push({
        provider: "gemini",
        label: "Gemini AI",
        status: res.ok ? "online" : "error",
        latencyMs: Date.now() - start,
        models: geminiModels.filter((m) => m.enabled).length,
        totalModels: geminiModels.length,
        configured: true,
        activeModel: geminiModels.find((m) => m.enabled)?.label ?? "None",
      });
    } catch (err) {
      results.push({
        provider: "gemini",
        label: "Gemini AI",
        status: "offline",
        latencyMs: Date.now() - start,
        error: err.message,
        configured: true,
      });
    }
  } else {
    results.push({ provider: "gemini", label: "Gemini AI", status: "not-configured", configured: false });
  }

  // Static
  results.push({
    provider: "static",
    label: "Static Fallback",
    status: "always-online",
    configured: true,
    models: STATIC_FALLBACKS.length,
    totalModels: STATIC_FALLBACKS.length,
  });

  return results;
}

// ΓöÇΓöÇ AI Usage Stats ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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
