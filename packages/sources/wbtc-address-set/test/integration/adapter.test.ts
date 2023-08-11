import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { mockAddressesResponseSuccess, mockMembersResponseSuccess } from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.ADDRESSES_ENDPOINT = process.env.ADDRESSES_ENDPOINT ?? 'http://localhost:8082'
    process.env.MEMBERS_ENDPOINT = process.env.MEMBERS_ENDPOINT ?? 'http://localhost:8081'
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

  describe('addresses endpoint', () => {
    it('should return success', async () => {
      mockAddressesResponseSuccess()
      const response = await testAdapter.request({})
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('members endpoint', () => {
    it('should return success', async () => {
      mockMembersResponseSuccess()
      const response = await testAdapter.request({ endpoint: 'members' })
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
