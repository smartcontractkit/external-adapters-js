import type { Middleware, AdapterRequest, AdapterErrorLog } from '@chainlink/types'
import { logger as Logger } from '../../modules'
import { getFeedId } from '../../metrics/util'

export const withIOLogger: Middleware =
  async (execute, context) => async (input: AdapterRequest) => {
    Logger.debug('Input: ', { input })
    try {
      const result = await execute(input, context)
      Logger.debug(`Output: [${result.statusCode}]: `, { output: result })
      return result
    } catch (error) {
      const feedID = getFeedId(input)
      const errorLog: AdapterErrorLog = {
        message: error.toString(),
        jobRunID: input.id,
        params: input.data,
        feedID,
        url: error.url,
        errorResponse: error.errorResponse,
      }

      if (Logger.level === 'debug') {
        errorLog.stack = error.stack
      }

      if (Logger.level === 'trace') {
        errorLog.rawError = error.cause
        errorLog.stack = undefined
      }

      Logger.error(errorLog)
      throw error
    }
  }
