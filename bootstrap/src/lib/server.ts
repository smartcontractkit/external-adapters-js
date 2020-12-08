import { logger } from '@chainlink/external-adapter'
import express from 'express'
import {
  HTTP_ERROR_NOT_IMPLEMENTED,
  HTTP_ERROR_UNSUPPORTED_MEDIA_TYPE,
  HTTP_ERROR_UNSUPPORTED_MEDIA_TYPE_MESSAGE,
} from './errors'
import { ExecuteSync, AdapterResponse, AdapterHealthCheck } from '@chainlink/types'

const app = express()
const port = process.env.EA_PORT || 8080

export const HEADER_CONTENT_TYPE = 'Content-Type'
export const CONTENT_TYPE_APPLICATION_JSON = 'application/json'
export const CONTENT_TYPE_TEXT_PLAIN = 'text/plain'

const notImplementedHealthCheck: AdapterHealthCheck = (callback) =>
  callback(HTTP_ERROR_NOT_IMPLEMENTED)

export const initHandler = (
  execute: ExecuteSync,
  checkHealth = notImplementedHealthCheck,
) => (): void => {
  app.use(express.json())

  app.post('/', (req, res) => {
    if (!req.is(CONTENT_TYPE_APPLICATION_JSON)) {
      return res
        .status(HTTP_ERROR_UNSUPPORTED_MEDIA_TYPE)
        .send(HTTP_ERROR_UNSUPPORTED_MEDIA_TYPE_MESSAGE)
    }

    execute(req.body, (status, result) => {
      res.status(status).json(result)
    })
  })

  app.get('/health', (_, res) => {
    logger.debug('Health check request')
    checkHealth((status: number, result: AdapterResponse) => {
      logger.debug(`Health check result [${status}]: `, { output: result })
      res.status(status).json(result)
    })
  })

  app.listen(port, () => logger.info(`Listening on port ${port}!`))

  process.on('SIGINT', () => {
    process.exit()
  })
}
