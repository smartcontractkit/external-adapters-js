import { separateBatches } from '../../src/lib/middleware/ws/utils'
import { WebSocketClassProvider, WsMessageRecorder } from '../../src/lib/middleware/ws/recorder'
import { AdapterRequest, AdapterResponse, MakeWSHandler } from '../../src/types'

// Need to import the index to avoid bad initialization
import '../../src'

import * as ws from '../../src/lib/middleware/ws'
import { combineReducers, Store } from 'redux'
import { WARMUP_REQUEST_ID } from '../../src/lib/middleware/cache-warmer/config'
import { Server } from 'mock-socket'
import {
  mockWebSocketFlow,
  mockWebSocketProvider,
  mockWebSocketServer,
} from '../helpers/websockets'
import { configureStore } from '../../src/lib/store'
import { createEpicMiddleware } from 'redux-observable'
import { createReducer } from '@reduxjs/toolkit'

describe('WebSockets', () => {
  describe('Separate batches', () => {
    it('should correctly separate a batched request into individual requests', async () => {
      const request = {
        id: '1',
        data: {
          base: 'BTC',
          quote: ['USD', 'EUR'],
        },
      }
      const splitRequests: AdapterRequest[] = []
      await separateBatches(request, async (res) => {
        splitRequests.push(res)
      })
      expect(splitRequests.length).toEqual(2)
      const [firstRequest, secondRequest] = splitRequests
      expect(firstRequest.data.base).toBe('BTC')
      expect(secondRequest.data.base).toBe('BTC')
      expect(firstRequest.data.quote).toBe('USD')
      expect(secondRequest.data.quote).toBe('EUR')
    })
  })

  describe('recorder', () => {
    it('records and prints messages', () => {
      const log = jest.spyOn(console, 'log').mockImplementationOnce(() => {
        return
      })
      const messages = [
        {
          type: 'sent',
          data: 'test',
        },
        {
          type: 'received',
          data: 'qweqwe',
        },
      ] as const
      WsMessageRecorder.add(messages[0])
      WsMessageRecorder.add(messages[1])
      WsMessageRecorder.print()
      expect(log).toHaveBeenCalledWith(`Recorded WebSocketMessages: ${JSON.stringify(messages)}`)
      jest.restoreAllMocks()
    })
  })

  describe('WebSocketClassProvider', () => {
    it('sets and get ws class', () => {
      WebSocketClassProvider.set({ test: true } as unknown as Parameters<
        typeof WebSocketClassProvider.set
      >[0])
      expect(WebSocketClassProvider.get()).toEqual({ test: true })
    })
  })

  const request: AdapterRequest = {
    id: '1',
    data: {
      from: 'ETH',
      to: 'USD',
    },
  }
  const response: AdapterResponse = {
    result: 123.4,
    jobRunID: '1',
    statusCode: 200,
    data: {
      number: 123.4,
      statusCode: 200,
    },
  }

  describe('middleware', () => {
    let oldEnv: NodeJS.ProcessEnv
    let mockedWsServer: Server
    let slice: Store
    let disconnectedPromise: Promise<true>
    const WS_URL = 'wss://chain.link.test'

    beforeAll(() => {
      oldEnv = JSON.parse(JSON.stringify(process.env))
      process.env.WS_ENABLED = 'true'
      process.env.WS_SUBSCRIPTION_TTL = '100'
    })

    beforeEach(() => {
      // Mock WS server
      mockedWsServer = mockWebSocketServer(WS_URL)
      mockWebSocketProvider(WebSocketClassProvider)

      // Mock store, add disconnect reducer to finish tests
      const epicMiddleware = createEpicMiddleware()
      let disconnectResolve: (value: true | PromiseLike<true>) => void
      disconnectedPromise = new Promise((resolve) => (disconnectResolve = resolve))
      const disconnectReducer = createReducer({}, (builder) => {
        builder.addCase(ws.actions.disconnectFulfilled, () => {
          disconnectResolve(true)
        })
      })
      const rootReducer = combineReducers({
        ws: ws.reducer.rootReducer,
        disconnectReducer,
      })
      const store = configureStore(rootReducer, { ws: {} }, [epicMiddleware])
      slice = {
        getState: () => store.getState()['ws'],
        dispatch: (a) => store.dispatch(a),
      } as Store
      epicMiddleware.run(ws.epics.rootEpic)
    })

    afterEach(() => {
      mockedWsServer.stop()
    })

    afterAll(() => {
      process.env = oldEnv
    })

    it('ignores ws if no ws handler is present', async () => {
      const execute = async () => response
      const middleware = await ws.withWebSockets(slice, undefined)(execute, {})
      const result = await middleware(request, {})
      expect(result).toBe(response)
    })

    it('ignores ws is request has warmup id', async () => {
      const makeHandler: MakeWSHandler = () => ({
        shouldNotServeInputUsingWS: () => true,
        connection: {
          url: 'asd',
        },
        subscribe: () => undefined,
        unsubscribe: () => undefined,
        toResponse: () => response,
        filter: () => true,
        isError: () => false,
        subsFromMessage: () => undefined,
      })
      const execute = async () => response
      const middleware = await ws.withWebSockets(slice, makeHandler)(execute, {})
      const result = await middleware(
        {
          ...request,
          id: WARMUP_REQUEST_ID,
        },
        {},
      )
      expect(result).toBe(response)
    })

    it('ignores ws if endpoint should not be served with ws', async () => {
      const makeHandler: MakeWSHandler = () => ({
        shouldNotServeInputUsingWS: () => true,
        connection: {
          url: 'asd',
        },
        subscribe: () => undefined,
        unsubscribe: () => undefined,
        toResponse: () => response,
        filter: () => true,
        isError: () => false,
        subsFromMessage: () => undefined,
      })
      const execute = async () => response
      const middleware = await ws.withWebSockets(slice, makeHandler)(execute, {})
      const result = await middleware(request, {})
      expect(result).toBe(response)
    })

    it('connects to ws, sends subscribe request, heartbeats, then unsubscribes', async () => {
      const subscribePayload = {
        type: 'subscribe',
        from: 'ETH',
        to: 'BTC',
      }
      const unsubscribePayload = {
        type: 'unsubscribe',
        from: 'ETH',
        to: 'BTC',
      }
      const makeHandler: MakeWSHandler = () => ({
        shouldNotServeInputUsingWS: () => false,
        connection: {
          url: WS_URL,
        },
        subscribe: () => subscribePayload,
        unsubscribe: () => unsubscribePayload,
        toResponse: () => response,
        filter: () => true,
        isError: () => false,
        subsFromMessage: () => subscribePayload,
        heartbeatIntervalInMS: 50,
        heartbeatMessage: () => 'heartbeat',
      })
      const execute = async () => response
      const middleware = await ws.withWebSockets(slice, makeHandler)(execute, {})
      await middleware(request, {})

      const flowFulfilled = mockWebSocketFlow(mockedWsServer, [
        {
          request: subscribePayload,
          response: {
            ...subscribePayload,
            tyep: 'subscribed',
          },
        },
        {
          request: 'heartbeat',
          response: [],
        },
        {
          request: unsubscribePayload,
          response: 'unsubscribed',
        },
      ])
      await flowFulfilled
      await disconnectedPromise
    }, 10000)
  })
})
