import {
  AdapterRequest,
  AdapterContext,
  Execute,
  ExecuteSync,
  MakeWSHandler,
  Middleware,
  APIEndpoint,
  Callback,
  Config,
} from '@chainlink/types'
import { combineReducers, Store } from 'redux'
import { Cache, withCache } from './lib/middleware/cache'
import * as cacheWarmer from './lib/middleware/cache-warmer'
import {
  AdapterError,
  logger as Logger,
  Requester,
  Validator,
  Overrider,
  Builder,
} from './lib/modules'
import * as metrics from './lib/metrics'
import * as RateLimit from './lib/middleware/rate-limit'
import * as burstLimit from './lib/middleware/burst-limit'
import * as ErrorBackoff from './lib/middleware/error-backoff'
import * as ioLogger from './lib/middleware/io-logger'
import * as statusCode from './lib/middleware/status-code'
import * as debug from './lib/middleware/debugger'
import * as normalize from './lib/middleware/normalize'
import * as server from './lib/server'
import { configureStore } from './lib/store'
import * as util from './lib/util'
import * as ws from './lib/middleware/ws'
import http from 'http'

const REDUX_MIDDLEWARE = ['burstLimit', 'cacheWarmer', 'errorBackoff', 'rateLimit', 'ws'] as const
type ReduxMiddleware = typeof REDUX_MIDDLEWARE[number]

const rootReducer = combineReducers({
  errorBackoff: ErrorBackoff.reducer.rootReducer,
  burstLimit: burstLimit.reducer.rootReducer,
  cacheWarmer: cacheWarmer.reducer.rootReducer,
  rateLimit: RateLimit.reducer.rootReducer,
  ws: ws.reducer.rootReducer,
})

export type RootState = ReturnType<typeof rootReducer>

// Init store
const initState = { burstLimit: {}, cacheWarmer: {}, errorBackoff: {}, rateLimit: {}, ws: {} }
export const store = configureStore(rootReducer, initState, [
  cacheWarmer.epics.epicMiddleware,
  ws.epics.epicMiddleware,
])

// Run epics
cacheWarmer.epics.epicMiddleware.run(cacheWarmer.epics.rootEpic)
ws.epics.epicMiddleware.run(ws.epics.rootEpic)

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
    withCache(storeSlice('burstLimit')),
    RateLimit.withRateLimit(storeSlice('rateLimit')),
    statusCode.withStatusCode,
    normalize.withNormalizedInput(endpointSelector),
  ].concat(metrics.METRICS_ENABLED ? [metrics.withMetrics] : [])

  return [
    ErrorBackoff.withErrorBackoff(storeSlice('errorBackoff')),
    ioLogger.withIOLogger,
    withCache(storeSlice('burstLimit')),
    cacheWarmer.withCacheWarmer(storeSlice('cacheWarmer'), warmerMiddleware, {
      store: storeSlice('ws'),
      makeWSHandler: makeWsHandler,
    })(execute),
    ws.withWebSockets(storeSlice('ws'), makeWsHandler),
    RateLimit.withRateLimit(storeSlice('rateLimit')),
    statusCode.withStatusCode,
    normalize.withNormalizedInput(endpointSelector),
  ].concat(metrics.METRICS_ENABLED ? [metrics.withMetrics, debug.withDebug] : [debug.withDebug])
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

export type ExternalAdapter = {
  execute: Execute
  makeWsHandler?: MakeWSHandler
  endpointSelector?: (request: AdapterRequest) => APIEndpoint
}

export type ExecuteHandler = {
  server: () => Promise<http.Server>
}

export const expose = <C extends Config>(
  context: AdapterContext,
  execute: Execute,
  makeWsHandler?: MakeWSHandler,
  endpointSelector?: (request: AdapterRequest) => APIEndpoint<C>,
): ExecuteHandler => {
  util.registerUnhandledRejectionHandler()

  const middleware = makeMiddleware(execute, makeWsHandler, endpointSelector)
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
