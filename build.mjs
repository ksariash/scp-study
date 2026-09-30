import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { gunzipSync } from 'node:zlib';

const ROOT = new URL('.', import.meta.url);
const sourceDir = new URL('./public-src/', ROOT);
const outputDir = new URL('./public/', ROOT);
const assetsDir = new URL('./assets/', ROOT);

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
await cp(sourceDir, outputDir, { recursive: true });

let encoded = '';
for (let i = 1; ; i++) {
  const part = new URL(`./static-binaries.tar.gz.b64.${String(i).padStart(2, '0')}.part`, assetsDir);
  try { encoded += await readFile(part, 'utf8'); }
  catch (error) { if (error?.code === 'ENOENT') break; throw error; }
}
if (!encoded) throw new Error('No static binary asset bundle parts found.');
const tar = gunzipSync(Buffer.from(encoded, 'base64'));
let offset = 0;
while (offset + 512 <= tar.length) {
  const header = tar.subarray(offset, offset + 512);
  if (header.every(byte => byte === 0)) break;

  const readString = (start, length) => header.subarray(start, start + length).toString('utf8').replace(/\0.*$/, '');
  const name = readString(0, 100);
  const prefix = readString(345, 155);
  const fullName = prefix ? `${prefix}/${name}` : name;
  const sizeText = readString(124, 12).trim();
  const size = sizeText ? Number.parseInt(sizeText, 8) : 0;
  const type = String.fromCharCode(header[156] || 48);
  const safeName = fullName.replace(/^\.\//, '');

  if (!safeName || safeName.startsWith('/') || safeName.split('/').includes('..')) {
    throw new Error(`Unsafe tar path: ${fullName}`);
  }

  const destination = new URL(`./${safeName}`, outputDir);
  if (type === '5') {
    await mkdir(destination, { recursive: true });
  } else if (type === '0' || type === '\0') {
    await mkdir(dirname(destination.pathname), { recursive: true });
    await writeFile(destination, tar.subarray(offset + 512, offset + 512 + size));
  }

  offset += 512 + Math.ceil(size / 512) * 512;
}

console.log('Built SCP Study static assets. Short & Sweet review audio remains in R2.');
