import { mockPriceEndpointWithSymbols } from './fixtures'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    const mockDate = new Date('2022-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    process.env['API_USERNAME'] = 'fake-api-username'
    process.env['API_PASSWORD'] = 'fake-api-password'

    mockPriceEndpointWithSymbols({
      TSLA: 239.255,
      INVALID_RESULT: null,
    })

    const adapter = (await import('./../../src')).adapter as unknown as Adapter
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
    spy.mockRestore()
  })

  async function requestWithRetry(data: object): Promise<any> {
    let response = await testAdapter.request(data)
    let attempts = 0
    while (response.statusCode === 504 && attempts < 20) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      response = await testAdapter.request(data)
      attempts++
    }
    return response
  }

  describe('price endpoint rest', () => {
    it('should return success', async () => {
      const data = {
        base: 'TSLA',
      }
      const response = await requestWithRetry(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it(
      'should return 502 when the provider returns a non-numeric result',
      async () => {
        const data = {
          base: 'INVALID_RESULT',
        }
        const response = await requestWithRetry(data)
        expect(response.statusCode).toBe(502)
        expect(response.json()).toMatchSnapshot()
      },
      30000,
    )
  })
})
