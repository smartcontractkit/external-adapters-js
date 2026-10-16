import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'

/**
 * REST transport mock. The REST path is explicitly out of scope for the
 * OPDATA-9200 dxLink migration (owner decision rest_transport_scope=keep_untouched)
 * and is kept as-is.
 */
export function mockPriceEndpoint(): nock.Scope {
  return mockRestTradePrice('TSLA', 239.255)
}

/** Parameterized REST Trade replay (any non-quoteSymbols ticker resolves Trade). */
export function mockRestTradePrice(symbol: string, price: number): nock.Scope {
  return nock('https://tools.dxfeed.com/webservice/rest', { encodedQueryParams: true })
    .get('/events.json')
    .query({ events: 'Trade,Quote', symbols: symbol })
    .reply(
      200,
      {
        status: 'OK',
        Trade: {
          [symbol]: {
            eventSymbol: symbol,
            eventTime: 0,
            time: 1636744209248,
            timeNanoPart: 0,
            sequence: 775394,
            exchangeCode: 'V',
            price,
            change: 0.03,
            size: 3,
            dayVolume: 700004,
            dayTurnover: 167577930,
            tickDirection: 'ZERO_UP',
            extendedTradingHours: false,
          },
        },
      },
      [
        'Server',
        'nginx',
        'Date',
        'Fri, 12 Nov 2021 19:10:13 GMT',
        'Content-Type',
        'application/json',
        'Transfer-Encoding',
        'chunked',
        'Connection',
        'close',
        'X-Origin-Nginx',
        'tools1',
        'Access-Control-Allow-Origin',
        '*',
        'Access-Control-Allow-Methods',
        'GET, POST, OPTIONS',
        'Access-Control-Max-Age',
        '86400',
        'X-Origin-Nginx',
        'tools1',
      ],
    )
    .persist()
}

/** REST upstream outage: the framework maps a provider 5xx onto a 502 error. */
export function mockPriceEndpointFailure(symbol: string): nock.Scope {
  return nock('https://tools.dxfeed.com/webservice/rest', { encodedQueryParams: true })
    .get('/events.json')
    .query({ events: 'Trade,Quote', symbols: symbol })
    .reply(500, { status: 'INTERNAL_SERVER_ERROR' }, ['Content-Type', 'application/json'])
}

/**
 * dxLink mock server for the OPDATA-9200 migration
 * (https://docs.dxfeed.com/dxlink-ws/).
 *
 * Behavior-based, driven by the spec's endpoint sample_response frames:
 * - client handshake: SETUP -> CHANNEL_REQUEST -> FEED_SETUP
 * - the server acknowledges FEED_SETUP with FEED_CONFIG, echoing the client's
 *   acceptEventFields (the COMPACT field order the FEED_DATA rows follow)
 * - client FEED_SUBSCRIPTION add/remove drives FEED_DATA pushes
 * - SETUP, CHANNEL_REQUEST, KEEPALIVE and remove entries need no reply
 *
 * FEED_DATA payloads are registered per `${eventType}:${symbol}` so a test can
 * update the frame a re-subscription (e.g. after a reconnect) will receive.
 */
type DxLinkSubscription = { symbol: string; type: string }

const dataFrames = new Map<string, Record<string, unknown>>()

export const setFeedData = (
  eventType: string,
  symbol: string,
  record: (string | number | boolean)[],
): void => {
  dataFrames.set(`${eventType}:${symbol}`, {
    type: 'FEED_DATA',
    channel: 1,
    data: [eventType, record],
  })
}

// Spec sample records (OPDATA-9200 endpoint_request_response_examples +
// data_source_endpoints[].sample_response). One COMPACT record per frame.
// Quote fields: eventType,eventSymbol,time,bidPrice,askPrice,bidSize,askSize,
//               bidExchangeCode,askExchangeCode
// Trade fields: eventType,eventSymbol,time,price,size,sequence,exchangeCode,
//               change,dayVolume,dayTurnover,tickDirection,extendedTradingHours
setFeedData('Quote', 'AAPL:USLF24', [
  'Quote',
  'AAPL:USLF24',
  1760000000000,
  189.95,
  190.05,
  100,
  200,
  'V',
  'V',
])
setFeedData('Trade', 'AAPL:USLF24', [
  'Trade',
  'AAPL:USLF24',
  1760000000000,
  189.98,
  10,
  12345,
  'V',
  0.12,
  5000000,
  999000000,
  'UP',
  false,
])

// Spec stock_quotes sample_response, second FEED_DATA frame: the JSON string
// "NaN" marks the bid price invalid (valueRangeScalingNotes) — the stock_quotes
// endpoint must surface it as an error result, not a number.
setFeedData('Quote', 'BADQ:USLF24', [
  'Quote',
  'BADQ:USLF24',
  1760000002000,
  'NaN',
  190.05,
  100,
  200,
  'V',
  'V',
])

/**
 * Structural type of a live mock-socket connection: only the members the tests
 * observe or drive (server->client frames, forced disconnects) are declared.
 */
export type DxLinkTestConnection = {
  send: (data: string) => void
  close: () => void
}

/** Live connections accepted by the mock server, oldest first. */
export const dxLinkConnections: DxLinkTestConnection[] = []

/**
 * Raw client→server wire frames, one array per accepted connection, oldest
 * first. Lets integration tests observe the adapter's dxLink control-protocol
 * output (handshake, FEED_SUBSCRIPTION, KEEPALIVE) on the real request path.
 */
export const clientFrameLog: string[][] = []

/** Raw server→client wire frames, one array per accepted connection, oldest first. */
export const serverFrameLog: string[][] = []

export const clearFrameLogs = (): void => {
  clientFrameLog.splice(0, clientFrameLog.length)
  serverFrameLog.splice(0, serverFrameLog.length)
}

/** Pushes an arbitrary server frame to the most recent live connection. */
export const sendToLastConnection = (frame: unknown): boolean => {
  const socket = dxLinkConnections[dxLinkConnections.length - 1]
  if (!socket) {
    return false
  }
  socket.send(JSON.stringify(frame))
  return true
}

export const mockDxLinkServer = (url: string): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(url, { mock: false })
  mockWsServer.on('connection', (socket) => {
    const connection = socket as unknown as DxLinkTestConnection
    dxLinkConnections.push(connection)
    const clientFrames: string[] = []
    const serverFrames: string[] = []
    clientFrameLog.push(clientFrames)
    serverFrameLog.push(serverFrames)
    const upstreamSend = connection.send.bind(connection)
    connection.send = (data: string) => {
      serverFrames.push(String(data))
      upstreamSend(data)
    }
    socket.on('message', (raw: unknown) => {
      clientFrames.push(String(raw))
      let msg: {
        type?: string
        channel?: number
        acceptEventFields?: unknown
        add?: DxLinkSubscription[]
      }
      try {
        msg = JSON.parse(String(raw))
      } catch {
        return
      }
      switch (msg?.type) {
        case 'FEED_SETUP':
          // dxLink: FEED_SETUP is acknowledged with FEED_CONFIG carrying the
          // accepted event fields (spec FEED_CONFIG sample_response frames).
          socket.send(
            JSON.stringify({
              type: 'FEED_CONFIG',
              channel: msg.channel,
              eventFields: msg.acceptEventFields,
            }),
          )
          break
        case 'FEED_SUBSCRIPTION':
          for (const sub of msg.add ?? []) {
            const frame = dataFrames.get(`${sub.type}:${sub.symbol}`)
            if (frame) {
              socket.send(JSON.stringify(frame))
            }
          }
          break
        // SETUP, CHANNEL_REQUEST, KEEPALIVE and remove entries: no reply
      }
    })
  })

  return mockWsServer
}
