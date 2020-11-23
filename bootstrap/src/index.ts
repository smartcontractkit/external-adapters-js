import { Requester, logger } from '@chainlink/external-adapter'
import { types } from 'util'
import { withCache, defaultOptions, redactOptions } from './lib/cache'
import * as util from './lib/util'
import * as server from './lib/server'
import * as gcp from './lib/gcp'
import * as aws from './lib/aws'
import {
  ExecuteSync,
  AdapterRequest,
  ExecuteWrappedResponse,
  AdapterHealthCheck,
} from '@chainlink/types'

type Middleware = (execute: ExecuteWrappedResponse) => Promise<ExecuteWrappedResponse>

// Try to initialize, pass through on error
const skipOnError = (middleware: Middleware) => async (execute: ExecuteWrappedResponse) => {
  try {
    return await middleware(execute)
  } catch (error) {
    logger.warn(`${middleware.name} middleware initialization error! Passing through. `, error)
    return execute
  }
}

// Make sure data has the same statusCode as the one we got as a result
const withStatusCode = (execute: ExecuteWrappedResponse) => async (data_: AdapterRequest) => {
  const { statusCode, data } = await execute(data_)
  if (data && typeof data === 'object' && data.statusCode) {
    return {
      statusCode,
      data: {
        ...data,
        statusCode,
      },
    }
  }

  return { statusCode, data }
}

// Log adapter input & output data
const withLogger = (execute: ExecuteWrappedResponse) => async (data: AdapterRequest) => {
  logger.debug('Input: ', { input: data })
  const result = await execute(data)
  logger.debug(`Output: [${result.statusCode}]: `, { output: result.data })
  return result
}

// Transform sync execute function to async
const withAsync = (execute: ExecuteWrappedResponse | ExecuteSync) => {
  // Check if execute is already a Promise
  if (types.isAsyncFunction(execute)) {
    const execAsync = execute as ExecuteWrappedResponse
    return (data: AdapterRequest) => execAsync(data)
  }
  return async (data: AdapterRequest) => util.toAsync(execute as ExecuteSync, data)
}

const middleware = [withAsync, withLogger, skipOnError(withCache), withStatusCode]

// Init all middleware, and return a wrapped execute fn
const withMiddleware = async (execute: ExecuteWrappedResponse | ExecuteSync) => {
  // Init and wrap middleware one by one
  let wrappedExecute
  for (const mw of middleware) {
    wrappedExecute = await mw(execute as ExecuteWrappedResponse)
  }
  return wrappedExecute
}

// Execution helper async => sync
const executeSync = (execute: ExecuteWrappedResponse | ExecuteSync): ExecuteSync => {
  // TODO: Try to init middleware only once
  // const initMiddleware = withMiddleware(execute)

  // Return sync function
  return (data: AdapterRequest, callback: Function) => {
    // We init on every call because of cache connection broken state issue
    return withMiddleware(execute)
      .then((executeWithMiddleware) => executeWithMiddleware && executeWithMiddleware(data))
      .then((result) => callback(result?.statusCode, result?.data))
      .catch((error) => callback(error.statusCode || 500, Requester.errored(data.id, error)))
  }
}

export const expose = (
  execute: ExecuteWrappedResponse | ExecuteSync,
  checkHealth?: AdapterHealthCheck,
) => {
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

// Log cache default options once
const cacheOptions = defaultOptions()
if (cacheOptions.enabled) logger.info('Cache enabled: ', redactOptions(cacheOptions))

export { util }
