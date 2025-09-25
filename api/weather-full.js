// Vercel Serverless Function: /api/weather-full
// Ported from server/index.js express handler

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { message, city } = (req.body || {});
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

    const summary = `Current weather in ${name}, ${country}: ${nowTemp != null ? `${nowTemp}°C` : 'N/A'}${nowApp != null ? ` (feels like ${nowApp}°C)` : ''}, ${nowDesc}${nowWind != null ? `, wind ${nowWind} km/h` : ''}${nowHumid != null ? `, humidity ${nowHumid}%` : ''}. Rain chance next 24h up to ${maxRainNext24}%.`;

    res.status(200).json({
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
}


