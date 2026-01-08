import { LoggerFactory, LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'

// Mock logger
const log = jest.fn()
const logger = {
  fatal: log,
  error: log,
  warn: log,
  info: log,
  debug: log,
  trace: log,
  msgPrefix: 'mock-logger',
}

const loggerFactory: LoggerFactory = {
  child: () => logger,
}

LoggerFactoryProvider.set(loggerFactory)

// Store listeners registered with the mock connection
const mockListeners: Record<string, ((...args: unknown[]) => void)[]> = {}

// Mock the JsApi before importing StreamingClient
jest.mock('../../src/transport/netdania/jsApi/jsapi-nodejs', () => ({
  window: {
    NetDania: {
      JsApi: {
        Fields: {
          QUOTE_BID: 10,
          QUOTE_ASK: 11,
          QUOTE_MID_PRICE: 9,
          QUOTE_TIME_STAMP: 152,
          QUOTE_TIME_ZONE: 3015,
        },
        JSONConnection: jest.fn().mockImplementation(() => ({
          addListener: jest.fn((event: string, callback: (...args: unknown[]) => void) => {
            if (!mockListeners[event]) {
              mockListeners[event] = []
            }
            mockListeners[event].push(callback)
          }),
          Flush: jest.fn(),
          GetRequestList: jest.fn().mockReturnValue([]),
          addRequests: jest.fn(),
          RemoveRequests: jest.fn(),
          disconnect: jest.fn(),
          reconnect: jest.fn(),
          _tryReconnect: true,
        })),
        Request: {
          getReqObjPrice: jest.fn().mockImplementation((instrument, provider, flag) => ({
            t: 1,
            i: Math.floor(Math.random() * 10000),
            m: flag,
            s: instrument,
            p: provider,
          })),
        },
      },
    },
  },
}))

import { BaseEndpointTypes } from '../../src/endpoint/price'
import { StreamingClient } from '../../src/transport/netdania'

describe('LVP (Last Value Persistence)', () => {
  const mockSettings: BaseEndpointTypes['Settings'] = {
    API_ENDPOINT: 'https://test.example.com',
    API_ENDPOINT_FAILOVER_1: '',
    API_ENDPOINT_FAILOVER_2: '',
    API_ENDPOINT_FAILOVER_3: '',
    NETDANIA_PASSWORD: 'test-password',
    USER_GROUP: 'test.group',
    POLLING_INTERVAL: 2000,
    CONNECTING_TIMEOUT_MS: 4000,
    CACHE_MAX_AGE: 90000,
  } as BaseEndpointTypes['Settings']

  beforeEach(() => {
    jest.clearAllMocks()
    // Clear mock listeners
    Object.keys(mockListeners).forEach((key) => delete mockListeners[key])
  })

  describe('StreamingClient heartbeat', () => {
    it('should emit heartbeat event when NetDania ONHEARTBEAT fires', () => {
      const client = new StreamingClient(mockSettings)
      const heartbeatHandler = jest.fn()
      client.on('heartbeat', heartbeatHandler)

      // Simulate NetDania's internal heartbeat event
      const onHeartbeatCallbacks = mockListeners['OnHeartbeat'] || []
      expect(onHeartbeatCallbacks.length).toBeGreaterThan(0)

      // Fire the heartbeat event
      onHeartbeatCallbacks.forEach((cb) => cb(Date.now()))

      // Verify our heartbeat was emitted
      expect(heartbeatHandler).toHaveBeenCalledTimes(1)
    })

    it('should register listener for NetDania ONHEARTBEAT event', () => {
      new StreamingClient(mockSettings)

      // Verify the listener was registered
      expect(mockListeners['OnHeartbeat']).toBeDefined()
      expect(mockListeners['OnHeartbeat'].length).toBe(1)
    })
  })
})
