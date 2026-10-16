import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import { mockDxLinkServer } from './fixtures'

/**
 * OPDATA-9200 definition of done, mock-only (owner decision
 * live_verification = mock_only): both spec example requests must return the
 * spec example responses field-for-field against the mock dxLink server, and
 * all seven report-field paths the streams consume downstream must resolve
 * non-null (data.mid_price, data.bid_price, data.ask_price, data.bid_volume,
 * data.ask_volume, data.result, timestamps.providerIndicatedTimeUnixMs).
 *
 * The recorded evidence file (primary_command_evidence) is NOT produced here:
 * the operator runs the spec primary_command against prod before sign-off.
 */

// Captured before FakeTimers.install() replaces the global timers: the mock
// socket bridge delivers frames on a REAL timer, so every step yields fake
// time (background cycles) AND real time (frame delivery).
const realSetTimeout = setTimeout

const WS_URL = 'ws://localhost:9095/dxlink-chainlink'

// Spec endpoint_request_response_examples requests, verbatim
const stockQuotesExampleRequest = {
  endpoint: 'stock_quotes',
  from: 'AAPL',
  to: 'USD',
  overrides: {
    dxfeed: {
      AAPL: 'AAPL:USLF24',
    },
  },
}

const stockExampleRequest = {
  endpoint: 'stock',
  from: 'AAPL',
  to: 'USD',
  transport: 'ws',
  overrides: {
    dxfeed: {
      AAPL: 'AAPL:USLF24',
    },
  },
}

// Spec endpoint_request_response_examples responses
const stockQuotesExampleResponse = {
  data: {
    mid_price: 190.0,
    bid_price: 189.95,
    bid_volume: 100,
    ask_price: 190.05,
    ask_volume: 200,
  },
  result: 190.0,
  statusCode: 200,
}

const stockExampleResponse = {
  data: { result: 189.98 },
  result: 189.98,
  statusCode: 200,
}

describe('acceptance: spec examples field-for-field (mock-only)', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  const step = async () => {
    await testAdapter.clock?.tickAsync(1000)
    await new Promise((resolve) => realSetTimeout(resolve, 10))
  }

  const requestUntilCached = async (
    params: Record<string, unknown>,
  ): Promise<{ statusCode: number; json: () => any }> => {
    let response = await testAdapter.request(params)
    for (let i = 0; i < 20 && response.statusCode === 504; i++) {
      await step()
      response = await testAdapter.request(params)
    }
    return response
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['WS_API_ENDPOINT'] = WS_URL
    process.env['API_USERNAME'] = process.env['API_USERNAME'] ?? 'fake-api-username'
    process.env['API_PASSWORD'] = process.env['API_PASSWORD'] ?? 'fake-api-password'
    process.env['WS_SUBSCRIPTION_TTL'] = '60000'
    process.env['CACHE_MAX_AGE'] = '600000'
    process.env['CACHE_POLLING_MAX_RETRIES'] = '0'

    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockDxLinkServer(WS_URL)

    const adapter = (await import('./../../src')).adapter as unknown as Adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install({ now: Date.parse('2026-01-01T00:00:00Z') }),
      testAdapter: {} as TestAdapter<never>,
    })

    await requestUntilCached(stockQuotesExampleRequest)
    await requestUntilCached(stockExampleRequest)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  it('returns the spec stock_quotes example response field-for-field', async () => {
    const response = await requestUntilCached(stockQuotesExampleRequest)
    expect(response.statusCode).toBe(stockQuotesExampleResponse.statusCode)

    const actual = response.json()
    // Spec example response timestamps, verbatim
    expect(actual.timestamps.providerIndicatedTimeUnixMs).toBe(1760000000000)
    delete actual.meta
    delete actual.timestamps
    expect(actual).toEqual(stockQuotesExampleResponse)

    // Report-field paths consumed downstream (spec intake.purposeHowUsed)
    expect(actual.data.mid_price).not.toBeNull()
    expect(actual.data.bid_price).not.toBeNull()
    expect(actual.data.ask_price).not.toBeNull()
    expect(actual.data.bid_volume).not.toBeNull()
    expect(actual.data.ask_volume).not.toBeNull()
    expect(actual.result).not.toBeNull()
  })

  it('returns the spec stock example response field-for-field', async () => {
    const response = await requestUntilCached(stockExampleRequest)
    expect(response.statusCode).toBe(stockExampleResponse.statusCode)

    const actual = response.json()
    // Spec example response timestamps, verbatim
    expect(actual.timestamps.providerIndicatedTimeUnixMs).toBe(1760000000000)
    delete actual.meta
    delete actual.timestamps
    expect(actual).toEqual(stockExampleResponse)

    // Report-field paths consumed downstream (spec intake.purposeHowUsed)
    expect(actual.data.result).not.toBeNull()
    expect(actual.result).not.toBeNull()
  })
})
