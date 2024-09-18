import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { mockRPCResponses } from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.RPC_URL = process.env.RPC_URL ?? 'http://localhost:3040'
    process.env.CHAIN_ID = process.env.CHAIN_ID ?? '1'
    process.env.RETRY = process.env.RETRY ?? '0'
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

  describe('balance endpoint', () => {
    it('should return success', async () => {
      const data = {
        endpoint: 'balance',
        addresses: [
          '0x61E5E1ea8fF9Dc840e0A549c752FA7BDe9224e99',
          '0x22f44f27A25053C9921037d6CDb5EDF9C05d567D',
        ],
      }
      mockRPCResponses()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success at block number', async () => {
      const data = {
        endpoint: 'balance',
        addresses: ['0x61E5E1ea8fF9Dc840e0A549c752FA7BDe9224e99'],
        blockNumber: 100,
      }
      mockRPCResponses()
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
