import { AdapterContext, Middleware, Execute } from '@chainlink/types'
import express from 'express'
import http from 'http'
import { join } from 'path'
import * as client from 'prom-client'
import { loadTestPayload } from './config/test-payload-loader'
import {
  HTTP_ERROR_UNSUPPORTED_MEDIA_TYPE,
  HTTP_ERROR_UNSUPPORTED_MEDIA_TYPE_MESSAGE,
} from './errors'
import { logger } from './external-adapter'
import { METRICS_ENABLED } from './metrics'
import { CACHE_ENABLED, defaultOptions } from './cache'
import { toObjectWithNumbers } from './util'
import { executeSync, withMiddleware } from '../index'

const app = express()
const port = process.env.EA_PORT || 8080
const baseUrl = process.env.BASE_URL || '/'

export const HEADER_CONTENT_TYPE = 'Content-Type'
export const CONTENT_TYPE_APPLICATION_JSON = 'application/json'
export const CONTENT_TYPE_TEXT_PLAIN = 'text/plain'

export const initHandler = (execute: Execute, middleware: Middleware[]) => async (): Promise<
  http.Server
> => {
  const context: AdapterContext = {
    cache: null,
  }
  if (CACHE_ENABLED) {
    const cacheOptions = defaultOptions()
    cacheOptions.instance = await cacheOptions.cacheBuilder(cacheOptions.cacheImplOptions)
    context.cache = cacheOptions
  }
  if (METRICS_ENABLED) {
    setupMetricsServer()
  }

  const executeWithMiddleware = await withMiddleware(execute, context, middleware)

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
    return executeSync(req.body, executeWithMiddleware, context, (status, result) => {
      res.status(status).json(result)
    })
  })

  app.get(join(baseUrl, 'health'), (_, res) => res.status(200).send('OK'))

  const testPayload = loadTestPayload()
  app.get(join(baseUrl, 'smoke'), (_, res) => {
    if (testPayload.isDefault) {
      return res.status(200).send('OK')
    }

    return executeSync(
      { data: testPayload.request, id: '1' },
      executeWithMiddleware,
      context,
      (status, result) => {
        res.status(status).json(result)
      },
    )
  })

  process.on('SIGINT', () => {
    context.cache?.instance?.close()
    process.exit()
  })

  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      logger.info(`Listening on port ${port}!`)
      resolve(server)
    })
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
