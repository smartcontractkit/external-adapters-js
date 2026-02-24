import {
  buildAllocation,
  buildEmptyAllocationsResponse,
  buildErrorResponse,
  buildSuccessResponse,
  buildTokenAllocationRequest,
  parseTokenAllocationResult,
} from '../../src/transport/utils'

describe('parseTokenAllocationResult', () => {
  it('parses integer number correctly', () => {
    const result = parseTokenAllocationResult(12345)
    expect(result).toBe(12345)
  })

  it('parses floating point number correctly', () => {
    const result = parseTokenAllocationResult(12345.6789)
    expect(result).toBe(12345.6789)
  })

  it('parses string integer correctly', () => {
    const result = parseTokenAllocationResult('98765')
    expect(result).toBe(98765)
  })

  it('parses string with decimals correctly', () => {
    const result = parseTokenAllocationResult('12345.67')
    expect(result).toBe(12345.67)
  })

  it('handles very large numbers with high precision', () => {
    const largeNumber = '123456789012345678901234567890.123456789'
    const result = parseTokenAllocationResult(largeNumber)
    expect(result).toBe(1.2345678901234568e29)
  })

  it('handles zero', () => {
    expect(parseTokenAllocationResult(0)).toBe(0)
    expect(parseTokenAllocationResult('0')).toBe(0)
  })

  it('handles negative numbers', () => {
    expect(parseTokenAllocationResult(-123.45)).toBe(-123.45)
    expect(parseTokenAllocationResult('-123.45')).toBe(-123.45)
  })

  it('handles scientific notation string', () => {
    const result = parseTokenAllocationResult('1.5e10')
    expect(result).toBe(15000000000)
  })
})

describe('buildTokenAllocationRequest', () => {
  const mockAllocations = [
    { symbol: 'AAPL', decimals: 18, balance: '1000000000000000000' },
    { symbol: 'GOOGL', decimals: 8, balance: '200000000' },
  ]

  it('builds request with correct url', () => {
    const request = buildTokenAllocationRequest(
      'http://localhost:8080',
      mockAllocations,
      'coingecko',
    )
    expect(request.url).toBe('http://localhost:8080')
  })

  it('builds request with POST method', () => {
    const request = buildTokenAllocationRequest(
      'http://localhost:8080',
      mockAllocations,
      'coingecko',
    )
    expect(request.method).toBe('POST')
  })

  it('builds request with allocations in data', () => {
    const request = buildTokenAllocationRequest(
      'http://localhost:8080',
      mockAllocations,
      'coingecko',
    )
    expect(request.data.data.allocations).toEqual(mockAllocations)
  })

  it('builds request with quote set to USD', () => {
    const request = buildTokenAllocationRequest(
      'http://localhost:8080',
      mockAllocations,
      'coingecko',
    )
    expect(request.data.data.quote).toBe('USD')
  })

  it('builds request with method set to price', () => {
    const request = buildTokenAllocationRequest(
      'http://localhost:8080',
      mockAllocations,
      'coingecko',
    )
    expect(request.data.data.method).toBe('price')
  })

  it('builds request with provided source', () => {
    const request = buildTokenAllocationRequest(
      'http://localhost:8080',
      mockAllocations,
      'coinmarketcap',
    )
    expect(request.data.data.source).toBe('coinmarketcap')
  })

  it('handles empty allocations array', () => {
    const request = buildTokenAllocationRequest('http://localhost:8080', [], 'coingecko')
    expect(request.data.data.allocations).toEqual([])
  })
})

describe('buildAllocation', () => {
  it('builds allocation with correct symbol', () => {
    const allocation = buildAllocation('AAPL', 18, '1000000000000000000')
    expect(allocation.symbol).toBe('AAPL')
  })

  it('builds allocation with correct decimals', () => {
    const allocation = buildAllocation('AAPL', 18, '1000000000000000000')
    expect(allocation.decimals).toBe(18)
  })

  it('builds allocation with correct balance', () => {
    const allocation = buildAllocation('AAPL', 18, '1000000000000000000')
    expect(allocation.balance).toBe('1000000000000000000')
  })

  it('handles different decimal values', () => {
    const allocation = buildAllocation('USDC', 6, '1000000')
    expect(allocation.decimals).toBe(6)
    expect(allocation.balance).toBe('1000000')
  })

  it('handles zero balance', () => {
    const allocation = buildAllocation('BTC', 8, '0')
    expect(allocation.balance).toBe('0')
  })
})

describe('buildEmptyAllocationsResponse', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(1000000000000)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns result as 0', () => {
    const response = buildEmptyAllocationsResponse(999999999000)
    expect(response.result).toBe(0)
  })

  it('returns data.result as 0', () => {
    const response = buildEmptyAllocationsResponse(999999999000)
    expect(response.data.result).toBe(0)
  })

  it('returns statusCode 200', () => {
    const response = buildEmptyAllocationsResponse(999999999000)
    expect(response.statusCode).toBe(200)
  })

  it('sets providerDataRequestedUnixMs from parameter', () => {
    const requestedTime = 999999999000
    const response = buildEmptyAllocationsResponse(requestedTime)
    expect(response.timestamps.providerDataRequestedUnixMs).toBe(requestedTime)
  })

  it('sets providerDataReceivedUnixMs to Date.now()', () => {
    const response = buildEmptyAllocationsResponse(999999999000)
    expect(response.timestamps.providerDataReceivedUnixMs).toBe(1000000000000)
  })

  it('sets providerIndicatedTimeUnixMs to undefined', () => {
    const response = buildEmptyAllocationsResponse(999999999000)
    expect(response.timestamps.providerIndicatedTimeUnixMs).toBeUndefined()
  })
})

describe('buildSuccessResponse', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(1000000000000)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns result with provided index value', () => {
    const response = buildSuccessResponse(12345.67, 999999999000)
    expect(response.result).toBe(12345.67)
  })

  it('returns data.result with provided index value', () => {
    const response = buildSuccessResponse(12345.67, 999999999000)
    expect(response.data.result).toBe(12345.67)
  })

  it('returns statusCode 200', () => {
    const response = buildSuccessResponse(12345.67, 999999999000)
    expect(response.statusCode).toBe(200)
  })

  it('sets providerDataRequestedUnixMs from parameter', () => {
    const requestedTime = 999999999000
    const response = buildSuccessResponse(12345.67, requestedTime)
    expect(response.timestamps.providerDataRequestedUnixMs).toBe(requestedTime)
  })

  it('sets providerDataReceivedUnixMs to Date.now()', () => {
    const response = buildSuccessResponse(12345.67, 999999999000)
    expect(response.timestamps.providerDataReceivedUnixMs).toBe(1000000000000)
  })

  it('sets providerIndicatedTimeUnixMs to undefined', () => {
    const response = buildSuccessResponse(12345.67, 999999999000)
    expect(response.timestamps.providerIndicatedTimeUnixMs).toBeUndefined()
  })

  it('handles zero index value', () => {
    const response = buildSuccessResponse(0, 999999999000)
    expect(response.result).toBe(0)
  })

  it('handles large index values', () => {
    const largeValue = 9999999999999.99
    const response = buildSuccessResponse(largeValue, 999999999000)
    expect(response.result).toBe(largeValue)
  })
})

describe('buildErrorResponse', () => {
  it('returns statusCode 502', () => {
    const response = buildErrorResponse('Test error message')
    expect(response.statusCode).toBe(502)
  })

  it('returns the provided error message', () => {
    const errorMsg = 'Failed to fetch data from provider'
    const response = buildErrorResponse(errorMsg)
    expect(response.errorMessage).toBe(errorMsg)
  })

  it('sets providerDataRequestedUnixMs to 0', () => {
    const response = buildErrorResponse('Test error')
    expect(response.timestamps.providerDataRequestedUnixMs).toBe(0)
  })

  it('sets providerDataReceivedUnixMs to 0', () => {
    const response = buildErrorResponse('Test error')
    expect(response.timestamps.providerDataReceivedUnixMs).toBe(0)
  })

  it('sets providerIndicatedTimeUnixMs to undefined', () => {
    const response = buildErrorResponse('Test error')
    expect(response.timestamps.providerIndicatedTimeUnixMs).toBeUndefined()
  })

  it('handles empty error message', () => {
    const response = buildErrorResponse('')
    expect(response.errorMessage).toBe('')
  })

  it('handles long error messages', () => {
    const longError = 'A'.repeat(1000)
    const response = buildErrorResponse(longError)
    expect(response.errorMessage).toBe(longError)
  })
})
