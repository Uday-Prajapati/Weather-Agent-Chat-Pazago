import express from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'weather-backend' });
});

app.post('/api/mastra-weather', async (req, res) => {
  try {
    const { message, threadId } = req.body || {};
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

    res.json({ content });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown server error' });
  }
});

// Full weather details via Open-Meteo (no API key required)
app.post('/api/weather-full', async (req, res) => {
  try {
    const { message, city } = req.body || {};
    const raw = (message || city || '').toString().trim();
    if (!raw) return res.status(400).json({ error: 'Missing city or message' });

    const extractCity = (input) => {
      const cleaned = input
        .replace(/[?.!]/g, ' ')
        .replace(/[“”"']/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const lower = cleaned.toLowerCase();
      const preps = [' in ', ' at ', ' for ', ' of '];
      for (const p of preps) {
        const idx = lower.lastIndexOf(p);
        if (idx !== -1) {
          const cand = cleaned.substring(idx + p.length).trim();
          if (cand) return cand;
        }
      }
      const parts = cleaned.split(' ');
      return parts[parts.length - 1] || cleaned;
    };

    const text = extractCity(raw);

    // Resolve city to lat/lon
    const geoUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
    geoUrl.searchParams.set('name', text);
    geoUrl.searchParams.set('count', '1');
    geoUrl.searchParams.set('language', 'en');
    const geoResp = await fetch(geoUrl);
    if (!geoResp.ok) return res.status(502).json({ error: `Geocoding failed: ${geoResp.status}` });
    const geo = await geoResp.json();
    const loc = geo?.results?.[0];
    if (!loc) return res.status(404).json({ error: `City not found for "${text}"` });

    const { latitude, longitude, name, country, timezone } = loc;

    // Fetch current, hourly (precip), and daily (7-day)
    const weatherUrl = new URL('https://api.open-meteo.com/v1/forecast');
    weatherUrl.searchParams.set('latitude', String(latitude));
    weatherUrl.searchParams.set('longitude', String(longitude));
    weatherUrl.searchParams.set('current', 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m');
    weatherUrl.searchParams.set('hourly', 'temperature_2m,precipitation_probability,weather_code');
    weatherUrl.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max');
    weatherUrl.searchParams.set('timezone', timezone || 'auto');
    const wxResp = await fetch(weatherUrl);
    if (!wxResp.ok) return res.status(502).json({ error: `Weather fetch failed: ${wxResp.status}` });
    const wx = await wxResp.json();

    const codeDesc = (code) => {
      const map = {
        0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
        45: 'Fog', 48: 'Depositing rime fog',
        51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
        61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
        66: 'Freezing rain (light)', 67: 'Freezing rain (heavy)',
        71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
        77: 'Snow grains', 80: 'Rain showers (slight)', 81: 'Rain showers (moderate)', 82: 'Rain showers (violent)',
        85: 'Snow showers (slight)', 86: 'Snow showers (heavy)',
        95: 'Thunderstorm (slight/moderate)', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail',
      };
      return map[code] || 'Unknown conditions';
    };

    const current = wx.current || wx.current_weather || {};
    const nowTemp = current.temperature_2m ?? current.temperature;
    const nowApp = current.apparent_temperature ?? null;
    const nowWind = current.wind_speed_10m ?? current.windspeed ?? null;
    const nowHumid = current.relative_humidity_2m ?? null;
    const nowDesc = codeDesc(current.weather_code);

    // Next 24h rain probabilities summary
    const hours = wx.hourly || {};
    const times = hours.time || [];
    const probs = hours.precipitation_probability || [];
    const next24 = [];
    const now = Date.now();
    for (let i = 0; i < times.length; i++) {
      const t = new Date(times[i]).getTime();
      if (t >= now && t <= now + 24 * 3600 * 1000) {
        next24.push({ time: times[i], precipitation_probability: probs[i] ?? null });
      }
    }
    const maxRainNext24 = next24.reduce((m, x) => Math.max(m, x.precipitation_probability ?? 0), 0);

    // 7-day outlook
    const daily = wx.daily || {};
    const days = [];
    const dTimes = daily.time || [];
    for (let i = 0; i < dTimes.length; i++) {
      days.push({
        date: dTimes[i],
        min: daily.temperature_2m_min?.[i] ?? null,
        max: daily.temperature_2m_max?.[i] ?? null,
        rain: daily.precipitation_probability_max?.[i] ?? null,
        desc: codeDesc(daily.weather_code?.[i]),
      });
    }

    const summary = `Current weather in ${name}, ${country}: ${nowTemp != null ? `${nowTemp}°C` : 'N/A'}${nowApp != null ? ` (feels like ${nowApp}°C)` : ''}, ${nowDesc}${nowWind != null ? `, wind ${nowWind} km/h` : ''}${nowHumid != null ? `, humidity ${nowHumid}%` : ''}. Rain chance next 24h up to ${maxRainNext24}%. Weekly: ` + days.slice(0,7).map(d => `${d.date}: ${d.min ?? '–'}–${d.max ?? '–'}°C, rain ${d.rain ?? 0}% (${d.desc})`).join('; ') + '.';

    res.json({
      location: { name, country, latitude, longitude, timezone },
      current: { temperature: nowTemp, apparent: nowApp, wind: nowWind, humidity: nowHumid, code: current.weather_code, description: nowDesc },
      next24h: next24,
      weekly: days,
      content: summary,
      raw: wx,
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown server error' });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Weather backend listening on http://localhost:${PORT}`);
});


