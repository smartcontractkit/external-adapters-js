/**
 * WS-routed credential gating: the adapter starts with a valid dxLink URL and
 * no credentials; WS requests fail validation, REST still serves.
 */
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import {
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers, { type InstalledClock } from '@sinonjs/fake-timers'
import nock from 'nock'
import { mockPriceEndpointWithSymbols } from '../integration/fixtures'

const VALID_WS_URL = 'wss://ws.example.test/dxlink'

describe('WS-routed credential gating', () => {
  let oldEnv: NodeJS.ProcessEnv
  let clock: InstalledClock
  let credlessAdapter: TestAdapter

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    LoggerFactoryProvider.set()
    delete process.env.API_USERNAME
    delete process.env.API_PASSWORD
    process.env.WS_API_ENDPOINT = VALID_WS_URL
    mockPriceEndpointWithSymbols({ TSLA: 239.255 })
    clock = FakeTimers.install({ now: Date.parse('2026-01-01T00:00:00Z') })
    const { adapter } = await import('./../../src/index')
    credlessAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock,
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    await credlessAdapter.api.close()
    clock.uninstall()
    setEnvVariables(oldEnv)
    nock.cleanAll()
  })

  it('fails a WS-routed request without API_USERNAME/API_PASSWORD', async () => {
    const response = await credlessAdapter.request({
      endpoint: 'stock',
      from: 'AAPL',
      to: 'USD',
      transport: 'ws',
    })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({ error: expect.anything() })
  })

  it('serves a REST-routed request without the WS credentials', async () => {
    await credlessAdapter.request({ base: 'TSLA' })
    await clock.tickAsync(1000)
    const response = await credlessAdapter.request({ base: 'TSLA' })
    expect(response.statusCode).toBe(200)
    expect(response.json().result).toBe(239.255)
  })
})
