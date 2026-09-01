import assert from "node:assert/strict";

process.env.API_PROXY_TARGET = "https://backend.example.com";

const { default: nextConfig } = await import("../next.config.mjs");

const rewrites = await nextConfig.rewrites();
assert.deepEqual(rewrites, [
  {
    source: "/api/v1/:path*",
    destination: "https://backend.example.com/api/v1/:path*",
  },
]);

const headers = await nextConfig.headers();
const csp = headers[0].headers.find((header) => header.key === "Content-Security-Policy")?.value;
assert.ok(csp?.includes("connect-src 'self' https://api-inference.huggingface.co"));

console.log("Deploy config tests passed");
