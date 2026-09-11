import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    API_ENDPOINT: {
      type: 'string',
      description: 'The HTTP API endpoint to use',
      default: 'https://oracle.prod.gsr.io/v1',
      sensitive: false,
    },
    WS_API_ENDPOINT: {
      type: 'string',
      description: 'The WS API endpoint to use',
      default: 'wss://oracle.prod.gsr.io/oracle',
      sensitive: false,
    },
    WS_USER_ID: {
      type: 'string',
      description: 'The user ID used to authenticate',
      required: true,
      sensitive: false,
    },
    WS_PUBLIC_KEY: {
      type: 'string',
      description: 'The public key used to authenticate',
      required: true,
      sensitive: false,
    },
    WS_PRIVATE_KEY: {
      type: 'string',
      description: 'The private key used to authenticate',
      required: true,
      sensitive: true,
    },
  },
  {
    envDefaultOverrides: {
      // DF-26076: GSR stops sending data when a session ends but leaves the
      // socket open, so the framework's staleness check is what notices. At the
      // 120s default that lands after CACHE_MAX_AGE (90s) has already expired
      // the cached prices, turning every stall into a burst of 504s. 30s keeps
      // detection and reconnect inside the cache's lifetime. GSR streams
      // hundreds of messages a second, so 30s of silence is unambiguous.
      WS_SUBSCRIPTION_UNRESPONSIVE_TTL: 30_000,
    },
  },
)
