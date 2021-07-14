import {
  AdapterMetricsMeta,
  AdapterRequest,
  Execute,
  ExecuteSync,
  MakeWSHandler,
  Middleware,
  APIEndpoint,
} from '@chainlink/types'
import { combineReducers, Store } from 'redux'
import { defaultOptions, redactOptions, withCache } from './lib/cache'
import * as cacheWarmer from './lib/cache-warmer'
import { WARMUP_REQUEST_ID } from './lib/cache-warmer/config'
import {
  AdapterError,
  logger as Logger,
  Requester,
  Validator,
  Builder,
} from './lib/external-adapter'
import * as metrics from './lib/metrics'
import { getFeedId } from './lib/metrics/util'
import * as rateLimit from './lib/rate-limit'
import * as server from './lib/server'
import { configureStore } from './lib/store'
import * as util from './lib/util'
import * as ws from './lib/ws'

const rootReducer = combineReducers({
  cacheWarmer: cacheWarmer.reducer.rootReducer,
  rateLimit: rateLimit.reducer.rootReducer,
  ws: ws.reducer.rootReducer,
})

export type RootState = ReturnType<typeof rootReducer>

// Init store
const initState = { cacheWarmer: {}, rateLimit: {}, ws: {} }
export const store = configureStore(rootReducer, initState, [
  cacheWarmer.epics.epicMiddleware,
  ws.epics.epicMiddleware,
])

// Run epics
cacheWarmer.epics.epicMiddleware.run(cacheWarmer.epics.rootEpic)
ws.epics.epicMiddleware.run(ws.epics.rootEpic)

const storeSlice = (slice: any) =>
  ({
    getState: () => store.getState()[slice],
    dispatch: (a) => store.dispatch(a),
  } as Store)

// Try to initialize, pass through on error
const skipOnError = (middleware: Middleware) => async (
  execute: Execute,
  endpointSelector?: (request: AdapterRequest) => APIEndpoint,
) => {
  try {
    return await middleware(execute, endpointSelector)
  } catch (error) {
    Logger.warn(`${middleware.name} middleware initialization error! Passing through. `, error)
    return execute
  }
}

// Make sure data has the same statusCode as the one we got as a result
const withStatusCode: Middleware = async (execute) => async (input) => {
  const { statusCode, data, ...rest } = await execute(input)
  if (data && typeof data === 'object' && data.statusCode) {
    return {
      ...rest,
      statusCode,
      data: {
        ...data,
        statusCode,
      },
    }
  }

  return { ...rest, statusCode, data }
}

// Log adapter input & output data
const withLogger: Middleware = async (execute) => async (input: AdapterRequest) => {
  Logger.debug('Input: ', { input })
  try {
    const result = await execute(input)
    Logger.debug(`Output: [${result.statusCode}]: `, { output: result.data })
    return result
  } catch (error) {
    Logger.error(error.toString(), { stack: error.stack })
    throw error
  }
}

const withMetrics: Middleware = async (execute) => async (input: AdapterRequest) => {
  const feedId = getFeedId(input)
  const metricsMeta: AdapterMetricsMeta = {
    feedId: metrics.util.getFeedId(input),
  }

  const recordMetrics = () => {
    const labels: Parameters<typeof metrics.httpRequestsTotal.labels>[0] = {
      is_cache_warming: String(input.id === WARMUP_REQUEST_ID),
      method: 'POST',
      feed_id: feedId,
    }
    const end = metrics.httpRequestDurationSeconds.startTimer()

    return (statusCode?: number, type?: metrics.HttpRequestType) => {
      labels.type = type
      labels.status_code = metrics.util.normalizeStatusCode(statusCode)
      end()
      metrics.httpRequestsTotal.labels(labels).inc()
    }
  }

  const record = recordMetrics()
  try {
    const result = await execute({ ...input, metricsMeta })
    record(
      result.statusCode,
      result.data.maxAge || (result as any).maxAge
        ? metrics.HttpRequestType.CACHE_HIT
        : metrics.HttpRequestType.DATA_PROVIDER_HIT,
    )
    return { ...result, metricsMeta: { ...result.metricsMeta, ...metricsMeta } }
  } catch (error) {
    record()
    throw error
  }
}

export const withDebug: Middleware = async (execute) => async (input: AdapterRequest) => {
  const result = await execute(input)
  if (!util.isDebug()) {
    const { debug, ...rest } = result
    return rest
  }
  return result
}

// Init all middleware, and return a wrapped execute fn
export const withMiddleware = async (
  execute: Execute,
  middleware: Middleware[],
  endpointSelector?: (request: AdapterRequest) => APIEndpoint,
) => {
  // Init and wrap middleware one by one
  for (let i = 0; i < middleware.length; i++) {
    execute = await middleware[i](execute, endpointSelector)
  }
  return execute
}

// Execution helper async => sync
const executeSync = (
  execute: Execute,
  makeWsHandler?: MakeWSHandler,
  endpointSelector?: (request: AdapterRequest) => APIEndpoint,
): ExecuteSync => {
  // TODO: Try to init middleware only once
  // const initMiddleware = withMiddleware(execute)
  const warmerMiddleware = [
    skipOnError(withCache),
    rateLimit.withRateLimit(storeSlice('rateLimit')),
    withStatusCode,
  ].concat(metrics.METRICS_ENABLED ? [withMetrics] : [])

  const middleware = [
    withLogger,
    skipOnError(withCache),
    cacheWarmer.withCacheWarmer(storeSlice('cacheWarmer'), warmerMiddleware, {
      store: storeSlice('ws'),
      makeWSHandler: makeWsHandler,
    })(execute),
    ws.withWebSockets(storeSlice('ws'), makeWsHandler),
    rateLimit.withRateLimit(storeSlice('rateLimit')),
    withStatusCode,
  ].concat(metrics.METRICS_ENABLED ? [withMetrics, withDebug] : [withDebug])

  // Return sync function
  return async (data: AdapterRequest, callback: any) => {
    // We init on every call because of cache connection broken state issue
    try {
      const executeWithMiddleware = await withMiddleware(execute, middleware, endpointSelector)
      const result = await executeWithMiddleware(data)

      return callback(result.statusCode, result)
    } catch (error) {
      return callback(error.statusCode || 500, Requester.errored(data.id, error))
    }
  }
}

export const expose = (
  execute: Execute,
  makeWsHandler?: MakeWSHandler,
  endpointSelector?: (request: AdapterRequest) => APIEndpoint,
) => {
  // Add middleware to the execution flow
  const _execute = executeSync(execute, makeWsHandler, endpointSelector)
  return {
    server: server.initHandler(_execute),
  }
}
export type ExecuteHandlers = ReturnType<typeof expose>

// Log cache default options once
const cacheOptions = defaultOptions()
if (cacheOptions.enabled) Logger.info('Cache enabled: ', redactOptions(cacheOptions))

export { Requester, Validator, AdapterError, Builder, Logger, util, server, executeSync }
