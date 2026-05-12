import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

export const mockStartResponse = {
  data: {
    startStream: [
      {
        type: 'START',
        requestedId: 'ANA_1058',
        streamId: 'ANA_1058',
        requestedScheme: 'TICKER_BC',
        last: {
          value: 231.6,
          size: 40.0,
          unixTimestamp: Date.now() / 1000, // Fresh timestamp
        },
        bestBid: {
          value: 230.8,
          size: 20.0,
          unixTimestamp: Date.now() / 1000,
        },
        bestAsk: {
          value: 231.6,
          size: 165.0,
          unixTimestamp: Date.now() / 1000,
        },
        mid: {
          value: 231.2,
          unixTimestamp: Date.now() / 1000,
        },
        volume: {
          value: 53750.0,
          unixTimestamp: Date.now() / 1000,
        },
      },
    ],
  },
}

export const mockUpdateResponse = {
  data: {
    startStream: [
      {
        type: 'UPDATE',
        requestedId: 'ANA_1058',
        streamId: 'ANA_1058',
        requestedScheme: 'TICKER_BC',
        bestBid: {
          value: 231.0,
          size: 25.0,
          unixTimestamp: Date.now() / 1000,
        },
        bestAsk: {
          value: 231.8,
          size: 150.0,
          unixTimestamp: Date.now() / 1000,
        },
      },
    ],
  },
}

export const mockErrorResponse = {
  data: {
    startStream: [
      {
        type: 'ERROR',
        requestedId: 'ABBN_4',
        streamId: 'ABBN_4',
        requestedScheme: 'TICKER_BC',
      },
    ],
  },
}

// Stale timestamps must be relative to the fake clock (epoch 0).
// 600s in the past from epoch 0 = negative timestamp, so we use a small positive
// timestamp that will be >300s old once the fake clock advances past ~302s.
// Since fake clock starts at 0 and the test runs quickly, a timestamp of 0 minus
// STALE_DATA_THRESHOLD_SECONDS (300) in the transport means any timestamp older than
// (currentTime - 300s) is stale. At fake time ~1s, anything < -299s is stale.
// We can't use negative timestamps, so we set timestamp to 0 and rely on the
// fake clock not advancing much — but the transport compares Date.now()/1000 - timestamp.
// With fake timers Date.now() returns ~1 (1 second), so age = 1 - 0 = 1s — NOT stale.
// Solution: use a very old real-world timestamp that will always be stale.
const VERY_OLD_TIMESTAMP = 1000000
export const mockStaleDataResponse = {
  data: {
    startStream: [
      {
        type: 'START',
        requestedId: 'STALE_999',
        streamId: 'STALE_999',
        requestedScheme: 'TICKER_BC',
        last: {
          value: 100.0,
          size: 10.0,
          unixTimestamp: VERY_OLD_TIMESTAMP,
        },
        bestBid: {
          value: 99.5,
          size: 50.0,
          unixTimestamp: VERY_OLD_TIMESTAMP,
        },
        bestAsk: {
          value: 100.5,
          size: 50.0,
          unixTimestamp: VERY_OLD_TIMESTAMP,
        },
      },
    ],
  },
}

export const mockApiErrorResponse = {
  errors: [
    {
      message: 'User does not have access to the requested quality of service',
      category: 'ENTITLEMENT_ERROR',
      type: 'ACCESS_DENIED',
      messageCode: 3001,
    },
  ],
}

const makeStaleResponse = () => {
  // Use Date.now() at call time so it captures fake clock value,
  // then subtract enough to exceed STALE_DATA_THRESHOLD_SECONDS (300s)
  const staleTimestamp = Date.now() / 1000 - 600
  return {
    data: {
      startStream: [
        {
          type: 'START',
          requestedId: 'STALE_999',
          streamId: 'STALE_999',
          requestedScheme: 'TICKER_BC',
          last: { value: 100.0, size: 10.0, unixTimestamp: staleTimestamp },
          bestBid: { value: 99.5, size: 50.0, unixTimestamp: staleTimestamp },
          bestAsk: { value: 100.5, size: 50.0, unixTimestamp: staleTimestamp },
        },
      ],
    },
  }
}

export const mockWebSocketServer = (URL: string): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', (msg) => {
      const parsed = JSON.parse(msg.toString())
      const query = parsed.query || ''

      if (query.includes('ABBN_4')) {
        socket.send(JSON.stringify(mockErrorResponse))
      } else if (query.includes('STALE_999')) {
        socket.send(JSON.stringify(makeStaleResponse()))
      } else if (query.includes('closeStream')) {
        socket.send(
          JSON.stringify({
            data: { closeStream: [{ type: 'STOP', streamId: 'ANA_1058' }] },
          }),
        )
      } else {
        // Fresh timestamps based on current (fake) clock
        const now = Date.now() / 1000
        const fresh = JSON.parse(JSON.stringify(mockStartResponse))
        for (const s of fresh.data.startStream) {
          if (s.last) s.last.unixTimestamp = now
          if (s.bestBid) s.bestBid.unixTimestamp = now
          if (s.bestAsk) s.bestAsk.unixTimestamp = now
          if (s.mid) s.mid.unixTimestamp = now
          if (s.volume) s.volume.unixTimestamp = now
        }
        socket.send(JSON.stringify(fresh))
      }
    })
  })
  return mockWsServer
}
