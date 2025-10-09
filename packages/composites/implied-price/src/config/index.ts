import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    SOURCE_TIMEOUT: {
      description: 'The number of milliseconds to wait for source adapter responses',
      type: 'number',
      default: 10000,
    },
    MAX_RETRIES: {
      description: 'Maximum number of retries for failed source requests',
      type: 'number',
      default: 3,
    },
    RETRY_DELAY: {
      description: 'Delay between retries in milliseconds',
      type: 'number',
      default: 1000,
    },
    SOURCE_CIRCUIT_BREAKER_THRESHOLD: {
      description: 'Number of consecutive failures before activating circuit breaker for a source',
      type: 'number',
      default: 5,
    },
    SOURCE_CIRCUIT_BREAKER_TIMEOUT: {
      description: 'Circuit breaker timeout in milliseconds',
      type: 'number',
      default: 60000,
    },
    REQUEST_COALESCING_ENABLED: {
      description: 'Enable request coalescing to avoid duplicate requests to same sources',
      type: 'boolean',
      default: true,
    },
    REQUEST_COALESCING_INTERVAL: {
      description: 'Interval in milliseconds for request coalescing',
      type: 'number',
      default: 100,
    },
    WARMUP_ENABLED: {
      description: 'Enable warmup requests on startup',
      type: 'boolean',
      default: false,
    },
    BACKGROUND_EXECUTE_MS: {
      description:
        'The amount of time the background execute should sleep before performing the next request',
      type: 'number',
      default: 10000,
    },
  },
  {
    envDefaultOverrides: {
      CACHE_MAX_AGE: 60_000,
      BACKGROUND_EXECUTE_TIMEOUT: 40_000,
      METRICS_ENABLED: true,
      API_TIMEOUT: 30000,
    },
  },
)
