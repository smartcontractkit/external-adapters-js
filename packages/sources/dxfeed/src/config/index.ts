import { AdapterConfig, SettingsDefinitionMap } from '@chainlink/external-adapter-framework/config'
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
 * Startup validate fn for WS_API_ENDPOINT: exactly the spec's
 * breaking_change_env_checks (reject the legacy cometd path, reject embedded
 * credentials). The spec declares no scheme requirement and no opt-in env var,
 * so ws:// loopback test-bridge URLs injected through WS_API_ENDPOINT alone are
 * accepted like any other clean URL.
 */
export const validateWsApiEndpoint = (value?: string): string =>
  wsApiEndpointBreakingChangeError(value)

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
 * behavior intact.
 */
class DxFeedAdapterConfig<
  T extends SettingsDefinitionMap = SettingsDefinitionMap,
> extends AdapterConfig<T> {
  buildCensorList(): { key: string; value: RegExp }[] {
    super.buildCensorList()
    return CensorList.getAll()
  }
}

export const config = new DxFeedAdapterConfig(
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
