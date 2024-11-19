import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { SocketServerMock } from 'socket.io-mock-ts'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.API_KEY = process.env.API_KEY ?? 'fake-api-key'
    process.env.WS_API_ENDPOINT = process.env.WS_API_ENDPOINT ?? 'ws:fake'

    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const socket = new SocketServerMock()
    jest.doMock('socket.io-client', () => ({
      io: () => socket,
    }))

    const adapter = (await import('../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })

    socket.clientMock.emit('initial_token_states', {
      0: {
        id: 'FRAX/USD',
        baseSymbol: 'FRAX',
        quoteSymbol: 'USD',
        processTimestamp: 1732555634,
        processBlockChainId: 'arbitrum',
        processBlockNumber: 278231251,
        processBlockTimestamp: 1732555633,
        aggregatedLast7DaysBaseVolume: 46661677.60698884,
        price: 0.9950774676498447,
        aggregatedMarketDepthMinusOnePercentUsdAmount: 3924545.4672679068,
        aggregatedMarketDepthPlusOnePercentUsdAmount: 37133041.95023558,
        aggregatedMarketDepthUsdAmount: 41057587.41750349,
        aggregatedLast7DaysUsdVolume: 92915562.18873177,
      },
    })
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
    spy.mockRestore()
  })

  describe('price endpoint', () => {
    it('should return success', async () => {
      const data = {
        base: 'FRAX',
        quote: 'USD',
        endpoint: 'price',
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
