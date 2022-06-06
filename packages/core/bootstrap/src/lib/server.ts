import { AdapterContext, Execute, Middleware, AdapterRequest } from '@chainlink/types'
import Fastify, { FastifyInstance } from 'fastify'
import { join } from 'path'
import * as client from 'prom-client'
import { executeSync, store, withMiddleware } from '../index'
import { defaultOptions } from './middleware/cache'
import { loadTestPayload } from './config/test-payload-loader'
import { logger } from './modules'
import { METRICS_ENABLED, setupMetrics } from './metrics'
import { get as getRateLimitConfig } from './middleware/rate-limit/config'
import { getClientIp, getEnv, toObjectWithNumbers } from './util'
import process from 'process'
import { serverShutdown } from './store'

const version = getEnv('npm_package_version')
const port = parseInt(getEnv('EA_PORT') as string)
const baseUrl = getEnv('BASE_URL') as string
const eaHost = getEnv('EA_HOST') as string

export const HEADER_CONTENT_TYPE = 'Content-Type'
export const CONTENT_TYPE_APPLICATION_JSON = 'application/json'
export const CONTENT_TYPE_TEXT_PLAIN = 'text/plain'

export const initHandler =
  (adapterContext: AdapterContext, execute: Execute, middleware: Middleware[]) =>
  async (): Promise<FastifyInstance> => {
    const app = Fastify({
      trustProxy: true,
      logger: false,
    })
    const name = adapterContext.name || ''
    const envDefaultOverrides: Record<string, string> | undefined =
      adapterContext.envDefaultOverrides
    for (const key in envDefaultOverrides) {
      if (!process.env[key]) {
        process.env[key] = envDefaultOverrides[key]
      }
    }
    let context: AdapterContext = {
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

    const executeWithMiddleware = await withMiddleware(execute, context, middleware)

    app.post<{
      Body: AdapterRequest
    }>(baseUrl, async (req, res) => {
      const clientIp = getClientIp(req)
      const metricsMeta = METRICS_ENABLED ? { metricsMeta: { requestOrigin: clientIp } } : {}

      req.body.data = {
        ...(req.body.data || {}),
        ...toObjectWithNumbers(req.query),
        ...metricsMeta,
      }

      context = {
        ...context,
        ip: clientIp,
        hostname: req.hostname,
      }

      return executeSync(req.body, executeWithMiddleware, context, (status, result) => {
        res.code(status).send(result)
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

    app.addHook('onClose', async () => {
      store.dispatch(serverShutdown())
      context.cache?.instance?.close()
    })

    return new Promise((resolve) => {
      app.listen(port, eaHost, (_, address) => {
        logger.info(`Server listening on ${address}!`)
        resolve(app)
      })
    })
  }

function setupMetricsServer(name: string) {
  const metricsApp = Fastify({
    logger: false,
  })
  const metricsPort = parseInt(getEnv('METRICS_PORT') as string)
  const endpoint = getEnv('METRICS_USE_BASE_URL') ? join(baseUrl, 'metrics') : '/metrics'

  setupMetrics(name)

  metricsApp.get(endpoint, async (_, res) => {
    res.type('txt')
    res.send(await client.register.metrics())
  })

  metricsApp.listen(metricsPort, eaHost, () =>
    logger.info(`Monitoring listening on port ${metricsPort}!`),
  )
}
