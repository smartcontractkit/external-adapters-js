import nock from 'nock'
import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'

export const mockTokenSuccess = (): nock.Scope =>
  nock('https://oracle.prod.gsr.io', {
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

const base = 'ETH'
const quote = 'USD'
const price = 1234
const time = 1669345393482

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
            ts: time * 1e6,
          },
        }),
      )
    })
  })
  return mockWsServer
}
