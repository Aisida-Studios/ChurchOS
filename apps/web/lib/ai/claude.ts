// AI provider helper — supports Gemini (free), Groq (free), or Anthropic
// Set ONE of these in apps/web/.env.local:
//   GEMINI_API_KEY=...       (free at aistudio.google.com)
//   GROQ_API_KEY=...         (free at groq.com)
//   ANTHROPIC_API_KEY=...    (paid)

interface Message { role: 'user' | 'assistant'; content: string }

// ── Gemini ────────────────────────────────────────────────────────────────────
async function callGemini(messages: Message[], system?: string, maxTokens = 1000): Promise<string> {
  const key = process.env.GEMINI_API_KEY!
  const model = 'gemini-1.5-flash'  // free tier model
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }))

  const body: any = {
    contents,
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 }
  }
  if (system) {
    body.systemInstruction = { parts: [{ text: system }] }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini error ${res.status}: ${err}`)
  }
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

// ── Groq ──────────────────────────────────────────────────────────────────────
async function callGroq(messages: Message[], system?: string, maxTokens = 1000): Promise<string> {
  const key = process.env.GROQ_API_KEY!
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',  // free on Groq
      max_tokens: maxTokens,
      messages: [
        ...(system ? [{ role: 'system', content: system }] : []),
        ...messages
      ]
    })
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq error ${res.status}: ${err}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

// ── Anthropic ─────────────────────────────────────────────────────────────────
async function callAnthropic(messages: Message[], system?: string, maxTokens = 1000): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY!
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      system: system ?? 'You are a helpful assistant for a church presentation system.',
      messages,
    })
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Anthropic error ${res.status}: ${err}`)
  }
  const data = await res.json()
  return data.content?.[0]?.text ?? ''
}

// ── Router ────────────────────────────────────────────────────────────────────
export async function callClaude(messages: Message[], system?: string, maxTokens = 1000): Promise<string> {
  if (process.env.GEMINI_API_KEY) return callGemini(messages, system, maxTokens)
  if (process.env.GROQ_API_KEY) return callGroq(messages, system, maxTokens)
  if (process.env.ANTHROPIC_API_KEY) return callAnthropic(messages, system, maxTokens)
  throw new Error(
    'No AI API key configured. Add one of these to apps/web/.env.local:\n' +
    '  GEMINI_API_KEY=...  (free at aistudio.google.com)\n' +
    '  GROQ_API_KEY=...    (free at groq.com)\n' +
    '  ANTHROPIC_API_KEY=... (paid)'
  )
}

export async function callClaudeJSON<T = any>(
  messages: Message[], system?: string, maxTokens = 1000
): Promise<T> {
  // Append JSON instruction to ensure clean output
  const jsonMessages: Message[] = [
    ...messages.slice(0, -1),
    {
      role: 'user',
      content: messages[messages.length - 1].content +
        '\n\nIMPORTANT: Return ONLY valid JSON. No markdown, no backticks, no explanation.'
    }
  ]
  const text = await callClaude(jsonMessages, system, maxTokens)
  const clean = text.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim()
  return JSON.parse(clean)
}
