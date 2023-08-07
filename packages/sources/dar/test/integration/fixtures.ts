import nock from 'nock'
import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'
export const mockPriceResponse = {
  darAssetID: '12345',
  darAssetTicker: 'ETH',
  quoteCurrency: 'USD',
  price: 1272.12,
  publishedAt: '2022-11-30T11:46:28.2323078Z',
  effectiveTime: 1669979114.4,
  errors: '',
}

export const mockTokenResponse = (): nock.Scope =>
  nock('https://test-url.com', {
    encodedQueryParams: true,
  })
    .post('/token-auth')
    .reply(
      200,
      () => ({ access_token: '111111111111111111111111111', expires_in: 12345, token_type: 'abc' }),
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

export const mockPriceWebSocketServer = (URL: string): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    setTimeout(() => {
      socket.send(JSON.stringify(mockPriceResponse))
    }, 100)
  })
  return mockWsServer
}
