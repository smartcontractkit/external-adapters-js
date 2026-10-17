// Jest provides ALLOW_INSECURE_LOOPBACK_WS to every test worker: the pipeline's
// GENERATED conformance suites (test/golden and the held-out golden sessions)
// pin an env block carrying ONLY spec env vars, so those suites cannot opt
// themselves into the dxfeed adapter's explicit loopback exemption while they
// exercise its ws:// in-process mock-socket bridges. Production deployments
// never run jest, so this never opens the plaintext downgrade path outside
// tests; tests that assert on the flag patch and restore it explicitly.
if (!process.env.ALLOW_INSECURE_LOOPBACK_WS) {
  process.env.ALLOW_INSECURE_LOOPBACK_WS = 'true'
}
