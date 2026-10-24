/**
 * WS-routed credential gating — OPDATA-9200 spec, customInputValidation, WS
 * paths only: the adapter starts with a valid dxLink URL and NO credentials;
 * a WS-routed request fails validation, a REST-routed request still serves.
 *
 * Boots the adapter once per file: jest isolates module state per test file,
 * so src/index.ts is evaluated exactly once here (fresh env read).
 */
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { TestAdapter } from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import { mockPriceEndpointWithSymbols } from '../integration/fixtures'

const VALID_WS_URL = 'wss://tools.dxfeed.com/dxlink-chainlink'

describe('WS-routed credential gating (spec: customInputValidation, WS paths only)', () => {
  let credlessAdapter: TestAdapter

  const requestWithRetry = async (data: object): Promise<any> => {
    let response = await credlessAdapter.request(data)
    let attempts = 0
    while (response.statusCode === 504 && attempts < 20) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      response = await credlessAdapter.request(data)
      attempts++
    }
    return response
  }

  beforeAll(async () => {
    LoggerFactoryProvider.set()
    // A valid dxLink URL (passes the startup validators) but NO credentials:
    // the adapter must still start — only WS-routed requests demand them.
    delete process.env.API_USERNAME
    delete process.env.API_PASSWORD
    process.env.WS_API_ENDPOINT = VALID_WS_URL
    mockPriceEndpointWithSymbols({ TSLA: 239.255 })
    const { adapter } = await import('./../../src/index')
    // rateLimiting stays: period 0 starves fake-timer ticks
    credlessAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(() => {
    nock.cleanAll()
  })

  it('fails validation on a WS-routed request without API_USERNAME/API_PASSWORD', async () => {
    const response = await credlessAdapter.request({
      endpoint: 'stock',
      from: 'AAPL',
      to: 'USD',
      transport: 'ws',
    })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({ error: expect.anything() })
  })

  it('passes a REST-routed request without the WS credentials (REST runs standalone)', async () => {
    const response = await requestWithRetry({ base: 'TSLA' })
    expect(response.statusCode).toBe(200)
    expect(response.json().result).toBe(239.255)
  }, 30000)
})
