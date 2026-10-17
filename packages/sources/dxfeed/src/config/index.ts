import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

const logger = makeLogger('Config')

/**
 * Spec breaking_change_env_checks that run BOTH at startup and at request time
 * on WS paths: WS_API_ENDPOINT must point at the dxLink endpoint — the legacy
 * cometd transport is deleted (cometd-transport-deletion exception) and the
 * Basic credentials ride the Authorization header, never the URL.
 */
const wsApiEndpointBreakingChangeError = (value?: string): string => {
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
 * Startup validate fn for WS_API_ENDPOINT: the breaking-change checks above
 * plus the encrypted-scheme requirement — the handshake sends the Basic
 * Authorization header, so a plaintext ws:// endpoint would put the
 * credentials on the wire in cleartext. The ONLY exemption is a ws:// LOOPBACK
 * URL (localhost / 127.0.0.1 / [::1]), which is accepted with a warning — no
 * opt-in flag is required: in-process test bridges (mock-socket WS servers)
 * bind there, and no real provider is loopback. Every non-loopback ws:// host
 * still fails closed: NODE_ENV is deliberately NOT consulted, because it is
 * set widely in staging and CI and must never open the plaintext downgrade
 * path by accident.
 * Request-time customInputValidation deliberately does NOT repeat this scheme
 * check: the startup gate owns it.
 */
export const validateWsApiEndpoint = (value?: string): string => {
  const breakingChangeError = wsApiEndpointBreakingChangeError(value)
  if (breakingChangeError) {
    return breakingChangeError
  }

  const isLoopbackUrl = (endpoint: string): boolean =>
    /^wss?:\/\/(localhost|127\.0\.0\.1|\[::1\])([:/?#]|$)/.test(endpoint)

  if (value && !value.startsWith('wss://')) {
    if (isLoopbackUrl(value)) {
      // Loopback exemption for in-process test bridges: accepted, but the
      // Basic Authorization header would cross even a loopback wire
      // unencrypted — signal it so a misconfigured endpoint does not pass
      // silently. The log carries the parsed host and scheme ONLY:
      // WS_API_ENDPOINT is sensitive: true, its raw value must never reach
      // the logs.
      const url = new URL(value)
      logger.warn(
        `WS_API_ENDPOINT uses unencrypted ${url.protocol}//${url.host} on a loopback address: the Basic Authorization header (API_USERNAME/API_PASSWORD) rides the handshake unencrypted; this plaintext scheme is only for local test bridges, use wss:// everywhere else`,
      )
    } else {
      return 'WS_API_ENDPOINT must use the encrypted wss:// scheme; the Basic Authorization header rides the handshake and must not cross the wire in cleartext'
    }
  }

  return ''
}

/**
 * Spec data_source_authentication breaking_change_env_checks: the Basic
 * credential pair (the dxLink AUTH message exists but is NOT used; credentials
 * ride the Authorization header only). The spec scopes the credential
 * requirement to WS paths — a REST-only deployment (defaultTransport rest,
 * owner decision rest_transport_scope=keep_untouched) must boot without them —
 * so the AdapterConfig does NOT mark the WS settings required. The WS-path
 * request-time check below enforces all three WS settings on requests whose
 * resolved transport is ws, with a clear per-request error.
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
 * One implementation, two call sites: the endpoints' customInputValidation runs
 * the request-time WS checks (cometd path, embedded credentials, credential
 * pair, WS_API_ENDPOINT presence) so a WS-path misconfiguration fails fast
 * with a clear error. The wss:// scheme check is NOT repeated here — it is
 * owned by the startup AdapterConfig validate fn.
 */
export const wsEnvInputValidationError = (settings: {
  WS_API_ENDPOINT?: string
  API_USERNAME?: string
  API_PASSWORD?: string
}): AdapterInputError | undefined => {
  const endpointError = wsApiEndpointBreakingChangeError(settings.WS_API_ENDPOINT)
  if (endpointError) {
    return new AdapterInputError({ statusCode: 400, message: endpointError })
  }

  const credentialError = missingWsCredentials(settings)
  if (credentialError) {
    return new AdapterInputError({ statusCode: 400, message: credentialError })
  }

  if (!settings.WS_API_ENDPOINT?.trim()) {
    return new AdapterInputError({
      statusCode: 400,
      message: 'WS_API_ENDPOINT is required for dxfeed websocket requests',
    })
  }

  return undefined
}

export const config = new AdapterConfig(
  {
    // The WS settings are NOT required at the AdapterConfig level: the spec
    // scopes the credential/endpoint requirement to WS paths, and a REST-only
    // deployment (3 lastTradedPrice params fall through to defaultTransport
    // rest, owner decision rest_transport_scope=keep_untouched) must boot
    // without them. wsEnvInputValidationError enforces all three on requests
    // whose resolved transport is ws
    API_USERNAME: {
      description: 'username for dxfeed API',
      type: 'string',
      sensitive: false,
    },
    API_PASSWORD: {
      description: 'password for dxfeed API',
      type: 'string',
      sensitive: true,
    },
    WS_API_ENDPOINT: {
      description: 'The websocket url for dxfeed (dxLink endpoint)',
      type: 'string',
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
      validate: {
        meta: {
          details: 'API endpoint warning',
        },
        fn: (value?: string): string => {
          if (value === 'https://tools.dxfeed.com/webservice/rest') {
            logger.warn(
              `Using demo endpoint: https://tools.dxfeed.com/webservice/rest (Please do not use in production!)`,
            )
          }
          return ''
        },
      },
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
