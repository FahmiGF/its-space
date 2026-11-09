import autocannon from "autocannon";

const base = process.env.STRESS_BASE_URL || process.env.SMOKE_BASE_URL || "http://localhost:3200";
const duration = Number(process.env.DURATION || 8);
const connections = Number(process.env.CONNECTIONS || 20);

const scenarios = [
  { name: "health API", path: "/api/health", connections },
  { name: "facility search (SSR + DB)", path: "/explore?category=sports&minCapacity=50", connections: Math.max(5, Math.round(connections / 2)) },
  { name: "facility detail (SSR + availability)", path: "/facilities/auditorium-utama", connections: Math.max(5, Math.round(connections / 2)) },
];

console.log(`Target: ${base}`);
console.log(`Duration: ${duration}s per scenario\n`);

let failed = false;
for (const scenario of scenarios) {
  const result = await autocannon({
    url: `${base}${scenario.path}`,
    connections: scenario.connections,
    duration,
    pipelining: 1,
    timeout: 15,
  });

  const non2xx = result.non2xx ?? 0;
  const errors = result.errors ?? 0;
  if (non2xx || errors) failed = true;

  console.log(`--- ${scenario.name} ---`);
  console.log(`URL: ${base}${scenario.path}`);
  console.log(`Connections: ${scenario.connections}`);
  console.log(`Requests/sec: ${Math.round(result.requests.average)}`);
  console.log(`Latency avg: ${Math.round(result.latency.average)} ms`);
  console.log(`Latency p95: ${Math.round(result.latency.p95 ?? result.latency.p97_5 ?? 0)} ms`);
  console.log(`Latency p99: ${Math.round(result.latency.p99 ?? 0)} ms`);
  console.log(`2xx: ${result["2xx"] ?? 0} · non-2xx: ${non2xx} · errors: ${errors}`);
  console.log(`Total requests: ${result.requests.total}\n`);
}

if (failed) {
  console.log("LOAD TEST FAILED: non-2xx responses or connection errors were detected.");
  process.exitCode = 1;
} else {
  console.log("LOAD TEST PASSED: all measured scenarios returned only 2xx responses.");
}
