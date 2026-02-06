import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { createHash } from 'crypto'
import { BaseEndpointTypes } from '../../src/endpoint/insurance-proof'
import {
  hashToAum,
  parseResponse,
  prepareRequests,
  RequestParams,
  ResponseSchema,
  TWO_POW_191,
} from '../../src/transport/insurance-proof'

describe('hashToAum', () => {
  it('returns a deterministic AUM value for a given hash', () => {
    const hash = '0xabc123def456'
    const result = hashToAum(hash)

    // Manually compute expected value
    const sha256Hash = createHash('sha256').update(hash).digest('hex')
    const hashBigInt = BigInt('0x' + sha256Hash)
    const expectedAum = (hashBigInt % TWO_POW_191).toString()

    expect(result).toBe(expectedAum)
  })

  it('returns different AUM values for different hashes', () => {
    const hash1 = '0xabc123'
    const hash2 = '0xdef456'

    const result1 = hashToAum(hash1)
    const result2 = hashToAum(hash2)

    expect(result1).not.toBe(result2)
  })

  it('returns same AUM value for same hash input', () => {
    const hash = 'test-hash-value'

    const result1 = hashToAum(hash)
    const result2 = hashToAum(hash)

    expect(result1).toBe(result2)
  })

  it('handles empty string input', () => {
    const hash = ''
    const result = hashToAum(hash)

    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns result less than TWO_POW_191', () => {
    const hash = '0xabc123def456'
    const result = hashToAum(hash)

    expect(BigInt(result)).toBeLessThan(TWO_POW_191)
  })
})

describe('prepareRequests', () => {
  const apiEndpoint = 'https://api.t-rize.com'
  const apiToken = 'test-token-123'

  const settings = makeStub('settings', {
    API_ENDPOINT: apiEndpoint,
    TRIZE_API_TOKEN: apiToken,
  } as unknown as BaseEndpointTypes['Settings'])

  it('returns request with correct baseURL from settings', () => {
    const param = makeStub('param', {} as RequestParams)

    const result = prepareRequests([param], settings)

    expect(result[0].request.baseURL).toBe(apiEndpoint)
  })

  it('returns request with correct URL path', () => {
    const param = makeStub('param', {} as RequestParams)

    const result = prepareRequests([param], settings)

    expect(result[0].request.url).toBe('/')
  })

  it('returns request with accept header set to application/json', () => {
    const param = makeStub('param', {} as RequestParams)

    const result = prepareRequests([param], settings)

    expect(result[0].request.headers.accept).toBe('application/json')
  })

  it('returns request with Bearer token authorization header', () => {
    const param = makeStub('param', {} as RequestParams)

    const result = prepareRequests([param], settings)

    expect(result[0].request.headers.Authorization).toBe(`Bearer ${apiToken}`)
  })

  it('wraps each param in its own request', () => {
    const param1 = makeStub('param1', {} as RequestParams)
    const param2 = makeStub('param2', {} as RequestParams)

    const result = prepareRequests([param1, param2], settings)

    expect(result).toHaveLength(2)
    expect(result[0].params).toEqual([param1])
    expect(result[1].params).toEqual([param2])
  })
})

describe('parseResponse', () => {
  it('returns error response when response.data is null', () => {
    const param = makeStub('param', {} as RequestParams)
    const response = { data: null as ResponseSchema | null }

    const result = parseResponse([param], response)

    expect(result[0].response).toEqual({
      errorMessage: 'The data provider did not return any value',
      statusCode: 502,
    })
  })

  it('returns error response when response.data is undefined', () => {
    const param = makeStub('param', {} as RequestParams)
    const response = { data: undefined as ResponseSchema | undefined }

    const result = parseResponse([param], response)

    expect(result[0].response).toEqual({
      errorMessage: 'The data provider did not return any value',
      statusCode: 502,
    })
  })

  it('returns daysRemaining from response data', () => {
    const param = makeStub('param', {} as RequestParams)
    const response = {
      data: {
        daysRemaining: 42,
        hash: '0xabc123',
      },
    }

    const result = parseResponse([param], response)

    expect((result[0].response as { data: { daysRemaining: number } }).data.daysRemaining).toBe(42)
  })

  it('returns computed aum from hash', () => {
    const hash = '0xabc123def456'
    const param = makeStub('param', {} as RequestParams)
    const response = {
      data: {
        daysRemaining: 30,
        hash,
      },
    }

    const result = parseResponse([param], response)
    const expectedAum = hashToAum(hash)

    expect((result[0].response as { data: { aum: string } }).data.aum).toBe(expectedAum)
  })

  it('returns null as result', () => {
    const param = makeStub('param', {} as RequestParams)
    const response = {
      data: {
        daysRemaining: 30,
        hash: '0xabc123',
      },
    }

    const result = parseResponse([param], response)

    expect((result[0].response as { result: null }).result).toBeNull()
  })

  it('handles multiple params with same response data', () => {
    const param1 = makeStub('param1', {} as RequestParams)
    const param2 = makeStub('param2', {} as RequestParams)
    const response = {
      data: {
        daysRemaining: 15,
        hash: 'test-hash',
      },
    }

    const result = parseResponse([param1, param2], response)

    expect(result).toHaveLength(2)
    expect(result[0].params).toBe(param1)
    expect(result[1].params).toBe(param2)
    expect((result[0].response as { data: { daysRemaining: number } }).data.daysRemaining).toBe(15)
    expect((result[1].response as { data: { daysRemaining: number } }).data.daysRemaining).toBe(15)
  })
})
