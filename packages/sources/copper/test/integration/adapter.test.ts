import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.API_KEY = 'LvGtQu5MjWdWTWb1sEHiDYgbrCe4vWzvAC9kBfaC7Gf7Z3HCSZbhcd4EpsR7KSqe89e8' //process.env.API_KEY ?? 'fake-api-key'
    process.env.API_SECRET =
      '0SYnWsVGacK1Dx37UXtNT1AiJO8Pa4P0CWQT4HYLwiRuXOQsPvoamuXGZ9e1LYO8PqdjuWjTsoWDsoQmNsaQZJK8Qr9W5imJAIf7BYb2z4K4JcdIlLQNQWofCYCzc5Hs' //process.env.API_SECRET ?? 'fake-api-secret'

    //const mockDate = new Date('2001-01-01T11:11:11.111Z')
    //spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('./../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
    //spy.mockRestore()
  })

  describe('solstice endpoint', () => {
    it('should return success', async () => {
      const data = {
        portfolioId: 'cme0yn5cu00743b6uvbqj9ysn',
        currencies: ['BTC', 'ETH', 'SOL', 'LTC', 'NEAR', 'USDC', 'USDT'],
      }
      // mockResponseSuccess()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
