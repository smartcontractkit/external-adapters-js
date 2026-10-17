import {
  AdapterConfig as FrameworkAdapterConfig,
  SettingsDefinitionMap,
} from '@chainlink/external-adapter-framework/config'
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
 * Loopback hosts for which an accepted plaintext ws:// WS_API_ENDPOINT inside a
 * test run (NODE_ENV === 'test') logs the plaintext-credential warning below:
 * the framework's mock-socket test bridge serves the dxLink mock on ws://
 * loopback and hands the URL to the adapter through WS_API_ENDPOINT alone.
 */
const LOOPBACK_WS_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1'])

/**
 * Startup validate fn for WS_API_ENDPOINT (runs only when a value is set): the
 * spec's breaking_change_env_checks ONLY — reject the legacy cometd path and
 * reject embedded credentials. No scheme gate: the spec declares no other
 * WS_API_ENDPOINT check, so any other value passes startup validation. A
 * plaintext ws:// endpoint accepted on the NODE_ENV=test loopback path (the
 * framework's mock-socket test bridge) logs a loud warning — a boot with real
 * credentials on that path would send the Basic Authorization header
 * unencrypted, and the warning is the signal in the logs.
 */
export const validateWsApiEndpoint = (value?: string): string => {
  const breakingChangeError = wsApiEndpointBreakingChangeError(value)
  if (breakingChangeError || !value) {
    return breakingChangeError
  }

  if (process.env.NODE_ENV === 'test') {
    try {
      const url = new URL(value)
      if (url.protocol === 'ws:' && LOOPBACK_WS_HOSTS.has(url.hostname)) {
        logger.warn(
          `WS_API_ENDPOINT uses a plaintext ws:// loopback endpoint: the Basic Authorization header (the API credentials) would be sent unencrypted. Acceptance of ws:// is for local test servers only (NODE_ENV=test).`,
        )
      }
    } catch {
      // Not a parseable URL — accepted above like any other value the spec does
      // not check; no warning can name a host
    }
  }

  return ''
}

/**
 * Spec data_source_authentication breaking_change_env_checks: the Basic
 * credential pair (the dxLink AUTH message exists but is NOT used; credentials
 * ride the Authorization header only). The WS settings are NOT
 * startup-required — the spec requires them on WS paths only, and the
 * REST-only boot (owner decision rest_transport_scope=keep_untouched) must
 * keep working with no WS variables at all. This request-time check is the
 * WS-path gate: the endpoints' customInputValidation runs it on requests whose
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
 * dxFeed AdapterConfig: the framework's buildCensorList populates the static
 * CensorList for log censoring but returns void. The adapter (and tests) need
 * the list itself, so the override returns it while keeping the framework
 * behavior intact. Exported so tests can re-construct the adapter config and
 * pin the censor list to one entry per sensitive key (round-2 proving test).
 */
export class AdapterConfig<
  T extends SettingsDefinitionMap = SettingsDefinitionMap,
> extends FrameworkAdapterConfig<T> {
  buildCensorList(): { key: string; value: RegExp }[] {
    super.buildCensorList()
    return CensorList.getAll()
  }

  // No validate() override: the framework's startup validation runs unchanged
  // inside initialize(). The three WS settings are declared required: false
  // below — the spec requires them on WS paths only, and the WS-path
  // requirement is the request-time gate (wsEnvInputValidationError through the
  // endpoints' customInputValidation).
}

/**
 * Constructs the adapter config with the spec settings surface. No explicit
 * return type: the constructed settings literal must flow into
 * `typeof config.settings` so the transports see the dxFeed keys
 * (an `AdapterConfig` annotation would default T to SettingsDefinitionMap and
 * erase API_USERNAME / API_PASSWORD / WS_API_ENDPOINT from the settings type).
 */
export const buildAdapterConfig = () =>
  new AdapterConfig(
    {
      // The spec environment_variables mark API_USERNAME, API_PASSWORD and
      // WS_API_ENDPOINT required: true for WS-path use (the dxLink WS transport
      // cannot build the Basic auth handshake header or the endpoint URL
      // without them), but they are NOT startup-required: the REST-only boot
      // (owner decision rest_transport_scope=keep_untouched) must keep working
      // with none of them set. The WS-path requirement is enforced at request
      // time (wsEnvInputValidationError through the endpoints'
      // customInputValidation on requests whose resolved transport is ws). The
      // breaking-change env checks stay: the WS_API_ENDPOINT validate fn above
      // runs ONLY when a value is set (the framework skips validate fns for
      // unset settings) and rejects the legacy cometd path and embedded
      // ://user:pass@ credentials.
      API_USERNAME: {
        description: 'username for dxfeed API',
        type: 'string',
        required: false,
        sensitive: false,
      },
      API_PASSWORD: {
        description: 'password for dxfeed API',
        type: 'string',
        required: false,
        sensitive: true,
      },
      WS_API_ENDPOINT: {
        description: 'The websocket url for dxfeed (dxLink endpoint)',
        type: 'string',
        required: false,
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
    },
    {
      envDefaultOverrides: {
        // Spec data_source_endpoints[].keepalive interval_seconds=30
        WS_HEARTBEAT_INTERVAL_MS: 30000,
      },
    },
  )

export const config = buildAdapterConfig()
