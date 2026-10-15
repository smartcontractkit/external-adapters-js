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
// parsed form, so field order does not matter. onRequest receives the raw form body so tests can
// count token requests (refresh_policy per_connect). The n-th request gets tokens[n]; the last
// token repeats once the list runs out.
export const mockTokenResponse = (
  onRequest: (body: string) => void = () => undefined,
  tokens: string[] = [ACCESS_TOKEN],
): nock.Scope => {
  let issued = 0
  return nock(new URL(AUTH_ENDPOINT).origin, {
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
      const token = tokens[Math.min(issued, tokens.length - 1)]
      issued++
      return { access_token: token, expires_in: 900 }
    })
}

// Spec sample_response / endpoint_request_response_examples[0].wire_input quote frame for AAPL
export const AAPL_QUOTE = {
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

// Spec quote with the `bs` field missing (spec requireVolume: invalid bid/ask volume)
export const NO_BID_VOLUME_QUOTE = {
  T: 'q',
  S: 'NOVL',
  bx: 'B',
  bp: 189.95,
  ax: 'B',
  ap: 190.05,
  as: 2,
  t: '2026-09-17T00:30:15.123456789Z',
}

// One-sided books (owner decision one_sided_semantics=match_reference)
const BID_ONLY_QUOTE = { ...AAPL_QUOTE, S: 'BIDONLY', ap: 0, as: 0 }
const ASK_ONLY_QUOTE = { ...AAPL_QUOTE, S: 'ASKONLY', bp: 0, bs: 0 }

// Spec sample_response: one array can carry several events. The SPY subscribe is answered with a
// success event and two spec quotes (AAPL and SPY) in a single frame.
const SPY_FRAME = [{ T: 'success', msg: 'authenticated' }, AAPL_QUOTE, { ...AAPL_QUOTE, S: 'SPY' }]

// Frame (JSON array) the server sends after an exact single-symbol subscribe for each symbol
const FRAMES_BY_SYMBOL: Record<string, object[]> = {
  AAPL: [AAPL_QUOTE],
  NOVL: [NO_BID_VOLUME_QUOTE],
  BIDONLY: [BID_ONLY_QUOTE],
  ASKONLY: [ASK_ONLY_QUOTE],
  SPY: SPY_FRAME,
}

// Spec subscribe format, shared by the mock server and the assertions
export const subscribeMessage = (symbol: string) => ({ action: 'subscribe', quotes: [symbol] })

let activeServer: MockWebsocketServer | undefined

// Sends the events as one JSON-array frame to every connected client
export const pushFrames = (events: object[]): void => {
  activeServer?.clients().forEach((client) => client.send(JSON.stringify(events)))
}

// Every Alpaca frame is a JSON array. The server answers subscribes only after an auth message
// that carries an issued OAuth access token (spec ws_auth_message). Before each quote frame it sends
// an error frame, which the adapter must survive.
export const mockWebsocketServer = (
  url: string,
  received: unknown[],
  tokens: string[] = [ACCESS_TOKEN],
): MockWebsocketServer => {
  const server = new MockWebsocketServer(url, { mock: false })
  activeServer = server
  server.on('connection', (socket) => {
    let authenticated = false
    socket.send(JSON.stringify([{ T: 'success', msg: 'connected' }]))
    socket.on('message', (raw) => {
      const message = JSON.parse(String(raw))
      received.push(message)
      if (message.action === 'auth') {
        authenticated = message.key === 'access_token' && tokens.includes(message.secret)
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
        for (const [symbol, frame] of Object.entries(FRAMES_BY_SYMBOL)) {
          if (isDeepStrictEqual(message, subscribeMessage(symbol))) {
            socket.send(JSON.stringify(frame))
          }
        }
      }
    })
  })
  return server
}
