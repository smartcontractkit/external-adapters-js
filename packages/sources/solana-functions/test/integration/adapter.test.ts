import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import FakeTimers from '@sinonjs/fake-timers'
import * as nock from 'nock'

import { SolanaAccountReader } from '../../src/shared/account-reader'
import { fakeVestingScheduleAccount, fakeYieldPoolAccount } from './fixtures'

describe('execute', () => {
  let clock: FakeTimers.InstalledClock
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.RPC_URL = process.env.RPC_URL ?? 'http://localhost:8545'
    process.env.CACHE_ENABLED = 'false'
    process.env.BACKGROUND_EXECUTE_MS = '0'

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

  describe('EUSXPrice', () => {
    it('should error if fetchAccountInformation fails', async () => {
      // Set date to avoid cache
      const mockDate = new Date('2005-01-01T11:11:11.111Z')
      spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

      // fetchAccountInformation with simulated account fetch failure from account reader
      jest
        .spyOn(SolanaAccountReader.prototype, 'fetchAccountInformation')
        .mockImplementation(async (_rpc: any, _addr: any, accountName: string) => {
          if (accountName === 'YieldPool') {
            throw new Error('Simulated account fetch failure')
          }
          if (accountName === 'VestingSchedule') {
            return fakeVestingScheduleAccount as any
          }
          throw new Error(`Unexpected accountName: ${accountName}`)
        })

      const response = await testAdapter.request({
        address: 'eUSXyKoZ6aGejYVbnp3wtWQ1E8zuokLAJPecPxxtgG3',
      })
      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })

    it('should error if accounts are missing information', async () => {
      // Set date to avoid cache
      const mockDate = new Date('2006-01-01T11:11:11.111Z')
      spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

      // fetchAccountInformation with empty value for yieldPool
      jest
        .spyOn(SolanaAccountReader.prototype, 'fetchAccountInformation')
        .mockImplementation(async (_rpc: any, _addr: any, accountName: string) => {
          if (accountName === 'YieldPool') {
            return {} as any
          }
          if (accountName === 'VestingSchedule') {
            return fakeVestingScheduleAccount as any
          }
          throw new Error(`Unexpected accountName: ${accountName}`)
        })

      const response = await testAdapter.request({
        address: 'eUSXyKoZ6aGejYVbnp3wtWQ1E8zuokLAJPecPxxtgG3',
      })

      expect(response.statusCode).toBe(502)
      expect(response.json()).toMatchSnapshot()
    })

    it('should calculate price based on yield pool and vesting schedule', async () => {
      // Set date to avoid cache
      const mockDate = new Date('2007-01-01T11:11:11.111Z')
      spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

      // fetchAccountInformation with valid yieldPool and vestingSchedule
      jest
        .spyOn(SolanaAccountReader.prototype, 'fetchAccountInformation')
        .mockImplementation(async (_rpc: any, _addr: any, accountName: string) => {
          if (accountName === 'YieldPool') {
            return fakeYieldPoolAccount as any
          }
          if (accountName === 'VestingSchedule') {
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
