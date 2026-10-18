import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { setEnvVariables } from '@chainlink/external-adapter-framework/util/testing-utils'
import { config, validateWsApiEndpoint, wsEnvInputValidationError } from '../../../src/config'
import { endpoint as priceEndpoint } from '../../../src/endpoint/price'
import { endpoint as stockQuotesEndpoint } from '../../../src/endpoint/stock-quotes'

LoggerFactoryProvider.set()

const CREDENTIALS = { API_USERNAME: 'dxfeed-user', API_PASSWORD: 'dxfeed-pass' }
// Fake host (test_fake_urls): the provider host belongs only in src/config
const DXLINK_ENDPOINT = 'wss://dxlink.fake.test/dxlink-chainlink'

/**
 * Runs fn with the given env vars set and the config (re)initialized from them,
 * restoring the environment afterwards. Startup behavior (the breaking-change
 * env checks wired into the AdapterConfig validator) is asserted through the
 * public initialize()/validate() surface.
 */
const withSettings = (env: Record<string, string | undefined>, fn: () => void): void => {
  const oldEnv = JSON.parse(JSON.stringify(process.env))
  try {
    for (const [name, value] of Object.entries(env)) {
      if (value === undefined) {
        delete process.env[name]
      } else {
        process.env[name] = value
      }
    }
    config.initialize()
    fn()
  } finally {
    setEnvVariables(oldEnv)
    config.initialize()
  }
}

// The framework resolves requestContext.transportName (ws|rest) BEFORE calling
// customInputValidation, so a WS-path request is exactly a request whose
// resolved transport is "ws".
const wsRequest = { requestContext: { transportName: 'ws' } } as any
const restRequest = { requestContext: { transportName: 'rest' } } as any

describe('startup breaking-change env checks (spec data_source_authentication.breaking_change_env_checks)', () => {
  it('fails startup with a legacy cometd WS_API_ENDPOINT', () => {
    withSettings(
      { ...CREDENTIALS, WS_API_ENDPOINT: 'wss://dxlink.fake.test/chainlink/cometd' },
      () => expect(() => config.validate()).toThrow(/cometd/),
    )
  })

  it('fails startup with a WS_API_ENDPOINT carrying embedded credentials', () => {
    withSettings(
      { ...CREDENTIALS, WS_API_ENDPOINT: 'wss://user:pass@dxlink.fake.test/dxlink-chainlink' },
      () => expect(() => config.validate()).toThrow(/credentials/),
    )
  })

  it('passes startup with a clean wss:// dxLink endpoint and both credentials', () => {
    withSettings({ ...CREDENTIALS, WS_API_ENDPOINT: DXLINK_ENDPOINT }, () =>
      expect(() => config.validate()).not.toThrow(),
    )
  })
})

describe('WS-path credential requirement (spec: require API_USERNAME and API_PASSWORD on WS paths)', () => {
  it('rejects a ws-path request with API_USERNAME missing', () => {
    const error = stockQuotesEndpoint.customInputValidation?.(wsRequest, {
      WS_API_ENDPOINT: DXLINK_ENDPOINT,
      API_PASSWORD: CREDENTIALS.API_PASSWORD,
    } as any)
    expect(error?.message).toContain('API_USERNAME')
  })

  it('rejects a ws-path request with API_PASSWORD missing', () => {
    const error = priceEndpoint.customInputValidation?.(wsRequest, {
      WS_API_ENDPOINT: DXLINK_ENDPOINT,
      API_USERNAME: CREDENTIALS.API_USERNAME,
    } as any)
    expect(error?.message).toContain('API_PASSWORD')
  })

  it('accepts a ws-path request with a clean dxLink config', () => {
    expect(
      priceEndpoint.customInputValidation?.(wsRequest, {
        ...CREDENTIALS,
        WS_API_ENDPOINT: DXLINK_ENDPOINT,
      } as any),
    ).toBeUndefined()
  })

  it('rejects a ws-path request missing any of the three WS settings (defense-in-depth request-time gate under the startup-required settings surface)', () => {
    // Nothing set at all
    for (const endpoint of [priceEndpoint, stockQuotesEndpoint]) {
      const error = endpoint.customInputValidation?.(wsRequest, {} as any)
      expect(error?.statusCode).toBe(400)
      expect(error?.message).toBeTruthy()
    }

    // Credentials set but WS_API_ENDPOINT unset
    const noEndpoint = priceEndpoint.customInputValidation?.(wsRequest, {
      API_USERNAME: CREDENTIALS.API_USERNAME,
      API_PASSWORD: CREDENTIALS.API_PASSWORD,
    } as any)
    expect(noEndpoint?.statusCode).toBe(400)
    expect(noEndpoint?.message).toContain('WS_API_ENDPOINT')

    // Endpoint set but the credential pair missing (the pre-existing gate)
    const noCreds = priceEndpoint.customInputValidation?.(wsRequest, {
      WS_API_ENDPOINT: DXLINK_ENDPOINT,
    } as any)
    expect(noCreds?.statusCode).toBe(400)
    expect(noCreds?.message).toContain('API_USERNAME')
  })

  it('leaves rest-path price requests ungated by the WS checks (owner decision rest_transport_scope=keep_untouched)', () => {
    expect(
      priceEndpoint.customInputValidation?.(restRequest, {
        WS_API_ENDPOINT: DXLINK_ENDPOINT,
      } as any),
    ).toBeUndefined()
  })

  it('reports both check families through one request-time helper', () => {
    expect(
      wsEnvInputValidationError({
        WS_API_ENDPOINT: 'wss://dxlink.fake.test/chainlink/cometd',
        ...CREDENTIALS,
      } as any)?.message,
    ).toContain('cometd')
    expect(
      wsEnvInputValidationError({ WS_API_ENDPOINT: DXLINK_ENDPOINT } as any)?.message,
    ).toContain('API_USERNAME')
    expect(
      wsEnvInputValidationError({ ...CREDENTIALS, WS_API_ENDPOINT: DXLINK_ENDPOINT } as any),
    ).toBeUndefined()
  })
})

describe('request-time wss:// scheme gate (round 2: wsEnvInputValidationError runs the SAME validateWsApiEndpoint as the startup validator — one rule, two enforcement points, no drift)', () => {
  // Passes BOTH breaking-change checks (no cometd path, no embedded credentials)
  // but is not wss:// — exactly the value the pre-fix request-time check admitted
  // while startup rejected it
  const plaintextEndpoint = 'http://dxlink.fake.test/dxlink-chainlink'

  it('rejects a non-wss WS_API_ENDPOINT at request time with the exact error the startup validate fn produces', () => {
    // Input sanity: the URL clears the breaking-change checks the request-time
    // gate already ran — only the scheme gate can reject it
    expect(validateWsApiEndpoint(plaintextEndpoint)).not.toContain('cometd')
    expect(validateWsApiEndpoint(plaintextEndpoint)).not.toContain('credentials')

    const requestError = wsEnvInputValidationError({
      ...CREDENTIALS,
      WS_API_ENDPOINT: plaintextEndpoint,
    } as any)
    expect(requestError?.statusCode).toBe(400)
    // Same rule, same message: the request-time check IS the startup validator
    expect(requestError?.message).toBe(validateWsApiEndpoint(plaintextEndpoint))
    expect(requestError?.message).toContain('wss://')
  })

  it('rejects the same endpoint through a WS-path endpoint customInputValidation', () => {
    const error = priceEndpoint.customInputValidation?.(wsRequest, {
      ...CREDENTIALS,
      WS_API_ENDPOINT: plaintextEndpoint,
    } as any)
    expect(error?.statusCode).toBe(400)
    expect(error?.message).toContain('wss://')
  })

  it('still admits the clean wss:// dxLink endpoint at request time', () => {
    expect(
      wsEnvInputValidationError({ ...CREDENTIALS, WS_API_ENDPOINT: DXLINK_ENDPOINT } as any),
    ).toBeUndefined()
  })
})
