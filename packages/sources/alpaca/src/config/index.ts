import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { makeLogger } from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('AlpacaConfig')

const sandboxWarn = (label: string, url: string): void => {
  if (url.includes('sandbox.alpaca.markets')) {
    logger.warn(
      `ALPACA: ${label} points at the SANDBOX environment (${url}) — sandbox credentials cannot ` +
        'authenticate production data streams. Set the production host explicitly in production deployments.',
    )
  }
}

export const config = new AdapterConfig({
  CLIENT_ID: {
    description: 'Broker API client id for the OAuth client-credentials token exchange.',
    type: 'string',
    required: true,
    sensitive: true,
  },
  CLIENT_SECRET: {
    description: 'Broker API client secret for the OAuth client-credentials token exchange.',
    type: 'string',
    required: true,
    sensitive: true,
  },
  AUTH_ENDPOINT: {
    description:
      'Full OAuth token endpoint URL. Moves with the environment: sandbox host now, production host (authx.alpaca.markets) later.',
    type: 'string',
    default: 'https://authx.sandbox.alpaca.markets/v1/oauth2/token',
    required: false,
    sensitive: false,
    validate: {
      meta: { details: 'environment warning' },
      fn: (value?: string): string | undefined => {
        if (value) {
          sandboxWarn('AUTH_ENDPOINT', value)
        }
        return undefined // returning a string would be an ERROR message, not the value
      },
    },
  },
  WS_API_ENDPOINT: {
    description:
      'Full WebSocket URL. The production host (stream.data.alpaca.markets) replaces the sandbox host once the boat-entitled environment is provisioned; the path (/v1beta1/overnight) stays the same.',
    type: 'string',
    default: 'wss://stream.data.sandbox.alpaca.markets/v1beta1/overnight',
    required: false,
    sensitive: false,
    validate: {
      meta: { details: 'environment warning' },
      fn: (value?: string): string | undefined => {
        if (value) {
          sandboxWarn('WS_API_ENDPOINT', value)
        }
        return undefined // returning a string would be an ERROR message, not the value
      },
    },
  },
})
