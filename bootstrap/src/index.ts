import { Requester, logger } from '@chainlink/external-adapter'
import { withCache, defaultOptions, redactOptions } from './lib/cache'
import * as util from './lib/util'
import * as server from './lib/server'
import * as gcp from './lib/gcp'
import * as aws from './lib/aws'
import {
  ExecuteSync,
  AdapterRequest,
  Execute,
  AdapterHealthCheck,
  AdapterResponse,
  AdapterErrorResponse,
} from '@chainlink/types'

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

const middleware = [withLogger, skipOnError(withCache), withStatusCode]

// Init all middleware, and return a wrapped execute fn
const withMiddleware = async (execute: Execute) => {
  // Init and wrap middleware one by one
  for (let i = 0; i < middleware.length; i++) {
    execute = await middleware[i](execute)
  }
  return execute
}

const wrapResponse = (response: AdapterResponse | AdapterErrorResponse) => {
  return {
    statusCode: response.statusCode,
    data: response,
  }
}

// Execution helper async => sync
const executeSync = (execute: Execute): ExecuteSync => {
  // TODO: Try to init middleware only once
  // const initMiddleware = withMiddleware(execute)

  // Return sync function
  return (data: AdapterRequest, callback: any) => {
    // We init on every call because of cache connection broken state issue
    return withMiddleware(execute)
      .then((executeWithMiddleware) => executeWithMiddleware(data))
      .then(wrapResponse)
      .then((result) => callback(result.statusCode, result.data))
      .catch((error) => callback(error.statusCode || 500, Requester.errored(data.id, error)))
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

export { util }
