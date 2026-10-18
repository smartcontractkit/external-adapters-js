import {
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'

/**
 * Plan item 1 proving test (OPDATA-9200): the spec's breaking-change env
 * checks on WS_API_ENDPOINT (data_source_authentication.breaking_change_env_checks),
 * proven through the real boot path. The adapter constructs its AdapterConfig
 * at module import (src/index.ts performs NO validation there — round-2 deleted
 * the import-time config.validate()); the framework runs config.validate()
 * inside adapter.initialize() (expose), so a rejected environment rejects
 * initialize() — no WS connection, no request, no mock server involved.
 *
 * The two URL checks run when WS_API_ENDPOINT is set: the legacy cometd
 * path (/chainlink/cometd — the transport this migration deletes) and embedded
 * ://user:pass@ credentials (credentials ride the Basic Authorization header,
 * never the URL). The spec environment_variables declare API_USERNAME,
 * API_PASSWORD and WS_API_ENDPOINT required:true — a boot WITHOUT the triple
 * is rejected by initialize() (the request-time gate
 * wsEnvInputValidationError stays as defense-in-depth).
 *
 * Round 2, plan item 1: the spec rule is wss-only (the Basic Authorization
 * header rides the WS handshake, so a plaintext ws:// endpoint exposes the
 * credentials). The ONLY admission is the adapter-owned test-only escape
 * hatch: ALLOW_PLAINTEXT_WS_TEST=true together with a LOOPBACK host — the
 * framework's mock-socket test bridge. Proven through the same real boot
 * path: ws:// is rejected without the flag, accepted for ws://127.0.0.1 with
 * the flag, and rejected again for a non-loopback host even with the flag
 * (a copied test env file must not be able to ship the flag into a
 * production topology and send the credentials unencrypted).
 */

// Fake hosts only (test_fake_urls): the real provider hosts live only in
// src/config defaults
const FAKE_DXLINK = 'wss://dxlink.fake.test/dxlink-chainlink'
const FAKE_REST = 'https://rest.fake.test/webservice/rest'

const CREDENTIALS = {
  API_USERNAME: 'fake-api-username',
  API_PASSWORD: 'fake-api-password',
}

describe('breaking-change config rejections', () => {
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
  })

  /**
   * Boots the adapter from scratch under the given env: resets the module
   * registry, applies the env, then imports src and returns the module. The
   * import itself never throws (round-2: module import performs no config
   * validation) — the startup checks run inside the framework's
   * adapter.initialize().
   */
  const boot = (env: Record<string, string | undefined>): Promise<typeof import('../../src')> => {
    jest.resetModules()
    for (const [name, value] of Object.entries(env)) {
      if (value === undefined) {
        delete process.env[name]
      } else {
        process.env[name] = value
      }
    }
    return import('./../../src')
  }

  const fullEnv = (wsApiEndpoint: string) => ({
    ...CREDENTIALS,
    WS_API_ENDPOINT: wsApiEndpoint,
    API_ENDPOINT: FAKE_REST,
  })

  it('rejects a legacy cometd WS_API_ENDPOINT through the framework initialize() path', async () => {
    // Spec breaking_change_env_checks[0]: the cometd transport is deleted —
    // pointing WS_API_ENDPOINT at it must fail the boot. The import succeeds
    // (no import-time validation), the framework's initialize() runs
    // config.validate() and rejects.
    const { adapter } = await boot(fullEnv('wss://dxlink.fake.test/chainlink/cometd'))
    await expect(adapter.initialize()).rejects.toThrow(/cometd/)
  })

  it('rejects a WS_API_ENDPOINT with embedded ://user:pass@ credentials through the framework initialize() path', async () => {
    // Spec breaking_change_env_checks[1]: credentials ride the Basic
    // Authorization header, never the URL
    const { adapter } = await boot(fullEnv('wss://user:pass@dxlink.fake.test/dxlink-chainlink'))
    await expect(adapter.initialize()).rejects.toThrow(/credentials/)
  })

  it('rejects a boot WITHOUT the WS credential triple — the spec environment_variables declare all three required:true', async () => {
    // Spec environment_variables: API_USERNAME, API_PASSWORD and WS_API_ENDPOINT
    // are each required — the framework's config.validate() (inside
    // adapter.initialize()) rejects the boot with none of the three set.
    // The earlier rejection boots above leak their API_USERNAME/API_PASSWORD
    // into this worker's process.env (boot() only writes the keys it is
    // given), so the WS triple is deleted explicitly.
    const { adapter } = await boot({
      API_USERNAME: undefined,
      API_PASSWORD: undefined,
      WS_API_ENDPOINT: undefined,
      API_ENDPOINT: FAKE_REST,
    })
    await expect(adapter.initialize()).rejects.toThrow(/WS_API_ENDPOINT/)
  })

  it('boots with a clean dxLink config (valid startup control)', async () => {
    // The control case: a clean wss:// dxLink endpoint plus the credential
    // pair boots the adapter and serves the request router
    const { adapter } = await boot(fullEnv(FAKE_DXLINK))
    adapter.rateLimiting = undefined
    // boot() calls jest.resetModules(), so the adapter was built against a
    // fresh module registry. The test harness helpers must come from that SAME
    // registry (dynamic import, not the top-level static one) or the
    // framework's `adapter instanceof Adapter` check in start() fails on the
    // class-identity mismatch between the two registries.
    const { TestAdapter: FreshTestAdapter } = await import(
      '@chainlink/external-adapter-framework/util/testing-utils'
    )
    const testAdapter = await FreshTestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })

    // No base param: both probes fail at input validation (400) — the endpoint
    // is registered and reachable, with no transport (WS or REST) ever invoked
    for (const endpoint of ['price', 'stock_quotes']) {
      const response = await testAdapter.request({ endpoint })
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchObject({ error: expect.anything() })
    }

    await testAdapter.api.close()
  })

  // Round 2, plan item 1: the plaintext ws:// gate, proven through the real
  // boot path. The spec rule is wss-only — the Basic Authorization header (the
  // credentials) rides the WS handshake. The single admission is the
  // adapter-owned ALLOW_PLAINTEXT_WS_TEST=true flag AND a loopback host (the
  // framework's mock-socket test bridge). Deliberately NOT pinned to the
  // rejection message text: the assertion is the spec rule (boot fails /
  // boot succeeds), not the wording the validator picks.
  describe('plaintext ws:// gate (ALLOW_PLAINTEXT_WS_TEST)', () => {
    it('rejects a ws:// endpoint even on loopback without the flag', async () => {
      // The loopback allowance exists ONLY behind the explicit flag: a plain
      // ws:// loopback endpoint with no ALLOW_PLAINTEXT_WS_TEST must fail the
      // boot. The flag is deleted explicitly — an earlier case in this worker
      // may have set it.
      const { adapter } = await boot({
        ...fullEnv('ws://127.0.0.1/dxlink-chainlink'),
        ALLOW_PLAINTEXT_WS_TEST: undefined,
      })
      await expect(adapter.initialize()).rejects.toThrow()
    })

    it('accepts ws://127.0.0.1 when ALLOW_PLAINTEXT_WS_TEST=true', async () => {
      // The escape hatch's whole purpose: the loopback mock-socket test bridge.
      // With the flag set and the host loopback, the boot succeeds — no server
      // is needed, initialize() only validates config (no socket is opened).
      const { adapter } = await boot({
        ...fullEnv('ws://127.0.0.1/dxlink-chainlink'),
        ALLOW_PLAINTEXT_WS_TEST: 'true',
      })
      await expect(adapter.initialize()).resolves.toBeUndefined()
    })

    it('rejects a ws:// NON-loopback host even when ALLOW_PLAINTEXT_WS_TEST=true', async () => {
      // Defence in depth (round 2, plan item 1): a copied test env file that
      // ships the flag into a production topology — flag set, host NOT
      // loopback — must hard-fail the boot, so the Basic credentials can never
      // be sent unencrypted to a remote host.
      const { adapter } = await boot({
        ...fullEnv('ws://dxlink.fake.test/dxlink-chainlink'),
        ALLOW_PLAINTEXT_WS_TEST: 'true',
      })
      await expect(adapter.initialize()).rejects.toThrow()
    })
  })
})
