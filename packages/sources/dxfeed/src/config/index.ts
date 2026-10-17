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
 * Opt-in flag for the loopback ws:// exemption (plan item 2): in-process test
 * bridges (mock-socket WS servers) bind to ws://localhost, but the Basic
 * Authorization header crosses even a loopback wire unencrypted, so the
 * exemption is closed by default and opens ONLY on an explicit
 * ALLOW_INSECURE_LOOPBACK_WS=true. NODE_ENV is deliberately NOT consulted: it
 * is set widely in staging and CI and must never open the plaintext downgrade
 * path by accident.
 */
const loopbackWsOptIn = (): boolean => process.env.ALLOW_INSECURE_LOOPBACK_WS === 'true'

/**
 * Startup validate fn for WS_API_ENDPOINT: the breaking-change checks above
 * plus the encrypted-scheme requirement — the handshake sends the Basic
 * Authorization header, so a plaintext ws:// endpoint would put the
 * credentials on the wire in cleartext. The ONLY exemption is a ws:// LOOPBACK
 * URL (localhost / 127.0.0.1 / [::1]) WITH the explicit
 * ALLOW_INSECURE_LOOPBACK_WS=true opt-in (default: rejected); it is accepted
 * with a warning because no real provider is loopback. Every non-loopback
 * ws:// host still fails closed.
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
      if (!loopbackWsOptIn()) {
        // Default false: no explicit opt-in, no plaintext handshake
        return 'WS_API_ENDPOINT uses unencrypted ws:// on a loopback address; if this endpoint serves a local test bridge, set ALLOW_INSECURE_LOOPBACK_WS=true, otherwise use wss://'
      }
      // Opted-in loopback test bridge: accepted, but the Basic Authorization
      // header crosses even a loopback wire unencrypted — signal it so a
      // misconfigured endpoint does not pass silently. The log carries the
      // parsed host and scheme ONLY: WS_API_ENDPOINT is sensitive: true, its
      // raw value must never reach the logs. (Plan item 3: the loopback regex
      // accepts shapes URL rejects, e.g. ws://localhost:notaport — a parse
      // failure degrades the log to the scheme string, it never throws.)
      let schemeAndHost: string
      try {
        const url = new URL(value)
        schemeAndHost = `${url.protocol}//${url.host}`
      } catch {
        schemeAndHost = `${value.split('://')[0]}://`
      }
      logger.warn(
        `WS_API_ENDPOINT uses unencrypted ${schemeAndHost} on a loopback address: the Basic Authorization header (API_USERNAME/API_PASSWORD) rides the handshake unencrypted; this plaintext scheme is only for local test bridges, use wss:// everywhere else`,
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
 * ride the Authorization header only). API_USERNAME and API_PASSWORD are
 * required at startup (spec environment_variables); WS_API_ENDPOINT is
 * request-time only (the REST-only deployment downgrade). The WS-path
 * request-time check below re-enforces the pair — plus WS_API_ENDPOINT
 * presence — on requests whose resolved transport is ws, with a clear
 * per-request error.
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

/** Spec environment_variables.API_ENDPOINT default — unchanged by the migration. */
export const REST_API_ENDPOINT_DEFAULT = 'https://tools.dxfeed.com/webservice/rest'

export const config = new AdapterConfig(
  {
    // The spec declares API_USERNAME, API_PASSWORD and WS_API_ENDPOINT
    // required=true: the WS paths cannot run without them, so the config
    // enforces them at startup. wsEnvInputValidationError re-enforces them on
    // requests whose resolved transport is ws
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
      // NOT required at startup (plan item: config downgrade): a REST-only
      // dxfeed deployment (owner decision rest_transport_scope=keep_untouched —
      // RDD's 3 lastTradedPrice params without a transport param fall through
      // to defaultTransport rest) must boot without a WS endpoint. The WS
      // requirement moves to REQUEST time: wsEnvInputValidationError gates
      // every ws-path request on WS_API_ENDPOINT presence, the credential pair
      // and the breaking-change checks. This deviates from the spec env block
      // (required:true) — the spec owner confirms the downgrade at the HITL
      // gate. The breaking-change validate fn below still runs at startup
      // whenever WS_API_ENDPOINT IS set.
      required: false,
      sensitive: true,
      validate: {
        meta: {
          details: 'The websocket url for dxfeed (dxLink endpoint)',
        },
        fn: validateWsApiEndpoint,
      },
    },
    // Review finding (loopback ws:// exemption lacked an explicit opt-in): the
    // key is declared for operator visibility, but the WS_API_ENDPOINT validate
    // fn reads process.env directly — framework validate fns receive only the
    // value, never the settings object
    ALLOW_INSECURE_LOOPBACK_WS: {
      description:
        'Explicit opt-in that allows an unencrypted ws:// LOOPBACK WS_API_ENDPOINT (local test bridges only); default false',
      type: 'boolean',
      required: false,
      default: false,
      sensitive: false,
    },
    API_ENDPOINT: {
      description: 'The API url for dxfeed',
      type: 'string',
      default: REST_API_ENDPOINT_DEFAULT,
      validate: {
        meta: {
          details: 'API endpoint warning',
        },
        fn: (value?: string): string => {
          if (value === REST_API_ENDPOINT_DEFAULT) {
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
