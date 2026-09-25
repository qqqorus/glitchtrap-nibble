// Usage (from backend/):  node simulation/simulate-swarm.js 1000
//                    or:  npm run swarm -- 1000
// Optional 2nd arg: duration in ms (default 5000)

const WebSocket = require("ws");
const { runSwarm } = require("./swarm");

const size = Number(process.argv[2]) || 1000;
const durationMs = Number(process.argv[3]) || 5000;
const url = process.env.WS_URL || "ws://localhost:3001";

const ws = new WebSocket(url);

ws.on("error", () => {
  console.error(`❌ Could not connect to ${url}. Is the backend running? (npm start in backend/)`);
  process.exit(1);
});

ws.on("open", async () => {
  console.log(`🚀 Launching AI Agent Swarm: ${size} wallets over ${durationMs / 1000}s`);
  const { master, ms } = await runSwarm({ size, durationMs, send: (m) => ws.send(JSON.stringify(m)) });
  console.log(`🔗 Master wallet: ${master}`);

  // Let the socket buffer drain before closing
  while (ws.bufferedAmount > 0) await new Promise((r) => setTimeout(r, 50));
  console.log(`✅ Swarm complete in ${(ms / 1000).toFixed(1)}s. Watch the graph.`);
  ws.close();
});
