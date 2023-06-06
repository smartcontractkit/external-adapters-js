import nock from 'nock'
import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

export const mockPriceSuccess = (): nock.Scope =>
  nock('https://api-v2.intrinio.com', {
    encodedQueryParams: true,
  })
    .get('/securities/AAPL/prices/realtime')
    .query({ api_key: 'fake-api-key' })
    .reply(
      200,
      {
        last_price: 24.25,
        last_time: '2022-02-23T17:58:46.261+00:00',
        last_size: 1,
        bid_price: 24.23,
        bid_size: 233,
        ask_price: 24.24,
        ask_size: 118,
        open_price: 25.74,
        close_price: null,
        high_price: 25.74,
        low_price: 24.1,
        exchange_volume: null,
        market_volume: 34311,
        updated_on: null,
        source: 'intrinio_mx',
        security: {
          id: 'sec_gkZOZA',
          ticker: 'ETD',
          exchange_ticker: 'ETD:UN',
          figi: 'BBG000BBVHG3',
          composite_figi: 'BBG000BBVDT8',
        },
      },
      [
        'Content-Type',
        'application/json',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )
    .persist()

export const mockAuthResponse = (): nock.Scope =>
  nock('https://realtime.intrinio.com', {
    encodedQueryParams: true,
  })
    .get('/auth')
    .query({ api_key: 'fake-api-key' })
    .reply(200, 'fake-api-token', ['Transfer-Encoding', 'chunked'])
    .persist()

export const mockWebSocketServer = (url: string) => {
  const mockWsServer = new MockWebsocketServer(url, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', () => {
      socket.send(
        JSON.stringify({
          topic: 'iex:securities:AAPL',
          payload: {
            type: 'last',
            timestamp: 1646336888.345325,
            ticker: 'AAPL',
            size: 100,
            price: 166.91,
          },
          event: 'quote',
        }),
      )
    })
  })
  return mockWsServer
}
