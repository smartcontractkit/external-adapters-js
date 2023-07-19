import moment from 'moment'
import { Logger } from '@chainlink/ea-bootstrap'
import type { AdapterContext } from '@chainlink/ea-bootstrap'

const CACHE_KEY = 'cachedCVIValue'

interface CachedCVIValue {
  value: number
  timestamp: number
}

export const saveToCache = async (
  context: AdapterContext,
  result: number,
  renewPeriodSeconds: number,
): Promise<void> => {
  if (!context || !context.cache) {
    return
  }
  const cache = context.cache?.instance
  if (!cache) {
    return
  }
  const now = moment().utc().unix()
  const value = await cache.getResponse(CACHE_KEY)
  if (value === undefined || (value && value.maxAge && now - value.maxAge > renewPeriodSeconds)) {
    const c = cache.setResponse(
      CACHE_KEY,
      {
        maxAge: now,
        result,
        statusCode: 200,
        data: { statusCode: 200, result },
      },
      renewPeriodSeconds * 2000,
    )
    if (typeof c !== 'boolean') {
      await c
    }
    Logger.info(`Saved to cache - value: ${result}, timestamp: ${now}`)
  }
}

export const loadFromCache = async (
  context: AdapterContext,
): Promise<CachedCVIValue | undefined> => {
  if (!context) {
    return
  }
  const cache = context.cache?.instance
  if (!cache) {
    return
  }
  const cached = await cache.getResponse(CACHE_KEY)
  if (!cached) {
    return
  }
  const resultString = cached.result?.toString()
  if (!resultString) {
    return
  }
  Logger.info(`Value from cache - value: ${resultString}, timestamp: ${cached.maxAge}`)
  return { value: +resultString, timestamp: cached.maxAge }
}
