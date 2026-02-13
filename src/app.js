const express = require("express");

function createApp() {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // This endpoint is intentionally designed to require a variable.
  // Candidates should demonstrate safe handling of variables in CI by setting DEMO_API_KEY secret in CI/CD pipeline.
  app.get("/config-check", (_req, res) => {
    const key = process.env.DEMO_API_KEY;
    if (!key) {
      return res.status(500).json({
        status: "error",
        message: "Missing DEMO_API_KEY"
      });
    }
    // DO NOT return the key. We only prove it exists.
    return res.status(200).json({
      status: "ok",
      message: "DEMO_API_KEY is set"
    });
  });

  return app;
}

module.exports = { createApp };
