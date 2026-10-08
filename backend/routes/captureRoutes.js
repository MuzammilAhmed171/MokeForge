import express from 'express';

const router = express.Router();

/**
 * Clean and format URL
 */
function formatUrl(rawUrl) {
  let url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  return url;
}

/**
 * Capture screenshots from URL for specified viewports
 * POST /api/capture
 * Body: { url: string, viewports?: string[] }
 */
router.post('/', async (req, res) => {
  try {
    const { url: rawUrl, viewports = ['desktop', 'mobile', 'tablet'] } = req.body;

    if (!rawUrl || typeof rawUrl !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid website URL'
      });
    }

    const targetUrl = formatUrl(rawUrl);

    // Validate URL syntax
    try {
      new URL(targetUrl);
    } catch {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL format'
      });
    }

    const domain = new URL(targetUrl).hostname.replace(/^www\./, '');
    const results = [];

    const viewportConfigs = {
      desktop: {
        name: `${domain} — Desktop`,
        kind: 'desktop',
        width: 1440,
        height: 900,
        microlinkParams: 'viewport.width=1440&viewport.height=900&viewport.deviceScaleFactor=1',
        mshotsParams: 'w=1440&h=900'
      },
      mobile: {
        name: `${domain} — Mobile`,
        kind: 'mobile',
        width: 390,
        height: 844,
        microlinkParams: 'viewport.width=390&viewport.height=844&viewport.isMobile=true&viewport.hasTouch=true&viewport.deviceScaleFactor=2',
        mshotsParams: 'w=480&h=960'
      },
      tablet: {
        name: `${domain} — Tablet`,
        kind: 'tablet',
        width: 820,
        height: 1180,
        microlinkParams: 'viewport.width=820&viewport.height=1180&viewport.isMobile=true&viewport.deviceScaleFactor=2',
        mshotsParams: 'w=800&h=1100'
      }
    };

    // Process selected viewports
    for (const vp of viewports) {
      const config = viewportConfigs[vp];
      if (!config) continue;

      // Primary source: Microlink API screenshot
      const primaryUrl = `https://api.microlink.io?url=${encodeURIComponent(targetUrl)}&screenshot=true&meta=false&embed=screenshot.url&${config.microlinkParams}&waitForTimeout=1500`;
      
      // Fallback source: WordPress mShots
      const fallbackUrl = `https://s0.wp.com/mshots/v1/${encodeURIComponent(targetUrl)}?${config.mshotsParams}`;

      // Secondary fallback: Thum.io
      const thumUrl = vp === 'mobile' 
        ? `https://image.thum.io/get/width/480/crop/960/iphone/${targetUrl}`
        : `https://image.thum.io/get/width/1440/crop/900/${targetUrl}`;

      results.push({
        id: 'cap_' + Math.random().toString(36).slice(2, 10),
        name: config.name,
        kind: config.kind,
        width: config.width,
        height: config.height,
        url: primaryUrl,
        fallbackUrls: [fallbackUrl, thumUrl]
      });
    }

    return res.json({
      success: true,
      domain,
      targetUrl,
      screenshots: results
    });
  } catch (error) {
    console.error('Screenshot capture error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate website screenshots',
      error: error.message
    });
  }
});

export default router;
