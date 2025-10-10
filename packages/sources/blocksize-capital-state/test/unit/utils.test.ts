jest.mock('@chainlink/external-adapter-framework/util', () => ({
  makeLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}))

import {
  blocksizeStateWebsocketOpenHandler,
  buildBlocksizeWebsocketAuthMessage,
  buildBlocksizeWebsocketTickersMessage,
  processStateData,
  StateData,
} from '../../src/transport/utils'

describe('utils.ts', () => {
  describe('buildBlocksizeWebsocketAuthMessage', () => {
    it('should build correct authentication message', () => {
      const auth = {
        api_key: 'test-api-key',
        token: 'test-token',
      }
      const result = buildBlocksizeWebsocketAuthMessage(auth)
      expect(result).toEqual({
        jsonrpc: '2.0',
        method: 'authentication_logon',
        params: auth,
      })
    })

    it('should handle empty credentials', () => {
      const auth = {
        api_key: '',
        token: '',
      }
      const result = buildBlocksizeWebsocketAuthMessage(auth)
      expect(result).toEqual({
        jsonrpc: '2.0',
        method: 'authentication_logon',
        params: auth,
      })
    })
  })

  describe('buildBlocksizeWebsocketTickersMessage', () => {
    it('should build subscription message correctly', () => {
      const method = 'state_subscribe'
      const tickerParams = { tickers: ['CBBTCUSD', 'ALETHUSD'] }
      const result = buildBlocksizeWebsocketTickersMessage(method, tickerParams)
      expect(result).toEqual({
        jsonrpc: '2.0',
        method: 'state_subscribe',
        params: tickerParams,
      })
    })

    it('should build unsubscription message correctly', () => {
      const method = 'state_unsubscribe'
      const tickerParams = { tickers: ['CBBTCUSD'] }
      const result = buildBlocksizeWebsocketTickersMessage(method, tickerParams)
      expect(result).toEqual({
        jsonrpc: '2.0',
        method: 'state_unsubscribe',
        params: tickerParams,
      })
    })

    it('should handle empty tickers array', () => {
      const method = 'state_subscribe'
      const tickerParams = { tickers: [] }
      const result = buildBlocksizeWebsocketTickersMessage(method, tickerParams)
      expect(result).toEqual({
        jsonrpc: '2.0',
        method: 'state_subscribe',
        params: tickerParams,
      })
    })
  })

  describe('processStateData', () => {
    const validStateData: StateData = {
      timestamp: 1672531200,
      base_symbol: 'CBBTC',
      quote_symbol: 'USD',
      aggregated_state_price: '50000.50',
      aggregated_plus_1_percent_usd_market_depth: '1000000',
      aggregated_minus_1_percent_usd_market_depth: '900000',
      aggregated_7d_usd_trading_volume: '5000000',
    }

    it('should process valid state data correctly', () => {
      const result = processStateData(validStateData)
      expect(result).toEqual({
        params: { base: 'CBBTC', quote: 'USD' },
        response: {
          data: { result: 50000.5 },
          result: 50000.5,
          timestamps: { providerIndicatedTimeUnixMs: 1672531200000 },
        },
      })
    })

    it('should handle streaming flag correctly', () => {
      const result = processStateData(validStateData, true)
      expect(result).toEqual({
        params: { base: 'CBBTC', quote: 'USD' },
        response: {
          data: { result: 50000.5 },
          result: 50000.5,
          timestamps: { providerIndicatedTimeUnixMs: 1672531200000 },
        },
      })
    })

    it('should return error for missing aggregated_state_price', () => {
      const invalidData = {
        ...validStateData,
        aggregated_state_price: '',
      }
      const result = processStateData(invalidData)
      expect(result.response.statusCode).toBe(502)
      expect(result.response.errorMessage).toContain('incomplete')
      expect(result.response.errorMessage).toContain('CBBTC/USD')
    })

    it('should return error for missing base_symbol', () => {
      const invalidData = {
        ...validStateData,
        base_symbol: '',
      }
      const result = processStateData(invalidData)
      expect(result.response.statusCode).toBe(502)
      expect(result.response.errorMessage).toContain('incomplete')
    })

    it('should return error for missing quote_symbol', () => {
      const invalidData = {
        ...validStateData,
        quote_symbol: '',
      }
      const result = processStateData(invalidData)
      expect(result.response.statusCode).toBe(502)
      expect(result.response.errorMessage).toContain('incomplete')
    })

    it('should return error for invalid price format', () => {
      const invalidData = {
        ...validStateData,
        aggregated_state_price: 'not-a-number',
      }
      const result = processStateData(invalidData)
      expect(result.response.statusCode).toBe(502)
      expect(result.response.errorMessage).toContain('invalid aggregated_state_price')
      expect(result.response.errorMessage).toContain('not-a-number')
    })

    it('should return error for negative price', () => {
      const invalidData = {
        ...validStateData,
        aggregated_state_price: '-100.50',
      }
      const result = processStateData(invalidData)
      expect(result.response.statusCode).toBe(502)
      expect(result.response.errorMessage).toContain('invalid aggregated_state_price')
      expect(result.response.errorMessage).toContain('-100.5')
    })

    it('should return error for zero price', () => {
      const invalidData = {
        ...validStateData,
        aggregated_state_price: '0',
      }
      const result = processStateData(invalidData)
      expect(result.response.statusCode).toBe(502)
      expect(result.response.errorMessage).toContain('invalid aggregated_state_price')
    })

    it('should handle decimal prices correctly', () => {
      const decimalData = {
        ...validStateData,
        aggregated_state_price: '0.001234',
      }
      const result = processStateData(decimalData)
      expect('data' in result.response).toBe(true)
      expect((result.response as any).data.result).toBe(0.001234)
      expect((result.response as any).result).toBe(0.001234)
    })

    it('should handle integer prices correctly', () => {
      const integerData = {
        ...validStateData,
        aggregated_state_price: '50000',
      }
      const result = processStateData(integerData)
      expect('data' in result.response).toBe(true)
      expect((result.response as any).data.result).toBe(50000)
      expect((result.response as any).result).toBe(50000)
    })

    it('should handle scientific notation', () => {
      const scientificData = {
        ...validStateData,
        aggregated_state_price: '1.23e-5',
      }
      const result = processStateData(scientificData)
      expect('data' in result.response).toBe(true)
      expect((result.response as any).data.result).toBe(0.0000123)
    })

    it('should preserve timestamp correctly', () => {
      const timestampData = {
        ...validStateData,
        timestamp: 1234567890,
      }
      const result = processStateData(timestampData)
      expect('timestamps' in result.response).toBe(true)
      expect((result.response as any).timestamps.providerIndicatedTimeUnixMs).toBe(1234567890000)
    })
  })

  describe('blocksizeStateWebsocketOpenHandler', () => {
    let mockConnection: any
    let mockAuth: any

    beforeEach(() => {
      mockConnection = {
        send: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }
      mockAuth = {
        api_key: 'test-api-key',
        token: 'test-token',
      }
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should resolve on successful authentication', async () => {
      const authPromise = blocksizeStateWebsocketOpenHandler(mockConnection, mockAuth)
      const messageHandler = mockConnection.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'message',
      )[1]
      const successEvent = {
        data: JSON.stringify({
          jsonrpc: '2.0',
          result: { user_id: 'test-user-123' },
        }),
      }
      messageHandler(successEvent)
      await expect(authPromise).resolves.toBeUndefined()
      expect(mockConnection.send).toHaveBeenCalledWith(
        JSON.stringify({
          jsonrpc: '2.0',
          method: 'authentication_logon',
          params: mockAuth,
        }),
      )
    })

    it('should reject on authentication timeout', async () => {
      const authPromise = blocksizeStateWebsocketOpenHandler(mockConnection, mockAuth)
      jest.advanceTimersByTime(10000)
      await expect(authPromise).rejects.toThrow('Authentication timeout after 10 seconds')
    })

    it('should reject on invalid API key error (4001)', async () => {
      const authPromise = blocksizeStateWebsocketOpenHandler(mockConnection, mockAuth)
      const messageHandler = mockConnection.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'message',
      )[1]
      const errorEvent = {
        data: JSON.stringify({
          jsonrpc: '2.0',
          error: { code: 4001, message: 'Invalid API key' },
        }),
      }
      messageHandler(errorEvent)
      await expect(authPromise).rejects.toThrow('Failed to make WS connection')
    })

    it('should reject on invalid token error (4002)', async () => {
      const authPromise = blocksizeStateWebsocketOpenHandler(mockConnection, mockAuth)
      const messageHandler = mockConnection.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'message',
      )[1]
      const errorEvent = {
        data: JSON.stringify({
          jsonrpc: '2.0',
          error: { code: 4002, message: 'Invalid token' },
        }),
      }
      messageHandler(errorEvent)
      await expect(authPromise).rejects.toThrow('Failed to make WS connection')
    })

    it('should reject on payment required error (4003)', async () => {
      const authPromise = blocksizeStateWebsocketOpenHandler(mockConnection, mockAuth)
      const messageHandler = mockConnection.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'message',
      )[1]
      const errorEvent = {
        data: JSON.stringify({
          jsonrpc: '2.0',
          error: { code: 4003, message: 'Payment required' },
        }),
      }
      messageHandler(errorEvent)
      await expect(authPromise).rejects.toThrow('Failed to make WS connection')
    })

    it('should reject on generic error', async () => {
      const authPromise = blocksizeStateWebsocketOpenHandler(mockConnection, mockAuth)
      const messageHandler = mockConnection.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'message',
      )[1]
      const errorEvent = {
        data: JSON.stringify({
          jsonrpc: '2.0',
          error: { code: 9999, message: 'Unknown error' },
        }),
      }
      messageHandler(errorEvent)
      await expect(authPromise).rejects.toThrow('Failed to make WS connection')
    })

    it('should reject on malformed JSON response', async () => {
      const authPromise = blocksizeStateWebsocketOpenHandler(mockConnection, mockAuth)
      const messageHandler = mockConnection.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'message',
      )[1]
      const malformedEvent = {
        data: 'invalid json',
      }
      messageHandler(malformedEvent)
      await expect(authPromise).rejects.toThrow('Failed to parse authentication response')
    })

    it('should clean up event listeners on success', async () => {
      const authPromise = blocksizeStateWebsocketOpenHandler(mockConnection, mockAuth)
      const messageHandler = mockConnection.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'message',
      )[1]
      const successEvent = {
        data: JSON.stringify({
          jsonrpc: '2.0',
          result: { user_id: 'test-user-123' },
        }),
      }
      messageHandler(successEvent)
      await authPromise
      expect(mockConnection.removeEventListener).toHaveBeenCalledWith('message', messageHandler)
    })

    it('should clean up event listeners on error', async () => {
      const authPromise = blocksizeStateWebsocketOpenHandler(mockConnection, mockAuth)
      const messageHandler = mockConnection.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'message',
      )[1]
      const errorEvent = {
        data: JSON.stringify({
          jsonrpc: '2.0',
          error: { code: 4001, message: 'Invalid API key' },
        }),
      }
      messageHandler(errorEvent)
      await expect(authPromise).rejects.toThrow()
      expect(mockConnection.removeEventListener).toHaveBeenCalledWith('message', messageHandler)
    })
  })
})
