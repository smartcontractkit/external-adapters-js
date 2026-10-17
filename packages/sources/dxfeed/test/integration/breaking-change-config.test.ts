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
 * ://user:pass@ credentials) plus requiredness: the spec environment_variables
 * mark API_USERNAME, API_PASSWORD and WS_API_ENDPOINT required (plan
 * CONF-ENV-MISMATCH — the dxLink WS transport cannot build the Basic auth
 * handshake header or the endpoint URL without them), so a boot without any
 * one of the three fails config.validate() at import. The URL checks keep
 * gating every boot that points WS_API_ENDPOINT at the deleted cometd
 * transport or embeds credentials in it.
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

  it('rejects startup when API_USERNAME, API_PASSWORD or WS_API_ENDPOINT is unset (spec environment_variables: all three required)', async () => {
    // Plan CONF-ENV-MISMATCH proving flow: the dxLink WS transport needs the
    // Basic auth handshake pair and the dxLink URL, so the spec marks all
    // three required — a boot without any one of them must fail the import
    // with a validation error naming the missing variable. Each is probed
    // alone, with the other two set to valid values.
    await expect(
      boot({
        API_USERNAME: undefined,
        API_PASSWORD: CREDENTIALS.API_PASSWORD,
        WS_API_ENDPOINT: FAKE_DXLINK,
        API_ENDPOINT: FAKE_REST,
      }),
    ).rejects.toThrow(/API_USERNAME/)

    await expect(
      boot({
        API_USERNAME: CREDENTIALS.API_USERNAME,
        API_PASSWORD: undefined,
        WS_API_ENDPOINT: FAKE_DXLINK,
        API_ENDPOINT: FAKE_REST,
      }),
    ).rejects.toThrow(/API_PASSWORD/)

    await expect(
      boot({
        API_USERNAME: CREDENTIALS.API_USERNAME,
        API_PASSWORD: CREDENTIALS.API_PASSWORD,
        WS_API_ENDPOINT: undefined,
        API_ENDPOINT: FAKE_REST,
      }),
    ).rejects.toThrow(/WS_API_ENDPOINT/)
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
