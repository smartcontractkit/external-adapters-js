import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

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

/**
 * Registers a COMPACT FEED_DATA frame carrying SEVERAL concatenated records for
 * one (eventType, symbol) wire key — the batching the provider does with
 * acceptAggregationPeriod=1 (spec suggested_implementation point 5; the spec
 * stock_quotes sample_response itself concatenates two Quote records in one
 * frame).
 */
export const setFeedDataRecords = (
  eventType: string,
  symbol: string,
  records: (string | number | boolean)[][],
): void => {
  dataFrames.set(`${eventType}:${symbol}`, {
    type: 'FEED_DATA',
    channel: 1,
    data: [eventType, records.flat()],
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
    // Mock-socket bridge workaround, applied here in the test setup before the
    // transport sends anything through this connection (moved out of
    // src/transport/ws.ts — no test-only code ships in src/): the in-process
    // bridge shares one socket object between this mock server and the client
    // connection, so an instance-level override of `send` shadows the standard
    // send path. The wrapper keeps the server->client frame log AND routes
    // every frame through the standard prototype send captured before the
    // override, so frames the adapter emits after the handshake
    // (FEED_SUBSCRIPTION updates, KEEPALIVE) still reach the server-side
    // message handler.
    const standardSend = Object.getPrototypeOf(connection)?.send as
      | ((data: string) => void)
      | undefined
    const upstreamSend = connection.send.bind(connection)
    connection.send = (data: string) => {
      serverFrames.push(String(data))
      if (typeof standardSend === 'function') {
        standardSend.call(connection, data)
      } else {
        upstreamSend(data)
      }
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

/**
 * Handshake-failure dxLink mock server: proves the adapter surfaces connection
 * errors instead of hanging when the provider never completes the handshake.
 * Two modes, switchable mid-test through setMode:
 * - 'no-feed-config': accepts the connection and answers nothing — SETUP,
 *   CHANNEL_REQUEST and FEED_SETUP are received and deliberately never
 *   acknowledged with FEED_CONFIG
 * - 'reject': closes every connection immediately (the behavioral stand-in for
 *   the provider rejecting the handshake — the mock-socket bridge carries no
 *   upgrade headers, so rejection is expressed as an immediate close)
 */
export type DxLinkHandshakeFailureMode = 'no-feed-config' | 'reject'

export type DxLinkHandshakeFailureServer = MockWebsocketServer & {
  setMode: (mode: DxLinkHandshakeFailureMode) => void
  connections: DxLinkTestConnection[]
  /** Raw client→server wire frames, one array per accepted connection, oldest first */
  framesByConnection: string[][]
}

export const mockDxLinkHandshakeFailureServer = (url: string): DxLinkHandshakeFailureServer => {
  const mode: { current: DxLinkHandshakeFailureMode } = { current: 'no-feed-config' }
  const connections: DxLinkTestConnection[] = []
  const framesByConnection: string[][] = []

  const mockWsServer = new MockWebsocketServer(url, { mock: false })
  mockWsServer.on('connection', (socket) => {
    const connection = socket as unknown as DxLinkTestConnection
    connections.push(connection)
    const frames: string[] = []
    framesByConnection.push(frames)
    socket.on('message', (raw: unknown) => {
      frames.push(String(raw))
      // No reply in any mode: FEED_SETUP never gets its FEED_CONFIG
    })
    if (mode.current === 'reject') {
      connection.close()
    }
  })

  const server = mockWsServer as DxLinkHandshakeFailureServer
  server.setMode = (next) => {
    mode.current = next
  }
  server.connections = connections
  server.framesByConnection = framesByConnection
  return server
}
