import {
  buildErrorResponse,
  buildRequestConfig,
  buildSuccessResponseData,
  extractTimestamp,
  parseNavValue,
  ResponseSchema,
} from '../../src/transport/nav'

describe('nav transport', () => {
  describe('extractTimestamp', () => {
    it('returns unix timestamp in milliseconds for valid ISO date', () => {
      const result = extractTimestamp('2026-02-24T02:04:50.593Z')
      expect(result).toBe(1771898690593)
    })

    it('returns unix timestamp for date without milliseconds', () => {
      const result = extractTimestamp('2023-01-15T10:30:00Z')
      expect(result).toBe(1673778600000)
    })

    it('returns NaN for invalid date string', () => {
      const result = extractTimestamp('invalid-date')
      expect(result).toBeNaN()
    })
  })

  describe('parseNavValue', () => {
    it('parses string NAV to number', () => {
      expect(parseNavValue('146.51')).toBe(146.51)
    })

    it('parses integer NAV string to number', () => {
      expect(parseNavValue('100')).toBe(100)
    })

    it('parses zero NAV string', () => {
      expect(parseNavValue('0')).toBe(0)
    })

    it('returns NaN for non-numeric string', () => {
      expect(parseNavValue('invalid')).toBeNaN()
    })

    it('parses negative NAV string', () => {
      expect(parseNavValue('-50.25')).toBe(-50.25)
    })
  })

  describe('buildRequestConfig', () => {
    it('builds correct request configuration with baseURL', () => {
      const result = buildRequestConfig('https://api.example.com')

      expect(result.baseURL).toBe('https://api.example.com')
    })

    it('builds correct request configuration with url path', () => {
      const result = buildRequestConfig('https://api.example.com')

      expect(result.url).toBe('/nav')
    })

    it('builds correct request configuration with headers', () => {
      const result = buildRequestConfig('https://api.example.com')

      expect(result.headers).toEqual({ accept: 'application/json' })
    })
  })

  describe('buildErrorResponse', () => {
    it('returns correct error message', () => {
      const result = buildErrorResponse()

      expect(result.errorMessage).toBe('The data provider did not return any value')
    })

    it('returns correct status code', () => {
      const result = buildErrorResponse()

      expect(result.statusCode).toBe(502)
    })
  })

  describe('buildSuccessResponseData', () => {
    const mockResponseData: ResponseSchema = {
      accountName: 'SYNTHESYS',
      NAV: '146.51',
      updatedAt: '2026-02-24T02:04:50.593Z',
      ripcord: false,
      ripcordDetails: [],
    }

    it('returns parsed NAV as result', () => {
      const result = buildSuccessResponseData(mockResponseData)

      expect(result.result).toBe(146.51)
    })

    it('returns result in data field', () => {
      const result = buildSuccessResponseData(mockResponseData)

      expect(result.data.result).toBe(146.51)
    })

    it('returns ripcord false in data field', () => {
      const result = buildSuccessResponseData(mockResponseData)

      expect(result.data.ripcord).toBe(false)
    })

    it('returns correct timestamp', () => {
      const result = buildSuccessResponseData(mockResponseData)

      expect(result.timestamps.providerIndicatedTimeUnixMs).toBe(1771898690593)
    })

    it('returns ripcord true when set in data', () => {
      const dataWithRipcord: ResponseSchema = {
        ...mockResponseData,
        ripcord: true,
      }

      const result = buildSuccessResponseData(dataWithRipcord)

      expect(result.data.ripcord).toBe(true)
    })

    it('handles integer NAV value', () => {
      const dataWithIntNAV: ResponseSchema = {
        ...mockResponseData,
        NAV: '100',
      }

      const result = buildSuccessResponseData(dataWithIntNAV)

      expect(result.result).toBe(100)
    })
  })
})
