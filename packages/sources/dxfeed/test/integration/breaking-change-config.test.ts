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
 * The two URL checks run only when WS_API_ENDPOINT is set: the legacy cometd
 * path (/chainlink/cometd — the transport this migration deletes) and embedded
 * ://user:pass@ credentials (credentials ride the Basic Authorization header,
 * never the URL). Plan item ws-env-triple-required-at-startup: the
 * breaking_change_env_checks scope the credential requirement to WS paths —
 * API_USERNAME, API_PASSWORD and WS_API_ENDPOINT are required: false at
 * startup, so a boot WITHOUT the triple succeeds (the WS-path requirement is
 * enforced at request time; rest-only-boot.test.ts proves the REST-only boot
 * and the request-time gate through the real request path).
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

  it('boots WITHOUT the WS credential triple — the breaking_change_env_checks scope the credential requirement to WS paths', async () => {
    // Plan item ws-env-triple-required-at-startup: API_USERNAME, API_PASSWORD
    // and WS_API_ENDPOINT are required: false at startup; only the REST path
    // needs API_ENDPOINT. A boot with none of the three set must succeed —
    // the credential requirement is enforced at REQUEST time on WS paths
    // (wsEnvInputValidationError through the endpoints' customInputValidation;
    // rest-only-boot.test.ts proves the 400 through the real request path).
    // The earlier rejection boots above leak their API_USERNAME/API_PASSWORD
    // into this worker's process.env (boot() only writes the keys it is
    // given), so the WS triple is deleted explicitly.
    const { adapter } = await boot({
      API_USERNAME: undefined,
      API_PASSWORD: undefined,
      WS_API_ENDPOINT: undefined,
      API_ENDPOINT: FAKE_REST,
    })
    await expect(adapter.initialize()).resolves.toBeUndefined()
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
})
