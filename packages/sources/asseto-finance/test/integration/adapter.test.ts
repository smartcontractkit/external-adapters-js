import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  mockAuthResponseSuccess,
  mockNavResponseSuccess,
  mockReserveResponseSuccess,
} from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.API_ENDPOINT = 'https://open.syncnav.com/api'
    process.env.CLIENT_ID = process.env.CLIENT_ID ?? 'clientId'
    process.env.CLIENT_SECRET = process.env.CLIENT_SECRET ?? 'secret'
    process.env.GRANT_TYPE = process.env.GRANT_TYPE ?? 'grant-type'
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

  describe('reserve endpoint', () => {
    it('should return success', async () => {
      const fundId = 8
      const data = {
        endpoint: 'reserve',
        fundId: fundId,
      }

      mockAuthResponseSuccess()
      mockReserveResponseSuccess(fundId)

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  describe('nav endpoint', () => {
    it('should return success', async () => {
      const fundId = 8
      const data = {
        endpoint: 'nav',
        fundId: fundId,
      }

      mockAuthResponseSuccess()
      mockNavResponseSuccess(fundId)

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })

  // describe('auth edge cases', () => {
  //   beforeEach(() => {
  //     nock.cleanAll()
  //   })
  //
  //   it('should handle auth 401 unauthorized error', async () => {
  //     const fundId = 8
  //     const data = {
  //       endpoint: 'reserve',
  //       fundId: fundId,
  //     }
  //
  //     mockAuthResponseUnauthorized()
  //
  //     const response = await testAdapter.request(data)
  //     expect(response.statusCode).toBe(502)
  //     expect(response.json()).toEqual(
  //       expect.objectContaining({
  //         errorMessage: 'Unable to auth',
  //       })
  //     )
  //   })
  //
  //   it('should handle auth 500 server error', async () => {
  //     const fundId = 8
  //     const data = {
  //       endpoint: 'nav',
  //       fundId: fundId,
  //     }
  //
  //     mockAuthResponseServerError()
  //
  //     const response = await testAdapter.request(data)
  //     expect(response.statusCode).toBe(502)
  //     expect(response.json()).toEqual(
  //       expect.objectContaining({
  //         errorMessage: 'Unable to auth',
  //       })
  //     )
  //   })
  //
  //   it('should handle missing access_token in auth response', async () => {
  //     const fundId = 8
  //     const data = {
  //       endpoint: 'reserve',
  //       fundId: fundId,
  //     }
  //
  //     mockAuthResponseMissingToken()
  //
  //     const response = await testAdapter.request(data)
  //     expect(response.statusCode).toBe(502)
  //     expect(response.json()).toEqual(
  //       expect.objectContaining({
  //         errorMessage: 'Unable to auth',
  //       })
  //     )
  //   })
  //
  //   it('should handle missing expires in auth response', async () => {
  //     const fundId = 8
  //     const data = {
  //       endpoint: 'nav',
  //       fundId: fundId,
  //     }
  //
  //     mockAuthResponseMissingExpiry()
  //
  //     const response = await testAdapter.request(data)
  //     expect(response.statusCode).toBe(502)
  //     expect(response.json()).toEqual(
  //       expect.objectContaining({
  //         errorMessage: 'Unable to auth',
  //       })
  //     )
  //   })
  //
  //   it('should handle invalid expires value in auth response', async () => {
  //     const fundId = 8
  //     const data = {
  //       endpoint: 'reserve',
  //       fundId: fundId,
  //     }
  //
  //     mockAuthResponseInvalidExpiry()
  //
  //     const response = await testAdapter.request(data)
  //     expect(response.statusCode).toBe(502)
  //     expect(response.json()).toEqual(
  //       expect.objectContaining({
  //         errorMessage: 'Unable to getToken',
  //       })
  //     )
  //   })
  //
  //   it('should handle auth timeout', async () => {
  //     const fundId = 8
  //     const data = {
  //       endpoint: 'nav',
  //       fundId: fundId,
  //     }
  //
  //     mockAuthResponseTimeout()
  //
  //     const response = await testAdapter.request(data)
  //     expect(response.statusCode).toBe(502)
  //     expect(response.json()).toEqual(
  //       expect.objectContaining({
  //         errorMessage: expect.stringContaining('timeout'),
  //       })
  //     )
  //   }, 10000)
  // })
})
