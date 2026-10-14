import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import { isDeepStrictEqual } from 'util'

// Spec environment_variables defaults
export const AUTH_ENDPOINT = 'https://authx.sandbox.alpaca.markets/v1/oauth2/token'
export const WS_API_ENDPOINT = 'wss://stream.data.sandbox.alpaca.markets/v1beta1/overnight'
export const CLIENT_ID = 'fake-client-id'
export const CLIENT_SECRET = 'fake-client-secret'
export const ACCESS_TOKEN = 'fake-access-token'

// Spec token_request: form-urlencoded client-credentials body. The object matcher compares the
// parsed form, so field order does not matter. onRequest receives the raw form body and counts
// token requests (per_connect policy).
export const mockTokenResponse = (
  onRequest: (body: string) => void = () => undefined,
): nock.Scope =>
  nock(new URL(AUTH_ENDPOINT).origin, {
    reqheaders: { 'content-type': 'application/x-www-form-urlencoded' },
  })
    .persist()
    .post(new URL(AUTH_ENDPOINT).pathname, {
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    })
    .reply(200, (_uri, body) => {
      onRequest(typeof body === 'string' ? body : JSON.stringify(body))
      return { access_token: ACCESS_TOKEN, expires_in: 900 }
    })

// Spec sample_response quote frame for AAPL
const AAPL_QUOTE = {
  T: 'q',
  S: 'AAPL',
  bx: 'B',
  bp: 189.95,
  bs: 1,
  ax: 'B',
  ap: 190.05,
  as: 2,
  c: ['R'],
  z: 'C',
  t: '2026-09-17T00:30:15.123456789Z',
}

// Same quote with the `as` field missing, for requireVolume=true (spec: throw if bid/ask volume is
// invalid)
const NO_VOLUME_QUOTE = {
  T: 'q',
  S: 'NOVL',
  bx: 'B',
  bp: 189.95,
  bs: 1,
  ax: 'B',
  ap: 190.05,
  t: '2026-09-17T00:30:15.123456789Z',
}

const QUOTES_BY_SYMBOL: Record<string, object> = { AAPL: AAPL_QUOTE, NOVL: NO_VOLUME_QUOTE }

// Spec subscribe format, shared by the mock server and the assertions
export const subscribeMessage = (symbol: string) => ({ action: 'subscribe', quotes: [symbol] })

// Every Alpaca frame is a JSON array. The server answers subscribes only after an auth message
// that carries the OAuth access token (spec ws_auth_message). Before the AAPL quote it sends an error frame, which the
// adapter must survive.
export const mockWebsocketServer = (url: string, received: unknown[]): MockWebsocketServer => {
  const server = new MockWebsocketServer(url, { mock: false })
  server.on('connection', (socket) => {
    let authenticated = false
    socket.send(JSON.stringify([{ T: 'success', msg: 'connected' }]))
    socket.on('message', (raw) => {
      const message = JSON.parse(String(raw))
      received.push(message)
      if (message.action === 'auth') {
        authenticated = message.key === 'access_token' && message.secret === ACCESS_TOKEN
        socket.send(
          JSON.stringify([
            authenticated
              ? { T: 'success', msg: 'authenticated' }
              : { T: 'error', code: 402, msg: 'auth failed' },
          ]),
        )
        return
      }
      if (message.action === 'subscribe' && authenticated) {
        // Spec sample_response subscription ack shape
        socket.send(
          JSON.stringify([
            {
              T: 'subscription',
              trades: [],
              quotes: message.quotes,
              bars: [],
              updatedBars: [],
              dailyBars: [],
              statuses: [],
              lulds: [],
              corrections: [],
              cancelErrors: [],
            },
          ]),
        )
        socket.send(JSON.stringify([{ T: 'error', code: 400, msg: 'invalid syntax' }]))
        // Spec subscribe format: the quote is sent only for an exact single-symbol frame
        for (const [symbol, quote] of Object.entries(QUOTES_BY_SYMBOL)) {
          if (isDeepStrictEqual(message, subscribeMessage(symbol))) {
            socket.send(JSON.stringify([quote]))
          }
        }
      }
    })
  })
  return server
}
