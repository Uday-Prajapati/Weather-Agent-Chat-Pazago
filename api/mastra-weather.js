// Vercel Serverless Function: /api/mastra-weather

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { message, threadId } = (req.body || {});
    const text = (message || '').toString().trim();
    const thread = (threadId || '70').toString();
    if (!text) {
      return res.status(400).json({ error: 'Missing message' });
    }

    const endpoint = 'https://brief-thousands-sunset-9fcb1c78-485f-4967-ac04-2759a8fa1462.mastra.cloud/api/agents/weatherAgent/stream';
    const body = {
      messages: [{ role: 'user', content: text }],
      runId: 'weatherAgent',
      maxRetries: 2,
      maxSteps: 5,
      temperature: 0.5,
      topP: 1,
      runtimeContext: {},
      threadId: thread,
      resourceId: 'weatherAgent',
    };

    const headers = {
      'Accept': '*/*',
      'Content-Type': 'application/json',
      'x-mastra-dev-playground': 'true',
    };
    if (process.env.BACKEND_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.BACKEND_API_KEY}`;
    }

    const upstream = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });
    const textResp = await upstream.text();

    // Best-effort parse of JSON/JSONL stream
    let content = '';
    try {
      const obj = JSON.parse(textResp);
      if (obj?.output?.[0]?.content) content = obj.output[0].content;
    } catch {
      const lines = textResp.split(/\r?\n/);
      for (const line of lines) {
        const t = line.trim();
        if (!t) continue;
        try {
          const o = JSON.parse(t);
          if (typeof o?.delta === 'string') content += o.delta;
          else if (o?.output?.[0]?.content) content = o.output[0].content;
        } catch {}
      }
    }

    if (!content) content = textResp || 'No content received';

    res.status(200).json({ content });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown server error' });
  }
}


