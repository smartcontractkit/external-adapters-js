import {
  AdapterConfig,
  buildErrorResponse,
  buildRequestConfig,
  buildSuccessResponse,
  RequestParams,
} from '../../../src/transport/reserves'

describe('reserves transport', () => {
  describe('buildRequestConfig', () => {
    const mockConfig: AdapterConfig = {
      API_ENDPOINT: 'https://api.example.com/v1',
      ACCOUNTABLE_BEARER_TOKEN: 'test-bearer-token',
    }

    it('returns correct baseURL from config', () => {
      const param: RequestParams = { client: 'syrupusdc' }
      const result = buildRequestConfig(param, mockConfig)

      expect(result.request.baseURL).toBe('https://api.example.com/v1')
    })

    it('returns correct url path', () => {
      const param: RequestParams = { client: 'syrupusdc' }
      const result = buildRequestConfig(param, mockConfig)

      expect(result.request.url).toBe('/reserves')
    })

    it('includes accept header as application/json', () => {
      const param: RequestParams = { client: 'syrupusdc' }
      const result = buildRequestConfig(param, mockConfig)

      expect(result.request.headers.accept).toBe('application/json')
    })

    it('includes Authorization header with Bearer token from config', () => {
      const param: RequestParams = { client: 'syrupusdc' }
      const result = buildRequestConfig(param, mockConfig)

      expect(result.request.headers.Authorization).toBe('Bearer test-bearer-token')
    })

    it('includes client in request params', () => {
      const param: RequestParams = { client: 'syrupusdc' }
      const result = buildRequestConfig(param, mockConfig)

      expect(result.request.params.client).toBe('syrupusdc')
    })

    it('wraps input param in params array', () => {
      const param: RequestParams = { client: 'syrupusdt' }
      const result = buildRequestConfig(param, mockConfig)

      expect(result.params).toEqual([{ client: 'syrupusdt' }])
    })

    it('handles different client values', () => {
      const param: RequestParams = { client: 'customclient' }
      const result = buildRequestConfig(param, mockConfig)

      expect(result.request.params.client).toBe('customclient')
      expect(result.params[0].client).toBe('customclient')
    })
  })

  describe('buildErrorResponse', () => {
    it('returns params unchanged', () => {
      const param: RequestParams = { client: 'syrupusdc' }
      const result = buildErrorResponse(param)

      expect(result.params).toEqual({ client: 'syrupusdc' })
    })

    it('returns statusCode 502', () => {
      const param: RequestParams = { client: 'syrupusdc' }
      const result = buildErrorResponse(param)

      expect(result.response.statusCode).toBe(502)
    })

    it('includes client name in error message', () => {
      const param: RequestParams = { client: 'syrupusdc' }
      const result = buildErrorResponse(param)

      expect(result.response.errorMessage).toBe(
        "The data provider didn't return any value for client: syrupusdc",
      )
    })

    it('handles different client values in error message', () => {
      const param: RequestParams = { client: 'invalidclient' }
      const result = buildErrorResponse(param)

      expect(result.response.errorMessage).toContain('invalidclient')
    })
  })

  describe('buildSuccessResponse', () => {
    it('returns params unchanged', () => {
      const param: RequestParams = { client: 'syrupusdc' }
      const result = buildSuccessResponse(param, 39869034.71)

      expect(result.params).toEqual({ client: 'syrupusdc' })
    })

    it('returns totalReserve as result', () => {
      const param: RequestParams = { client: 'syrupusdc' }
      const result = buildSuccessResponse(param, 39869034.71)

      expect(result.response.result).toBe(39869034.71)
    })

    it('returns totalReserve in data.result', () => {
      const param: RequestParams = { client: 'syrupusdc' }
      const result = buildSuccessResponse(param, 39869034.71)

      expect(result.response.data.result).toBe(39869034.71)
    })

    it('handles zero totalReserve', () => {
      const param: RequestParams = { client: 'zeroclient' }
      const result = buildSuccessResponse(param, 0)

      expect(result.response.result).toBe(0)
      expect(result.response.data.result).toBe(0)
    })

    it('handles large totalReserve values', () => {
      const param: RequestParams = { client: 'largeclient' }
      const largeValue = 999999999999.99
      const result = buildSuccessResponse(param, largeValue)

      expect(result.response.result).toBe(largeValue)
      expect(result.response.data.result).toBe(largeValue)
    })

    it('handles negative totalReserve values', () => {
      const param: RequestParams = { client: 'negativeclient' }
      const result = buildSuccessResponse(param, -100.5)

      expect(result.response.result).toBe(-100.5)
      expect(result.response.data.result).toBe(-100.5)
    })
  })
})
