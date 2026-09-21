const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 10_000;
const THUMBNAIL_SIZE = 176;

const ALLOWED_IMAGE_HOSTS = [
  'images.unsplash.com',
  'res.cloudinary.com',
  'r2.orusgallery.com',
];

const ALLOWED_IMAGE_HOST_SUFFIXES = [
  '.r2.dev',
  '.supabase.co',
  '.vercel-storage.com',
];

function configuredR2Host(): string | null {
  const raw = process.env.R2_PUBLIC_URL;
  if (!raw) return null;

  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

function isAllowedRemoteImage(url: URL): boolean {
  if (url.protocol !== 'https:') return false;

  const hostname = url.hostname.toLowerCase();
  const r2Host = configuredR2Host();
  return (
    ALLOWED_IMAGE_HOSTS.includes(hostname)
    || ALLOWED_IMAGE_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix))
    || (r2Host !== null && hostname === r2Host)
  );
}

function bufferFromDataUri(source: string): Buffer | null {
  const match = source.match(/^data:image\/(?:jpe?g|png|webp|gif);base64,([a-zA-Z0-9+/=\s]+)$/);
  if (!match) return null;

  const buffer = Buffer.from(match[1], 'base64');
  return buffer.length > 0 && buffer.length <= MAX_IMAGE_BYTES ? buffer : null;
}

async function fetchRemoteImage(source: string): Promise<Buffer | null> {
  let currentUrl: URL;
  try {
    currentUrl = new URL(source);
  } catch {
    return null;
  }

  for (let redirects = 0; redirects <= 2; redirects += 1) {
    if (!isAllowedRemoteImage(currentUrl)) return null;

    const response = await fetch(currentUrl, {
      cache: 'force-cache',
      redirect: 'manual',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location || redirects === 2) return null;
      currentUrl = new URL(location, currentUrl);
      continue;
    }

    if (!response.ok) return null;

    const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
    if (!contentType.startsWith('image/')) return null;

    const contentLength = Number(response.headers.get('content-length'));
    if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer.length > 0 && buffer.length <= MAX_IMAGE_BYTES ? buffer : null;
  }

  return null;
}

async function loadImageBuffer(source: string): Promise<Buffer | null> {
  if (source.startsWith('data:')) return bufferFromDataUri(source);
  return fetchRemoteImage(source);
}

/**
 * React PDF only renders JPEG and PNG reliably. Admin uploads are stored as
 * WebP, so every artwork image is fetched server-side and converted to a small
 * JPEG data URI before the document is rendered.
 */
export async function preparePdfImage(source: string): Promise<string> {
  if (!source) return '';

  try {
    const input = await loadImageBuffer(source);
    if (!input) return '';

    const sharp = (await import('sharp')).default;
    const jpeg = await sharp(input, {
      animated: false,
      limitInputPixels: 40_000_000,
    })
      .rotate()
      .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
        fit: 'cover',
        position: 'centre',
      })
      .flatten({ background: '#f5f5f5' })
      .jpeg({ quality: 84, mozjpeg: true })
      .toBuffer();

    return `data:image/jpeg;base64,${jpeg.toString('base64')}`;
  } catch {
    // One unavailable/corrupt image must not prevent the full inventory from
    // downloading. The PDF component will render its neutral placeholder.
    return '';
  }
}

export async function preparePdfArtworkImages<T extends { imageUrl: string }>(
  artworks: T[],
  concurrency = 6,
): Promise<T[]> {
  const prepared = new Array<T>(artworks.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < artworks.length) {
      const index = nextIndex;
      nextIndex += 1;
      const artwork = artworks[index];
      prepared[index] = {
        ...artwork,
        imageUrl: await preparePdfImage(artwork.imageUrl),
      };
    }
  }

  const workerCount = Math.min(Math.max(1, concurrency), artworks.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return prepared;
}
