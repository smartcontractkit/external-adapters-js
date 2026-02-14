import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  mockResponseEmptyBody,
  mockResponseFailure401,
  mockResponseFailure404,
  mockResponseFailure500,
  mockResponseSuccess,
  mockResponseSuccessAnotherDeal,
  mockResponseSuccessSpecialChars,
  mockResponseSuccessZeroDays,
} from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.TRIZE_API_TOKEN = process.env.TRIZE_API_TOKEN ?? 'fake-api-token'
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

  describe('proof_of_insurance endpoint', () => {
    describe('happy path', () => {
      it('should return success', async () => {
        const data = {
          deal_name: 'Entity 2 Deal',
          instrument_id: 'DEAL-ENTITY2-EXAMPLE',
          endpoint: 'proof_of_insurance',
        }
        mockResponseSuccess()
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })

      it('should return success for another deal', async () => {
        const data = {
          deal_name: 'Another Deal',
          instrument_id: 'DEAL-ANOTHER-123',
          endpoint: 'proof_of_insurance',
        }
        mockResponseSuccessAnotherDeal()
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })

      it('should handle special characters in deal name and instrument id', async () => {
        const data = {
          deal_name: 'Deal & Company',
          instrument_id: 'DEAL-SPECIAL/TEST',
          endpoint: 'proof_of_insurance',
        }
        mockResponseSuccessSpecialChars()
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })

      it('should handle zero days remaining', async () => {
        const data = {
          deal_name: 'Expired Deal',
          instrument_id: 'DEAL-EXPIRED',
          endpoint: 'proof_of_insurance',
        }
        mockResponseSuccessZeroDays()
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })
    })

    describe('validation errors', () => {
      it('should fail on empty request', async () => {
        const response = await testAdapter.request({})
        expect(response.statusCode).toBe(400)
        expect(response.json()).toMatchSnapshot()
      })

      it('should fail on missing deal_name', async () => {
        const response = await testAdapter.request({
          instrument_id: 'DEAL-ENTITY2-EXAMPLE',
          endpoint: 'proof_of_insurance',
        })
        expect(response.statusCode).toBe(400)
        expect(response.json()).toMatchSnapshot()
      })

      it('should fail on missing instrument_id', async () => {
        const response = await testAdapter.request({
          deal_name: 'Entity 2 Deal',
          endpoint: 'proof_of_insurance',
        })
        expect(response.statusCode).toBe(400)
        expect(response.json()).toMatchSnapshot()
      })

      it('should fail on invalid deal_name type', async () => {
        const response = await testAdapter.request({
          deal_name: 12345,
          instrument_id: 'DEAL-ENTITY2-EXAMPLE',
          endpoint: 'proof_of_insurance',
        })
        expect(response.statusCode).toBe(400)
        expect(response.json()).toMatchSnapshot()
      })

      it('should fail on invalid instrument_id type', async () => {
        const response = await testAdapter.request({
          deal_name: 'Entity 2 Deal',
          instrument_id: { invalid: 'object' },
          endpoint: 'proof_of_insurance',
        })
        expect(response.statusCode).toBe(400)
        expect(response.json()).toMatchSnapshot()
      })
    })

    describe('upstream failures', () => {
      it('should handle 500 error from upstream', async () => {
        const data = {
          deal_name: 'Error Deal',
          instrument_id: 'DEAL-ERROR',
          endpoint: 'proof_of_insurance',
        }
        mockResponseFailure500()
        const response = await testAdapter.request(data)
        // May return 502 if error is cached, or 504 if still processing
        expect([502, 504]).toContain(response.statusCode)
      })

      it('should handle 404 error from upstream', async () => {
        const data = {
          deal_name: 'NotFound Deal',
          instrument_id: 'DEAL-NOTFOUND',
          endpoint: 'proof_of_insurance',
        }
        mockResponseFailure404()
        const response = await testAdapter.request(data)
        // May return 502 if error is cached, or 504 if still processing
        expect([502, 504]).toContain(response.statusCode)
      })

      it('should handle 401 error from upstream', async () => {
        const data = {
          deal_name: 'Unauthorized Deal',
          instrument_id: 'DEAL-UNAUTHORIZED',
          endpoint: 'proof_of_insurance',
        }
        mockResponseFailure401()
        const response = await testAdapter.request(data)
        // May return 502 if error is cached, or 504 if still processing
        expect([502, 504]).toContain(response.statusCode)
      })

      it('should handle empty response body from upstream', async () => {
        const data = {
          deal_name: 'Empty Deal',
          instrument_id: 'DEAL-EMPTY',
          endpoint: 'proof_of_insurance',
        }
        mockResponseEmptyBody()
        const response = await testAdapter.request(data)
        // May return 502 if error is cached, or 504 if still processing
        expect([502, 504]).toContain(response.statusCode)
      })
    })
  })
})
