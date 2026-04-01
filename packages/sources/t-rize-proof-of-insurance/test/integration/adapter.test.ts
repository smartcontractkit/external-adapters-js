import {
  setEnvVariables,
  TestAdapter,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  mockResponseEmptyBody,
  mockResponseFailure401,
  mockResponseFailure404,
  mockResponseFailure500,
  mockResponseInvalidComputedAt,
  mockResponseOverflowContractAfterTruncation,
  mockResponseOverflowRootAfterTruncation,
  mockResponseSuccess,
  mockResponseSuccessAnotherTree,
  mockResponseSuccessMinimalRoot,
  mockResponseSuccessPositiveInt192Boundary,
  mockResponseSuccessSpecialChars,
  POSITIVE_INT192_MAX_DECIMAL,
} from './fixtures'

const OWNER_PARTY_ID =
  'TRIZEGroup-exampleValidator-1::0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.TRIZE_API_KEY = process.env.TRIZE_API_KEY ?? 'fake-api-key'

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

  describe('proof-of-insurance endpoint', () => {
    describe('happy path', () => {
      it('should return success', async () => {
        const data = {
          ownerPartyId: OWNER_PARTY_ID,
          treeId: 'tree-001',
          endpoint: 'proof-of-insurance',
        }
        mockResponseSuccess()
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })

      it('should return success for another tree', async () => {
        const data = {
          ownerPartyId: OWNER_PARTY_ID,
          treeId: 'tree-002',
          endpoint: 'proof-of-insurance',
        }
        mockResponseSuccessAnotherTree()
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })

      it('should handle special characters in ownerPartyId and treeId', async () => {
        const data = {
          ownerPartyId: 'owner::with-special/chars',
          treeId: 'tree & test',
          endpoint: 'proof-of-insurance',
        }
        mockResponseSuccessSpecialChars()
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })

      it('should handle minimal merkle root', async () => {
        const data = {
          ownerPartyId: 'minimal-owner',
          treeId: 'tree-minimal',
          endpoint: 'proof-of-insurance',
        }
        mockResponseSuccessMinimalRoot()
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })

      it('should accept exact positive int192 boundary values', async () => {
        const data = {
          ownerPartyId: 'boundary-owner',
          treeId: 'tree-boundary',
          endpoint: 'proof-of-insurance',
        }

        mockResponseSuccessPositiveInt192Boundary()
        const response = await testAdapter.request(data)

        expect(response.statusCode).toBe(200)
        expect(response.json()).toEqual(
          expect.objectContaining({
            result: POSITIVE_INT192_MAX_DECIMAL,
            data: expect.objectContaining({
              navPerShare: POSITIVE_INT192_MAX_DECIMAL,
              aum: POSITIVE_INT192_MAX_DECIMAL,
              navDate: '1704067200000000000',
              ripcord: 0,
            }),
          }),
        )
      })
    })

    describe('validation errors', () => {
      it('should fail on empty request', async () => {
        const response = await testAdapter.request({})
        expect(response.statusCode).toBe(400)
        expect(response.json()).toMatchSnapshot()
      })

      it('should fail on missing ownerPartyId', async () => {
        const response = await testAdapter.request({
          treeId: 'tree-001',
          endpoint: 'proof-of-insurance',
        })
        expect(response.statusCode).toBe(400)
        expect(response.json()).toMatchSnapshot()
      })

      it('should fail on missing treeId', async () => {
        const response = await testAdapter.request({
          ownerPartyId: OWNER_PARTY_ID,
          endpoint: 'proof-of-insurance',
        })
        expect(response.statusCode).toBe(400)
        expect(response.json()).toMatchSnapshot()
      })

      it('should fail on invalid ownerPartyId type', async () => {
        const response = await testAdapter.request({
          ownerPartyId: 12345,
          treeId: 'tree-001',
          endpoint: 'proof-of-insurance',
        })
        expect(response.statusCode).toBe(400)
        expect(response.json()).toMatchSnapshot()
      })

      it('should fail on invalid treeId type', async () => {
        const response = await testAdapter.request({
          ownerPartyId: OWNER_PARTY_ID,
          treeId: { invalid: 'object' },
          endpoint: 'proof-of-insurance',
        })
        expect(response.statusCode).toBe(400)
        expect(response.json()).toMatchSnapshot()
      })
    })

    describe('upstream failures', () => {
      it('should handle 500 error from upstream', async () => {
        const data = {
          ownerPartyId: 'error-owner',
          treeId: 'tree-error',
          endpoint: 'proof-of-insurance',
        }
        mockResponseFailure500()
        const response = await testAdapter.request(data)
        expect([502, 504]).toContain(response.statusCode)
      })

      it('should handle 404 error from upstream', async () => {
        const data = {
          ownerPartyId: 'notfound-owner',
          treeId: 'tree-notfound',
          endpoint: 'proof-of-insurance',
        }
        mockResponseFailure404()
        const response = await testAdapter.request(data)
        expect([502, 504]).toContain(response.statusCode)
      })

      it('should handle 401 error from upstream', async () => {
        const data = {
          ownerPartyId: 'unauthorized-owner',
          treeId: 'tree-unauthorized',
          endpoint: 'proof-of-insurance',
        }
        mockResponseFailure401()
        const response = await testAdapter.request(data)
        expect([502, 504]).toContain(response.statusCode)
      })

      it('should handle empty response body from upstream', async () => {
        const data = {
          ownerPartyId: 'empty-owner',
          treeId: 'tree-empty',
          endpoint: 'proof-of-insurance',
        }
        mockResponseEmptyBody()
        const response = await testAdapter.request(data)
        expect([502, 504]).toContain(response.statusCode)
      })

      it('should fail on invalid computedAt from upstream', async () => {
        const data = {
          ownerPartyId: 'invalid-time-owner',
          treeId: 'tree-invalid-time',
          endpoint: 'proof-of-insurance',
        }

        mockResponseInvalidComputedAt()
        const response = await testAdapter.request(data)

        expect(response.statusCode).toBe(502)
        expect(response.json()).toEqual(
          expect.objectContaining({
            statusCode: 502,
            errorMessage: 'Unable to map computedAt to navDate: invalid timestamp.',
          }),
        )
      })
    })

    describe('encoding guardrails', () => {
      it('should fail fast when truncated root still exceeds positive int192', async () => {
        const data = {
          ownerPartyId: 'overflow-root-owner',
          treeId: 'tree-overflow-root-truncated',
          endpoint: 'proof-of-insurance',
        }

        mockResponseOverflowRootAfterTruncation()
        const response = await testAdapter.request(data)

        expect(response.statusCode).toBe(502)
        expect(response.json()).toEqual(
          expect.objectContaining({
            statusCode: 502,
            errorMessage: expect.stringContaining(
              'Unable to map root to navPerShare: value does not fit positive int192.',
            ),
          }),
        )
      })

      it('should fail fast when truncated contractId still exceeds positive int192', async () => {
        const data = {
          ownerPartyId: 'overflow-contract-owner',
          treeId: 'tree-overflow-contract-truncated',
          endpoint: 'proof-of-insurance',
        }

        mockResponseOverflowContractAfterTruncation()
        const response = await testAdapter.request(data)

        expect(response.statusCode).toBe(502)
        expect(response.json()).toEqual(
          expect.objectContaining({
            statusCode: 502,
            errorMessage: expect.stringContaining(
              'Unable to map contractId to aum: value does not fit positive int192.',
            ),
          }),
        )
      })
    })
  })
})
