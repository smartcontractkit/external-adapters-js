import moment from 'moment'
import { Cache } from '@chainlink/ea-bootstrap'
import { CacheEntry } from '@chainlink/ea-bootstrap/src/lib/cache/types'
import { AdapterContext } from '@chainlink/types'

const CACHE_KEY = 'cachedCVIValue'

interface CachedCVIValue {
  value: number
  timestamp: number
}

export const saveCache = async (
  context: AdapterContext,
  result: number,
  renewPeriod: number,
): Promise<void> => {
  const cache = context.cache.instance as Cache
  const value = await cache.getResponse(CACHE_KEY)
  const cachedValue: CachedCVIValue = value?.data
  const now = moment().utc().unix()
  if (!cachedValue || now - cachedValue.timestamp > renewPeriod * 1000) {
    const data: CachedCVIValue = { value: result, timestamp: now }
    cache.setResponse(CACHE_KEY, { data } as CacheEntry, renewPeriod * 2000)
  }
}

export const loadCache = async (context: AdapterContext): Promise<CachedCVIValue | undefined> => {
  const cache = context.cache.instance as Cache
  const value = await cache.getResponse(CACHE_KEY)
  return value?.data
}
