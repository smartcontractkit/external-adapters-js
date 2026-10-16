import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

/**
 * Spec breaking_change_env_checks: WS_API_ENDPOINT must point at the dxLink
 * endpoint — the legacy cometd transport is deleted (cometd-transport-deletion
 * exception) and the Basic credentials ride the Authorization header, never the URL.
 */
export const validateWsApiEndpoint = (value?: string): string => {
  if (!value) {
    return ''
  }

  if (value.includes('/chainlink/cometd')) {
    return 'WS_API_ENDPOINT points at the legacy cometd transport, which is deleted in this adapter; use the dxLink endpoint, e.g. wss://tools.dxfeed.com/dxlink-chainlink'
  }

  if (/:\/\/[^/@]+@/.test(value)) {
    return 'WS_API_ENDPOINT must not embed credentials; set API_USERNAME and API_PASSWORD for the Basic Authorization header instead'
  }

  return ''
}

/**
 * Spec data_source_authentication breaking_change_env_checks: WS paths require
 * the Basic credential pair (the dxLink AUTH message exists but is NOT used;
 * credentials ride the Authorization header only).
 */
export const missingWsCredentials = (settings: {
  API_USERNAME?: string
  API_PASSWORD?: string
}): string => {
  if (!settings.API_USERNAME?.trim() || !settings.API_PASSWORD?.trim()) {
    return 'API_USERNAME and API_PASSWORD are required for dxLink websocket requests'
  }
  return ''
}

/**
 * One implementation, two call sites: the AdapterConfig validate fn runs the
 * same checks at startup, and the endpoints' customInputValidation runs them at
 * request time so a WS-path misconfiguration fails fast with a clear error.
 */
export const wsEnvInputValidationError = (settings: {
  WS_API_ENDPOINT?: string
  API_USERNAME?: string
  API_PASSWORD?: string
}): AdapterInputError | undefined => {
  const endpointError = validateWsApiEndpoint(settings.WS_API_ENDPOINT)
  if (endpointError) {
    return new AdapterInputError({ statusCode: 400, message: endpointError })
  }

  const credentialError = missingWsCredentials(settings)
  if (credentialError) {
    return new AdapterInputError({ statusCode: 400, message: credentialError })
  }

  return undefined
}

export const config = new AdapterConfig(
  {
    API_USERNAME: {
      description: 'username for dxfeed API',
      type: 'string',
      required: true,
      sensitive: false,
    },
    API_PASSWORD: {
      description: 'password for dxfeed API',
      type: 'string',
      required: true,
      sensitive: true,
    },
    WS_API_ENDPOINT: {
      description: 'The websocket url for dxfeed (dxLink endpoint)',
      type: 'string',
      required: true,
      sensitive: true,
      validate: {
        meta: {
          details: 'The websocket url for dxfeed (dxLink endpoint)',
        },
        fn: validateWsApiEndpoint,
      },
    },
    API_ENDPOINT: {
      description: 'The API url for dxfeed',
      type: 'string',
      default: 'https://tools.dxfeed.com/webservice/rest',
      sensitive: false,
    },
  },
  {
    envDefaultOverrides: {
      // Spec data_source_endpoints[].keepalive interval_seconds=30
      WS_HEARTBEAT_INTERVAL_MS: 30000,
    },
  },
)
