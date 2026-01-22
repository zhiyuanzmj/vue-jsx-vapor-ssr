import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Cache variables
let templateHtml = null;
let manifest = null;
let render = null;
let loadError = null;

// Lazy load assets on first request
async function loadAssets() {
  if (templateHtml && manifest && render) {
    return;
  }

  try {
    const distPath = path.resolve(__dirname, "../../dist");

    // Load HTML template
    const templatePath = path.join(distPath, "client/index.html");
    console.log("Loading template from:", templatePath);
    templateHtml = await fs.readFile(templatePath, "utf-8");

    // Load SSR manifest
    const manifestPath = path.join(distPath, "client/.vite/ssr-manifest.json");
    console.log("Loading manifest from:", manifestPath);
    manifest = JSON.parse(await fs.readFile(manifestPath, "utf-8"));

    // Load server render function
    const serverPath = path.join(distPath, "server/entry-server.js");
    console.log("Loading server module from:", serverPath);
    const serverModule = await import(serverPath);
    render = serverModule.render;

    console.log("✓ Assets loaded successfully");
  } catch (error) {
    loadError = error;
    console.error("❌ Failed to load assets:", error);
    throw error;
  }
}

export default async (request, context) => {
  try {
    // Load assets if not already loaded
    if (!templateHtml || !manifest || !render) {
      await loadAssets();
    }

    const url = new URL(request.url).pathname;
    console.log("Rendering:", url);

    // Execute SSR render
    const rendered = await render(url, manifest);

    // Replace placeholders with rendered content
    const html = templateHtml
      .replace(`<!--app-head-->`, rendered.head ?? "")
      .replace(`<!--app-html-->`, rendered.html ?? "");

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("❌ Render error:", error);

    // Return detailed error information
    const errorHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Server Error</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    h1 {
      color: #d32f2f;
      margin-top: 0;
    }
    .error-section {
      margin: 20px 0;
      padding: 15px;
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      border-radius: 4px;
    }
    .error-title {
      font-weight: bold;
      color: #856404;
      margin-bottom: 10px;
    }
    .error-content {
      font-family: "Courier New", monospace;
      font-size: 13px;
      color: #333;
      white-space: pre-wrap;
      word-wrap: break-word;
      background: #f8f9fa;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
    }
    .debug-info {
      margin-top: 20px;
      padding: 15px;
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
      border-radius: 4px;
    }
    .debug-title {
      font-weight: bold;
      color: #1565c0;
      margin-bottom: 10px;
    }
    .debug-content {
      font-family: "Courier New", monospace;
      font-size: 12px;
      color: #333;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>⚠️ Server Error 500</h1>

    <div class="error-section">
      <div class="error-title">Error Message:</div>
      <div class="error-content">${error.message || "Unknown error"}</div>
    </div>

    <div class="error-section">
      <div class="error-title">Stack Trace:</div>
      <div class="error-content">${(error.stack || "No stack trace available").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
    </div>

    ${
      loadError
        ? `
    <div class="error-section">
      <div class="error-title">Asset Loading Error:</div>
      <div class="error-content">${(loadError.message || "Unknown error").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
    </div>
    `
        : ""
    }

    <div class="debug-info">
      <div class="debug-title">Debug Information:</div>
      <div class="debug-content">
Request URL: ${request.url}
Path: ${new URL(request.url).pathname}
Method: ${request.method}
Time: ${new Date().toISOString()}
      </div>
    </div>

    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
      <p>This error typically occurs when:</p>
      <ul>
        <li>Build files are missing (dist/client or dist/server)</li>
        <li>The SSR manifest file is not generated</li>
        <li>The server render function fails</li>
        <li>File paths are incorrect</li>
      </ul>
      <p><strong>Solution:</strong> Check Netlify build logs and verify that build completed successfully.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    return new Response(errorHtml, {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
};

export const config = {
  path: "/*",
};
