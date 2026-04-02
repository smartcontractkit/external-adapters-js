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
  mockResponseInvalidContractId,
  mockResponseInvalidRoot,
  mockResponseSuccess,
  mockResponseSuccessAnotherTree,
  mockResponseSuccessFlexibleEncoding,
  mockResponseSuccessMinimalRoot,
  mockResponseSuccessSignBitRoot,
  mockResponseSuccessSpecialChars,
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

      it('should normalize flexible upstream encodings', async () => {
        const data = {
          ownerPartyId: 'normalized-owner',
          treeId: 'tree-normalized',
          endpoint: 'proof-of-insurance',
        }

        mockResponseSuccessFlexibleEncoding()
        const response = await testAdapter.request(data)

        expect(response.statusCode).toBe(200)
        expect(response.json()).toEqual(
          expect.objectContaining({
            result: '1',
            data: expect.objectContaining({
              root: '1',
              contractId: '43981',
            }),
            timestamps: expect.objectContaining({
              providerIndicatedTimeUnixMs: 1704067200000,
            }),
          }),
        )
      })

      it('should handle values with the sign bit set after 24 bytes', async () => {
        const data = {
          ownerPartyId: 'sign-bit-owner',
          treeId: 'tree-sign-bit',
          endpoint: 'proof-of-insurance',
        }

        mockResponseSuccessSignBitRoot()
        const response = await testAdapter.request(data)

        expect(response.statusCode).toBe(200)
        expect(response.json()).toEqual(
          expect.objectContaining({
            result: '24519928653854221733733552434404946937899825954937634815',
            data: expect.objectContaining({
              root: '24519928653854221733733552434404946937899825954937634815',
              contractId: '24519928653854221733733552434404946937899825954937634815',
            }),
            timestamps: expect.objectContaining({
              providerIndicatedTimeUnixMs: 1704067200000,
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
        expect(response.statusCode).toBe(502)
      })

      it('should handle 404 error from upstream', async () => {
        const data = {
          ownerPartyId: 'notfound-owner',
          treeId: 'tree-notfound',
          endpoint: 'proof-of-insurance',
        }
        mockResponseFailure404()
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(504)
      })

      it('should handle 401 error from upstream', async () => {
        const data = {
          ownerPartyId: 'unauthorized-owner',
          treeId: 'tree-unauthorized',
          endpoint: 'proof-of-insurance',
        }
        mockResponseFailure401()
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(504)
      })

      it('should handle empty response body from upstream', async () => {
        const data = {
          ownerPartyId: 'empty-owner',
          treeId: 'tree-empty',
          endpoint: 'proof-of-insurance',
        }
        mockResponseEmptyBody()
        const response = await testAdapter.request(data)
        expect(response.statusCode).toBe(502)
      })
    })

    describe('provider payload validation', () => {
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
            errorMessage: 'Unable to parse computedAt: invalid timestamp value "not-a-date".',
          }),
        )
      })

      it('should fail on invalid root from upstream', async () => {
        const data = {
          ownerPartyId: 'invalid-root-owner',
          treeId: 'tree-invalid-root',
          endpoint: 'proof-of-insurance',
        }

        mockResponseInvalidRoot()
        const response = await testAdapter.request(data)

        expect(response.statusCode).toBe(502)
        expect(response.json()).toEqual(
          expect.objectContaining({
            statusCode: 502,
            errorMessage: 'Unable to decode root: invalid base64 value "!not-base64!".',
          }),
        )
      })

      it('should fail on invalid contractId from upstream', async () => {
        const data = {
          ownerPartyId: 'invalid-contract-owner',
          treeId: 'tree-invalid-contract',
          endpoint: 'proof-of-insurance',
        }

        mockResponseInvalidContractId()
        const response = await testAdapter.request(data)

        expect(response.statusCode).toBe(502)
        expect(response.json()).toEqual(
          expect.objectContaining({
            statusCode: 502,
            errorMessage: 'Unable to normalize contractId: invalid hex value "xyz123".',
          }),
        )
      })
    })
  })
})
