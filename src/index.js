const AUDIO_PREFIX = '/audio/';

function audioObjectKey(pathname) {
  if (!pathname.startsWith(AUDIO_PREFIX)) return null;
  let decoded;
  try { decoded = decodeURIComponent(pathname); }
  catch (_) { return null; }
  const key = decoded.replace(/^\/+/, '');
  if (!key.startsWith('audio/') || key.includes('..') || key.includes('\\')) return null;
  return key;
}

function baseAudioHeaders(object) {
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('ETag', object.httpEtag);
  headers.set('Accept-Ranges', 'bytes');
  if (object.uploaded) headers.set('Last-Modified', object.uploaded.toUTCString());
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'audio/mp4');
  if (!headers.has('Cache-Control')) headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  return headers;
}

function returnedRange(object) {
  if (!object.range) return null;
  const size = Number(object.size) || 0;
  let start = 0;
  let length = 0;

  if (Number.isFinite(object.range.offset)) {
    start = Number(object.range.offset);
    length = Number.isFinite(object.range.length) ? Number(object.range.length) : Math.max(0, size - start);
  } else if (Number.isFinite(object.range.suffix)) {
    length = Math.min(size, Number(object.range.suffix));
    start = Math.max(0, size - length);
  } else if (Number.isFinite(object.range.length)) {
    length = Math.min(size, Number(object.range.length));
  }

  if (!length) return null;
  return { start, end: start + length - 1, length, size };
}

async function serveAudio(request, env, key) {
  if (request.method === 'HEAD') {
    const object = await env.AUDIO.head(key);
    if (!object) return new Response('Not found', { status: 404 });
    const headers = baseAudioHeaders(object);
    headers.set('Content-Length', String(object.size));
    return new Response(null, { status: 200, headers });
  }

  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  }

  const hasRange = request.headers.has('Range');
  let object;
  try {
    object = await env.AUDIO.get(key, hasRange ? { range: request.headers } : undefined);
  } catch (_) {
    return new Response('Requested range not satisfiable', {
      status: 416,
      headers: { 'Accept-Ranges': 'bytes' }
    });
  }

  if (!object) return new Response('Not found', { status: 404 });

  const headers = baseAudioHeaders(object);
  const range = returnedRange(object);
  if (hasRange && range) {
    headers.set('Content-Range', `bytes ${range.start}-${range.end}/${range.size}`);
    headers.set('Content-Length', String(range.length));
    return new Response(object.body, { status: 206, headers });
  }

  headers.set('Content-Length', String(object.size));
  return new Response(object.body, { status: 200, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const key = audioObjectKey(url.pathname);
    if (key) return serveAudio(request, env, key);
    return env.ASSETS.fetch(request);
  }
};
