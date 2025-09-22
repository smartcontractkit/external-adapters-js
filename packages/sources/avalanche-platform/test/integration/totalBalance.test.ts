import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { mockBalanceSuccess, mockStakeSuccess } from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.P_CHAIN_RPC_URL = process.env.P_CHAIN_RPC_URL ?? 'http://localhost:3500/ext/bc/P'
    process.env.BACKGROUND_EXECUTE_MS = '0'
    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

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
    spy.mockRestore()
  })

  describe('totalBalance endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'totalBalance',
        addresses: [
          {
            address: 'P-fuji1vd9sddlllrlk9fvj9lhntpw8t00lmvtnqkl2jt',
          },
        ],
        assetId: 'U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK',
      }
      mockBalanceSuccess()
      mockStakeSuccess()
      const response = await testAdapter.request(data)
      expect(response.json()).toMatchSnapshot()
      expect(response.statusCode).toBe(200)
    })
  })
})
