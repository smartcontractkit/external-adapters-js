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
  AdapterData,
} from './types'
import { combineReducers, Store } from 'redux'
import {
  BurstLimit,
  Cache,
  CacheWarmer,
  Debug,
  ErrorBackoff,
  IoLogger,
  Normalize,
  RateLimit,
  StatusCode,
  WebSocket,
} from './lib/middleware'
import {
  AdapterError,
  logger as Logger,
  Requester,
  Validator,
  Builder,
  Overrider,
} from './lib/modules'
import * as metrics from './lib/metrics'
import * as server from './lib/server'
import { configureStore } from './lib/store'
import * as util from './lib/util'

export * from './types'

const REDUX_MIDDLEWARE = ['burstLimit', 'cacheWarmer', 'errorBackoff', 'rateLimit', 'ws'] as const
type ReduxMiddleware = typeof REDUX_MIDDLEWARE[number]

const rootReducer = combineReducers({
  errorBackoff: ErrorBackoff.reducer.rootReducer,
  burstLimit: BurstLimit.reducer.rootReducer,
  cacheWarmer: CacheWarmer.reducer.rootReducer,
  rateLimit: RateLimit.reducer.rootReducer,
  ws: WebSocket.reducer.rootReducer,
})

export type RootState = ReturnType<typeof rootReducer>

export const initialState: RootState = {
  burstLimit: BurstLimit.reducer.initialState,
  cacheWarmer: CacheWarmer.reducer.initialState,
  errorBackoff: ErrorBackoff.reducer.initialState,
  rateLimit: RateLimit.reducer.initialState,
  ws: WebSocket.reducer.initialState,
}

// Initialize Redux store
export const store = configureStore(
  rootReducer,
  { burstLimit: {}, cacheWarmer: {}, errorBackoff: {}, rateLimit: {}, ws: {} },
  [CacheWarmer.epics.epicMiddleware, WebSocket.epics.epicMiddleware],
)

// Run epics
CacheWarmer.epics.epicMiddleware.run(CacheWarmer.epics.rootEpic)
WebSocket.epics.epicMiddleware.run(WebSocket.epics.rootEpic)

export const storeSlice = (slice: ReduxMiddleware): Store =>
  ({
    getState: () => store.getState()[slice],
    dispatch: (a) => store.dispatch(a),
  } as Store)

export const makeMiddleware = <C extends Config, D extends AdapterData>(
  execute: Execute<AdapterRequest<D>>,
  makeWsHandler?: MakeWSHandler,
  endpointSelector?: (request: AdapterRequest<D>) => APIEndpoint<C, D>,
): Middleware<AdapterRequest<D>>[] => {
  const warmerMiddleware = [
    Cache.withCache<D>(storeSlice('burstLimit')),
    RateLimit.withRateLimit<AdapterRequest<D>>(storeSlice('rateLimit')),
    StatusCode.withStatusCode<AdapterRequest<D>>(),
    Normalize.withNormalizedInput(endpointSelector),
  ].concat(metrics.METRICS_ENABLED ? [metrics.withMetrics()] : [])

  const metricsMiddleware: Middleware<AdapterRequest<D>>[] = metrics.METRICS_ENABLED
    ? [metrics.withMetrics(), Debug.withDebug()]
    : [Debug.withDebug()]

  return [
    ErrorBackoff.withErrorBackoff(storeSlice('errorBackoff')),
    IoLogger.withIOLogger(),
    Cache.withCache(storeSlice('burstLimit')),
    CacheWarmer.withCacheWarmer<D>(storeSlice('cacheWarmer'), warmerMiddleware, {
      store: storeSlice('ws'),
      makeWSHandler: makeWsHandler,
    })(execute),
    WebSocket.withWebSockets(storeSlice('ws'), makeWsHandler),
    RateLimit.withRateLimit(storeSlice('rateLimit')),
    StatusCode.withStatusCode(),
    Normalize.withNormalizedInput(endpointSelector),
    ...metricsMiddleware,
  ]
}

// Wrap raw Execute function with middleware
export const withMiddleware = async <D extends AdapterData>(
  execute: Execute<AdapterRequest<D>>,
  context: AdapterContext,
  middleware: Middleware<AdapterRequest<D>>[],
): Promise<Execute<AdapterRequest<D>>> => {
  // Init and wrap middleware one by one
  for (let i = 0; i < middleware.length; i++) {
    execute = await middleware[i](execute, context)
  }
  return execute
}

// Execution helper async => sync
export const executeSync: ExecuteSync = async <D extends AdapterData>(
  data: AdapterRequest<D>,
  execute: Execute<AdapterRequest<D>>,
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

export const expose = <C extends Config, D extends AdapterData>(
  context: AdapterContext,
  execute: Execute<AdapterRequest<D>>,
  makeWsHandler?: MakeWSHandler,
  endpointSelector?: (request: AdapterRequest) => APIEndpoint<C, D>,
): ExecuteHandler => {
  util.registerUnhandledRejectionHandler()
  const middleware = makeMiddleware<C, D>(execute, makeWsHandler, endpointSelector)
  return {
    server: server.initHandler(context, execute, middleware),
  }
}

export {
  Requester,
  Validator,
  Overrider,
  AdapterError,
  Builder,
  Logger,
  util,
  server,
  Cache,
  RateLimit,
}
