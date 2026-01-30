import { LoggerFactory, LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import fs from 'fs'
import { MonitorPriceResponse, Utils } from '../../src/transport/netdania'

// Mock logger for StreamingClient tests
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

// Mock the JsApi for StreamingClient tests
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

describe('PartialPriceUpdate', () => {
  it('must parse all the correct updates correctly', async () => {
    const rawUpdates = (await fs.promises.readFile(__dirname + '/raw-price-updates.jsonl', 'utf-8'))
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        return JSON.parse(line) as MonitorPriceResponse
      })
    for (const update of rawUpdates) {
      console.debug(`Parsing update: ${JSON.stringify(update)}`)
      const ppu = Utils.mkPartialPriceUpdate(update)
      expect(ppu).toBeDefined()
    }
  })

  it('must parse a valid update correctly', async () => {
    const update: MonitorPriceResponse = {
      type: 2,
      id: 6,
      data: [
        { f: 11, v: '1296.5' },
        { f: 3015, v: '1750333500165' },
        { f: 10, v: '1291.5' },
        {
          f: 152,
          v: '1750333500165',
        },
        { f: 9, v: '1294' },
        { f: 3013, v: '1750333500165' },
      ],
      modifiedFids: [11, 3015, 10, 152, 9, 3013],
    }

    const ppu = Utils.mkPartialPriceUpdate(update)
    expect(ppu).toBeDefined()
  })

  it('must throw on invalid updates', () => {
    const update: MonitorPriceResponse = {
      type: 1, // otherwise valid
      id: 6,
      data: [
        { f: 11, v: '1296.5' },
        { f: 3015, v: '1750333500165' },
        { f: 10, v: '1291.5' },
        {
          f: 152,
          v: '1750333500165',
        },
        { f: 9, v: '1294' },
        { f: 3013, v: '1750333500165' },
      ],
      modifiedFids: [11, 3015, 10, 152, 9, 3013],
    }
    expect(() => Utils.mkPartialPriceUpdate(update)).toThrow(
      'Not a price response, type is 1, expected 2.',
    )
  })

  it('must sanitize a full url by idempotently redacting the h parameter', () => {
    expect(Utils.sanitize('https://example.com/path?h=12345&otherParam=value&cb=?')).toBe(
      'https://example.com/path?h=redacted&otherParam=value&cb=?',
    )

    const urlWithoutH = 'https://example.com/path?sessid=UP12345&otherParam=value'
    expect(Utils.sanitize(urlWithoutH)).toBe(urlWithoutH)
  })

  it('must sanitize a partial url by idempotently redacting the h parameter', () => {
    expect(
      Utils.sanitize(
        '?xstream=1&v=5&dt=0&h=eyJnIjoiY2hhaW4ubGluayIsImFpIjoiTm9kZUpTQVBJdjEuNS4yIiwicHIiOjIsImF1IjoibG9jYWxob3N0OjgwODAiLCJxdXAiOjEsInAiOiJmYWtlLWFwaS1rZXkifQ..&xcmd=W3sidCI6MSwiaSI6MSwibSI6MSwicyI6IkVVUlVTRCIsInAiOiJpZGMifV0.&cb=?&ts=1752653143000',
      ),
    ).toBe(
      '?xstream=1&v=5&dt=0&h=redacted&xcmd=W3sidCI6MSwiaSI6MSwibSI6MSwicyI6IkVVUlVTRCIsInAiOiJpZGMifV0.&cb=?&ts=1752653143000',
    )

    const urlWithoutH =
      '?xstream=1&v=5&dt=0&xcmd=W3sidCI6MSwiaSI6MSwibSI6MSwicyI6IkVVUlVTRCIsInAiOiJpZGMifV0.&cb=?&ts=1752653143000'
    expect(Utils.sanitize(urlWithoutH)).toBe(urlWithoutH)
  })
})

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
    CACHE_MAX_AGE: 300000, // 5 minutes - exceeds NetDania heartbeat interval for LVP
  } as BaseEndpointTypes['Settings']

  beforeEach(() => {
    jest.clearAllMocks()
    Object.keys(mockListeners).forEach((key) => delete mockListeners[key])
  })

  describe('StreamingClient heartbeat', () => {
    it('should emit heartbeat event when NetDania ONHEARTBEAT fires', () => {
      const client = new StreamingClient(mockSettings)
      const heartbeatHandler = jest.fn()
      client.on('heartbeat', heartbeatHandler)

      const onHeartbeatCallbacks = mockListeners['OnHeartbeat'] || []
      expect(onHeartbeatCallbacks.length).toBeGreaterThan(0)

      onHeartbeatCallbacks.forEach((cb) => cb(Date.now()))

      expect(heartbeatHandler).toHaveBeenCalledTimes(1)
    })

    it('should register listener for NetDania ONHEARTBEAT event', () => {
      new StreamingClient(mockSettings)

      expect(mockListeners['OnHeartbeat']).toBeDefined()
      expect(mockListeners['OnHeartbeat'].length).toBe(1)
    })
  })
})
