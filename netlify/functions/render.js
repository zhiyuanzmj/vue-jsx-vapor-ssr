import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Cached production assets
const templateHtml = await fs.readFile(
  path.join(__dirname, "../../dist/client/index.html"),
  "utf-8"
);

const manifest = JSON.parse(
  await fs.readFile(
    path.join(__dirname, "../../dist/client/.vite/ssr-manifest.json"),
    "utf-8"
  )
);

const { render } = await import(
  path.join(__dirname, "../../dist/server/entry-server.js")
);

export default async (request, context) => {
  try {
    const url = new URL(request.url).pathname;

    const rendered = await render(url, manifest);

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
    console.error("Render error:", error);
    return new Response(
      `<pre>${error.stack || error.message}</pre>`,
      {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }
};

export const config = {
  path: "/*",
};
