import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import {
  mockWebSocketProvider,
  MockWebsocketServer,
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import { mockWebsocketServer } from './fixtures'

describe('websocket', () => {
  let mockWsServer: MockWebsocketServer | undefined
  let testAdapter: TestAdapter
  const wsEndpoint = 'ws://localhost:9090'
  let oldEnv: NodeJS.ProcessEnv

  const dataPriceIncludesMapping = {
    base: 'EZETH',
    quote: 'USD',
    endpoint: 'price',
    transport: 'ws',
  }

  const dataPriceHardcodedQuote = {
    base: 'EZETH',
    quote: 'ETH',
    endpoint: 'price',
    transport: 'ws',
  }

  const dataFundingRate = {
    base: 'BTC',
    quote: '',
    exchange: 'binance',
    endpoint: 'funding-rate',
  }

  const dataFundingRateAergo = {
    base: 'AERGO',
    quote: '',
    exchange: 'binance',
    endpoint: 'funding-rate',
  }

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['WS_API_ENDPOINT'] = wsEndpoint
    process.env['WS_FUNDING_RATE_API_ENDPOINT'] = wsEndpoint
    process.env['API_KEY'] = 'mock-api-key'
    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockWebsocketServer(wsEndpoint)

    const adapter = (await import('./../../src')).adapter
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      clock: FakeTimers.install(),
      testAdapter: {} as TestAdapter<never>,
    })

    // Send initial request to start background execute and wait for cache to be filled with results
    await testAdapter.request(dataPriceIncludesMapping)
    await testAdapter.waitForCache(1)
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    testAdapter.clock?.uninstall()
    await testAdapter.api.close()
  })

  describe('price endpoint', () => {
    it('EZETH/USD should return success - tests includes.json mapping', async () => {
      const response = await testAdapter.request(dataPriceIncludesMapping)
      expect(response.json()).toMatchSnapshot()
    })

    it('EZETH/ETH should return success - tests hardcoded ETH quote', async () => {
      const response = await testAdapter.request(dataPriceHardcodedQuote)
      expect(response.json()).toMatchSnapshot()
    })

    it('CBETH/ETH should return success - tests includes.json + hardcoded ETH quote', async () => {
      const response = await testAdapter.request({
        base: 'CBETH',
        quote: 'ETH',
        endpoint: 'price',
        transport: 'ws',
      })
      expect(response.json()).toMatchSnapshot()
    })

    it('LBTC/BTC should return success - tests includes.json + hardcoded BTC quote', async () => {
      const response = await testAdapter.request({
        base: 'LBTC',
        quote: 'BTC',
        endpoint: 'price',
        transport: 'ws',
      })
      expect(response.json()).toMatchSnapshot()
    })

    it('GHO/USD should return success - tests includes.json mapping', async () => {
      const response = await testAdapter.request({
        base: 'GHO',
        quote: 'USD',
        endpoint: 'price',
        transport: 'ws',
      })
      expect(response.json()).toMatchSnapshot()
    })

    it('unmapped symbol should return failure', async () => {
      const response = await testAdapter.request({
        base: 'UNMAPPED',
        quote: 'USD',
        endpoint: 'price',
        transport: 'ws',
      })
      expect(response.json()).toMatchSnapshot()
    })

    it('unsupported quote currency should return failure', async () => {
      const response = await testAdapter.request({
        base: 'EZETH',
        quote: 'EUR',
        endpoint: 'price',
        transport: 'ws',
      })
      expect(response.json()).toMatchSnapshot()
    })

    it('base override with asset ID should return success', async () => {
      const response = await testAdapter.request({
        base: 'TESTCOIN',
        quote: 'USD',
        endpoint: 'price',
        transport: 'ws',
        overrides: {
          'mobula-state': {
            TESTCOIN: '999888777',
          },
        },
      })
      expect(response.json()).toMatchSnapshot()
    })

    it('base override with BTC quote should return success', async () => {
      const response = await testAdapter.request({
        base: 'ANOTHERCOIN',
        quote: 'BTC',
        endpoint: 'price',
        transport: 'ws',
        overrides: {
          'mobula-state': {
            ANOTHERCOIN: '111222333',
          },
        },
      })
      expect(response.json()).toMatchSnapshot()
    })

    it('base override with ETH quote should return success', async () => {
      const response = await testAdapter.request({
        base: 'CUSTOMTOKEN',
        quote: 'ETH',
        endpoint: 'price',
        transport: 'ws',
        overrides: {
          'mobula-state': {
            CUSTOMTOKEN: '444555666',
          },
        },
      })
      expect(response.json()).toMatchSnapshot()
    })

    it('quote override with asset ID should return success', async () => {
      const response = await testAdapter.request({
        base: 'EZETH',
        quote: 'CUSTOMQUOTE',
        endpoint: 'price',
        transport: 'ws',
        overrides: {
          'mobula-state': {
            CUSTOMQUOTE: '100004304', // ETH asset ID as quote override
          },
        },
      })
      expect(response.json()).toMatchSnapshot()
    })

    it('direct base asset ID should return success', async () => {
      const response = await testAdapter.request({
        base: '102478632', // EZETH asset ID directly
        quote: 'USD',
        endpoint: 'price',
        transport: 'ws',
      })
      expect(response.json()).toMatchSnapshot()
    })

    it('direct base and quote asset IDs should return success', async () => {
      const response = await testAdapter.request({
        base: '2921', // GHO asset ID directly
        quote: '100001656', // BTC asset ID directly
        endpoint: 'price',
        transport: 'ws',
      })
      expect(response.json()).toMatchSnapshot()
    })

    it('direct asset IDs with crypto quote should return success', async () => {
      const response = await testAdapter.request({
        base: '100029813', // CBETH asset ID directly
        quote: '100004304', // ETH asset ID directly
        endpoint: 'price',
        transport: 'ws',
      })
      expect(response.json()).toMatchSnapshot()
    })

    it('direct asset IDs with hardcoded SOL quote should return success', async () => {
      const response = await testAdapter.request({
        base: '102484658', // LBTC asset ID directly
        quote: '100010811', // SOL asset ID directly (tests hardcoded SOL quote)
        endpoint: 'price',
        transport: 'ws',
      })
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('funding rate endpoint', () => {
    it('have data should return success', async () => {
      const response = await testAdapter.request(dataFundingRate)
      expect(response.json()).toMatchSnapshot()
    })

    it('have partial data return success', async () => {
      const response = await testAdapter.request(dataFundingRateAergo)
      expect(response.json()).toMatchSnapshot()
    })

    it('no data should return failure', async () => {
      const response = await testAdapter.request({
        base: 'ETH',
        quote: '',
        exchange: 'binance',
        endpoint: 'funding-rate',
      })
      expect(response.json()).toMatchSnapshot()
    })
  })
})
