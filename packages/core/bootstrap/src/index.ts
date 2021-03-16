import { combineReducers, Store } from 'redux'
import { logger } from '@chainlink/external-adapter'
import {
  AdapterHealthCheck,
  AdapterRequest,
  Execute,
  ExecuteSync,
  Middleware,
} from '@chainlink/types'
import { defaultOptions, redactOptions, withCache } from './lib/cache'
import * as aws from './lib/aws'
import * as gcp from './lib/gcp'
import * as cacheWarmer from './lib/cache-warmer'
import * as rateLimit from './lib/rate-limit'
import * as server from './lib/server'
import * as util from './lib/util'
import { configureStore } from './lib/store'
import { Requester } from '@chainlink/external-adapter'
import * as metrics from './lib/metrics'
import { WARMUP_REQUEST_ID } from './lib/cache-warmer/config'

const rootReducer = combineReducers({
  cacheWarmer: cacheWarmer.reducer.rootReducer,
  rateLimit: rateLimit.reducer.rootReducer,
})

// Init store
const initState = { cacheWarmer: {}, rateLimit: {} }
export const store = configureStore(rootReducer, initState, [cacheWarmer.epics.epicMiddleware])

// Run epics
cacheWarmer.epics.epicMiddleware.run(cacheWarmer.epics.rootEpic)

// Try to initialize, pass through on error
const skipOnError = (middleware: Middleware) => async (execute: Execute) => {
  try {
    return await middleware(execute)
  } catch (error) {
    logger.warn(`${middleware.name} middleware initialization error! Passing through. `, error)
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
  logger.debug('Input: ', { input })
  try {
    const result = await execute(input)
    logger.debug(`Output: [${result.statusCode}]: `, { output: result.data })
    return result
  } catch (error) {
    logger.error(error.toString(), { stack: error.stack })
    throw error
  }
}

const withMetrics: Middleware = async (execute) => async (input: AdapterRequest) => {
  try {
    const start = Date.now()
    metrics.httpRequestsTotal.inc()
    if (input.id === WARMUP_REQUEST_ID) {
      metrics.cacheWarmerRequests.inc()
    }
    const result = await execute(input)
    result.data.maxAge !== undefined
      ? metrics.httpRequestsCacheHits.inc()
      : metrics.httpRequestsDataProviderHits.inc()

    metrics.httpRequestDurationSeconds.observe((Date.now() - start) / 1000)
    return result
  } catch (error) {
    // Counter errored responses?
    logger.debug(error)
    throw error
  }
}

const middleware = [
  withLogger,
  skipOnError(withCache),
  rateLimit.withRateLimit({
    getState: () => store.getState().rateLimit,
    dispatch: (a) => store.dispatch(a),
  } as Store),
  withStatusCode,
  withMetrics,
]

// Init all middleware, and return a wrapped execute fn
const withMiddleware = async (execute: Execute) => {
  // Init and wrap middleware one by one
  for (let i = 0; i < middleware.length; i++) {
    execute = await middleware[i](execute)
  }
  return execute
}

// Execution helper async => sync
const executeSync = (execute: Execute): ExecuteSync => {
  // TODO: Try to init middleware only once
  // const initMiddleware = withMiddleware(execute)

  // Return sync function
  return async (data: AdapterRequest, callback: any) => {
    // We init on every call because of cache connection broken state issue
    try {
      const executeWithMiddleware = await withMiddleware(execute)
      const result = await executeWithMiddleware(data)
      // only consider registering a warmup request if the original one was successful
      // and we have caching enabled
      if (util.parseBool(process.env.CACHE_ENABLED) && util.parseBool(process.env.WARMUP_ENABLED)) {
        store.dispatch(
          cacheWarmer.actions.warmupSubscribed({
            id: data.id,
            executeFn: executeWithMiddleware,
            data,
          }),
        )
      }
      return callback(result.statusCode, result)
    } catch (error) {
      return callback(error.statusCode || 500, Requester.errored(data.id, error))
    }
  }
}

export const expose = (execute: Execute, checkHealth?: AdapterHealthCheck) => {
  // Add middleware to the execution flow
  const _execute = executeSync(execute)
  return {
    server: server.initHandler(_execute, checkHealth),
    gcpHandler: gcp.initHandler(_execute),
    // Backwards compatibility for old gcpHandler
    gcpservice: gcp.initHandler(_execute),
    // Default index.handler for AWS Lambda
    handler: aws.initHandlerREST(_execute),
    awsHandlerREST: aws.initHandlerREST(_execute),
    awsHandlerHTTP: aws.initHandlerHTTP(_execute),
  }
}
export type ExecuteHandlers = ReturnType<typeof expose>

// Log cache default options once
const cacheOptions = defaultOptions()
if (cacheOptions.enabled) logger.info('Cache enabled: ', redactOptions(cacheOptions))

export { util, server }
