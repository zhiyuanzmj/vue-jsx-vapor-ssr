import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Cache for loaded assets
let cache = {
  templateHtml: null,
  manifest: null,
  render: null,
};

async function loadAssets() {
  if (cache.templateHtml && cache.manifest && cache.render) {
    return cache;
  }

  try {
    const distPath = path.resolve(__dirname, '../dist');

    // Load HTML template
    const templatePath = path.join(distPath, 'client/index.html');
    console.log('[SSR] Loading template from:', templatePath);
    cache.templateHtml = await fs.readFile(templatePath, 'utf-8');

    // Load SSR manifest
    const manifestPath = path.join(distPath, 'client/.vite/ssr-manifest.json');
    console.log('[SSR] Loading manifest from:', manifestPath);
    cache.manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));

    // Load server render function
    const serverPath = path.join(distPath, 'server/entry-server.js');
    console.log('[SSR] Loading server module from:', serverPath);
    const serverModule = await import(serverPath);
    cache.render = serverModule.render;

    console.log('[SSR] ✓ Assets loaded successfully');
    return cache;
  } catch (error) {
    console.error('[SSR] ❌ Failed to load assets:', error);
    throw error;
  }
}

export default async (req, res) => {
  try {
    // Only handle GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Load assets
    const { templateHtml, manifest, render } = await loadAssets();

    // Get URL path
    const url = req.url || '/';
    console.log('[SSR] Rendering:', url);

    // Execute SSR render
    const rendered = await render(url, manifest);

    // Replace placeholders with rendered content
    const html = templateHtml
      .replace(`<!--app-head-->`, rendered.head ?? '')
      .replace(`<!--app-html-->`, rendered.html ?? '');

    // Set response headers
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=3600');

    return res.status(200).send(html);
  } catch (error) {
    console.error('[SSR] ❌ Render error:', error);

    // Return detailed error page
    const errorHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Server Error</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      padding: 40px;
      max-width: 800px;
      width: 100%;
    }
    h1 {
      color: #d32f2f;
      margin-bottom: 10px;
      font-size: 28px;
    }
    .subtitle {
      color: #666;
      margin-bottom: 30px;
      font-size: 14px;
    }
    .section {
      margin: 30px 0;
      padding: 20px;
      background: #f5f5f5;
      border-left: 4px solid #2196f3;
      border-radius: 4px;
    }
    .section-title {
      font-weight: 600;
      color: #1976d2;
      margin-bottom: 10px;
      font-size: 14px;
      text-transform: uppercase;
    }
    .section-content {
      font-family: "Courier New", monospace;
      font-size: 12px;
      color: #333;
      white-space: pre-wrap;
      word-wrap: break-word;
      background: white;
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;
      line-height: 1.5;
    }
    .checklist {
      list-style: none;
      padding: 0;
    }
    .checklist li {
      padding: 8px 0;
      color: #666;
      font-size: 13px;
    }
    .checklist li:before {
      content: "→ ";
      color: #2196f3;
      font-weight: bold;
      margin-right: 8px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      color: #999;
      font-size: 12px;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>⚠️ Server Error 500</h1>
    <p class="subtitle">Something went wrong during SSR rendering</p>

    <div class="section">
      <div class="section-title">Error Message</div>
      <div class="section-content">${(error.message || 'Unknown error').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    </div>

    <div class="section">
      <div class="section-title">Stack Trace</div>
      <div class="section-content">${(error.stack || 'No stack trace available').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    </div>

    <div class="section">
      <div class="section-title">Debug Info</div>
      <div class="section-content">Request URL: ${req.url}
Request Method: ${req.method}
Time: ${new Date().toISOString()}</div>
    </div>

    <div class="section">
      <div class="section-title">Common Causes</div>
      <ul class="checklist">
        <li>Build files are missing (dist/client or dist/server)</li>
        <li>The SSR manifest file was not generated</li>
        <li>The server render function has an error</li>
        <li>File paths are incorrect</li>
        <li>Dependencies are missing or incompatible</li>
      </ul>
    </div>

    <div class="footer">
      <p><strong>How to debug:</strong></p>
      <p>1. Check Vercel deployment logs<br>
2. Run <code>npm run build</code> locally to verify build succeeds<br>
3. Run <code>vercel dev</code> to test locally<br>
4. Check that dist/client and dist/server directories exist<br>
5. Verify entry-server.ts exports a render function</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(500).send(errorHtml);
  }
};
