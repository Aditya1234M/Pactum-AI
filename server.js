const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = Number(process.env.PORT || 8080);
const ROOT = __dirname;
const MAX_BODY_BYTES = 1024 * 1024;
const MAX_DOCUMENT_CHARS = 12000;

function loadLocalCredentials() {
  try {
    const filePath = path.join(ROOT, "capi", "credentials.json");
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return {};
  }
}

const localCredentials = loadLocalCredentials();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || localCredentials.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || localCredentials.GEMINI_MODEL || "gemini-2.0-flash";

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://generativelanguage.googleapis.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"
};

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    ...securityHeaders,
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(body);
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
        reject(new Error("Request body is too large."));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function buildPrompt(question, documentText) {
  return `You are Pactum AI, a careful legal-document intelligence assistant. Provide legal information, not formal legal advice.

Analyze only the supplied document and answer the user's question. Do not invent clauses or facts. Return valid JSON with exactly these keys:
{
  "answer": "plain-English answer",
  "citation": "short exact quote or clause reference from the document",
  "riskFlag": "High Risk | Medium Risk | Safe | Information",
  "actionItem": "practical next step",
  "confidence": "High | Medium | Low"
}

DOCUMENT:
${documentText.slice(0, MAX_DOCUMENT_CHARS)}

QUESTION:
${question.slice(0, 1200)}`;
}

async function handleAsk(req, res) {
  if (!GEMINI_API_KEY) {
    sendJson(res, 503, { error: "Server GenAI is not configured; use the offline engine." });
    return;
  }

  let payload;
  try {
    payload = JSON.parse(await readRequestBody(req));
  } catch {
    sendJson(res, 400, { error: "Invalid request body." });
    return;
  }

  const question = typeof payload.question === "string" ? payload.question.trim() : "";
  const documentText = typeof payload.documentText === "string" ? payload.documentText.trim() : "";
  if (!question || !documentText) {
    sendJson(res, 400, { error: "A question and document are required." });
    return;
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(question, documentText) }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Gemini request failed:", response.status);
      sendJson(res, 502, { error: "The live model is temporarily unavailable." });
      return;
    }

    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      sendJson(res, 502, { error: "The live model returned no answer." });
      return;
    }

    let result;
    try {
      result = JSON.parse(rawText);
    } catch {
      sendJson(res, 502, { error: "The live model returned an invalid answer." });
      return;
    }

    sendJson(res, 200, {
      question,
      answer: String(result.answer || "No answer received."),
      citation: String(result.citation || "No exact citation returned."),
      riskFlag: String(result.riskFlag || "Information"),
      actionItem: String(result.actionItem || "Review this result with a qualified legal professional."),
      confidence: String(result.confidence || "Medium"),
      source: `Google Gemini (${GEMINI_MODEL})`
    });
  } catch (error) {
    console.error("Gemini request error:", error.message);
    sendJson(res, 502, { error: "The live model is temporarily unavailable." });
  }
}

function serveStatic(req, res, requestUrl) {
  const requestedPath = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  if (requestedPath.startsWith("/capi/") || requestedPath === "/.env") {
    res.writeHead(404, securityHeaders);
    res.end("Not found");
    return;
  }
  const safePath = path.normalize(requestedPath).replace(/^([/\\])+/, "");
  const filePath = path.join(ROOT, safePath);
  if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, securityHeaders);
    res.end("Not found");
    return;
  }

  const extension = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    ...securityHeaders,
    "Content-Type": contentTypes[extension] || "application/octet-stream",
    "Cache-Control": extension === ".html" ? "no-cache" : "public, max-age=3600"
  });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (req.method === "GET" && requestUrl.pathname === "/api/health") {
    sendJson(res, 200, { status: "ok", genaiConfigured: Boolean(process.env.GEMINI_API_KEY) });
    return;
  }
  if (req.method === "POST" && requestUrl.pathname === "/api/ask") {
    await handleAsk(req, res);
    return;
  }
  if (req.method === "GET") {
    serveStatic(req, res, requestUrl);
    return;
  }
  sendJson(res, 405, { error: "Method not allowed." });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Pactum AI listening on port ${PORT}`);
});
