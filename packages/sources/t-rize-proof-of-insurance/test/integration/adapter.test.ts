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
  mockResponseOverflowContractAfterTruncation,
  mockResponseOverflowRootAfterTruncation,
  mockResponseSuccess,
  mockResponseSuccessAnotherTree,
  mockResponseSuccessMinimalRoot,
  mockResponseSuccessSpecialChars,
} from './fixtures'

const OWNER_PARTY_ID =
  'TRIZEGroup-cantonTestnetValidator-1::12205de11e389c7da899c66b0fec93ac08b8e9023e8deb30a1316ed9925955fbf06b'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.TRIZE_API_KEY = process.env.TRIZE_API_KEY ?? 'fake-api-key'
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
          owner_party_id: OWNER_PARTY_ID,
          tree_id: 'tree-001',
          endpoint: 'proof_of_insurance',
        }
        mockResponseSuccess()
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })

      it('should return success for another tree', async () => {
        const data = {
          owner_party_id: OWNER_PARTY_ID,
          tree_id: 'tree-002',
          endpoint: 'proof_of_insurance',
        }
        mockResponseSuccessAnotherTree()
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })

      it('should handle special characters in owner_party_id and tree_id', async () => {
        const data = {
          owner_party_id: 'owner::with-special/chars',
          tree_id: 'tree & test',
          endpoint: 'proof_of_insurance',
        }
        mockResponseSuccessSpecialChars()
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })

      it('should handle minimal merkle root', async () => {
        const data = {
          owner_party_id: 'minimal-owner',
          tree_id: 'tree-minimal',
          endpoint: 'proof_of_insurance',
        }
        mockResponseSuccessMinimalRoot()
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

      it('should fail on missing owner_party_id', async () => {
        const response = await testAdapter.request({
          tree_id: 'tree-001',
          endpoint: 'proof_of_insurance',
        })
        expect(response.statusCode).toBe(400)
        expect(response.json()).toMatchSnapshot()
      })

      it('should fail on missing tree_id', async () => {
        const response = await testAdapter.request({
          owner_party_id: OWNER_PARTY_ID,
          endpoint: 'proof_of_insurance',
        })
        expect(response.statusCode).toBe(400)
        expect(response.json()).toMatchSnapshot()
      })

      it('should fail on invalid owner_party_id type', async () => {
        const response = await testAdapter.request({
          owner_party_id: 12345,
          tree_id: 'tree-001',
          endpoint: 'proof_of_insurance',
        })
        expect(response.statusCode).toBe(400)
        expect(response.json()).toMatchSnapshot()
      })

      it('should fail on invalid tree_id type', async () => {
        const response = await testAdapter.request({
          owner_party_id: OWNER_PARTY_ID,
          tree_id: { invalid: 'object' },
          endpoint: 'proof_of_insurance',
        })
        expect(response.statusCode).toBe(400)
        expect(response.json()).toMatchSnapshot()
      })
    })

    describe('upstream failures', () => {
      it('should handle 500 error from upstream', async () => {
        const data = {
          owner_party_id: 'error-owner',
          tree_id: 'tree-error',
          endpoint: 'proof_of_insurance',
        }
        mockResponseFailure500()
        const response = await testAdapter.request(data)
        expect([502, 504]).toContain(response.statusCode)
      })

      it('should handle 404 error from upstream', async () => {
        const data = {
          owner_party_id: 'notfound-owner',
          tree_id: 'tree-notfound',
          endpoint: 'proof_of_insurance',
        }
        mockResponseFailure404()
        const response = await testAdapter.request(data)
        expect([502, 504]).toContain(response.statusCode)
      })

      it('should handle 401 error from upstream', async () => {
        const data = {
          owner_party_id: 'unauthorized-owner',
          tree_id: 'tree-unauthorized',
          endpoint: 'proof_of_insurance',
        }
        mockResponseFailure401()
        const response = await testAdapter.request(data)
        expect([502, 504]).toContain(response.statusCode)
      })

      it('should handle empty response body from upstream', async () => {
        const data = {
          owner_party_id: 'empty-owner',
          tree_id: 'tree-empty',
          endpoint: 'proof_of_insurance',
        }
        mockResponseEmptyBody()
        const response = await testAdapter.request(data)
        expect([502, 504]).toContain(response.statusCode)
      })
    })

    describe('encoding guardrails', () => {
      it('should fail fast when truncated root still exceeds positive int192', async () => {
        const data = {
          owner_party_id: 'overflow-root-owner',
          tree_id: 'tree-overflow-root-truncated',
          endpoint: 'proof_of_insurance',
        }

        mockResponseOverflowRootAfterTruncation()
        const response = await testAdapter.request(data)

        expect(response.statusCode).toBe(502)
        expect(response.json()).toEqual(
          expect.objectContaining({
            statusCode: 502,
            errorMessage: expect.stringContaining(
              'Unable to map root to navPerShare: truncated value does not fit positive int192.',
            ),
          }),
        )
      })

      it('should fail fast when truncated contractId still exceeds positive int192', async () => {
        const data = {
          owner_party_id: 'overflow-contract-owner',
          tree_id: 'tree-overflow-contract-truncated',
          endpoint: 'proof_of_insurance',
        }

        mockResponseOverflowContractAfterTruncation()
        const response = await testAdapter.request(data)

        expect(response.statusCode).toBe(502)
        expect(response.json()).toEqual(
          expect.objectContaining({
            statusCode: 502,
            errorMessage: expect.stringContaining(
              'Unable to map contractId to aum: truncated value does not fit positive int192.',
            ),
          }),
        )
      })
    })
  })
})
