const APP_VERSION = 75;
const CACHE_NAME = 'scp-study-v75-ui2';
const AUDIO_CACHE_NAME = 'scp-study-audio-v3';
const DOCUMENT_CACHE_NAME = 'scp-study-documents-v2';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './ui-system.css',
  './cohorts/index.js',
  './cohort-loader.js',
  './ui-system.js',
  './cohorts/2026-summer/cohort.js',
  './cohorts/2026-summer/questions.js',
  './cohorts/2026-summer/chaburos.js',
  './cohorts/2026-summer/audio-reviews.js',
  './cohorts/2026-summer/glossary.js',
  './cohorts/2026-summer/essay-practice.js',
  './cohorts/2026-summer/course-notes.js',
  './pdfjs/pdf.mjs',
  './pdfjs/pdf.worker.mjs',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './images/install-scp-study-ios.png',
  './glossary-audio/glossary-nat-bar-nat.mp3',
  './glossary-audio/glossary-taam-keikar.mp3',
  './glossary-audio/glossary-ben-yomo.mp3',
  './glossary-audio/glossary-eino-ben-yomo.mp3',
  './glossary-audio/glossary-basar-bechalav.mp3',
  './glossary-audio/glossary-lechatchila.mp3',
  './glossary-audio/glossary-bedieved.mp3',
  './glossary-audio/glossary-pagum.mp3',
  './glossary-audio/glossary-pogem.mp3',
  './glossary-audio/glossary-noten-taam-lifgam.mp3',
  './glossary-audio/glossary-davar-charif.mp3',
  './glossary-audio/glossary-kli-rishon.mp3',
  './glossary-audio/glossary-kli-sheini.mp3',
  './glossary-audio/glossary-irui.mp3',
  './glossary-audio/glossary-irui-kli-rishon.mp3',
  './glossary-audio/glossary-kdei-klipa.mp3',
  './glossary-audio/glossary-tataah-gavar.mp3',
  './glossary-audio/glossary-shishim.mp3',
  './glossary-audio/glossary-bitul.mp3',
  './glossary-audio/glossary-ein-mevatlin.mp3',
  './glossary-audio/glossary-sakana.mp3',
  './glossary-audio/glossary-safek-sfeika.mp3',
  './glossary-audio/glossary-yad-soledet.mp3',
  './glossary-audio/glossary-reicha.mp3',
  './glossary-audio/glossary-issur.mp3',
  './glossary-audio/glossary-heter.mp3',
  './glossary-audio/glossary-parve.mp3',
  './glossary-audio/glossary-gezeirah.mp3',
  './glossary-audio/glossary-yayin-nesech.mp3',
  './glossary-audio/glossary-stam-yeinam.mp3',
  './glossary-audio/glossary-maga-akum.mp3',
  './glossary-audio/glossary-akum.mp3',
  './glossary-audio/glossary-mevushal.mp3',
  './glossary-audio/glossary-hamshacha.mp3',
  './glossary-audio/glossary-nitzok.mp3',
  './glossary-audio/glossary-yotzei-venichnas.mp3',
  './glossary-audio/glossary-eivah.mp3',
  './glossary-audio/glossary-kiyuha.mp3',
  './glossary-audio/glossary-chotam-betoch-chotam.mp3'
];

const AUDIO_PATH_RE = /\.(?:m4a|mp3|mp4|aac|wav|ogg)(?:$|\?)/i;
const PDF_PATH_RE = /\.pdf(?:$|\?)/i;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    for (const key of keys) {
      if (!key.startsWith('scp-study-') || key === CACHE_NAME || key === AUDIO_CACHE_NAME || key === DOCUMENT_CACHE_NAME) continue;
      await caches.delete(key);
    }
    await self.clients.claim();
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      try {
        client.postMessage({ type: 'SCP_APP_UPDATED', version: APP_VERSION, cache: CACHE_NAME });
      } catch (_) {}
    }
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

function isAudioRequest(request) {
  try { return AUDIO_PATH_RE.test(new URL(request.url).pathname); }
  catch (_) { return false; }
}

function isPdfRequest(request) {
  try { return PDF_PATH_RE.test(new URL(request.url).pathname); }
  catch (_) { return false; }
}

function parseSingleRange(rangeHeader, size) {
  if (!rangeHeader || !rangeHeader.startsWith('bytes=') || rangeHeader.includes(',')) return null;
  const match = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader.trim());
  if (!match) return null;
  const rawStart = match[1];
  const rawEnd = match[2];
  let start;
  let end;
  if (rawStart === '' && rawEnd === '') return null;
  if (rawStart === '') {
    const suffixLength = Number(rawEnd);
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) return null;
    start = Math.max(0, size - suffixLength);
    end = size - 1;
  } else {
    start = Number(rawStart);
    end = rawEnd === '' ? size - 1 : Number(rawEnd);
  }
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || start >= size || end < start) return null;
  end = Math.min(end, size - 1);
  return { start, end };
}

async function handleAudioRangeRequest(request) {
  const rangeHeader = request.headers.get('range');
  const audioCache = await caches.open(AUDIO_CACHE_NAME);
  const cached = await audioCache.match(request.url);

  // Let the origin/R2 Worker satisfy uncached Range requests directly. This
  // avoids downloading the entire M4A just to answer a small media probe.
  if (!cached || cached.status === 206) return fetch(request);

  const body = await cached.arrayBuffer();
  const size = body.byteLength;
  const range = parseSingleRange(rangeHeader, size);
  if (!range) {
    return new Response(null, {
      status: 416,
      statusText: 'Range Not Satisfiable',
      headers: { 'Content-Range': `bytes */${size}`, 'Accept-Ranges': 'bytes' }
    });
  }

  const { start, end } = range;
  const sliced = body.slice(start, end + 1);
  const headers = new Headers(cached.headers);
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
  headers.set('Content-Length', String(sliced.byteLength));
  headers.delete('Content-Encoding');
  return new Response(sliced, { status: 206, statusText: 'Partial Content', headers });
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const rangeHeader = event.request.headers.get('range');
  if (rangeHeader && isAudioRequest(event.request)) {
    event.respondWith(handleAudioRangeRequest(event.request));
    return;
  }

  if (isPdfRequest(event.request)) {
    event.respondWith((async () => {
      const documentCache = await caches.open(DOCUMENT_CACHE_NAME);
      const cached = await documentCache.match(event.request.url);
      if (cached) return cached;
      return fetch(event.request);
    })());
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request)
        .then(async response => {
          if (response && response.ok && event.request.url.startsWith(self.location.origin)) {
            const targetCache = await caches.open(isAudioRequest(event.request) ? AUDIO_CACHE_NAME : CACHE_NAME);
            targetCache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') return caches.match('./index.html');
          throw new Error('Offline and resource is not cached');
        });
    })
  );
});

self.addEventListener('push', event => {
  event.waitUntil((async () => {
    let payload = {};
    try { payload = event.data ? event.data.json() : {}; } catch (_) {
      payload = { title:'SCP Study', body:event.data?.text?.() || 'You have a new notification.' };
    }
    const data = payload && typeof payload.data === 'object' ? payload.data : {};
    if (data.type === 'sync_request') {
      const windows = await self.clients.matchAll({ type:'window', includeUncontrolled:true });
      for (const client of windows) {
        try { client.postMessage({ type:'SCP_SYNC_REQUEST' }); } catch (_) {}
      }
      return;
    }
    await self.registration.showNotification(payload.title || 'SCP Study', {
      body: payload.body || '',
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png',
      tag: payload.tag || (data.notificationId ? 'scp-' + data.notificationId : undefined),
      data
    });
    const windows = await self.clients.matchAll({ type:'window', includeUncontrolled:true });
    for (const client of windows) {
      try { client.postMessage({ type:'SCP_NOTIFICATION_RECEIVED', notificationId:data.notificationId || null }); } catch (_) {}
    }
  })());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const rawUrl = event.notification?.data?.url || '/?notifications=1';
    const target = new URL(rawUrl, self.location.origin).href;
    const windows = await self.clients.matchAll({ type:'window', includeUncontrolled:true });
    for (const client of windows) {
      if ('focus' in client) {
        try { if ('navigate' in client) await client.navigate(target); } catch (_) {}
        await client.focus();
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(target);
  })());
});
