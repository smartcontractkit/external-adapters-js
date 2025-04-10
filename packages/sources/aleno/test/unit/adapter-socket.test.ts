import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { SocketServerMock } from 'socket.io-mock-ts'
import { config } from '../../src/config'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import * as socketIoClient from 'socket.io-client'
import { type SocketIOTransportTypes, SocketIOTransport } from '../../src/transport/price-socketio'

jest.mock('socket.io-client')

LoggerFactoryProvider.set()

type SubscribeCallback = (response: {
  status: string
  involvedSubscriptions: string[]
  subscriptionsAfterUpdate: string[]
}) => void
type SubscribeCall = {
  subscriptions: string[]
  callback: SubscribeCallback
}

describe('SocketIOTransport', () => {
  const API_TIMEOUT = 30_000
  const BACKGROUND_EXECUTE_MS_SSE = 1_000
  const testApiKey = 'test_aleno_key'
  const context = {
    adapterSettings: {
      API_TIMEOUT,
      BACKGROUND_EXECUTE_MS_SSE,
    },
    endpointName: 'price',
    inputParameters: new InputParameters({}),
  } as EndpointContext<SocketIOTransportTypes>
  const emptySubscriptions = { desired: [], new: [], stale: [] }

  let mockSocket: SocketServerMock

  beforeEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()

    jest.useFakeTimers()
    process.env.API_KEY = testApiKey
    config.initialize()

    mockSocket = new SocketServerMock()
    jest.spyOn(socketIoClient, 'io').mockReturnValue(mockSocket as unknown as socketIoClient.Socket)
  })

  it('should connect to endpoint', async () => {
    const transport = new SocketIOTransport()

    expect(socketIoClient.io).toBeCalledTimes(0)

    transport.streamHandler(context, emptySubscriptions)

    expect(socketIoClient.io).toBeCalledTimes(1)
    expect(socketIoClient.io).toBeCalledWith('https://state-price-socket.aleno.ai', {
      auth: { apiKey: testApiKey },
    })
  })

  it('should sleep before returning from streamHandlers', async () => {
    const transport = new SocketIOTransport()

    let streamHandlerReturned = false
    transport.streamHandler(context, emptySubscriptions).then(() => {
      streamHandlerReturned = true
    })

    await jest.advanceTimersByTimeAsync(BACKGROUND_EXECUTE_MS_SSE - 1)
    expect(streamHandlerReturned).toBe(false)
    await jest.advanceTimersByTimeAsync(1)
    expect(streamHandlerReturned).toBe(true)
  })

  it('should update subscriptions', async () => {
    const subscribeSpy = jest.fn()
    mockSocket.clientMock.on('subscribe', subscribeSpy)

    const transport = new SocketIOTransport()

    transport.streamHandler(context, emptySubscriptions)
    await jest.advanceTimersByTimeAsync(BACKGROUND_EXECUTE_MS_SSE)

    mockSocket.clientMock.emit('connect')
    expect(subscribeSpy).toBeCalledTimes(0)

    const subscriptions = [{ base: 'FRAC', quote: 'USD' }]
    transport.streamHandler(context, { desired: subscriptions, new: subscriptions, stale: [] })
    await jest.advanceTimersByTimeAsync(BACKGROUND_EXECUTE_MS_SSE)

    expect(subscribeSpy).toBeCalledTimes(1)
    expect(subscribeSpy).toBeCalledWith(['FRAC/USD'], expect.any(Function))
  })

  it('should not subscribe again without new subscriptions', async () => {
    const subscribeCalls: SubscribeCall[] = []
    const subscribeSpy = jest
      .fn()
      .mockImplementation((subscriptions: string[], callback: SubscribeCallback) => {
        subscribeCalls.push({ subscriptions, callback })
      })
    mockSocket.clientMock.on('subscribe', subscribeSpy)

    const transport = new SocketIOTransport()

    transport.streamHandler(context, emptySubscriptions)
    await jest.advanceTimersByTimeAsync(BACKGROUND_EXECUTE_MS_SSE)

    mockSocket.clientMock.emit('connect')

    const subscriptions = [{ base: 'FRAC', quote: 'USD' }]
    const streamHandlerPromise = transport.streamHandler(context, {
      desired: subscriptions,
      new: subscriptions,
      stale: [],
    })

    expect(subscribeSpy).toBeCalledTimes(1)
    expect(subscribeSpy).toBeCalledWith(['FRAC/USD'], expect.any(Function))

    subscribeCalls[0].callback({
      status: 'ok',
      involvedSubscriptions: ['frac/usd'],
      subscriptionsAfterUpdate: ['frac/usd'],
    })
    await jest.advanceTimersByTimeAsync(BACKGROUND_EXECUTE_MS_SSE)
    await streamHandlerPromise

    transport.streamHandler(context, { desired: subscriptions, new: [], stale: [] })
    await jest.advanceTimersByTimeAsync(BACKGROUND_EXECUTE_MS_SSE)
    // Still only 1 call.
    expect(subscribeSpy).toBeCalledTimes(1)
  })

  it('should unsubscribe', async () => {
    const subscribeCalls: SubscribeCall[] = []
    const subscribeSpy = jest.fn().mockImplementation((subscriptions, callback) => {
      subscribeCalls.push({ subscriptions, callback })
    })
    mockSocket.clientMock.on('subscribe', subscribeSpy)

    const unsubscribeSpy = jest.fn()
    mockSocket.clientMock.on('unsubscribe', unsubscribeSpy)

    const transport = new SocketIOTransport()

    transport.streamHandler(context, emptySubscriptions)
    await jest.advanceTimersByTimeAsync(BACKGROUND_EXECUTE_MS_SSE)

    mockSocket.clientMock.emit('connect')

    const subscriptions = [{ base: 'FRAC', quote: 'USD' }]
    const streamHandlerPromise = transport.streamHandler(context, {
      desired: subscriptions,
      new: subscriptions,
      stale: [],
    })

    expect(subscribeSpy).toBeCalledTimes(1)
    expect(subscribeSpy).toBeCalledWith(['FRAC/USD'], expect.any(Function))

    subscribeCalls[0].callback({
      status: 'ok',
      involvedSubscriptions: ['frac/usd'],
      subscriptionsAfterUpdate: ['frac/usd'],
    })
    await jest.advanceTimersByTimeAsync(BACKGROUND_EXECUTE_MS_SSE)
    await streamHandlerPromise

    expect(unsubscribeSpy).toBeCalledTimes(0)

    transport.streamHandler(context, { desired: [], new: [], stale: subscriptions })
    await jest.advanceTimersByTimeAsync(BACKGROUND_EXECUTE_MS_SSE)
    // Still only 1 call.
    expect(subscribeSpy).toBeCalledTimes(1)

    expect(unsubscribeSpy).toBeCalledTimes(1)
    expect(unsubscribeSpy).toBeCalledWith(['FRAC/USD'], expect.any(Function))
  })

  it('should subscribe again after unsubscribe', async () => {
    const subscribeCalls: SubscribeCall[] = []
    const subscribeSpy = jest.fn().mockImplementation((subscriptions, callback) => {
      subscribeCalls.push({ subscriptions, callback })
    })
    mockSocket.clientMock.on('subscribe', subscribeSpy)

    const unsubscribeCalls: SubscribeCall[] = []
    const unsubscribeSpy = jest.fn().mockImplementation((subscriptions, callback) => {
      unsubscribeCalls.push({ subscriptions, callback })
    })
    mockSocket.clientMock.on('unsubscribe', unsubscribeSpy)

    const transport = new SocketIOTransport()

    transport.streamHandler(context, emptySubscriptions)
    await jest.advanceTimersByTimeAsync(BACKGROUND_EXECUTE_MS_SSE)

    mockSocket.clientMock.emit('connect')

    const subscriptions = [{ base: 'FRAC', quote: 'USD' }]
    transport.streamHandler(context, { desired: subscriptions, new: subscriptions, stale: [] })

    expect(subscribeSpy).toBeCalledTimes(1)
    expect(subscribeSpy).toBeCalledWith(['FRAC/USD'], expect.any(Function))

    subscribeCalls[0].callback({
      status: 'ok',
      involvedSubscriptions: ['frac/usd'],
      subscriptionsAfterUpdate: ['frac/usd'],
    })
    await jest.advanceTimersByTimeAsync(BACKGROUND_EXECUTE_MS_SSE)

    expect(unsubscribeSpy).toBeCalledTimes(0)

    transport.streamHandler(context, { desired: [], new: [], stale: subscriptions })

    // Still only 1 call.
    expect(subscribeSpy).toBeCalledTimes(1)

    expect(unsubscribeSpy).toBeCalledTimes(1)
    expect(subscribeSpy).toBeCalledWith(['FRAC/USD'], expect.any(Function))
    unsubscribeCalls[0].callback({
      status: 'ok',
      involvedSubscriptions: ['frac/usd'],
      subscriptionsAfterUpdate: [],
    })
    await jest.advanceTimersByTimeAsync(BACKGROUND_EXECUTE_MS_SSE)

    transport.streamHandler(context, { desired: subscriptions, new: subscriptions, stale: [] })
    await jest.advanceTimersByTimeAsync(BACKGROUND_EXECUTE_MS_SSE)

    expect(subscribeSpy).toBeCalledTimes(2)
    expect(subscribeSpy).toHaveBeenNthCalledWith(2, ['FRAC/USD'], expect.any(Function))
  })

  it('should subscribe and unsubscribe', async () => {
    const subscribeCalls: SubscribeCall[] = []
    const subscribeSpy = jest.fn().mockImplementation((subscriptions, callback) => {
      subscribeCalls.push({ subscriptions, callback })
    })
    mockSocket.clientMock.on('subscribe', subscribeSpy)

    const unsubscribeSpy = jest.fn()
    mockSocket.clientMock.on('unsubscribe', unsubscribeSpy)

    const transport = new SocketIOTransport()

    transport.streamHandler(context, emptySubscriptions)
    await jest.advanceTimersByTimeAsync(BACKGROUND_EXECUTE_MS_SSE)

    mockSocket.clientMock.emit('connect')

    const subscriptions = [{ base: 'FRAC', quote: 'USD' }]
    const streamHandlerPromise = transport.streamHandler(context, {
      desired: subscriptions,
      new: subscriptions,
      stale: [],
    })

    expect(subscribeSpy).toBeCalledTimes(1)
    expect(subscribeSpy).toBeCalledWith(['FRAC/USD'], expect.any(Function))

    subscribeCalls[0].callback({
      status: 'ok',
      involvedSubscriptions: ['frac/usd'],
      subscriptionsAfterUpdate: ['frac/usd'],
    })
    await jest.advanceTimersByTimeAsync(BACKGROUND_EXECUTE_MS_SSE)
    await streamHandlerPromise

    expect(unsubscribeSpy).toBeCalledTimes(0)

    const newSubscriptions = [{ base: 'BTC', quote: 'USD' }]
    transport.streamHandler(context, {
      desired: newSubscriptions,
      new: newSubscriptions,
      stale: subscriptions,
    })
    subscribeCalls[1].callback({
      status: 'ok',
      involvedSubscriptions: ['btc/usd'],
      subscriptionsAfterUpdate: ['btc/usd'],
    })
    await jest.advanceTimersByTimeAsync(BACKGROUND_EXECUTE_MS_SSE)

    expect(subscribeSpy).toBeCalledTimes(2)
    expect(subscribeSpy).toHaveBeenNthCalledWith(2, ['BTC/USD'], expect.any(Function))

    expect(unsubscribeSpy).toBeCalledTimes(1)
    expect(unsubscribeSpy).toBeCalledWith(['FRAC/USD'], expect.any(Function))
  })

  it('should subscribe again if previous subscribe call timed out', async () => {
    const subscribeCalls: SubscribeCall[] = []
    const subscribeSpy = jest.fn().mockImplementation((subscriptions, callback) => {
      subscribeCalls.push({ subscriptions, callback })
    })
    mockSocket.clientMock.on('subscribe', subscribeSpy)

    const unsubscribeSpy = jest.fn()
    mockSocket.clientMock.on('unsubscribe', unsubscribeSpy)

    const transport = new SocketIOTransport()

    transport.streamHandler(context, emptySubscriptions)
    await jest.advanceTimersByTimeAsync(BACKGROUND_EXECUTE_MS_SSE)

    mockSocket.clientMock.emit('connect')

    const subscriptions = [{ base: 'FRAC', quote: 'USD' }]
    let streamHandlerThrew = false
    transport
      .streamHandler(context, { desired: subscriptions, new: subscriptions, stale: [] })
      .catch(() => {
        streamHandlerThrew = true
      })

    expect(subscribeSpy).toBeCalledTimes(1)
    expect(subscribeSpy).toBeCalledWith(['FRAC/USD'], expect.any(Function))

    await jest.advanceTimersByTimeAsync(API_TIMEOUT - 1)
    expect(streamHandlerThrew).toBe(false)
    await jest.advanceTimersByTimeAsync(1)
    expect(streamHandlerThrew).toBe(true)

    transport.streamHandler(context, { desired: subscriptions, new: [], stale: [] })
    await jest.advanceTimersByTimeAsync(0)

    expect(subscribeSpy).toBeCalledTimes(2)
    // This call is made to confirm the current subscriptions as we can't be
    // sure because the previous call timed out.
    expect(subscribeSpy).toHaveBeenNthCalledWith(2, [], expect.any(Function))
    subscribeCalls[1].callback({
      status: 'ok',
      involvedSubscriptions: [],
      subscriptionsAfterUpdate: [],
    })
    await jest.advanceTimersByTimeAsync(0)
    expect(subscribeSpy).toBeCalledTimes(3)
    expect(subscribeSpy).toHaveBeenNthCalledWith(3, ['FRAC/USD'], expect.any(Function))
  })

  it('should resubscribe even if unsubscribe timed out', async () => {
    const subscribeCalls: SubscribeCall[] = []
    const subscribeSpy = jest.fn().mockImplementation((subscriptions, callback) => {
      subscribeCalls.push({ subscriptions, callback })
    })
    mockSocket.clientMock.on('subscribe', subscribeSpy)

    const unsubscribeSpy = jest.fn()
    mockSocket.clientMock.on('unsubscribe', unsubscribeSpy)

    const transport = new SocketIOTransport()

    transport.streamHandler(context, emptySubscriptions)
    await jest.advanceTimersByTimeAsync(BACKGROUND_EXECUTE_MS_SSE)

    mockSocket.clientMock.emit('connect')

    const subscriptions = [{ base: 'FRAC', quote: 'USD' }]
    transport.streamHandler(context, { desired: subscriptions, new: subscriptions, stale: [] })

    expect(subscribeSpy).toBeCalledTimes(1)
    expect(subscribeSpy).toBeCalledWith(['FRAC/USD'], expect.any(Function))

    subscribeCalls[0].callback({
      status: 'ok',
      involvedSubscriptions: ['frac/usd'],
      subscriptionsAfterUpdate: ['frac/usd'],
    })

    await jest.advanceTimersByTimeAsync(BACKGROUND_EXECUTE_MS_SSE)

    transport.streamHandler(context, { desired: [], new: [], stale: subscriptions }).catch(() => {
      /* expected */
    })
    expect(unsubscribeSpy).toBeCalledTimes(1)
    expect(unsubscribeSpy).toBeCalledWith(['FRAC/USD'], expect.any(Function))
    await jest.advanceTimersByTimeAsync(API_TIMEOUT)

    // The unsubscribe called timed out, but this doesn't mean we didn't
    // unsubscribe. So we the next update has the subscription desired again,
    // we should subscribe again just to be sure.

    transport.streamHandler(context, { desired: subscriptions, new: subscriptions, stale: [] })

    expect(subscribeSpy).toBeCalledTimes(2)

    // This call is made to confirm the current subscriptions as we can't be
    // sure because the previous call timed out.
    expect(subscribeSpy).toHaveBeenNthCalledWith(2, [], expect.any(Function))
    subscribeCalls[1].callback({
      status: 'ok',
      involvedSubscriptions: [],
      subscriptionsAfterUpdate: [],
    })

    await jest.advanceTimersByTimeAsync(0)
    expect(subscribeSpy).toBeCalledTimes(3)
    expect(subscribeSpy).toHaveBeenNthCalledWith(3, ['FRAC/USD'], expect.any(Function))
    subscribeCalls[2].callback({
      status: 'ok',
      involvedSubscriptions: ['frac/usd'],
      subscriptionsAfterUpdate: ['frac/usd'],
    })
    await jest.advanceTimersByTimeAsync(0)

    // If the earlier timed out call returns now, it should not result in
    // additional subscribe calls.
    subscribeCalls[0].callback({
      status: 'ok',
      involvedSubscriptions: [],
      subscriptionsAfterUpdate: [],
    })
    await jest.advanceTimersByTimeAsync(0)

    transport.streamHandler(context, { desired: subscriptions, new: [], stale: [] })
    await jest.advanceTimersByTimeAsync(BACKGROUND_EXECUTE_MS_SSE)
    // No additional calls.
    expect(subscribeSpy).toBeCalledTimes(3)
    expect(unsubscribeSpy).toBeCalledTimes(1)
  })
})
