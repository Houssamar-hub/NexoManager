import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import app from "../src/server.js";

const makeRequest = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = http.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        method: options.method || "GET",
        headers: options.headers || {},
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          let json = {};
          try {
            json = JSON.parse(body);
          } catch {
            // non-json body
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body,
            json,
          });
        });
      }
    );

    req.on("error", reject);

    if (options.body) {
      const data =
        typeof options.body === "string"
          ? options.body
          : JSON.stringify(options.body);
      req.write(data);
    }

    req.end();
  });
};

describe("API Routing & Middleware", () => {
  let server;
  let baseUrl;

  before(async () => {
    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it("GET /health should return 200 with service status", async () => {
    const res = await makeRequest(`${baseUrl}/health`);
    assert.equal(res.status, 200);
    assert.equal(res.json.success, true);
    assert.equal(res.json.status, "ok");
    assert.equal(res.json.service, "NexoManager API");
  });

  it("GET /api/health should also return 200", async () => {
    const res = await makeRequest(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    assert.equal(res.json.success, true);
  });

  it("GET / should return welcome JSON", async () => {
    const res = await makeRequest(`${baseUrl}/`);
    assert.equal(res.status, 200);
    assert.equal(res.json.success, true);
    assert.match(res.json.message, /NexoManager/);
  });

  it("GET /api/nonexistent should return 404 with structured JSON", async () => {
    const res = await makeRequest(`${baseUrl}/api/nonexistent`);
    assert.equal(res.status, 404);
    assert.equal(res.json.success, false);
    assert.match(res.json.message, /introuvable/i);
  });

  it("GET /api/students without token should return 401", async () => {
    const res = await makeRequest(`${baseUrl}/api/students`);
    assert.equal(res.status, 401);
    assert.equal(res.json.success, false);
    assert.match(res.json.message, /token/i);
  });

  it("GET /api/groups without token should return 401", async () => {
    const res = await makeRequest(`${baseUrl}/api/groups`);
    assert.equal(res.status, 401);
    assert.equal(res.json.success, false);
  });

  it("GET /api/payments without token should return 401", async () => {
    const res = await makeRequest(`${baseUrl}/api/payments`);
    assert.equal(res.status, 401);
    assert.equal(res.json.success, false);
  });

  it("GET /api/dashboard without token should return 401", async () => {
    const res = await makeRequest(`${baseUrl}/api/dashboard`);
    assert.equal(res.status, 401);
    assert.equal(res.json.success, false);
  });

  it("GET /api/notifications without token should return 401", async () => {
    const res = await makeRequest(`${baseUrl}/api/notifications`);
    assert.equal(res.status, 401);
    assert.equal(res.json.success, false);
  });

  it("GET /api/reports/students/excel without token should return 401", async () => {
    const res = await makeRequest(`${baseUrl}/api/reports/students/excel`);
    assert.equal(res.status, 401);
    assert.equal(res.json.success, false);
  });

  it("POST /api/auth/register with empty body should return 400 validation error", async () => {
    const res = await makeRequest(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {},
    });
    assert.equal(res.status, 400);
    assert.equal(res.json.success, false);
    assert.ok(res.json.message);
  });

  it("POST /api/auth/login with empty body should return 400 validation error", async () => {
    const res = await makeRequest(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {},
    });
    assert.equal(res.status, 400);
    assert.equal(res.json.success, false);
    assert.ok(res.json.message);
  });
});
