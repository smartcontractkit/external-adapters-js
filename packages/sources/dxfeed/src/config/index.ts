import { AdapterConfig as FrameworkAdapterConfig } from '@chainlink/external-adapter-framework/config'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import CensorList from '@chainlink/external-adapter-framework/util/censor/censor-list'
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
 * Loopback hosts for which a plaintext ws:// WS_API_ENDPOINT is accepted inside
 * a test run (NODE_ENV === 'test'): the framework's mock-socket test bridge
 * serves the dxLink mock on ws:// loopback and hands the URL to the adapter
 * through WS_API_ENDPOINT alone.
 */
const LOOPBACK_WS_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1'])

/**
 * Startup validate fn for WS_API_ENDPOINT (runs only when a value is set): the
 * spec breaking_change_env_checks (reject the legacy cometd path, reject
 * embedded ://user:pass@ credentials) plus the scheme gate — the Basic
 * Authorization header rides the WS handshake, so any scheme other than wss://
 * is rejected at startup (plan ws-plaintext-endpoint-accepted). ws:// is
 * permitted ONLY when NODE_ENV is 'test' AND the host is loopback (the
 * framework's mock-socket test bridge); such an acceptance logs a loud
 * plaintext-credential warning.
 */
export const validateWsApiEndpoint = (value?: string): string => {
  const breakingChangeError = wsApiEndpointBreakingChangeError(value)
  if (breakingChangeError || !value) {
    return breakingChangeError
  }

  let url: URL
  try {
    url = new URL(value)
  } catch {
    // A value that does not parse as a URL has no scheme to gate on — rejected
    return 'WS_API_ENDPOINT is not a parseable URL; use the wss:// dxLink endpoint, e.g. wss://tools.dxfeed.com/dxlink-chainlink'
  }

  if (url.protocol === 'wss:') {
    return ''
  }

  if (
    url.protocol === 'ws:' &&
    process.env.NODE_ENV === 'test' &&
    LOOPBACK_WS_HOSTS.has(url.hostname)
  ) {
    logger.warn(
      `WS_API_ENDPOINT uses a plaintext ws:// loopback endpoint: the Basic Authorization header (the API credentials) would be sent unencrypted. Acceptance of ws:// is for local test servers only (NODE_ENV=test).`,
    )
    return ''
  }

  return 'WS_API_ENDPOINT must use the wss:// scheme: the dxLink handshake sends the Basic Authorization header (API_USERNAME and API_PASSWORD), which a plaintext ws:// endpoint would expose. Use the dxLink endpoint, e.g. wss://tools.dxfeed.com/dxlink-chainlink'
}

/**
 * Spec data_source_authentication breaking_change_env_checks: the Basic
 * credential pair (the dxLink AUTH message exists but is NOT used; credentials
 * ride the Authorization header only). The pair is also enforced at request
 * time by this check: the endpoints' customInputValidation runs it on requests
 * whose resolved transport is ws, with a clear per-request error.
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
 * with a clear error.
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

/**
 * The spec settings surface. API_USERNAME, API_PASSWORD and WS_API_ENDPOINT are
 * required: TRUE at startup (spec environment_variables) — a missing WS triple
 * fails config.validate() inside adapter.initialize(), before any request or
 * socket. The pair is ALSO enforced at request time by wsEnvInputValidationError
 * through the endpoints' customInputValidation (defense-in-depth: the WS
 * transport's options() also refuses to build a Basic header from a missing
 * pair).
 */
// `as const` keeps the definition literal (required: true/false, type:
// 'string'): the framework's Settings<T> mapped type uses those literals to
// decide which settings are optional keys — a widened `required: boolean`
// drops the key from the settings type entirely
const dxFeedSettings = {
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
} as const

/**
 * The adapter config type: the framework config built from the dxfeed settings
 * surface.
 */
export type DxFeedAdapterConfig = FrameworkAdapterConfig<typeof dxFeedSettings>

/**
 * The dxfeed censor entries (plan buildcensorlist-subclass-override): the
 * wrapper calls the framework config builder, whose buildCensorList — the
 * pinned framework version 2.20.0 signature returns void — populates the static
 * CensorList from the sensitive settings (API_PASSWORD, WS_API_ENDPOINT); this
 * accessor appends those built entries to the result as a typed list instead of
 * overriding the framework method on a subclass.
 */
export const censorList = (): { key: string; value: RegExp }[] => {
  config.buildCensorList()
  return CensorList.getAll()
}

/**
 * Wrapper around the framework config builder — NOT an AdapterConfig subclass
 * (plan buildcensorlist-subclass-override: a subclass overriding buildCensorList
 * changes its return type and can silently diverge on a framework upgrade).
 * Pinned framework version: 2.20.0.
 */
export const buildAdapterConfig = (): DxFeedAdapterConfig =>
  new FrameworkAdapterConfig(dxFeedSettings, {
    envDefaultOverrides: {
      // Spec data_source_endpoints[].keepalive interval_seconds=30
      WS_HEARTBEAT_INTERVAL_MS: 30000,
    },
  })

export const config = buildAdapterConfig()
