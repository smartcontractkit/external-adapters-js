import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import {
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'

/**
 * Boot smoke flow (OPDATA-9200): the adapter boots with a mocked (but
 * valid) config and exposes both spec endpoints — price (default) and
 * stock_quotes — through the real request router.
 *
 * No WS connection is opened here: both probes fail at input validation
 * (missing base) before any transport runs, so the suite needs no socket or
 * nock mocks. The full request/response flows per endpoint live in
 * adapter-ws.test.ts / stock-quotes.test.ts / acceptance.test.ts.
 */

/** Structural view of the booted adapter — avoids coupling to framework internals. */
type EndpointLike = { name: string; aliases?: string[] }
type AdapterLike = {
  defaultEndpoint?: string
  endpoints: EndpointLike[]
}

describe('dxfeed adapter init', () => {
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv
  let adapter: AdapterLike

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    // Mocked-but-valid config: a fake credential pair and a clean wss:// dxLink
    // URL satisfy the spec startup checks (breaking_change_env_checks: no
    // /chainlink/cometd path, no embedded ://user:pass@ credentials)
    process.env['API_USERNAME'] = process.env['API_USERNAME'] ?? 'fake-api-username'
    process.env['API_PASSWORD'] = process.env['API_PASSWORD'] ?? 'fake-api-password'
    process.env['WS_API_ENDPOINT'] =
      process.env['WS_API_ENDPOINT'] ?? 'wss://dxlink.fake.test/dxlink-chainlink'

    const imported = (await import('./../../src')).adapter as unknown as Adapter
    imported.rateLimiting = undefined
    adapter = imported as unknown as AdapterLike
    testAdapter = await TestAdapter.startWithMockedCache(imported, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
  })

  it('boots with mocked config and exposes both spec endpoints', async () => {
    // Boot itself is the first assertion: an invalid config (cometd path,
    // embedded credentials) would have rejected startWithMockedCache above.
    // The credential pair is required at boot per the spec env block (this
    // suite sets it anyway); only WS_API_ENDPOINT is downgraded to request-time
    // enforcement for REST-only deployments (plan item: required:false).
    const endpointNames = adapter.endpoints.map((e) => e.name.toLowerCase())
    expect(endpointNames).toEqual(expect.arrayContaining(['price', 'stock_quotes']))

    // Spec external_adapterSpecifications.endpoints: price carries the aliases
    // crypto/stock/forex/commodities and is the default endpoint
    // (defaultTransport rest)
    const price = adapter.endpoints.find((e) => e.name === 'price')
    expect(price?.aliases).toEqual(
      expect.arrayContaining(['crypto', 'stock', 'forex', 'commodities']),
    )
    expect(adapter.defaultEndpoint).toBe('price')
  })

  it('routes both endpoints through the real request router', async () => {
    // Each probe carries no base param, so both requests fail at input
    // validation (400) — proving the endpoint is registered and reachable,
    // with no transport (WS or REST) ever invoked.
    for (const endpoint of ['price', 'stock_quotes']) {
      const response = await testAdapter.request({ endpoint })
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchObject({ error: expect.anything() })
    }
  })
})
