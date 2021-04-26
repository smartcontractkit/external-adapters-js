/**
 * Ignore any collisions based on the keys in the bootstrap package
 */
export const collisionIgnoreMap = {
  EXPERIMENTAL_METRICS_ENABLED: true,
  METRICS_PORT: true,
  METRICS_NAME: true,
  EXPERIMENTAL_RATE_LIMIT_ENABLED: true,
  RATE_LIMIT_CAPACITY: true,
  RATE_LIMIT_API_PROVIDER: true,
  RATE_LIMIT_API_TIER: true,
  CACHE_ENABLED: true,
  CACHE_TYPE: true,
  CACHE_KEY_GROUP: true,
  CACHE_KEY_IGNORED_PROPS: true,
  EXPERIMENTAL_WARMUP_ENABLED: true,
  WARMUP_UNHEALTHY_THRESHOLD: true,
  WARMUP_SUBSCRIPTION_TTL: true,
  CACHE_MAX_AGE: true,
  CACHE_MAX_ITEMS: true,
  CACHE_UPDATE_AGE_ON_GET: true,
  CACHE_REDIS_HOST: true,
  CACHE_REDIS_PORT: true,
  CACHE_REDIS_PATH: true,
  CACHE_REDIS_URL: true,
  CACHE_REDIS_PASSWORD: true,
  CACHE_REDIS_TIMEOUT: true,
  REQUEST_COALESCING_ENABLED: true,
  REQUEST_COALESCING_INTERVAL: true,
  REQUEST_COALESCING_INTERVAL_MAX: true,
  REQUEST_COALESCING_INTERVAL_COEFFICIENT: true,
  REQUEST_COALESCING_ENTROPY_MAX: true,
} as const

/**
 * Always rename adapter specific things such as "API_KEY"
 */
export const forceRenameMap = {
  API_KEY: true,
  RPC_URL: true,
  API_USERNAME: true,
  API_PASSWORD: true,
  API_ENDPOINT: true,
} as const

export const collisionPackageTypeMap = {
  // composites: true,
} as const
