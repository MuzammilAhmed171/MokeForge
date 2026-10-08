import type { Asset } from '../types';
import { uid } from '../templates';

export type CaptureViewport = 'desktop' | 'mobile' | 'tablet';

export interface ViewportOption {
  id: CaptureViewport;
  label: string;
  sublabel: string;
  icon: string;
  width: number;
  height: number;
  description: string;
  deviceMatch: string;
}

export const VIEWPORT_OPTIONS: ViewportOption[] = [
  {
    id: 'desktop',
    label: 'Desktop / Laptop',
    sublabel: '1440 × 900 px',
    icon: '💻',
    width: 1440,
    height: 900,
    description: 'Perfect for MacBook, Laptop & Browser Window mockups',
    deviceMatch: 'laptop, browser, monitor'
  },
  {
    id: 'mobile',
    label: 'Mobile Screen',
    sublabel: '390 × 844 px',
    icon: '📱',
    width: 390,
    height: 844,
    description: 'Perfect for iPhone & Android Smartphone mockups',
    deviceMatch: 'phone'
  },
  {
    id: 'tablet',
    label: 'Tablet / iPad',
    sublabel: '820 × 1180 px',
    icon: '📟',
    width: 820,
    height: 1180,
    description: 'Perfect for iPad & Tablet mockups',
    deviceMatch: 'tablet'
  }
];

export function cleanAndFormatUrl(raw: string): string {
  let url = raw.trim();
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  return url;
}

export function extractDomain(rawUrl: string): string {
  try {
    const formatted = cleanAndFormatUrl(rawUrl);
    const parsed = new URL(formatted);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return rawUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] || 'Website';
  }
}

/**
 * Load an image from URL and convert to local high-resolution base64 dataUrl
 */
function loadImageToDataUrl(src: string, targetW?: number, targetH?: number): Promise<{ dataUrl: string; w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    // 15 second timeout for image loading
    const timer = setTimeout(() => {
      img.src = '';
      reject(new Error('Image load timed out'));
    }, 15000);

    img.onload = () => {
      clearTimeout(timer);
      try {
        const nw = img.naturalWidth || targetW || 1200;
        const nh = img.naturalHeight || targetH || 800;

        const max = 1600;
        const sc = Math.min(1, max / Math.max(nw, nh));
        const w = Math.max(1, Math.round(nw * sc));
        const h = Math.max(1, Math.round(nh * sc));

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.90);
        resolve({ dataUrl, w, h });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error(`Failed to load image from ${src}`));
    };

    img.src = src;
  });
}

/**
 * Try loading image through candidate URLs with fallback
 */
async function loadWithFallbacks(candidateUrls: string[], targetW?: number, targetH?: number): Promise<{ dataUrl: string; w: number; h: number }> {
  let lastError: any = null;
  for (const url of candidateUrls) {
    try {
      return await loadImageToDataUrl(url, targetW, targetH);
    } catch (err) {
      lastError = err;
      // Try next provider
    }
  }
  throw lastError || new Error('All screenshot providers failed');
}

/**
 * Capture screenshots for requested viewports from a live website URL
 */
export async function captureWebsiteScreenshots(
  targetUrl: string,
  viewports: CaptureViewport[] = ['desktop', 'mobile', 'tablet'],
  onProgress?: (msg: string, percent: number) => void
): Promise<Asset[]> {
  const formattedUrl = cleanAndFormatUrl(targetUrl);
  if (!formattedUrl) {
    throw new Error('Please enter a valid website URL');
  }

  const domain = extractDomain(formattedUrl);
  const assets: Asset[] = [];
  const total = viewports.length;

  onProgress?.(`Connecting to ${domain}...`, 10);

  for (let i = 0; i < viewports.length; i++) {
    const vp = viewports[i];
    const vpMeta = VIEWPORT_OPTIONS.find(v => v.id === vp) || VIEWPORT_OPTIONS[0];
    const basePercent = 15 + Math.round((i / total) * 75);

    onProgress?.(`Rendering ${vpMeta.label} viewport...`, basePercent);

    // Build URL candidates with different high-speed providers
    const candidates: string[] = [];

    if (vp === 'desktop') {
      candidates.push(
        `https://api.microlink.io?url=${encodeURIComponent(formattedUrl)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=1440&viewport.height=900&waitForTimeout=1500`,
        `https://s0.wp.com/mshots/v1/${encodeURIComponent(formattedUrl)}?w=1440&h=900`,
        `https://image.thum.io/get/width/1440/crop/900/${formattedUrl}`
      );
    } else if (vp === 'mobile') {
      candidates.push(
        `https://api.microlink.io?url=${encodeURIComponent(formattedUrl)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=390&viewport.height=844&viewport.isMobile=true&viewport.hasTouch=true&viewport.deviceScaleFactor=2&waitForTimeout=1500`,
        `https://s0.wp.com/mshots/v1/${encodeURIComponent(formattedUrl)}?w=480&h=960`,
        `https://image.thum.io/get/width/480/crop/960/iphone/${formattedUrl}`
      );
    } else if (vp === 'tablet') {
      candidates.push(
        `https://api.microlink.io?url=${encodeURIComponent(formattedUrl)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=820&viewport.height=1180&viewport.isMobile=true&viewport.deviceScaleFactor=2&waitForTimeout=1500`,
        `https://s0.wp.com/mshots/v1/${encodeURIComponent(formattedUrl)}?w=800&h=1100`,
        `https://image.thum.io/get/width/800/crop/1100/${formattedUrl}`
      );
    }

    try {
      const { dataUrl, w, h } = await loadWithFallbacks(candidates, vpMeta.width, vpMeta.height);
      const assetName = `${domain} — ${vpMeta.label.split(' ')[0]}`;
      assets.push({
        id: uid(),
        name: assetName,
        dataUrl,
        w,
        h
      });
    } catch (err) {
      console.warn(`Could not capture ${vp} for ${formattedUrl}:`, err);
    }
  }

  onProgress?.('Optimizing screenshots...', 95);

  if (assets.length === 0) {
    throw new Error(`Could not capture screenshots from ${domain}. Please check if the URL is accessible.`);
  }

  onProgress?.('Screenshots captured successfully!', 100);
  return assets;
}
