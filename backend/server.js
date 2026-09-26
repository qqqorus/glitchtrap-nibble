// Express + WebSocket server on :3001
//
// WebSocket (ws://localhost:3001)
//   server -> frontend : WsMessage events (see frontend/lib/types.ts, and backend/README.md)
//   swarm  -> server   : SIM_STAKE { address, fundingSource } / SIM_CLAIM { address }
//
// HTTP
//   GET  /health        { ok, chain }
//   GET  /state         full snapshot (debugging)
//   POST /submit-slash  start the slash proposal + 30s countdown
//   POST /simulate      { size?, durationMs? } run the swarm from the UI
//   POST /reset         clean demo state

const http = require("http");
const express = require("express");
const cors = require("cors");
const { WebSocketServer } = require("ws");
const { ethers } = require("ethers");

const cfg = require("./config");
const chain = require("./chain");
const { Detector } = require("./detector");
const { Engine } = require("./engine");
const { createSlasher } = require("./slasher");
const { startListener } = require("./listener");
const { runSwarm } = require("./simulation/swarm");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

function broadcast(msg) {
  const data = JSON.stringify(msg);
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(data);
  }
}

const detector = new Detector({
  windowMs: cfg.TEMPORAL_WINDOW_MS,
  temporalThreshold: cfg.TEMPORAL_THRESHOLD,
  fundingThreshold: cfg.FUNDING_THRESHOLD,
});
const engine = new Engine({ detector, slasher: createSlasher(chain), broadcast });

// ---------- WebSocket ----------

function handleSimMessage(msg) {
  if (!msg || typeof msg !== "object") return;
  const address = msg.address;
  if (!ethers.isAddress(address)) return;

  switch (msg.type) {
    case "SIM_STAKE":
    case "FAKE_STAKE_EVENT": // old format from the original plan
      engine.handleStake({ address, fundingSource: msg.fundingSource, isReal: false });
      if (msg.type === "FAKE_STAKE_EVENT") engine.handleClaim(address);
      break;
    case "SIM_CLAIM":
      engine.handleClaim(address);
      break;
  }
}

wss.on("connection", (ws) => {
  for (const m of engine.initialMessages()) ws.send(JSON.stringify(m));
  ws.on("message", (raw) => {
    try {
      handleSimMessage(JSON.parse(raw));
    } catch {
      /* ignore malformed */
    }
  });
});

// ---------- HTTP ----------

app.get("/health", (_req, res) => res.json({ ok: true, chain: chain.isEnabled() }));

app.get("/state", (_req, res) => res.json(engine.snapshot()));

app.post("/submit-slash", (_req, res) => {
  const result = engine.submitSlash();
  res.status(result.ok ? 200 : 409).json(result);
});

let swarmRunning = false;
app.post("/simulate", async (req, res) => {
  if (swarmRunning) return res.status(409).json({ ok: false, error: "Swarm already running" });
  const size = Math.min(Number(req.body?.size) || 1000, 5000);
  const durationMs = Number(req.body?.durationMs) || 5000;
  swarmRunning = true;
  res.json({ ok: true, size, durationMs });
  try {
    const { master } = await runSwarm({ size, durationMs, send: handleSimMessage });
    console.log(`[server] swarm of ${size} done (master ${master})`);
  } finally {
    swarmRunning = false;
  }
});

app.post("/reset", (_req, res) => {
  engine.fullReset();
  res.json({ ok: true });
});

// ---------- start ----------

(async () => {
  await chain.init();
  startListener(chain, engine);

  // Rehearsal safety: if a previous run left the contract at 100x, put it back to 1x
  const m = await chain.read((c) => c.stakeMultiplier());
  if (m !== null && m !== 1n) {
    console.log(`[chain] contract multiplier was ${m}x, resetting to 1x`);
    chain.send("triggerAttackDetection(1)", (c) => c.triggerAttackDetection(1));
  }

  server.listen(cfg.PORT, () => {
    console.log(`\n🛡️  Backend on http://localhost:${cfg.PORT}  (ws://localhost:${cfg.PORT})`);
    console.log(`   chain: ${chain.isEnabled() ? "ONLINE" : "OFFLINE (demo still works, no on-chain calls)"}`);
    console.log(`   slash: ${cfg.AUTO_SLASH ? "automatic after detection" : "manual, POST /submit-slash"}\n`);
  });
})();
