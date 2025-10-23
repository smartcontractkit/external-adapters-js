import type { WebsocketTransportGenerics } from '@chainlink/external-adapter-framework/transports'
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

describe('ProtobufWsTransport heartbeat', () => {
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
    }

    // Set the mock connection on the transport
    ;(transport as any).wsConnection = mockWsConnection
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  test('startHeartbeat sends ping every 30 seconds', () => {
    const intervalMs = 30000
    transport.startHeartbeat(intervalMs)

    // Initially no pings should be sent
    expect(mockWsConnection.ping).not.toHaveBeenCalled()

    // After 30 seconds, first ping should be sent
    jest.advanceTimersByTime(30000)
    expect(mockWsConnection.ping).toHaveBeenCalledTimes(1)

    // After another 30 seconds, second ping should be sent
    jest.advanceTimersByTime(30000)
    expect(mockWsConnection.ping).toHaveBeenCalledTimes(2)

    // After another 30 seconds, third ping should be sent
    jest.advanceTimersByTime(30000)
    expect(mockWsConnection.ping).toHaveBeenCalledTimes(3)
  })

  test('startHeartbeat updates lastMessageReceivedAt when sending ping', () => {
    const intervalMs = 30000
    const initialTime = Date.now()
    transport.startHeartbeat(intervalMs)

    // Advance time and trigger ping
    jest.advanceTimersByTime(30000)

    // lastMessageReceivedAt should be updated
    expect((transport as any).lastMessageReceivedAt).toBeGreaterThanOrEqual(initialTime)
  })

  test('startHeartbeat registers pong handler', () => {
    const intervalMs = 30000
    transport.startHeartbeat(intervalMs)

    // Verify that pong handler was registered
    expect(mockWsConnection.on).toHaveBeenCalledWith('pong', expect.any(Function))
  })

  test('pong handler updates lastMessageReceivedAt', () => {
    const intervalMs = 30000
    transport.startHeartbeat(intervalMs)

    // Get the pong handler that was registered
    const pongHandler = mockWsConnection.on.mock.calls.find((call: any) => call[0] === 'pong')?.[1]

    expect(pongHandler).toBeDefined()

    // Set initial timestamp
    const initialTime = Date.now()
    ;(transport as any).lastMessageReceivedAt = initialTime

    // Simulate pong response after some time
    jest.advanceTimersByTime(5000)
    pongHandler()

    // lastMessageReceivedAt should be updated to current time
    expect((transport as any).lastMessageReceivedAt).toBeGreaterThan(initialTime)
  })

  test('stopHeartbeat clears the interval', () => {
    const intervalMs = 30000
    transport.startHeartbeat(intervalMs)

    // Verify pings are being sent
    jest.advanceTimersByTime(30000)
    expect(mockWsConnection.ping).toHaveBeenCalledTimes(1)

    // Stop heartbeat
    transport.stopHeartbeat()

    // Advance time and verify no more pings are sent
    jest.advanceTimersByTime(60000)
    expect(mockWsConnection.ping).toHaveBeenCalledTimes(1) // Still only 1
  })

  test('startHeartbeat stops previous heartbeat before starting new one', () => {
    const intervalMs = 30000
    transport.startHeartbeat(intervalMs)

    // Advance time and verify first heartbeat is working
    jest.advanceTimersByTime(30000)
    expect(mockWsConnection.ping).toHaveBeenCalledTimes(1)

    // Start heartbeat again (should clear previous interval)
    transport.startHeartbeat(intervalMs)

    // Advance time by 30 seconds - should only get 1 more ping, not 2
    jest.advanceTimersByTime(30000)
    expect(mockWsConnection.ping).toHaveBeenCalledTimes(2)
  })

  test('heartbeat does not send ping when connection is not OPEN', () => {
    const intervalMs = 30000
    mockWsConnection.readyState = WebSocket.CONNECTING
    transport.startHeartbeat(intervalMs)

    jest.advanceTimersByTime(30000)
    expect(mockWsConnection.ping).not.toHaveBeenCalled()
  })

  test('heartbeat does not crash when wsConnection is null', () => {
    const intervalMs = 30000
    ;(transport as any).wsConnection = null

    expect(() => {
      transport.startHeartbeat(intervalMs)
      jest.advanceTimersByTime(30000)
    }).not.toThrow()
  })
})
