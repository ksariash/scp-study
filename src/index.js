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
  // The copied R2 objects may retain generic application/octet-stream
  // metadata. Browsers, especially Safari/iOS, need a real media MIME type.
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

  // Be tolerant of an R2 object that was created with a literal leading slash.
  keys.push('/' + key);

  // Keep the pre-Zman flat key as a temporary compatibility read. It is never
  // used for writes and can be removed after production audio is verified.
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

      const object = await env.AUDIO.get(candidate, {
        range: { offset: range.start, length: range.length }
      });
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const key = audioObjectKey(url.pathname);
    if (key) return serveAudio(request, env, key);
    return env.ASSETS.fetch(request);
  }
};
