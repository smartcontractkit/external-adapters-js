import { decodeReport, generateAuthHeaders } from '@chainlink/data-streams-sdk'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { createDataEngineTransport } from '../../src/transport/wsTransportBase'

jest.mock('@chainlink/data-streams-sdk', () => ({
  decodeReport: jest.fn(),
  generateAuthHeaders: jest.fn(),
}))

jest.mock('@chainlink/external-adapter-framework/util', () => ({
  makeLogger: jest.fn(),
  ProviderResult: jest.fn(),
}))

jest.mock('../../src/config', () => ({
  config: {
    settings: {
      WS_API_ENDPOINT: 'wss://test.example.com',
      API_USERNAME: 'test-username',
      API_PASSWORD: 'test-password',
    },
  },
}))

const mockDecodeReport = decodeReport as jest.MockedFunction<typeof decodeReport>
const mockGenerateAuthHeaders = generateAuthHeaders as jest.MockedFunction<
  typeof generateAuthHeaders
>
const mockMakeLogger = makeLogger as jest.MockedFunction<typeof makeLogger>

describe('wsTransportBase', () => {
  const mockLogger = {
    error: jest.fn(),
    info: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockMakeLogger.mockReturnValue(mockLogger as unknown as ReturnType<typeof makeLogger>)
    mockGenerateAuthHeaders.mockReturnValue({
      Authorization: 'Bearer test-token',
      'X-API-Key': 'test-key',
    })
  })

  describe('createDataEngineTransport', () => {
    const mockConfig = {
      schemaVersion: 'V3',
      loggerName: 'test-logger',
      extractData: jest.fn((decoded: any) => ({
        price: decoded.price,
        timestamp: decoded.timestamp,
      })),
    }

    const mockContext = {
      adapterSettings: {
        WS_API_ENDPOINT: 'wss://test.example.com',
        API_USERNAME: 'test-username',
        API_PASSWORD: 'test-password',
      },
    }

    describe('url function', () => {
      it('should build correct WebSocket URL with feed IDs', () => {
        const transport = createDataEngineTransport(mockConfig)
        const url = (transport as any).config.url(mockContext, [
          { feedId: '0X0008' },
          { feedId: '0x0003' },
        ])

        expect(url).toBe('wss://test.example.com/api/v1/ws?feedIDs=0x0003%2C0x0008')
      })

      it('should build URL without feed IDs when none provided', () => {
        const transport = createDataEngineTransport(mockConfig)
        const url = (transport as any).config.url(mockContext, [{ random: 123 }])

        expect(url).toBe('wss://test.example.com/api/v1/ws?feedIDs=')
      })
    })

    describe('options function', () => {
      it('should generate correct WebSocket options with auth headers', () => {
        const transport = createDataEngineTransport(mockConfig)
        const options = (transport as any).config.options(mockContext, [
          { feedId: '0X0008' },
          { feedId: '0x0003' },
        ])

        expect(mockGenerateAuthHeaders).toHaveBeenCalledWith(
          'test-username',
          'test-password',
          'GET',
          'wss://test.example.com/api/v1/ws?feedIDs=0x0003%2C0x0008',
        )
        expect(options).toEqual({
          headers: {
            Authorization: 'Bearer test-token',
            'X-API-Key': 'test-key',
          },
          followRedirects: true,
        })
      })
    })

    describe('message handler', () => {
      it('ignore message without full report', () => {
        const transportConfig = (createDataEngineTransport(mockConfig) as any).config

        expect(transportConfig.handlers.message({})).toBeUndefined()
        expect(
          transportConfig.handlers.message({
            report: { feedID: '0x0003' },
          }),
        ).toBeUndefined()
        expect(
          transportConfig.handlers.message({
            report: { fullReport: '0x123' },
          }),
        ).toBeUndefined()
      })

      it('should return error for unsupported schema version', () => {
        mockDecodeReport.mockReturnValue({ version: 'V2' } as any)

        const transportConfig = (createDataEngineTransport(mockConfig) as any).config

        const result = transportConfig.handlers.message({
          report: {
            feedID: '0x0003',
            fullReport: '0x123',
          },
        })

        expect(result).toEqual([
          {
            params: {
              feedId: '0x0003',
            },
            response: {
              statusCode: 400,
              errorMessage: 'V2 schema from 0x0003 is not supported',
            },
          },
        ])
      })

      it('should process valid messages and extract data', () => {
        mockDecodeReport.mockReturnValue({
          version: 'V3',
          price: 50000,
          timestamp: 1234567890,
        } as any)

        const transport = createDataEngineTransport(mockConfig)
        const transportConfig = (transport as any).config

        // Simulate url callback to register subscription
        transportConfig.url(mockContext, [{ feedId: '0x0003' }])

        const result = transportConfig.handlers.message({
          report: {
            feedID: '0x0003',
            fullReport: '0x123',
          },
        })

        expect(result).toEqual([
          {
            params: {
              feedId: '0x0003',
            },
            response: {
              result: null,
              data: {
                price: 50000,
                timestamp: 1234567890,
              },
            },
          },
        ])
      })

      it('should fan out results when desiredSubs are captured via url callback', () => {
        // extractData mock returns { price, timestamp } from decoded report
        mockDecodeReport.mockReturnValue({
          version: 'V3',
          price: '120950127609218450000000',
          timestamp: 1234567890,
        } as any)

        const extractDataWithBid = jest.fn((decoded: any) => ({
          price: decoded.price,
          bid: decoded.bid,
        }))

        const transport = createDataEngineTransport({
          ...mockConfig,
          extractData: extractDataWithBid,
        })
        const transportConfig = (transport as any).config

        mockDecodeReport.mockReturnValue({
          version: 'V3',
          price: '120950127609218450000000',
          bid: '120945968265543240000000',
        } as any)

        // Simulate url callback to capture desiredSubs
        transportConfig.url(mockContext, [
          { feedId: '0x0003', resultPath: 'price' },
          { feedId: '0x0003', resultPath: 'bid' },
        ])

        const result = transportConfig.handlers.message({
          report: {
            feedID: '0x0003',
            fullReport: '0x123',
          },
        })

        expect(result).toHaveLength(2)
        expect(result[0]).toEqual({
          params: { feedId: '0x0003', resultPath: 'price' },
          response: {
            result: '120950127609218450000000',
            data: {
              price: '120950127609218450000000',
              bid: '120945968265543240000000',
            },
          },
        })
        expect(result[1]).toEqual({
          params: { feedId: '0x0003', resultPath: 'bid' },
          response: {
            result: '120945968265543240000000',
            data: {
              price: '120950127609218450000000',
              bid: '120945968265543240000000',
            },
          },
        })
      })

      it('should apply decimals scaling when resultPath and decimals are provided', () => {
        mockDecodeReport.mockReturnValue({
          version: 'V3',
          price: '120950127609218450000000',
        } as any)

        const transport = createDataEngineTransport(mockConfig)
        const transportConfig = (transport as any).config

        // Simulate url callback to capture desiredSubs
        transportConfig.url(mockContext, [{ feedId: '0x0003', resultPath: 'price', decimals: 8 }])

        const result = transportConfig.handlers.message({
          report: {
            feedID: '0x0003',
            fullReport: '0x123',
          },
        })

        expect(result).toHaveLength(1)
        expect(result[0].response.result).toBe('12095012760921')
        // data should still contain raw values
        expect(result[0].response.data.price).toBe('120950127609218450000000')
      })

      it('should return result null when resultPath is not provided even with desiredSubs', () => {
        mockDecodeReport.mockReturnValue({
          version: 'V3',
          price: '120950127609218450000000',
        } as any)

        const transport = createDataEngineTransport(mockConfig)
        const transportConfig = (transport as any).config

        // Simulate url callback with no resultPath
        transportConfig.url(mockContext, [{ feedId: '0x0003' }])

        const result = transportConfig.handlers.message({
          report: {
            feedID: '0x0003',
            fullReport: '0x123',
          },
        })

        expect(result).toHaveLength(1)
        expect(result[0].response.result).toBeNull()
      })

      it('should only fan out results for matching feedId', () => {
        mockDecodeReport.mockReturnValue({
          version: 'V3',
          price: '100',
        } as any)

        const transport = createDataEngineTransport(mockConfig)
        const transportConfig = (transport as any).config

        // Simulate url callback with multiple feedIds
        transportConfig.url(mockContext, [
          { feedId: '0x0003', resultPath: 'price' },
          { feedId: '0xOTHER', resultPath: 'price' },
        ])

        const result = transportConfig.handlers.message({
          report: {
            feedID: '0x0003',
            fullReport: '0x123',
          },
        })

        expect(result).toHaveLength(1)
        expect(result[0].params.feedId).toBe('0x0003')
      })
    })
  })
})
