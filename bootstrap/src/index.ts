import { Requester, logger } from '@chainlink/external-adapter'
import { withCache, defaultOptions, redactOptions } from './lib/cache'
import * as util from './lib/util'
import * as server from './lib/server'
import * as gcp from './lib/gcp'
import * as aws from './lib/aws'
import {
  ExecuteSync,
  AdapterRequest,
  AdapterHealthCheck,
  Config,
  ExecuteWithConfig,
  AdapterErrorResponse,
  ExecuteCall,
  WrappedAdapterResponse,
  AdapterResponse,
} from '@chainlink/types'

export type Middleware = (
  execute: ExecuteWithConfig<Config>,
  options?: any,
) => ExecuteCall | Promise<ExecuteCall>

// Try to initialize, pass through on error
const skipOnError = (middleware: Middleware) => async (execute: ExecuteWithConfig<Config>) => {
  try {
    return await middleware(execute)
  } catch (error) {
    logger.warn(`${middleware.name} middleware initialization error! Passing through. `, error)
    return execute.call
  }
}

// Make sure data has the same statusCode as the one we got as a result
const withStatusCode: Middleware = (execute: ExecuteWithConfig<Config>) => async (
  data_: AdapterRequest,
) => {
  const { statusCode, data } = await execute.call(data_)
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
const withLogger: Middleware = (execute: ExecuteWithConfig<Config>) => async (
  data: AdapterRequest,
) => {
  logger.debug('Input: ', { input: data })
  try {
    const result = await execute.call(data)
    logger.debug(`Output: [${result.statusCode}]: `, { output: result.data })
    return result
  } catch (error) {
    logger.error(error.toString(), { stack: error.stack })
    throw error
  }
}

const middleware = [withLogger, skipOnError(withCache), withStatusCode]

// Init all middleware, and return a wrapped execute fn
const withMiddleware = async (execute: ExecuteWithConfig<Config>) => {
  // Init and wrap middleware one by one
  const config = execute.config
  for (let i = 0; i < middleware.length; i++) {
    // The only time the 'execute' will be executed will be on the first middleware. The rest are inheriting the prev middleware func
    const prev = await middleware[i](execute)
    execute = { config, call: prev }
  }
  return execute
}

// Transform sync execute function to async
const withAsync = (execute: ExecuteWithConfig<Config>): ExecuteWithConfig<Config> => {
  // Check if execute is already a Promise
  return execute as ExecuteWithConfig<Config>
  // return (data: AdapterRequest) => util.toAsync(execute as ExecuteSync, data)
}

const wrapResponse = (response: AdapterResponse | AdapterErrorResponse): WrappedAdapterResponse => {
  return {
    statusCode: response.statusCode,
    data: response,
  }
}

// Execution helper async => sync
const executeSync = (execute: ExecuteWithConfig<Config>): ExecuteSync => {
  // TODO: Try to init middleware only once
  // const initMiddleware = withMiddleware(execute)

  // Return sync function
  return (data: AdapterRequest, callback: any) => {
    // We init on every call because of cache connection broken state issue
    return withMiddleware(execute)
      .then((executeWithMiddleware) => executeWithMiddleware.call(data))
      .then(wrapResponse)
      .then((result) => callback(result.statusCode, result.data))
      .catch((error) => callback(error.statusCode || 500, Requester.errored(data.id, error)))
  }
}

export const expose = (
  execute: ExecuteWithConfig<Config>,
  checkHealth?: AdapterHealthCheck,
): any => {
  // Add middleware to the execution flow
  const _execute = executeSync(withAsync(execute))
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

export { util }
