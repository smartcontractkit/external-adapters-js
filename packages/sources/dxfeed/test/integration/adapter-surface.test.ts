import {
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import fs from 'fs'
import nock from 'nock'
import path from 'path'
import { FAKE_REST_ENDPOINT, mockBatchedRestTransport } from './rest-mocks'

/**
 * Plan proving test (round1-delete-cometd, OPDATA-9200):
 * - the adapter exposes stock_quotes and price with the spec aliases; both
 *   route through the real request router (400 probes; boot itself proves the
 *   config surface accepts a clean dxLink environment)
 * - a grep-level check over src/: no cometd module file, no cometd module
 *   import, no clientId reference survives the deletion (the cometd STRING in
 *   src/config's breaking-change env check is the rejection message, not
 *   behavior — an import is what this forbids). yarn build is the complementary
 *   half of the proof: a surviving cometd import would fail compilation,
 *   because the module no longer exists.
 * - the untouched REST transport still resolves a request WITHOUT a transport
 *   param (owner decision rest_transport_scope = keep_untouched: the price
 *   endpoint's defaultTransport stays "rest")
 *
 * Fake hosts only (test_fake_urls): the REST host is the nock interceptor in
 * rest-mocks.ts; the WS endpoint is a clean fake URL that is never dialed (no
 * request in this suite routes to ws).
 */

const SRC_DIR = path.join(__dirname, '..', '..', 'src')

const listSourceFiles = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? listSourceFiles(full) : full
  })

/** Structural views of the booted adapter — avoids coupling to framework internals. */
type EndpointLike = { name: string; aliases?: string[] }
type AdapterLike = {
  defaultEndpoint?: string
  endpoints: EndpointLike[]
}

describe('adapter surface after the cometd deletion', () => {
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
  })

  /**
   * Boots the adapter from scratch under the given env: resets the module
   * registry, applies the env, then imports src. The import itself never
   * throws — the startup checks run inside the framework's adapter.initialize().
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const boot = async (env: Record<string, string | undefined>): Promise<{ adapter: any }> => {
    jest.resetModules()
    for (const [name, value] of Object.entries(env)) {
      if (value === undefined) {
        delete process.env[name]
      } else {
        process.env[name] = value
      }
    }
    // The harness helpers must come from the SAME (reset) registry or the
    // framework's class-identity checks fail across registries — callers
    // import TestAdapter dynamically alongside the booted adapter
    return import('./../../src')
  }

  it('no cometd transport module, cometd import or clientId reference exists anywhere in src', () => {
    const files = listSourceFiles(SRC_DIR).filter((file) => /\.(ts|json)$/.test(file))
    expect(files.length).toBeGreaterThan(0)
    for (const file of files) {
      // No cometd-named module file survives the deletion
      expect(path.basename(file)).not.toMatch(/cometd/i)
      const source = fs.readFileSync(file, 'utf8')
      // No module path containing "cometd" is imported or required anywhere
      expect(source).not.toMatch(/(?:from\s+['"]|require\(\s*['"])[^'"]*cometd[^'"]*['"]/i)
      // The cometd session state (clientId tracking) carries over in no form
      expect(source).not.toMatch(/clientId/)
    }
  })

  it('boots with a clean dxLink config and exposes stock_quotes and price with the spec aliases', async () => {
    // Mocked-but-valid config: a fake credential pair and a clean wss:// dxLink
    // URL satisfy the spec startup checks (breaking_change_env_checks)
    const { adapter } = await boot({
      API_USERNAME: 'fake-api-username',
      API_PASSWORD: 'fake-api-password',
      WS_API_ENDPOINT: 'wss://dxlink.fake.test/dxlink-chainlink',
      API_ENDPOINT: FAKE_REST_ENDPOINT,
    })
    const adapterLike = adapter as unknown as AdapterLike

    // Both spec endpoints are exposed
    const endpointNames = adapterLike.endpoints.map((e) => e.name.toLowerCase())
    expect(endpointNames).toEqual(expect.arrayContaining(['price', 'stock_quotes']))

    // Spec external_adapterSpecifications.endpoints: price carries the aliases
    // crypto/stock/forex/commodities and is the default endpoint
    // (defaultTransport rest)
    const price = adapterLike.endpoints.find((e) => e.name === 'price')
    expect(price?.aliases).toEqual(
      expect.arrayContaining(['crypto', 'stock', 'forex', 'commodities']),
    )
    expect(adapterLike.defaultEndpoint).toBe('price')
  })

  it('routes both endpoints through the real request router and rejects an empty body with 400', async () => {
    const { adapter } = await boot({
      API_USERNAME: 'fake-api-username',
      API_PASSWORD: 'fake-api-password',
      WS_API_ENDPOINT: 'wss://dxlink.fake.test/dxlink-chainlink',
      API_ENDPOINT: FAKE_REST_ENDPOINT,
    })
    adapter.rateLimiting = undefined
    const { TestAdapter: FreshTestAdapter } = await import(
      '@chainlink/external-adapter-framework/util/testing-utils'
    )
    const testAdapter = await FreshTestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })

    // Each probe carries no base param, so both requests fail at input
    // validation (400) — proving the endpoint is registered and reachable,
    // with no transport (WS or REST) ever invoked
    for (const endpoint of ['price', 'stock_quotes']) {
      const response = await testAdapter.request({ endpoint })
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchObject({ error: expect.anything() })
    }

    // A completely empty body fails input validation on the default endpoint
    const empty = await testAdapter.request({})
    expect(empty.statusCode).toBe(400)
    expect(empty.json()).toMatchObject({ error: expect.anything() })

    await testAdapter.api.close()
  })

  describe('REST path (defaultTransport rest, keep_untouched)', () => {
    let spy: jest.SpyInstance
    let testAdapter: TestAdapter

    beforeAll(async () => {
      const { adapter } = await boot({
        API_USERNAME: 'fake-api-username',
        API_PASSWORD: 'fake-api-password',
        // Clean dxLink URL, never dialed: no request in this suite routes to ws
        WS_API_ENDPOINT: 'wss://dxlink.fake.test/dxlink-chainlink',
        // Fake REST host (test_fake_urls): the untouched REST transport reads
        // API_ENDPOINT from settings, so the nock interceptor in rest-mocks.ts
        // is what requests hit — never a real provider host
        API_ENDPOINT: FAKE_REST_ENDPOINT,
      })
      adapter.rateLimiting = undefined
      // Batched REST mock (the untouched transport batches the desired symbol
      // set into one request); see rest-mocks.ts
      mockBatchedRestTransport()
      const mockDate = new Date('2022-01-01T11:11:11.111Z')
      spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())
      const { TestAdapter: FreshTestAdapter } = await import(
        '@chainlink/external-adapter-framework/util/testing-utils'
      )
      testAdapter = await FreshTestAdapter.startWithMockedCache(adapter, {
        testAdapter: {} as TestAdapter<never>,
      })
    })

    afterAll(async () => {
      await testAdapter.api.close()
      // cleanAll only: nock.restore() kills the interceptor process-wide, so any
      // suite sharing this jest worker afterwards would hit real DNS instead of
      // its mock (the repo-wide teardown convention)
      nock.cleanAll()
      spy.mockRestore()
    })

    it('resolves a request WITHOUT a transport param through the REST transport', async () => {
      // No endpoint param either: the adapter default endpoint is price, whose
      // defaultTransport is "rest". The nock interception itself is the proof
      // the REST transport handled the request — no dxLink socket exists in
      // this suite, and the 239.255 value comes only from the REST fixture.
      const response = await testAdapter.request({ base: 'TSLA', to: 'USD' })
      expect(response.statusCode).toBe(200)
      // Spec price response shape: data.result and result carry the provider's
      // last trade price (endpoint_request_response_examples.price)
      expect(response.json()).toMatchObject({
        data: { result: 239.255 },
        result: 239.255,
      })
    })
  })
})
