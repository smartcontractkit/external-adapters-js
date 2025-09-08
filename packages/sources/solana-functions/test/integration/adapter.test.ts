import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'

import { SolanaAccountReader } from '../../src/shared/account_reader'
import { fakeVestingScheduleAccount, fakeYieldPoolAccount } from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.RPC_URL = process.env.RPC_URL ?? 'http://localhost:8545'
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

  describe('eusx-price endpoint', () => {
    it('should calculate price based on yield pool and vesting schedule', async () => {
      jest
        .spyOn(SolanaAccountReader.prototype, 'fetchAccountInformation')
        .mockImplementation(async (_addr: any, accountName: string) => {
          // Match whatever exact strings your IDL decode uses.
          if (accountName === 'YieldPool' || accountName === 'yieldPool') {
            return fakeYieldPoolAccount as any
          }
          if (accountName === 'VestingSchedule' || accountName === 'vestingSchedule') {
            return fakeVestingScheduleAccount as any
          }
          throw new Error(`Unexpected accountName: ${accountName}`)
        })

      const response = await testAdapter.request({
        address: 'eUSXyKoZ6aGejYVbnp3wtWQ1E8zuokLAJPecPxxtgG3',
      })
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
