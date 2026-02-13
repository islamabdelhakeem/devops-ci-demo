const request = require("supertest");
const { createApp } = require("../src/app");

describe("Hello World service", () => {
  test("GET /health returns ok", async () => {
    const app = createApp();
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  test("GET /config-check fails when DEMO_API_KEY is missing", async () => {
    const app = createApp();
    delete process.env.DEMO_API_KEY;

    const res = await request(app).get("/config-check");
    expect(res.statusCode).toBe(500);
    expect(res.body.message).toMatch(/Missing DEMO_API_KEY/);
  });

  test("GET /config-check succeeds when DEMO_API_KEY is set", async () => {
    const app = createApp();
    process.env.DEMO_API_KEY = "not-a-real-secret";

    const res = await request(app).get("/config-check");
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/is set/);
  });
});
