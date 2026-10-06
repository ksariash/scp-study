const AUDIO_PREFIX = '/audio/';
const CURRENT_AUDIO_PREFIX = 'audio/2026-summer/';
const LEGACY_AUDIO_PREFIX = 'audio/';

function audioObjectKey(pathname) {
  if (!pathname.startsWith(AUDIO_PREFIX)) return null;
  let decoded;
  try { decoded = decodeURIComponent(pathname); }
  catch (_) { return null; }
  const key = decoded.replace(/^\/+/, '');
  if (!key.startsWith('audio/') || key.includes('..') || key.includes('\\')) return null;
  return key;
}

function audioContentType(key) {
  const lower = String(key || '').toLowerCase();
  if (lower.endsWith('.m4a') || lower.endsWith('.mp4')) return 'audio/mp4';
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.aac')) return 'audio/aac';
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.ogg')) return 'audio/ogg';
  return 'application/octet-stream';
}

function baseAudioHeaders(object, key) {
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Content-Type', audioContentType(key));
  headers.set('Content-Disposition', 'inline');
  headers.set('ETag', object.httpEtag);
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('X-SCP-Audio-Route', 'r2');
  headers.set('X-SCP-Audio-Key', key);
  if (object.uploaded) headers.set('Last-Modified', object.uploaded.toUTCString());
  return headers;
}

function candidateAudioKeys(key) {
  const keys = [key];
  keys.push('/' + key);
  if (key.startsWith(CURRENT_AUDIO_PREFIX)) {
    const filename = key.slice(CURRENT_AUDIO_PREFIX.length);
    if (filename && !filename.includes('/')) {
      keys.push(LEGACY_AUDIO_PREFIX + filename, '/' + LEGACY_AUDIO_PREFIX + filename);
    }
  }
  return [...new Set(keys)];
}

function parseByteRange(value, size) {
  const raw = String(value || '').trim();
  if (!raw || !Number.isFinite(size) || size <= 0) return null;
  if (raw.includes(',')) return { invalid: true };
  const match = /^bytes=(\d*)-(\d*)$/i.exec(raw);
  if (!match || (!match[1] && !match[2])) return { invalid: true };

  let start;
  let end;
  if (!match[1]) {
    const suffix = Number(match[2]);
    if (!Number.isInteger(suffix) || suffix <= 0) return { invalid: true };
    const length = Math.min(size, suffix);
    start = size - length;
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : size - 1;
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || start >= size || end < start) {
      return { invalid: true };
    }
    end = Math.min(end, size - 1);
  }

  return { start, end, length: end - start + 1 };
}

async function serveAudio(request, env, key) {
  const candidates = candidateAudioKeys(key);

  if (request.method === 'HEAD') {
    for (const candidate of candidates) {
      const object = await env.AUDIO.head(candidate);
      if (!object) continue;
      const headers = baseAudioHeaders(object, candidate);
      headers.set('Content-Length', String(object.size));
      return new Response(null, { status: 200, headers });
    }
    return new Response('Not found', { status: 404, headers: { 'X-SCP-Audio-Requested-Key': key } });
  }

  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  }

  const rangeHeader = request.headers.get('Range');
  if (rangeHeader) {
    for (const candidate of candidates) {
      const metadata = await env.AUDIO.head(candidate);
      if (!metadata) continue;
      const range = parseByteRange(rangeHeader, Number(metadata.size));
      if (!range || range.invalid) {
        return new Response('Requested range not satisfiable', {
          status: 416,
          headers: {
            'Accept-Ranges': 'bytes',
            'Content-Range': `bytes */${metadata.size}`,
            'X-SCP-Audio-Key': candidate
          }
        });
      }
      const object = await env.AUDIO.get(candidate, { range: { offset: range.start, length: range.length } });
      if (!object || !('body' in object)) continue;
      const headers = baseAudioHeaders(object, candidate);
      headers.set('Content-Range', `bytes ${range.start}-${range.end}/${metadata.size}`);
      headers.set('Content-Length', String(range.length));
      return new Response(object.body, { status: 206, headers });
    }
    return new Response('Not found', { status: 404, headers: { 'X-SCP-Audio-Requested-Key': key } });
  }

  for (const candidate of candidates) {
    const object = await env.AUDIO.get(candidate);
    if (!object || !('body' in object)) continue;
    const headers = baseAudioHeaders(object, candidate);
    headers.set('Content-Length', String(object.size));
    return new Response(object.body, { status: 200, headers });
  }

  return new Response('Not found', { status: 404, headers: { 'X-SCP-Audio-Requested-Key': key } });
}

function suggestedChaburaRegion(cf = {}) {
  const country = String(cf.country || '').toUpperCase();
  const continent = String(cf.continent || '').toUpperCase();
  const timezone = String(cf.timezone || '');

  if (country === 'IL') return 'Israel';
  if (country === 'CA') return 'Canada';
  if (country === 'US') {
    const easternZones = new Set([
      'America/New_York',
      'America/Detroit',
      'America/Indiana/Indianapolis',
      'America/Indiana/Marengo',
      'America/Indiana/Vevay',
      'America/Indiana/Vincennes',
      'America/Indiana/Winamac',
      'America/Kentucky/Louisville',
      'America/Kentucky/Monticello'
    ]);
    return easternZones.has(timezone) ? 'East Coast (EST)' : 'Central/West Coast';
  }
  if (continent === 'EU' || ['GB','IE','FR','DE','ES','IT','NL','BE','CH','AT','PT','SE','NO','DK','FI','PL','CZ','HU','RO','GR'].includes(country)) {
    return 'Europe';
  }
  if (country === 'AU' || country === 'ZA' || continent === 'SA') {
    return 'Australia/South Africa/South America';
  }
  return null;
}

function clientLocationResponse(request) {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405, headers: { Allow:'GET' } });
  }
  return new Response(JSON.stringify({ suggestedChaburaRegion: suggestedChaburaRegion(request.cf || {}) }), {
    headers: {
      'Content-Type':'application/json; charset=utf-8',
      'Cache-Control':'no-store',
      'X-Robots-Tag':'noindex, nofollow'
    }
  });
}

const SHELL_STYLE_PATHS = [
  'ui-system.css',
  'test-mode.css',
  'test-mode-polish.css',
  'chabura-ui.css'
];
const SHELL_SCRIPT_PATHS = [
  'ui-system.js',
  'chabura-ui.js',
  'test-mode.js',
  'test-mode-polish.js',
  'test-analytics-retry.js'
];
const SHELL_CACHE_NAME = 'scp-study-v75-ui9';

function cloneAssetResponse(response, body, contentType = null) {
  const headers = new Headers(response.headers);
  headers.delete('Content-Length');
  if (contentType) headers.set('Content-Type', contentType);
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

async function enhanceHtmlShell(response) {
  if (!response.ok) return response;
  let html = await response.text();
  for (const path of SHELL_STYLE_PATHS) {
    if (html.includes(`href="${path}"`) || html.includes(`href="./${path}"`)) continue;
    html = html.replace('</head>', `  <link rel="stylesheet" href="${path}" />\n</head>`);
  }
  for (const path of SHELL_SCRIPT_PATHS) {
    if (html.includes(`src="${path}"`) || html.includes(`src="./${path}"`)) continue;
    html = html.replace('</body>', `  <script src="${path}"></script>\n</body>`);
  }
  return cloneAssetResponse(response, html, 'text/html; charset=utf-8');
}

async function enhanceServiceWorker(response) {
  if (!response.ok) return response;
  let source = await response.text();
  source = source.replace(/const CACHE_NAME = 'scp-study-v75-ui\d+';/, `const CACHE_NAME = '${SHELL_CACHE_NAME}';`);
  if (!source.includes("'./chabura-ui.css'")) {
    source = source.replace("  './ui-system.css',", "  './ui-system.css',\n  './chabura-ui.css',");
  }
  if (!source.includes("'./chabura-ui.js'")) {
    source = source.replace("  './ui-system.js',", "  './ui-system.js',\n  './chabura-ui.js',");
  }
  if (!source.includes("'./test-analytics-retry.js'")) {
    source = source.replace("  './test-mode-polish.js',", "  './test-mode-polish.js',\n  './test-analytics-retry.js',");
  }
  return cloneAssetResponse(response, source, 'application/javascript; charset=utf-8');
}

async function serveAsset(request, env, url) {
  const response = await env.ASSETS.fetch(request);
  if (request.method !== 'GET') return response;
  if ((url.pathname === '/' || url.pathname === '/index.html') && response.headers.get('Content-Type')?.includes('text/html')) {
    return enhanceHtmlShell(response);
  }
  if (url.pathname === '/sw.js') return enhanceServiceWorker(response);
  return response;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/client-location') return clientLocationResponse(request);
    const key = audioObjectKey(url.pathname);
    if (key) return serveAudio(request, env, key);
    return serveAsset(request, env, url);
  }
};
