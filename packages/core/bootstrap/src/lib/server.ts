import { AdapterContext, Execute, Middleware } from '@chainlink/types'
import express from 'express'
import http from 'http'
import { join } from 'path'
import * as client from 'prom-client'
import { executeSync, storeSlice, withMiddleware } from '../index'
import { defaultOptions } from './middleware/cache'
import { loadTestPayload } from './config/test-payload-loader'
import {
  HTTP_ERROR_UNSUPPORTED_MEDIA_TYPE,
  HTTP_ERROR_UNSUPPORTED_MEDIA_TYPE_MESSAGE,
} from './errors'
import { logger } from './modules'
import { METRICS_ENABLED, setupMetrics } from './metrics'
import { get as getRateLimitConfig } from './middleware/rate-limit/config'
import { getEnv, toObjectWithNumbers } from './util'
import { warmupShutdown } from './middleware/cache-warmer/actions'
import { shutdown } from './middleware/error-backoff/actions'
import { AddressInfo } from 'net'
import { WSReset } from './middleware/ws/actions'

const app = express()
const version = getEnv('npm_package_version')
const port = parseInt(getEnv('EA_PORT') as string)
const baseUrl = getEnv('BASE_URL') as string

export const HEADER_CONTENT_TYPE = 'Content-Type'
export const CONTENT_TYPE_APPLICATION_JSON = 'application/json'
export const CONTENT_TYPE_TEXT_PLAIN = 'text/plain'

export const initHandler =
  (adapterContext: AdapterContext, execute: Execute, middleware: Middleware[]) =>
  async (): Promise<http.Server> => {
    const name = adapterContext.name || ''
    const envDefaultOverrides = adapterContext.envDefaultOverrides
    const context: AdapterContext = {
      name,
      envDefaultOverrides,
      cache: null,
      rateLimit: getRateLimitConfig(
        {
          limits: adapterContext.rateLimit || { http: {}, ws: {} },
          name,
        },
        adapterContext,
      ),
    }
    const cacheOptions = defaultOptions(undefined, context)
    if (cacheOptions.enabled) {
      cacheOptions.instance = await cacheOptions.cacheBuilder(cacheOptions.cacheImplOptions)
      context.cache = cacheOptions
    }

    if (METRICS_ENABLED) {
      setupMetricsServer(name)
    }

    initExpressMiddleware(app)

    const executeWithMiddleware = await withMiddleware(execute, context, middleware)

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

    app.get(join(baseUrl, 'health'), async (_, res) => {
      // TODO https://app.shortcut.com/chainlinklabs/story/23810/update-redis-server-healthcheck
      // if (cacheOptions.enabled && cacheOptions.cacheImplOptions.type === 'redis') {
      //   logger.debug('Checking if redis connection initialized')
      //   const cache = context.cache.instance as redis.RedisCache
      //   if (!cache.client.connected) {
      //     res.status(500).send({ message: 'Redis not connected', version })
      //     return
      //   }
      // }

      res.status(200).send({ message: 'OK', version })
    })

    const testPayload = loadTestPayload()
    app.get(join(baseUrl, 'smoke'), async (_, res) => {
      if (testPayload.isDefault) {
        return res.status(200).send('OK')
      }

      const errors = []

      for (const index in testPayload.requests) {
        try {
          await executeSync(
            { data: testPayload.requests[index], id: index },
            executeWithMiddleware,
            context,
            (status, result) => {
              if (status === 400) errors.push(result)
            },
          )
        } catch (e) {
          errors.push(e)
        }
      }
      if (errors.length > 0) return res.status(500).send(errors)

      return res.status(200).send('OK')
    })

    process.on('SIGINT', () => {
      context.cache?.instance?.close()
      process.exit()
    })

    return new Promise((resolve) => {
      const server = app.listen(port, () => {
        server.on('close', () => {
          storeSlice('cacheWarmer').dispatch(warmupShutdown())
          storeSlice('errorBackoff').dispatch(shutdown())
          storeSlice('ws').dispatch(WSReset())
          context.cache?.instance?.close()
        })

        logger.info(`Listening on port ${(server.address() as AddressInfo).port}!`)
        resolve(server)
      })
    })
  }

function setupMetricsServer(name: string) {
  const metricsApp = express()
  const metricsPort = parseInt(getEnv('METRICS_PORT') as string)
  const endpoint = getEnv('METRICS_USE_BASE_URL') ? join(baseUrl, 'metrics') : '/metrics'

  setupMetrics(name)

  metricsApp.get(endpoint, async (_, res) => {
    res.type('txt')
    res.send(await client.register.metrics())
  })

  metricsApp.listen(metricsPort, () => logger.info(`Monitoring listening on port ${metricsPort}!`))
}

function initExpressMiddleware(app: express.Express) {
  app.set('trust proxy', 1)
  app.use(express.json({ limit: '1mb' }))
}
