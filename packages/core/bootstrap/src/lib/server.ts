import { ExecuteSync } from '@chainlink/types'
import express from 'express'
import { join } from 'path'
import * as client from 'prom-client'
import { loadTestPayload } from './config/test-payload-loader'
import {
  HTTP_ERROR_UNSUPPORTED_MEDIA_TYPE,
  HTTP_ERROR_UNSUPPORTED_MEDIA_TYPE_MESSAGE,
} from './errors'
import { logger } from './external-adapter'
import { METRICS_ENABLED } from './metrics'
import { toObjectWithNumbers } from './util'

const app = express()
const port = process.env.EA_PORT || 8080
const baseUrl = process.env.BASE_URL || '/'

export const HEADER_CONTENT_TYPE = 'Content-Type'
export const CONTENT_TYPE_APPLICATION_JSON = 'application/json'
export const CONTENT_TYPE_TEXT_PLAIN = 'text/plain'

export const initHandler = (execute: ExecuteSync) => (): void => {
  if (METRICS_ENABLED) {
    setupMetricsServer()
  }
  app.use(express.json())

  app.post(baseUrl, (req, res) => {
    if (!req.is(CONTENT_TYPE_APPLICATION_JSON)) {
      return res
        .status(HTTP_ERROR_UNSUPPORTED_MEDIA_TYPE)
        .send(HTTP_ERROR_UNSUPPORTED_MEDIA_TYPE_MESSAGE)
    }
    req.body.data = {
      ...(req.body.data || {}),
      ...toObjectWithNumbers(req.query),
    }
    return execute(req.body, (status, result) => {
      res.status(status).json(result)
    })
  })

  const testPayload = loadTestPayload()
  app.get(join(baseUrl, 'health'), (_, res) => {
    if (testPayload.isDefault) {
      return res.status(200).send('OK')
    }

    return execute({ data: testPayload.request, id: '1' }, (status, result) => {
      res.status(status).json(result)
    })
  })

  app.listen(port, () => logger.info(`Listening on port ${port}!`))
  process.on('SIGINT', () => {
    process.exit()
  })
}

function setupMetricsServer() {
  const metricsApp = express()
  const metricsPort = process.env.METRICS_PORT || 9080
  const endpoint = process.env.METRICS_USE_BASE_URL ? join(baseUrl, 'metrics') : '/metrics'

  metricsApp.get(endpoint, async (_, res) => {
    res.type('txt')
    res.send(await client.register.metrics())
  })

  metricsApp.listen(metricsPort, () => logger.info(`Monitoring listening on port ${metricsPort}!`))
}
