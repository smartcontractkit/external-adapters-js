import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { endpoint as priceEndpoint, priceInputParameters } from '../../src/endpoint/price'
import {
  endpoint as stockQuotesEndpoint,
  stockQuotesInputParameters,
} from '../../src/endpoint/stock-quotes'

LoggerFactoryProvider.set()

/**
 * Catches the framework's input-validation failure and returns its error shape,
 * so each assertion can pin the spec's 400-validation-error behaviour without
 * involving a transport (validation is framework-owned; the REQUIRED flag and
 * the OPTIONS list are the spec's business).
 */
const validationError = (validate: () => unknown): { statusCode?: number; message: string } => {
  try {
    validate()
  } catch (error) {
    return error as { statusCode?: number; message: string }
  }
  throw new Error('Expected the request to fail input validation')
}

describe('quote is required on price and stock_quotes (spec input_parameters: quote, aliases ["to"], required: true — plan quote-required-on-price-and-stock_quotes lock test)', () => {
  it('a price request without quote/to returns a 400 validation error naming quote', () => {
    // Spec endpoint_request_response_examples[1] request carries from+to; from
    // alone (no quote/to) must fail validation, never fall through to a
    // transport with an undefined quote currency
    const error = validationError(() => priceInputParameters.validateInput({ from: 'AAPL' }))
    expect(error.statusCode).toBe(400)
    expect(error.message).toContain('quote')
  })

  it('a stock_quotes request without quote/to returns a 400 validation error naming quote', () => {
    // Spec endpoint_request_response_examples[0] request carries from+to
    const error = validationError(() => stockQuotesInputParameters.validateInput({ from: 'AAPL' }))
    expect(error.statusCode).toBe(400)
    expect(error.message).toContain('quote')
  })

  it('both endpoints declare quote required (the spec flag is locked, not relaxed)', () => {
    expect((priceInputParameters.definition as any).quote.required).toBe(true)
    expect((stockQuotesInputParameters.definition as any).quote.required).toBe(true)
    // The spec alias "to" resolves to quote on both endpoints
    expect((priceInputParameters.definition as any).quote.aliases).toEqual(['to'])
    expect((stockQuotesInputParameters.definition as any).quote.aliases).toEqual(['to'])
  })

  it('a request with quote passes validation on both endpoints (spec endpoint_request_response_examples requests)', () => {
    expect(priceInputParameters.validateInput({ from: 'AAPL', to: 'USD' })).toMatchObject({
      base: 'AAPL',
      quote: 'USD',
    })
    expect(stockQuotesInputParameters.validateInput({ from: 'AAPL', to: 'USD' })).toMatchObject({
      base: 'AAPL',
      quote: 'USD',
    })
  })

  it('both endpoints stay registered under their spec names (the required flag is on the endpoints the spec declares)', () => {
    expect(priceEndpoint.name).toBe('price')
    expect(stockQuotesEndpoint.name).toBe('stock_quotes')
  })
})

describe('transport param options rest|ws (spec price input_parameters: "ws" (dxLink) or "rest"; plan transport-param-options-list proving test)', () => {
  it('a transport outside rest|ws returns a 400 validation error', () => {
    // The README documents options rest,ws: a bad value fails clean input
    // validation instead of falling through to the router
    const error = validationError(() =>
      priceInputParameters.validateInput({ base: 'AAPL', quote: 'USD', transport: 'ftp' }),
    )
    expect(error.statusCode).toBe(400)
    expect(error.message).toContain('transport')
  })

  it('transports "rest" and "ws" pass validation', () => {
    expect(
      priceInputParameters.validateInput({ base: 'AAPL', quote: 'USD', transport: 'rest' }),
    ).toMatchObject({ transport: 'rest' })
    expect(
      priceInputParameters.validateInput({ base: 'AAPL', quote: 'USD', transport: 'ws' }),
    ).toMatchObject({ transport: 'ws' })
  })

  it('the runtime definition carries exactly the spec options list', () => {
    expect((priceInputParameters.definition as any).transport.options).toEqual(['rest', 'ws'])
  })

  it('the router still rejects an unregistered transport key at the routing layer too (defence in depth behind the options list)', () => {
    const badRequest = {
      body: { data: { base: 'AAPL', quote: 'USD', transport: 'ftp' } },
    } as any
    expect(() => priceEndpoint.getTransportNameForRequest(badRequest, {} as any)).toThrow(
      /No transport found for key "ftp"/,
    )
  })
})
