import {
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'

/**
 * Breaking-change config rejections at STARTUP, proven through the real boot
 * path (spec data_source_authentication.breaking_change_env_checks, plan item
 * round1-integration-tests): the adapter constructs its AdapterConfig at module
 * import, so a rejected environment makes the import itself fail — no WS
 * connection, no request, no mock server involved.
 *
 * The request-time WS-path checks (credential pair + clean endpoint on every
 * ws-transport request) are unit-covered in
 * test/unit/config/env-validation.test.ts; this suite owns the boot-level
 * integration half.
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

  it('rejects a missing credential pair at startup', async () => {
    // Spec environment_variables: API_USERNAME and API_PASSWORD are
    // required=true — the boot must fail with neither set, even with a clean
    // dxLink endpoint
    await expect(
      boot({
        API_USERNAME: undefined,
        API_PASSWORD: undefined,
        WS_API_ENDPOINT: FAKE_DXLINK,
        API_ENDPOINT: FAKE_REST,
      }),
    ).rejects.toThrow(/API_USERNAME/)
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
