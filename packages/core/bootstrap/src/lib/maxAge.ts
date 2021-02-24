import { logger } from '@chainlink/external-adapter'

const MAX_AGE_ALLOWED = 1000 * 60 * 2
const DEFAULT_CACHE_MAX_AGE = 1000 * 30

const calculate = (maxReqAllowed: number): number => {
  const SEC_IN_MIN = 60
  const MS_IN_SEC = 1000

  let maxAge = Math.round(MS_IN_SEC / (maxReqAllowed / SEC_IN_MIN))
  if (maxAge < DEFAULT_CACHE_MAX_AGE) {
    maxAge = DEFAULT_CACHE_MAX_AGE
  } else if (maxAge >= MAX_AGE_ALLOWED) {
    logger.warn(
      `Cache: Max age is hitting the maximum values (${MAX_AGE_ALLOWED} ms). Too many dependent adapters`,
    )
    maxAge = MAX_AGE_ALLOWED
  }
  return maxAge
}

export default {
  calculate,
}
