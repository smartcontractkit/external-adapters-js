import { AxiosResponse } from 'axios'
import {
  parseNavPerShare,
  parseResponse,
  prepareRequests,
  ResponseSchema,
} from '../../src/transport/transport'
import { ErrorResponse, SuccessResponse, TEST_BEARER_TOKEN, TEST_URL } from '../utils/testConfig'

describe('Transport functions', () => {
  // Mock adapter settings that match the expected type
  const mockAdapterSettings = {
    API_BASE_URL: TEST_URL,
    BEARER_TOKEN: TEST_BEARER_TOKEN,
  } as any

  describe('parseNavPerShare', () => {
    it('should parse valid nav_per_share values', () => {
      expect(parseNavPerShare('100')).toBe(100)
      expect(parseNavPerShare('0')).toBe(0)
      expect(parseNavPerShare('3.14')).toBe(3.14)
    })

    it('should throw an error for invalid nav_per_share values', () => {
      expect(() => parseNavPerShare(null)).toThrow('nav_per_share is null')
      expect(() => parseNavPerShare('invalid')).toThrow('Invalid nav_per_share value: invalid')
      expect(() => parseNavPerShare('NaN')).toThrow('Invalid nav_per_share value: NaN')
    })
  })

  describe('prepareRequests', () => {
    it('should create a single request for single artwork_id', () => {
      const data = { artwork_id: 'TEST' }
      const singleParam = [data]
      const result = prepareRequests(singleParam, mockAdapterSettings)

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(1)

      const request = result[0]
      expect(request.params).toEqual(singleParam)
      expect(request.request.baseURL).toBe(TEST_URL)
      expect(request.request.url).toBe(`/artwork/${data.artwork_id}/price`)
      expect(request.request.headers?.Authorization).toBe(`Bearer ${TEST_BEARER_TOKEN}`)
    })

    it('should prepare multiple requests correctly', () => {
      const params = [{ artwork_id: 'banksy' }, { artwork_id: 'picasso' }, { artwork_id: 'monet' }]

      const result = prepareRequests(params, mockAdapterSettings)

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(3)
      result.forEach((request, index) => {
        expect(request.params).toEqual([params[index]])
        expect(request.request.baseURL).toBe(TEST_URL)
        expect(request.request.url).toBe(`/artwork/${params[index].artwork_id}/price`)
        expect(request.request.headers?.Authorization).toBe(`Bearer ${TEST_BEARER_TOKEN}`)
      })
    })

    it('should handle empty params array', () => {
      const params: any[] = []

      const result = prepareRequests(params, mockAdapterSettings)

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(0)
    })
  })

  describe('parseResponse', () => {
    it('should parse successful response correctly', () => {
      const data = { artwork_id: 'banksy' }
      const params = [data]
      const mockResponseData: ResponseSchema = {
        ...SuccessResponse,
        artwork_id: 'banksy',
      }

      const mockSuccessResponse = {
        data: mockResponseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      } as AxiosResponse<ResponseSchema>
      const result = parseResponse(params, mockSuccessResponse)
      const expectedNAV = Number(mockResponseData.nav_per_share)

      expect(result).toHaveLength(1)
      expect(result[0].params).toEqual(data)
      expect(result[0].response.result).toBe(expectedNAV)
      expect(result[0].response.data?.result).toBe(expectedNAV)
      expect('errorMessage' in result[0].response).toBe(false)
    })

    it('should handle response with success=false', () => {
      const data = { artwork_id: 'TEST_ERROR' }
      const params = [data]
      const mockResponseData: ResponseSchema = {
        ...ErrorResponse,
        artwork_id: data.artwork_id,
        message: `Asset ID '${data.artwork_id}' not found`,
      }

      const mockErrorResponse = {
        data: mockResponseData,
        status: 404,
        statusText: 'Not Found',
        headers: {},
        config: {},
      } as AxiosResponse<ResponseSchema>
      const result = parseResponse(params, mockErrorResponse)

      expect(result).toHaveLength(1)
      expect(result[0].params).toEqual(data)
      expect(result[0].response.errorMessage).toBe(
        `The data provider failed to return a value for artwork_id=TEST_ERROR, errorMessage: ${mockResponseData.message}`,
      )
    })

    it('should handle response with no data', () => {
      const params = [{ artwork_id: 'no-data' }]
      const mockResponse = {
        data: null as unknown,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      } as AxiosResponse<ResponseSchema>

      const result = parseResponse(params, mockResponse)

      expect(result).toHaveLength(1)
      expect(result[0].params).toEqual({ artwork_id: 'no-data' })
      expect('errorMessage' in result[0].response).toBe(true)
      if ('errorMessage' in result[0].response) {
        expect(result[0].response.errorMessage).toBe(
          `The data provider failed to respond for artwork_id=${params[0].artwork_id}`,
        )
      }
    })

    it('should handle invalid nav_per_share value', () => {
      const data = { artwork_id: 'invalid-nav' }
      const params = [data]
      const mockResponseData: ResponseSchema = {
        ...SuccessResponse,
        artwork_id: data.artwork_id,
        nav_per_share: 'invalid-number',
      }

      const mockResponse = {
        data: mockResponseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      } as AxiosResponse<ResponseSchema>
      const result = parseResponse(params, mockResponse)

      expect(result).toHaveLength(1)
      expect(result[0].params).toEqual(data)
      expect(result[0].response.result).toBeUndefined()
      expect(result[0].response.data).toBeUndefined()
      expect(result[0].response.errorMessage).toBe(
        `Failed to parse response for artwork_id=${data.artwork_id}. Error: Invalid nav_per_share value: ${mockResponseData.nav_per_share}`,
      )
    })
  })
})
