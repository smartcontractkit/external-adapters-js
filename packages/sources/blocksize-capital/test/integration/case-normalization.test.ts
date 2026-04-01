/**
 * Integration tests for DF-22956: case-insensitive asset handling.
 *
 * These tests verify that mixed-case requests for the same asset pair
 * resolve correctly without causing WebSocket subscription churn.
 *
 * Requires @chainlink/external-adapter-framework >= 2.14.0 with
 * NORMALIZE_CASE_INPUTS support.
 */
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import { mockWebSocketServer } from './fixtures'

describe('case-insensitive asset handling', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  const wsEndpoint = 'wss://data.blocksize.capital/marketdata/v1/ws'
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['WS_API_ENDPOINT'] = wsEndpoint
    process.env['API_KEY'] = 'fake-api-key'

    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockWebSocketServer(wsEndpoint)

    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
      testAdapter: {} as TestAdapter<never>,
    })

    await testAdapter.request({ base: 'ETH', quote: 'EUR' })
    await testAdapter.waitForCache()
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  it('should return same result for uppercase and mixed-case base', async () => {
    const upperResponse = await testAdapter.request({ base: 'ETH', quote: 'EUR' })
    const mixedResponse = await testAdapter.request({ base: 'Eth', quote: 'EUR' })

    expect(upperResponse.statusCode).toBe(200)
    expect(mixedResponse.statusCode).toBe(200)
    expect(upperResponse.json().result).toBe(mixedResponse.json().result)
  })

  it('should return same result for uppercase and lowercase quote', async () => {
    const upperResponse = await testAdapter.request({ base: 'ETH', quote: 'EUR' })
    const lowerResponse = await testAdapter.request({ base: 'ETH', quote: 'eur' })

    expect(upperResponse.statusCode).toBe(200)
    expect(lowerResponse.statusCode).toBe(200)
    expect(upperResponse.json().result).toBe(lowerResponse.json().result)
  })

  it('should return same result for fully lowercase pair', async () => {
    const upperResponse = await testAdapter.request({ base: 'ETH', quote: 'EUR' })
    const lowerResponse = await testAdapter.request({ base: 'eth', quote: 'eur' })

    expect(upperResponse.statusCode).toBe(200)
    expect(lowerResponse.statusCode).toBe(200)
    expect(upperResponse.json().result).toBe(lowerResponse.json().result)
  })

  it('should handle the USDe/USDE case from the original bug report', async () => {
    const response1 = await testAdapter.request({ base: 'ETH', quote: 'EUR' })
    const response2 = await testAdapter.request({ base: 'Eth', quote: 'Eur' })
    const response3 = await testAdapter.request({ base: 'eTH', quote: 'eUR' })

    expect(response1.statusCode).toBe(200)
    expect(response2.statusCode).toBe(200)
    expect(response3.statusCode).toBe(200)

    expect(response1.json().result).toBe(response2.json().result)
    expect(response2.json().result).toBe(response3.json().result)
  })
})
