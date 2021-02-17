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
  Config,
  ExecuteCall,
} from '@chainlink/types'

export type Middleware<O = any> = (execute: Execute<Config>, options?: O) => Promise<ExecuteCall>

// Try to initialize, pass through on error
const skipOnError = (middleware: Middleware) => async (execute: Execute<Config>) => {
  try {
    return await middleware(execute)
  } catch (error) {
    logger.warn(`${middleware.name} middleware initialization error! Passing through. `, error)
    return execute.call
  }
}

// Make sure data has the same statusCode as the one we got as a result
const withStatusCode: Middleware = async (execute) => async (input) => {
  const { statusCode, data, ...rest } = await execute.call(input)
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
    const result = await execute.call(input)
    logger.debug(`Output: [${result.statusCode}]: `, { output: result.data })
    return result
  } catch (error) {
    logger.error(error.toString(), { stack: error.stack })
    throw error
  }
}

const middleware = [withLogger, skipOnError(withCache), withStatusCode]

// Init all middleware, and return a wrapped execute fn
const withMiddleware = async (execute: Execute<Config>) => {
  // Init and wrap middleware one by one
  const config = execute.config
  for (let i = 0; i < middleware.length; i++) {
    const prev = await middleware[i](execute)
    execute = { config, call: prev }
  }
  return execute
}

// Execution helper async => sync
const executeSync = (execute: Execute<Config>): ExecuteSync => {
  // TODO: Try to init middleware only once
  // const initMiddleware = withMiddleware(execute)

  // Return sync function
  return (data: AdapterRequest, callback: any) => {
    // We init on every call because of cache connection broken state issue
    return withMiddleware(execute)
      .then((executeWithMiddleware) => executeWithMiddleware.call(data))
      .then((result) => callback(result.statusCode, result))
      .catch((error) => callback(error.statusCode || 500, Requester.errored(data.id, error)))
  }
}

export const expose = (execute: Execute<Config>, checkHealth?: AdapterHealthCheck): any => {
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
