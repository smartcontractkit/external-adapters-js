import {
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'

/**
 * Breaking-change config rejections at STARTUP, proven through the real boot
 * path (spec data_source_authentication.breaking_change_env_checks): the
 * adapter constructs its AdapterConfig at module import, so a rejected
 * environment makes the import itself fail — no WS connection, no request, no
 * mock server involved.
 *
 * The startup rejections are the two URL checks (legacy cometd path, embedded
 * ://user:pass@ credentials) and they run only when WS_API_ENDPOINT is set.
 * The WS-only settings (API_USERNAME, API_PASSWORD, WS_API_ENDPOINT) are NOT
 * startup-required — config.validate() must pass without them so the preserved
 * REST-only deployment boots (owner decision rest_transport_scope); they gate
 * the WS request path instead, through wsEnvInputValidationError at request
 * time, which this suite also proves end-to-end.
 */

// Fake hosts only (test_fake_urls): the real provider hosts live only in
// src/config defaults
const FAKE_DXLINK = 'wss://dxlink.fake.test/dxlink-chainlink'
const FAKE_REST = 'https://rest.fake.test/webservice/rest'

const CREDENTIALS = {
  API_USERNAME: 'fake-api-username',
  API_PASSWORD: 'fake-api-password',
}

describe('breaking-change config rejections at startup', () => {
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
  })

  /**
   * Boots the adapter from scratch under the given env: resets the module
   * registry, applies the env, then imports src — whose top-level
   * `new Adapter({ config })` runs config.initialize() against the env. A
   * rejected environment rejects the import (the spec's "startup checks").
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

  it('rejects a legacy cometd WS_API_ENDPOINT at startup', async () => {
    // Spec breaking_change_env_checks[0]: the cometd transport is deleted —
    // pointing WS_API_ENDPOINT at it must fail the boot
    await expect(boot(fullEnv('wss://dxlink.fake.test/chainlink/cometd'))).rejects.toThrow(/cometd/)
  })

  it('rejects a WS_API_ENDPOINT with embedded ://user:pass@ credentials at startup', async () => {
    // Spec breaking_change_env_checks[1]: credentials ride the Basic
    // Authorization header, never the URL
    await expect(
      boot(fullEnv('wss://user:pass@dxlink.fake.test/dxlink-chainlink')),
    ).rejects.toThrow(/credentials/)
  })

  it('boots with the WS-only settings unset and gates WS-path requests at request time instead', async () => {
    // Plan item (config-sessions): API_USERNAME, API_PASSWORD and
    // WS_API_ENDPOINT are WS-request-path requirements, not startup ones —
    // config.validate() must pass with all three unset so the preserved
    // REST-only deployment boots. The spec's request-time gate
    // (wsEnvInputValidationError) then fails every WS-path request with a 400
    // until the environment supplies them.
    const booted = await boot({
      API_USERNAME: undefined,
      API_PASSWORD: undefined,
      WS_API_ENDPOINT: undefined,
      API_ENDPOINT: FAKE_REST,
    })
    // Boot itself is the first assertion: a startup-required rejection would
    // have rejected the import above.
    expect(booted.adapter).toBeDefined()

    // jest.resetModules() in boot() means the harness helpers must come from
    // the SAME fresh registry (see the control test below).
    const { TestAdapter: FreshTestAdapter } = await import(
      '@chainlink/external-adapter-framework/util/testing-utils'
    )
    const testAdapter = await FreshTestAdapter.startWithMockedCache(booted.adapter, {
      testAdapter: {} as TestAdapter<never>,
    })

    // Every WS-path request fails fast at request time (400, the
    // wsEnvInputValidationError credential message) — no transport attempt,
    // no hang. Both WS endpoints probe the gate.
    for (const data of [
      { endpoint: 'price', base: 'AAPL', to: 'USD', transport: 'ws' },
      { endpoint: 'stock_quotes', from: 'AAPL', to: 'USD' },
    ]) {
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(400)
      expect(JSON.stringify(response.json())).toMatch(/API_USERNAME/)
    }

    await testAdapter.api.close()
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
