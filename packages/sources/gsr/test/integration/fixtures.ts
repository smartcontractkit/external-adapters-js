import nock from 'nock'
import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

const generateMockTokenSuccess = (basePath: string): nock.Scope =>
  nock(basePath, {
    encodedQueryParams: true,
  })
    .post('/v1/token', {
      apiKey: 'test-pub-key',
      userId: 'test-user-id',
      ts: /^\d+$/,
      signature: /^[0-9a-f]+$/i,
    })
    .reply(
      200,
      () => ({
        success: true,
        ts: 1652198967193000000,
        token: 'fake-token',
        validUntil: '2022-05-10T16:19:18.235Z',
      }),
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

export const mockTokenSuccess = () => generateMockTokenSuccess('https://oracle.prod.gsr.io')

const base = 'ETH'
const quote = 'USD'
const price = 1234
const bidPrice = 1233
const askPrice = 1235
const time = 1669345393482

const basewLwbaInvariantViolation = 'BTC'
const askPriceLwbaInvariantViolation = 1222

export const mockWebSocketServer = (URL: string) => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', () => {
      socket.send(
        JSON.stringify({
          type: 'ticker',
          data: {
            symbol: `${base.toUpperCase()}.${quote.toUpperCase()}`,
            price,
            bidPrice,
            askPrice,
            ts: time * 1e6,
          },
        }),
      )
      socket.send(
        JSON.stringify({
          type: 'ticker',
          data: {
            symbol: `${basewLwbaInvariantViolation.toUpperCase()}.${quote.toUpperCase()}`,
            price,
            bidPrice,
            askPriceLwbaInvariantViolation,
            ts: time * 1e6,
          },
        }),
      )
    })
  })
  return mockWsServer
}
