import type {
  AdapterRequest,
  AdapterContext,
  Execute,
  ExecuteSync,
  ExecuteHandler,
  MakeWSHandler,
  Middleware,
  APIEndpoint,
  Callback,
  Config,
} from './types'
import { combineReducers, Store } from 'redux'
import {
  BurstLimit,
  Cache,
  CacheWarmer,
  Debug,
  IoLogger,
  Normalize,
  RateLimit,
  StatusCode,
  WebSocket,
} from './lib/middleware'
import { AdapterError, logger as Logger, Requester, Validator, Builder } from './lib/modules'
import * as metrics from './lib/metrics'
import * as server from './lib/server'
import { configureStore } from './lib/store'
import * as util from './lib/util'

export * from './types'

const REDUX_MIDDLEWARE = ['burstLimit', 'cacheWarmer', 'rateLimit', 'ws'] as const
type ReduxMiddleware = typeof REDUX_MIDDLEWARE[number]

const rootReducer = combineReducers({
  burstLimit: BurstLimit.reducer.rootReducer,
  cacheWarmer: CacheWarmer.reducer.rootReducer,
  rateLimit: RateLimit.reducer.rootReducer,
  ws: WebSocket.reducer.rootReducer,
})

export type RootState = ReturnType<typeof rootReducer>

export const initialState: RootState = {
  burstLimit: BurstLimit.reducer.initialState,
  cacheWarmer: CacheWarmer.reducer.initialState,
  rateLimit: RateLimit.reducer.initialState,
  ws: WebSocket.reducer.initialState,
}

// Initialize Redux store
export const store = configureStore(rootReducer, initialState, [
  CacheWarmer.epics.epicMiddleware,
  WebSocket.epics.epicMiddleware,
])

// Run epics
CacheWarmer.epics.epicMiddleware.run(CacheWarmer.epics.rootEpic)
WebSocket.epics.epicMiddleware.run(WebSocket.epics.rootEpic)

export const storeSlice = (slice: ReduxMiddleware): Store =>
  ({
    getState: () => store.getState()[slice],
    dispatch: (a) => store.dispatch(a),
  } as Store)

export const makeMiddleware = <C extends Config>(
  execute: Execute,
  makeWsHandler?: MakeWSHandler,
  endpointSelector?: (request: AdapterRequest) => APIEndpoint<C>,
): Middleware[] => {
  const warmerMiddleware = [
    Cache.withCache(storeSlice('burstLimit')),
    RateLimit.withRateLimit(storeSlice('rateLimit')),
    StatusCode.withStatusCode,
    Normalize.withNormalizedInput(endpointSelector),
  ].concat(metrics.METRICS_ENABLED ? [metrics.withMetrics] : [])

  return [
    IoLogger.withIOLogger,
    Cache.withCache(storeSlice('burstLimit')),
    CacheWarmer.withCacheWarmer(storeSlice('cacheWarmer'), warmerMiddleware, {
      store: storeSlice('ws'),
      makeWSHandler: makeWsHandler,
    })(execute),
    WebSocket.withWebSockets(storeSlice('ws'), makeWsHandler),
    RateLimit.withRateLimit(storeSlice('rateLimit')),
    StatusCode.withStatusCode,
    Normalize.withNormalizedInput(endpointSelector),
  ].concat(metrics.METRICS_ENABLED ? [metrics.withMetrics, Debug.withDebug] : [Debug.withDebug])
}

// Wrap raw Execute function with middleware
export const withMiddleware = async (
  execute: Execute,
  context: AdapterContext,
  middleware: Middleware[],
): Promise<Execute> => {
  // Init and wrap middleware one by one
  for (let i = 0; i < middleware.length; i++) {
    execute = await middleware[i](execute, context)
  }
  return execute
}

// Execution helper async => sync
export const executeSync: ExecuteSync = async (
  data: AdapterRequest,
  execute: Execute,
  context: AdapterContext,
  callback: Callback,
) => {
  try {
    const result = await execute(data, context)
    return callback(result.statusCode, result)
  } catch (error) {
    const feedID = metrics.util.getFeedId(data)
    return callback(
      error.statusCode || 500,
      Requester.errored(
        data.id,
        error,
        error.providerResponseStatusCode || error.statusCode,
        feedID,
      ),
    )
  }
}

export const expose = <C extends Config>(
  context: AdapterContext,
  execute: Execute,
  makeWsHandler?: MakeWSHandler,
  endpointSelector?: (request: AdapterRequest) => APIEndpoint<C>,
): ExecuteHandler => {
  const middleware = makeMiddleware(execute, makeWsHandler, endpointSelector)
  return {
    server: server.initHandler(context, execute, middleware),
  }
}

export { Requester, Validator, AdapterError, Builder, Logger, util, server, Cache, RateLimit }
