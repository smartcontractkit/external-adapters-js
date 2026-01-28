import {
  marketStatusMap,
  settlementFlagMap,
  getMarketStatus,
  getSettlementFlag,
  calculateMidPrice,
  parseTimestampToUnixSeconds,
  parseTimestampToUnixMs,
  buildRequestConfig,
  parseMarketResponse,
  KalshiMarketResponse,
  ProviderResponse,
} from '../../src/transport/utils'

describe('getMarketStatus', () => {
  it('returns 1 for active status', () => {
    expect(getMarketStatus('active')).toBe(1)
  })

  it('returns 2 for closed status', () => {
    expect(getMarketStatus('closed')).toBe(2)
  })

  it('returns 3 for settled status', () => {
    expect(getMarketStatus('settled')).toBe(3)
  })

  it('returns 0 for unknown status', () => {
    expect(getMarketStatus('unknown')).toBe(0)
  })

  it('returns 0 for empty string', () => {
    expect(getMarketStatus('')).toBe(0)
  })
})

describe('getSettlementFlag', () => {
  it('returns 1 for yes result', () => {
    expect(getSettlementFlag('yes')).toBe(1)
  })

  it('returns 2 for no result', () => {
    expect(getSettlementFlag('no')).toBe(2)
  })

  it('returns 0 for undefined result', () => {
    expect(getSettlementFlag(undefined)).toBe(0)
  })

  it('returns 0 for unknown result', () => {
    expect(getSettlementFlag('unknown')).toBe(0)
  })

  it('returns 0 for empty string', () => {
    expect(getSettlementFlag('')).toBe(0)
  })
})

describe('calculateMidPrice', () => {
  it('calculates mid price correctly for standard values', () => {
    expect(calculateMidPrice(48, 52)).toBe(50)
  })

  it('calculates mid price correctly when bid equals ask', () => {
    expect(calculateMidPrice(100, 100)).toBe(100)
  })

  it('calculates mid price correctly for zero values', () => {
    expect(calculateMidPrice(0, 0)).toBe(0)
  })

  it('calculates mid price correctly for decimal result', () => {
    expect(calculateMidPrice(45, 56)).toBe(50.5)
  })
})

describe('parseTimestampToUnixSeconds', () => {
  it('parses ISO timestamp to unix seconds', () => {
    expect(parseTimestampToUnixSeconds('2025-03-19T18:00:00Z')).toBe(1742407200)
  })

  it('parses timestamp with milliseconds', () => {
    expect(parseTimestampToUnixSeconds('2025-01-29T00:57:00.500Z')).toBe(1738112220)
  })

  it('returns NaN for invalid timestamp', () => {
    expect(parseTimestampToUnixSeconds('invalid')).toBeNaN()
  })
})

describe('parseTimestampToUnixMs', () => {
  it('parses ISO timestamp to unix milliseconds', () => {
    expect(parseTimestampToUnixMs('2025-03-19T18:00:00Z')).toBe(1742407200000)
  })

  it('parses timestamp with milliseconds', () => {
    expect(parseTimestampToUnixMs('2025-01-29T00:57:00.500Z')).toBe(1738112220500)
  })

  it('returns NaN for invalid timestamp', () => {
    expect(parseTimestampToUnixMs('invalid')).toBeNaN()
  })
})

describe('buildRequestConfig', () => {
  const mockConfig = {
    API_ENDPOINT: 'https://api.kalshi.com/v1',
    KALSHI_API_KEY: 'test-api-key',
  }

  it('builds correct request config with market ticker', () => {
    const result = buildRequestConfig({ market_ticker: 'KXUSIRATECUTS25MAR' }, mockConfig)

    expect(result.params).toEqual([{ market_ticker: 'KXUSIRATECUTS25MAR' }])
    expect(result.request.baseURL).toBe('https://api.kalshi.com/v1')
    expect(result.request.url).toBe('/markets/KXUSIRATECUTS25MAR')
    expect(result.request.headers.accept).toBe('application/json')
    expect(result.request.headers.Authorization).toBe('Bearer test-api-key')
  })

  it('builds correct URL for different market ticker', () => {
    const result = buildRequestConfig({ market_ticker: 'ANOTHERMARKET' }, mockConfig)

    expect(result.request.url).toBe('/markets/ANOTHERMARKET')
  })

  it('uses custom API endpoint from config', () => {
    const customConfig = {
      API_ENDPOINT: 'https://custom.api.com',
      KALSHI_API_KEY: 'custom-key',
    }
    const result = buildRequestConfig({ market_ticker: 'TEST' }, customConfig)

    expect(result.request.baseURL).toBe('https://custom.api.com')
    expect(result.request.headers.Authorization).toBe('Bearer custom-key')
  })
})

describe('parseMarketResponse', () => {
  const createMockResponse = (data: KalshiMarketResponse | null): ProviderResponse<KalshiMarketResponse> =>
    ({
      data,
    }) as ProviderResponse<KalshiMarketResponse>

  describe('successful response parsing', () => {
    it('parses active market response correctly', () => {
      const response = createMockResponse({
        market: {
          ticker: 'KXUSIRATECUTS25MAR',
          event_ticker: 'USIRATECUTS25',
          status: 'active',
          yes_bid: 48,
          yes_ask: 52,
          no_bid: 45,
          no_ask: 55,
          open_interest: 104923,
          category: 'Macro',
          close_time: '2025-03-19T18:00:00Z',
          updated_at: '2025-01-29T00:57:00Z',
        },
      })

      const result = parseMarketResponse([{ market_ticker: 'KXUSIRATECUTS25MAR' }], response)

      expect(result).toHaveLength(1)
      expect(result[0].params.market_ticker).toBe('KXUSIRATECUTS25MAR')

      const data = (result[0].response as { data: Record<string, unknown> }).data
      expect(data.market_ticker).toBe('KXUSIRATECUTS25MAR')
      expect(data.event_ticker).toBe('USIRATECUTS25')
      expect(data.market_status).toBe(1)
      expect(data.settlement_flag).toBe(0)
      expect(data.yes_bid_price).toBe(48)
      expect(data.yes_ask_price).toBe(52)
      expect(data.no_bid_price).toBe(45)
      expect(data.no_ask_price).toBe(55)
      expect(data.yes_mid_price).toBe(50)
      expect(data.no_mid_price).toBe(50)
      expect(data.open_interest).toBe(104923)
      expect(data.category).toBe('Macro')
      expect(data.close_timestamp).toBe(1742407200)
      expect(data.updated_at).toBe(1738112220)
    })

    it('parses settled market with yes result', () => {
      const response = createMockResponse({
        market: {
          ticker: 'SETTLEDMARKET',
          event_ticker: 'SETTLEDEVENT',
          status: 'settled',
          result: 'yes',
          yes_bid: 100,
          yes_ask: 100,
          no_bid: 0,
          no_ask: 0,
          open_interest: 75000,
          category: 'Economics',
          close_time: '2025-01-10T18:00:00Z',
          updated_at: '2025-01-10T18:05:00Z',
        },
      })

      const result = parseMarketResponse([{ market_ticker: 'SETTLEDMARKET' }], response)

      const data = (result[0].response as { data: Record<string, unknown> }).data
      expect(data.market_status).toBe(3)
      expect(data.settlement_flag).toBe(1)
    })

    it('parses settled market with no result', () => {
      const response = createMockResponse({
        market: {
          ticker: 'SETTLEDMARKET',
          event_ticker: 'SETTLEDEVENT',
          status: 'settled',
          result: 'no',
          yes_bid: 0,
          yes_ask: 0,
          no_bid: 100,
          no_ask: 100,
          open_interest: 60000,
          category: 'Climate',
          close_time: '2025-01-05T18:00:00Z',
          updated_at: '2025-01-05T18:10:00Z',
        },
      })

      const result = parseMarketResponse([{ market_ticker: 'SETTLEDMARKET' }], response)

      const data = (result[0].response as { data: Record<string, unknown> }).data
      expect(data.market_status).toBe(3)
      expect(data.settlement_flag).toBe(2)
    })

    it('parses closed market', () => {
      const response = createMockResponse({
        market: {
          ticker: 'CLOSEDMARKET',
          event_ticker: 'CLOSEDEVENT',
          status: 'closed',
          yes_bid: 45,
          yes_ask: 55,
          no_bid: 45,
          no_ask: 55,
          open_interest: 50000,
          category: 'Politics',
          close_time: '2025-01-15T18:00:00Z',
          updated_at: '2025-01-15T18:00:00Z',
        },
      })

      const result = parseMarketResponse([{ market_ticker: 'CLOSEDMARKET' }], response)

      const data = (result[0].response as { data: Record<string, unknown> }).data
      expect(data.market_status).toBe(2)
      expect(data.settlement_flag).toBe(0)
    })

    it('sets providerIndicatedTimeUnixMs from updated_at', () => {
      const response = createMockResponse({
        market: {
          ticker: 'TEST',
          event_ticker: 'TESTEVENT',
          status: 'active',
          yes_bid: 50,
          yes_ask: 50,
          no_bid: 50,
          no_ask: 50,
          open_interest: 1000,
          category: 'Test',
          close_time: '2025-03-19T18:00:00Z',
          updated_at: '2025-01-29T00:57:00Z',
        },
      })

      const result = parseMarketResponse([{ market_ticker: 'TEST' }], response)

      const timestamps = (result[0].response as { timestamps: { providerIndicatedTimeUnixMs: number } }).timestamps
      expect(timestamps.providerIndicatedTimeUnixMs).toBe(1738112220000)
    })

    it('handles unknown market status with 0', () => {
      const response = createMockResponse({
        market: {
          ticker: 'UNKNOWNMARKET',
          event_ticker: 'UNKNOWNEVENT',
          status: 'unknown_status',
          yes_bid: 50,
          yes_ask: 50,
          no_bid: 50,
          no_ask: 50,
          open_interest: 10000,
          category: 'Other',
          close_time: '2025-06-01T18:00:00Z',
          updated_at: '2025-01-20T12:00:00Z',
        },
      })

      const result = parseMarketResponse([{ market_ticker: 'UNKNOWNMARKET' }], response)

      const data = (result[0].response as { data: Record<string, unknown> }).data
      expect(data.market_status).toBe(0)
    })

    it('handles unknown settlement result with 0', () => {
      const response = createMockResponse({
        market: {
          ticker: 'SETTLEDMARKET',
          event_ticker: 'SETTLEDEVENT',
          status: 'settled',
          result: 'unknown_result',
          yes_bid: 50,
          yes_ask: 50,
          no_bid: 50,
          no_ask: 50,
          open_interest: 10000,
          category: 'Other',
          close_time: '2025-06-01T18:00:00Z',
          updated_at: '2025-01-20T12:00:00Z',
        },
      })

      const result = parseMarketResponse([{ market_ticker: 'SETTLEDMARKET' }], response)

      const data = (result[0].response as { data: Record<string, unknown> }).data
      expect(data.settlement_flag).toBe(0)
    })
  })

  describe('error responses', () => {
    it('returns error for empty response data', () => {
      const response = createMockResponse(null as unknown as KalshiMarketResponse)

      const result = parseMarketResponse([{ market_ticker: 'EMPTYMARKET' }], response)

      expect(result).toHaveLength(1)
      expect(result[0].response).toEqual({
        errorMessage: "The data provider didn't return any value for EMPTYMARKET",
        statusCode: 502,
      })
    })

    it('returns error for response with null market', () => {
      const response = createMockResponse({ market: null } as unknown as KalshiMarketResponse)

      const result = parseMarketResponse([{ market_ticker: 'NULLMARKET' }], response)

      expect(result).toHaveLength(1)
      expect(result[0].response).toEqual({
        errorMessage: "The data provider didn't return any value for NULLMARKET",
        statusCode: 502,
      })
    })

    it('returns error for response with empty object', () => {
      const response = createMockResponse({} as KalshiMarketResponse)

      const result = parseMarketResponse([{ market_ticker: 'MISSINGMARKET' }], response)

      expect(result).toHaveLength(1)
      expect((result[0].response as { errorMessage: string }).errorMessage).toContain('MISSINGMARKET')
      expect((result[0].response as { statusCode: number }).statusCode).toBe(502)
    })

    it('returns error for each param when response is empty', () => {
      const response = createMockResponse(null as unknown as KalshiMarketResponse)

      const result = parseMarketResponse(
        [{ market_ticker: 'MARKET1' }, { market_ticker: 'MARKET2' }],
        response,
      )

      expect(result).toHaveLength(2)
      expect((result[0].response as { errorMessage: string }).errorMessage).toContain('MARKET1')
      expect((result[1].response as { errorMessage: string }).errorMessage).toContain('MARKET2')
    })
  })

  describe('multiple params handling', () => {
    it('returns same data for all params from single response', () => {
      const response = createMockResponse({
        market: {
          ticker: 'KXUSIRATECUTS25MAR',
          event_ticker: 'USIRATECUTS25',
          status: 'active',
          yes_bid: 48,
          yes_ask: 52,
          no_bid: 45,
          no_ask: 55,
          open_interest: 104923,
          category: 'Macro',
          close_time: '2025-03-19T18:00:00Z',
          updated_at: '2025-01-29T00:57:00Z',
        },
      })

      const result = parseMarketResponse(
        [{ market_ticker: 'PARAM1' }, { market_ticker: 'PARAM2' }],
        response,
      )

      expect(result).toHaveLength(2)
      expect(result[0].params.market_ticker).toBe('PARAM1')
      expect(result[1].params.market_ticker).toBe('PARAM2')

      const data1 = (result[0].response as { data: Record<string, unknown> }).data
      const data2 = (result[1].response as { data: Record<string, unknown> }).data
      expect(data1.market_ticker).toBe('KXUSIRATECUTS25MAR')
      expect(data2.market_ticker).toBe('KXUSIRATECUTS25MAR')
    })
  })
})

describe('marketStatusMap', () => {
  it('contains expected status mappings', () => {
    expect(marketStatusMap).toEqual({
      active: 1,
      closed: 2,
      settled: 3,
    })
  })
})

describe('settlementFlagMap', () => {
  it('contains expected settlement mappings', () => {
    expect(settlementFlagMap).toEqual({
      yes: 1,
      no: 2,
    })
  })
})
