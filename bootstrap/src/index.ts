import { logger, Requester } from '@chainlink/external-adapter'
import { AdapterHealthCheck, AdapterRequest, Execute, ExecuteSync } from '@chainlink/types'
import * as aws from './lib/aws'
import { defaultOptions, redactOptions, withCache } from './lib/cache'
import * as metrics from './lib/metrics'
import { actions, store } from './lib/cache-warmer'
import * as gcp from './lib/gcp'
import * as server from './lib/server'
import * as util from './lib/util'
export type Middleware<O = any> = (execute: Execute, options?: O) => Promise<Execute>

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
  const recordMetrics = () => {
    const labels: Parameters<typeof metrics.httpRequestsTotal.labels>[0] = {
      method: 'POST',
    }
    const end = metrics.httpRequestDurationSeconds.startTimer()

    return (statusCode?: number, type?: metrics.HttpRequestType) => {
      labels.type = type
      labels.status_code = metrics.normalizeStatusCode(statusCode)
      end()
      metrics.httpRequestsTotal.labels(labels).inc()
    }
  }

  const record = recordMetrics()
  try {
    const result = await execute(input)
    record(
      result.statusCode,
      result.data.maxAge || (result as any).maxAge
        ? metrics.HttpRequestType.CACHE_HIT
        : metrics.HttpRequestType.DATA_PROVIDER_HIT,
    )
    return result
  } catch (error) {
    record()
    throw error
  }
}

const middleware = [withLogger, skipOnError(withCache), withStatusCode].concat(
  metrics.METRICS_ENABLED ? [withMetrics] : [],
)

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
      store.dispatch(
        actions.warmupRequestSubscribed({ data, executeFn: executeWithMiddleware, id: data.id }),
      )
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
