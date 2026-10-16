import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { wsEnvInputValidationError } from '../../src/config'
import { endpoint as priceEndpoint } from '../../src/endpoint/price'
import { endpoint as stockQuotesEndpoint } from '../../src/endpoint/stock-quotes'

LoggerFactoryProvider.set()

const DXLINK_ENDPOINT = 'wss://tools.dxfeed.com/dxlink-chainlink'

const cleanSettings = {
  WS_API_ENDPOINT: DXLINK_ENDPOINT,
  API_USERNAME: 'dxfeed-user',
  API_PASSWORD: 'dxfeed-pass',
}

const errorMessage = (error: { message?: string } | undefined): string => error?.message ?? ''

/**
 * The framework resolves requestContext.transportName (ws|rest) BEFORE calling
 * customInputValidation, so a WS-path request is exactly a request whose
 * resolved transport is "ws".
 */
const wsRequest = { requestContext: { transportName: 'ws' } } as any
const restRequest = { requestContext: { transportName: 'rest' } } as any

describe('request-time breaking-change env checks (spec data_source_authentication.breaking_change_env_checks)', () => {
  it('rejects a WS-path request whose WS_API_ENDPOINT is the legacy cometd path, naming the legacy path', () => {
    const error = stockQuotesEndpoint.customInputValidation?.(wsRequest, {
      ...cleanSettings,
      WS_API_ENDPOINT: 'wss://tools.dxfeed.com/chainlink/cometd',
    } as any)
    expect(errorMessage(error)).toContain('cometd')
  })

  it('rejects a WS-path request whose WS_API_ENDPOINT embeds credentials', () => {
    const error = stockQuotesEndpoint.customInputValidation?.(wsRequest, {
      ...cleanSettings,
      WS_API_ENDPOINT: 'wss://user:pass@tools.dxfeed.com/dxlink-chainlink',
    } as any)
    expect(errorMessage(error)).toContain('credentials')
  })

  it('rejects a WS-path request without API_USERNAME/API_PASSWORD', () => {
    const noCreds = { WS_API_ENDPOINT: DXLINK_ENDPOINT } as any
    const stockError = stockQuotesEndpoint.customInputValidation?.(wsRequest, noCreds)
    expect(errorMessage(stockError)).toContain('API_USERNAME')
    expect(errorMessage(stockError)).toContain('API_PASSWORD')

    const priceError = priceEndpoint.customInputValidation?.(wsRequest, noCreds)
    expect(errorMessage(priceError)).toContain('API_USERNAME')
  })

  it('passes a WS-path request with a clean dxLink config (no error)', () => {
    expect(
      stockQuotesEndpoint.customInputValidation?.(wsRequest, cleanSettings as any),
    ).toBeUndefined()
    expect(priceEndpoint.customInputValidation?.(wsRequest, cleanSettings as any)).toBeUndefined()
  })

  it('leaves REST-path price requests alone (owner decision rest_transport_scope=keep_untouched)', () => {
    // Even with no credentials configured at all, a rest-transport request is valid
    expect(
      priceEndpoint.customInputValidation?.(restRequest, {
        WS_API_ENDPOINT: DXLINK_ENDPOINT,
      } as any),
    ).toBeUndefined()
  })

  it('shares one implementation with the startup AdapterConfig validate fn', () => {
    // The request-time helper is built on the same check fns the config
    // validator wires in — a misconfiguration produces the same message at both seams
    expect(
      errorMessage(
        wsEnvInputValidationError({
          WS_API_ENDPOINT: 'wss://tools.dxfeed.com/chainlink/cometd',
        } as any),
      ),
    ).toContain('cometd')
    expect(errorMessage(wsEnvInputValidationError({} as any))).toContain('API_USERNAME')
    expect(wsEnvInputValidationError(cleanSettings as any)).toBeUndefined()
  })
})
