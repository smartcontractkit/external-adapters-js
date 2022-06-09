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
import { AnyAction, combineReducers, Reducer, Store } from 'redux'
import * as BurstLimit from './lib/middleware/burst-limit'
import * as Cache from './lib/middleware/cache'
import * as CacheKey from './lib/middleware/cache-key'
import * as CacheWarmer from './lib/middleware/cache-warmer'
import * as Debug from './lib/middleware/debugger'
import * as ErrorBackoff from './lib/middleware/error-backoff'
import * as IoLogger from './lib/middleware/io-logger'
import * as Normalize from './lib/middleware/normalize'
import * as RateLimit from './lib/middleware/rate-limit'
import * as StatusCode from './lib/middleware/status-code'
import * as WebSocket from './lib/middleware/ws'
import { logger as Logger } from './lib/modules/logger'
import { Requester } from './lib/modules/requester'
import { Validator } from './lib/modules/validator'
import { Builder } from './lib/modules/selector'
import { Overrider } from './lib/modules/overrider'
import { AdapterError } from './lib/modules/error'
import * as metrics from './lib/metrics'
import * as server from './lib/server'
import { configureStore, serverShutdown } from './lib/store'
import * as util from './lib/util'
import { FastifyInstance } from 'fastify'
import { RPCErrorMap } from './lib/errors'

export * from './types'

const REDUX_MIDDLEWARE = ['burstLimit', 'cacheWarmer', 'errorBackoff', 'rateLimit', 'ws'] as const
type ReduxMiddleware = typeof REDUX_MIDDLEWARE[number]

const serverReducer = combineReducers({
  errorBackoff: ErrorBackoff.reducer.rootReducer,
  burstLimit: BurstLimit.reducer.rootReducer,
  cacheWarmer: CacheWarmer.reducer.rootReducer,
  rateLimit: RateLimit.reducer.rootReducer,
  ws: WebSocket.reducer.rootReducer,
})

const rootReducer = (state: ReturnType<typeof serverReducer>, action: AnyAction) => {
  if (serverShutdown.match(action)) {
    return serverReducer(initialState, { type: undefined })
  }
  return serverReducer(state, action)
}

export type RootState = ReturnType<typeof serverReducer>

export const initialState: RootState = {
  burstLimit: BurstLimit.reducer.initialState,
  cacheWarmer: CacheWarmer.reducer.initialState,
  errorBackoff: ErrorBackoff.reducer.initialState,
  rateLimit: RateLimit.reducer.initialState,
  ws: WebSocket.reducer.initialState,
}

// Initialize Redux store
export const store = configureStore(
  rootReducer as Reducer<RootState>,
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
    CacheKey.withCacheKey(endpointSelector),
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
    CacheKey.withCacheKey(endpointSelector),
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
  } catch (e) {
    const error = new AdapterError(e as Partial<AdapterError>)
    const feedID = metrics.util.getFeedId(data)

    // Try to transform error message if error is thrown from ether.js
    if (
      RPCErrorMap[error?.code as keyof typeof RPCErrorMap] &&
      error?.message?.includes('version')
    ) {
      error.message = RPCErrorMap[error.code as keyof typeof RPCErrorMap]
    }

    return callback(
      error.statusCode || 500,
      Requester.errored(data.id, error, error.providerStatusCode || error.statusCode, feedID),
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

// Export types
export * from './types'
// Export all error types
export * from './lib/modules/error'

export {
  Requester,
  Validator,
  Overrider,
  CacheKey,
  Builder,
  Logger,
  util,
  server,
  Cache,
  RateLimit,
  FastifyInstance,
}
