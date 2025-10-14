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
              result: null,
              data: {
                price: 50000,
                timestamp: 1234567890,
              },
            },
          },
        ])
      })
    })
  })
})
