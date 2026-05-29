import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'

const createDepthResponse = (symbol: string, region: string) => ({
  code: 1,
  data: {
    type: 'depth',
    s: symbol,
    r: region,
    a: [
      {
        po: 1,
        p: 125,
        v: 11,
        o: 1,
      },
    ],
    b: [
      {
        po: 1,
        p: 123,
        v: 12,
        o: 1,
      },
    ],
  },
})

const createQuoteResponse = (symbol: string, region: string) => ({
  code: 1,
  data: {
    type: 'quote',
    s: symbol,
    r: region,
    ld: 124,
  },
})

export const mockResponseSuccess = (): nock.Scope =>
  nock('http://localhost:9090')
    .get(/\/(stock|indices)\/(depth|quote)/)
    .query(true)
    .reply(200, function (uri) {
      const url = new URL(uri, 'http://localhost:9090')
      const type = url.pathname.split('/').at(-1)
      const code = url.searchParams.get('code')!
      const region = url.searchParams.get('region')!
      if (type === 'depth') {
        return createDepthResponse(code, region)
      } else if (type === 'quote') {
        return createQuoteResponse(code, region)
      } else {
        throw new Error(`Unknown type: ${type}`)
      }
    })
    .persist()

export const mockWebsocketServer = (url: string): MockWebsocketServer => {
  const mockWsServer = new MockWebsocketServer(url, { mock: false })
  mockWsServer.on('connection', (socket) => {
    socket.on('message', (message) => {
      const parsedMessage = JSON.parse(message as string)
      if (parsedMessage.ac !== 'subscribe') {
        return
      }
      const [symbol, region] = parsedMessage.params.split('$')
      if (parsedMessage.types === 'depth') {
        socket.send(JSON.stringify(createDepthResponse(symbol, region)))
      } else if (parsedMessage.types === 'quote') {
        socket.send(JSON.stringify(createQuoteResponse(symbol, region)))
      } else {
        throw new Error(`Unknown message type: ${parsedMessage.types}`)
      }
    })
  })

  return mockWsServer
}
