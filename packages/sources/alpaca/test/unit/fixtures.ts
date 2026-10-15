import { WebSocket } from '@chainlink/external-adapter-framework/transports'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'

// Spec environment_variables default, plus obvious placeholder credentials
export const AUTH_ENDPOINT = 'https://authx.sandbox.alpaca.markets/v1/oauth2/token'
export const WS_API_ENDPOINT = 'wss://stream.data.sandbox.alpaca.markets/v1beta1/overnight'
export const CLIENT_ID = 'fake-client-id'
export const CLIENT_SECRET = 'fake-client-secret'
export const ACCESS_TOKEN = 'fake-access-token'

// Spec endpoint_request_response_examples[0].wire_input
export const WIRE_INPUT = {
  T: 'q' as const,
  S: 'AAPL',
  bx: 'B',
  bp: 189.95,
  bs: 1,
  ax: 'B',
  ap: 190.05,
  as: 2,
  t: '2026-09-17T00:30:15.123456789Z',
}

// Spec endpoint_request_response_examples[0].response.timestamps.providerIndicatedTimeUnixMs
export const WIRE_INPUT_TIME_MS = 1789605015123

const LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const
export type MockLogger = Record<(typeof LEVELS)[number], jest.Mock>

// Routes every adapter log call to one jest mock per level, so tests can assert the level and
// what was (not) logged
export const mockLogger = (): MockLogger => {
  const logger = Object.fromEntries(LEVELS.map((level) => [level, jest.fn()])) as MockLogger
  LoggerFactoryProvider.set({ child: () => logger } as unknown as Parameters<
    typeof LoggerFactoryProvider.set
  >[0])
  return logger
}

// Every argument of every log call at any level, as one string
export const loggedText = (logger: MockLogger): string =>
  JSON.stringify(LEVELS.map((level) => logger[level].mock.calls))

export const clearLogs = (logger: MockLogger): void =>
  LEVELS.forEach((level) => logger[level].mockClear())

type Listener = (event: { data: string }) => void

// Minimal in-memory connection: records sent messages and answers each one with authReply as a
// 'message' event (an empty array answers nothing the adapter acts on). Listeners are kept per
// event type and counted, so tests can assert that none are left behind.
export const makeConnection = (authReply: unknown) => {
  const listeners = new Map<string, Set<Listener>>()
  const listenersOf = (type: string) => {
    const set = listeners.get(type) ?? new Set<Listener>()
    listeners.set(type, set)
    return set
  }
  const sent: unknown[] = []
  const close = jest.fn()
  const connection = {
    send: (data: string) => {
      sent.push(JSON.parse(data))
      ;[...listenersOf('message')].forEach((listener) =>
        listener({ data: JSON.stringify(authReply) }),
      )
    },
    close,
    addEventListener: (type: string, listener: Listener) => listenersOf(type).add(listener),
    removeEventListener: (type: string, listener: Listener) => listenersOf(type).delete(listener),
  } as unknown as WebSocket
  const listenerCount = (type: string) => listenersOf(type).size
  return { connection, sent, close, listenerCount }
}
