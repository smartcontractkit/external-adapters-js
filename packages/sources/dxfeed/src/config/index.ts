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
 * Loopback hosts for which a plaintext ws:// WS_API_ENDPOINT is still accepted:
 * the framework's mock-socket test bridge serves the dxLink mock on ws://
 * loopback and hands the URL to the adapter through WS_API_ENDPOINT alone. No
 * other ws:// target passes — there is no opt-in env var or bypass flag.
 */
const LOOPBACK_WS_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1'])

/**
 * Startup validate fn for WS_API_ENDPOINT: the spec's breaking_change_env_checks
 * (reject the legacy cometd path, reject embedded credentials) plus the scheme
 * gate — the endpoint is the secure dxLink WebSocket (spec data_source_base_url
 * wss://tools.dxfeed.com/dxlink-chainlink), and a plaintext ws:// URL would send
 * the Basic Authorization header — the API credentials — over unencrypted TCP.
 * ws:// is accepted only for loopback hosts so mock-server tests keep working.
 */
export const validateWsApiEndpoint = (value?: string): string => {
  const breakingChangeError = wsApiEndpointBreakingChangeError(value)
  if (breakingChangeError || !value) {
    return breakingChangeError
  }

  let scheme = ''
  let hostname = ''
  try {
    const url = new URL(value)
    scheme = url.protocol.replace(/:$/, '')
    hostname = url.hostname
  } catch {
    // A value no URL can parse out of has no wss:// scheme either — rejected below
  }

  if (scheme === 'wss') {
    return ''
  }
  if (scheme === 'ws' && LOOPBACK_WS_HOSTS.has(hostname)) {
    return ''
  }
  return `WS_API_ENDPOINT must use the wss:// scheme (got ${
    scheme ? `${scheme}://` : 'a value that is not a URL'
  }): a plaintext ws:// url sends the Basic Authorization header — the API credentials — unencrypted. Only ws:// loopback hosts (localhost, 127.0.0.1, ::1) are accepted, for local test servers.`
}

/**
 * Spec data_source_authentication breaking_change_env_checks: the Basic
 * credential pair (the dxLink AUTH message exists but is NOT used; credentials
 * ride the Authorization header only). API_USERNAME, API_PASSWORD and
 * WS_API_ENDPOINT are all required at startup per the spec
 * environment_variables declarations (required=true); the config enforces
 * them there. The WS-path request-time check below re-enforces the pair —
 * plus WS_API_ENDPOINT presence — on requests whose resolved transport is
 * ws, with a clear per-request error.
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
        // Spec environment_variables declares WS_API_ENDPOINT required=true: the
        // WS paths cannot run without it, so the config enforces it at startup
        // (the breaking-change validate fn below rejects the legacy cometd path
        // and embedded credentials). wsEnvInputValidationError re-enforces the
        // endpoint, the credential pair and the breaking-change checks on
        // requests whose resolved transport is ws.
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
    },
    {
      envDefaultOverrides: {
        // Spec data_source_endpoints[].keepalive interval_seconds=30
        WS_HEARTBEAT_INTERVAL_MS: 30000,
      },
    },
  )

export const config = buildAdapterConfig()
