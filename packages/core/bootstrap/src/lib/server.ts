import type {
  AdapterContext,
  Execute,
  Middleware,
  AdapterRequest,
  AdapterData,
  EnvDefaultOverrides,
} from '../types'
import Fastify, { FastifyInstance } from 'fastify'
import { join } from 'path'
import * as client from 'prom-client'
import { executeSync, store, withMiddleware } from '../index'
import { defaultOptions } from './middleware/cache'
import { loadTestPayload } from './config/test-payload-loader'
import { logger } from './modules/logger'
import { METRICS_ENABLED, setupMetrics } from './metrics'
import { get as getRateLimitConfig } from './config/provider-limits/config'
import {
  buildCensorList,
  envVarValidations,
  getClientIp,
  getEnv,
  logEnvVarWarnings,
  parseBool,
  toObjectWithNumbers,
} from './util'
import { Limits } from './config/provider-limits'
import process from 'process'
import { serverShutdown } from './store'

const version = getEnv('npm_package_version')
const port = parseInt(getEnv('EA_PORT') as string)
const baseUrl = getEnv('BASE_URL') as string
const eaHost = getEnv('EA_HOST') as string
const maxPayloadSize = parseInt(getEnv('MAX_PAYLOAD_SIZE_LIMIT') as string)

export const HEADER_CONTENT_TYPE = 'Content-Type'
export const CONTENT_TYPE_APPLICATION_JSON = 'application/json'
export const CONTENT_TYPE_TEXT_PLAIN = 'text/plain'

export const initHandler =
  <D extends AdapterData>(
    adapterContext: AdapterContext,
    execute: Execute<AdapterRequest<D>>,
    middleware: Middleware<AdapterRequest<D>>[],
  ) =>
  async (): Promise<FastifyInstance> => {
    const name = adapterContext.name || ''
    const envDefaultOverrides = adapterContext.envDefaultOverrides || {}
    for (const key in envDefaultOverrides) {
      if (!process.env[key] && envDefaultOverrides[key as keyof EnvDefaultOverrides]) {
        process.env[key] = envDefaultOverrides[key as keyof EnvDefaultOverrides]
      }
    }

    // Validate env vars and fail startup if conditions not met
    envVarValidations()

    const app = Fastify({
      trustProxy: true,
      logger: false,
      bodyLimit: maxPayloadSize,
    })

    const rateLimit: Limits = adapterContext.rateLimit || { http: {}, ws: {} }
    let context: AdapterContext = {
      name,
      cache: undefined,
      envDefaultOverrides,
      rateLimit,
      limits: getRateLimitConfig(
        {
          limits: rateLimit,
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

    // Build list of env var values to censor in logs
    buildCensorList()

    // Log warnings based on env vars
    logEnvVarWarnings()

    if (METRICS_ENABLED) {
      setupMetricsServer(name)
    }

    const executeWithMiddleware = await withMiddleware<D>(execute, context, middleware)

    app.post<{
      Body: AdapterRequest<D>
    }>(baseUrl, async (req, res) => {
      req.body.data = {
        ...(req.body.data || {}),
        ...toObjectWithNumbers(req.query as Record<string, unknown>),
      }

      context = {
        ...context,
        ip: getClientIp(req),
        host: req.hostname,
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

    const testPayload = loadTestPayload<D>()
    app.get(join(baseUrl, 'smoke'), async (_, res) => {
      if (testPayload.isDefault) {
        return res.status(200).send('OK')
      }

      const errors = []

      for (const index in testPayload.requests) {
        try {
          await executeSync<D>(
            { data: testPayload.requests[index], id: index },
            executeWithMiddleware,
            context,
            (status, result) => {
              if (status === 400) errors.push(result)
            },
          )
        } catch (e: any) {
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
        logger.info(`Server listening on ${address}`)
        resolve(app)
      })
    })
  }

function setupMetricsServer(name: string) {
  const metricsApp = Fastify({
    logger: false,
  })
  const metricsPort = parseInt(getEnv('METRICS_PORT') as string)
  const endpoint = parseBool(getEnv('METRICS_USE_BASE_URL')) ? join(baseUrl, 'metrics') : '/metrics'
  logger.info(`Metrics endpoint: http://${eaHost}:${metricsPort}${endpoint}`)

  setupMetrics(name)

  metricsApp.get(endpoint, async (_, res) => {
    res.type('txt')
    res.send(await client.register.metrics())
  })

  metricsApp.listen(metricsPort, eaHost)
}
