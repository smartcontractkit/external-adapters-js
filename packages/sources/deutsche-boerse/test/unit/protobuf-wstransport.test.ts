import type { WebsocketTransportGenerics } from '@chainlink/external-adapter-framework/transports'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import WebSocket from 'ws'
import { ProtobufWsTransport } from '../../src/transport/protobuf-wstransport'

LoggerFactoryProvider.set()

type Dummy = WebsocketTransportGenerics & { Provider: { WsMessage: Buffer } }

describe('ProtobufWsTransport helpers', () => {
  const t = new ProtobufWsTransport<Dummy>({} as any)

  test('deserializeMessage handles Buffer', () => {
    const src = Buffer.from([1, 2, 3])
    expect(t.deserializeMessage(src)).toBeInstanceOf(Buffer)
  })

  test('deserializeMessage handles ArrayBuffer', () => {
    const ab = new Uint8Array([4, 5, 6]).buffer
    const out = t.deserializeMessage(ab)
    expect(Buffer.isBuffer(out)).toBe(true)
    expect((out as Buffer).equals(Buffer.from([4, 5, 6]))).toBe(true)
  })

  test('deserializeMessage handles ArrayBufferView', () => {
    const u8 = new Uint8Array([7, 8, 9])
    const out = t.deserializeMessage(u8 as any)
    expect((out as Buffer).equals(Buffer.from([7, 8, 9]))).toBe(true)
  })

  test('toRawData private: coerces inputs to Buffer', () => {
    const anyT = t as any
    expect(Buffer.isBuffer(anyT.toRawData(Buffer.from('x')))).toBe(true)
    expect(Buffer.isBuffer(anyT.toRawData(new Uint8Array([1, 2])))).toBe(true)
    expect(Buffer.isBuffer(anyT.toRawData('hi'))).toBe(true)
    expect(Buffer.isBuffer(anyT.toRawData({ a: 1 }))).toBe(true)
  })
})

describe('ProtobufWsTransport heartbeat + establishWsConnection', () => {
  let transport: ProtobufWsTransport<Dummy>
  let mockWsConnection: any

  beforeEach(() => {
    jest.useFakeTimers()
    transport = new ProtobufWsTransport<Dummy>({} as any)

    // Mock WebSocket connection
    mockWsConnection = {
      ping: jest.fn(),
      on: jest.fn(),
      readyState: WebSocket.OPEN,
      addEventListener: jest.fn(),
    }
    ;(transport as any).wsConnection = mockWsConnection

    // Mocks used by updateTTL(cacheMaxAge) inside heartbeat
    ;(transport as any).subscriptionSet = {
      getAll: jest.fn().mockResolvedValue([{ a: 1 }]),
    }
    ;(transport as any).responseCache = { writeTTL: jest.fn() }
    ;(transport as any).name = 'ProtobufWsTransport'
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  test('startHeartbeat sends ping every interval and writes response TTL', async () => {
    const intervalMs = 30000
    const cacheMaxAge = 60000

    transport.startHeartbeat(intervalMs, cacheMaxAge)

    expect(mockWsConnection.ping).not.toHaveBeenCalled()

    jest.advanceTimersByTime(intervalMs)
    expect(mockWsConnection.ping).toHaveBeenCalledTimes(1)

    // updateTTL should write TTL for current params
    await Promise.resolve()
    expect((transport as any).responseCache.writeTTL).toHaveBeenCalledWith(
      'ProtobufWsTransport',
      [{ a: 1 }],
      cacheMaxAge,
    )

    jest.advanceTimersByTime(intervalMs)
    expect(mockWsConnection.ping).toHaveBeenCalledTimes(2)
  })

  test('startHeartbeat updates lastMessageReceivedAt when sending ping', () => {
    const intervalMs = 30000
    const cacheMaxAge = 60000
    const initialTime = Date.now()

    transport.startHeartbeat(intervalMs, cacheMaxAge)
    jest.advanceTimersByTime(intervalMs)

    expect((transport as any).lastMessageReceivedAt).toBeGreaterThanOrEqual(initialTime)
  })

  // ping/pong handlers are now attached in establishWsConnection
  test('establishWsConnection registers ping/pong handlers', async () => {
    const spy = jest
      .spyOn(WebSocketTransport.prototype as any, 'establishWsConnection')
      .mockResolvedValue(mockWsConnection)

    await transport.establishWsConnection({ adapterSettings: {} } as any, 'ws://example', {})

    expect(spy).toHaveBeenCalled()
    expect(mockWsConnection.on).toHaveBeenCalledWith('ping', expect.any(Function))
    expect(mockWsConnection.on).toHaveBeenCalledWith('pong', expect.any(Function))
  })

  test('stopHeartbeat clears the interval', () => {
    transport.startHeartbeat(30000, 60000)
    jest.advanceTimersByTime(30000)
    expect(mockWsConnection.ping).toHaveBeenCalledTimes(1)

    transport.stopHeartbeat()
    jest.advanceTimersByTime(60000)
    expect(mockWsConnection.ping).toHaveBeenCalledTimes(1)
  })

  test('heartbeat does not send ping when connection is not OPEN', () => {
    mockWsConnection.readyState = WebSocket.CONNECTING
    transport.startHeartbeat(30000, 60000)
    jest.advanceTimersByTime(30000)
    expect(mockWsConnection.ping).not.toHaveBeenCalled()
  })

  test('heartbeat safe when wsConnection is null', () => {
    ;(transport as any).wsConnection = null
    expect(() => {
      transport.startHeartbeat(30000, 60000)
      jest.advanceTimersByTime(30000)
    }).not.toThrow()
  })
})
