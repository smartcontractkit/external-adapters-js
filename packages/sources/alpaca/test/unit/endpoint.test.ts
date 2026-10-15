import { inputParameters } from '../../src/endpoint/stock_quotes'

const statusCodeOf = (fn: () => void): number | undefined => {
  try {
    fn()
  } catch (e) {
    return (e as { statusCode?: number }).statusCode
  }
  return undefined
}

// Spec endpoints[stock_quotes].input_parameters
describe('inputParameters', () => {
  // Spec aliases: base <- from/coin/symbol, quote <- to/market. The first row is the spec example
  // request {"from":"AAPL","to":"USD"}
  it.each([
    [{ from: 'AAPL', to: 'USD' }],
    [{ coin: 'AAPL', market: 'USD' }],
    [{ symbol: 'AAPL', quote: 'USD' }],
  ])('aliases %p resolve to base AAPL and quote USD', (input) => {
    const params = inputParameters.validateInput(input)

    expect(params.base).toBe('AAPL')
    expect(params.quote).toBe('USD')
  })

  it('rejects request without base', () => {
    expect(statusCodeOf(() => inputParameters.validateInput({ quote: 'USD' }))).toBe(400)
  })

  // Spec input_parameters requireVolume / isOvernight: default false
  it('spec example request without flags validates to requireVolume false and isOvernight false', () => {
    const params = inputParameters.validateInput({ from: 'AAPL', to: 'USD' })

    expect(params.requireVolume).toBe(false)
    expect(params.isOvernight).toBe(false)
  })

  // Spec quote: no option list (dxfeed reference does not restrict quote), so lowercase usd passes
  it('accepts lowercase quote usd', () => {
    expect(() => inputParameters.validateInput({ base: 'AAPL', quote: 'usd' })).not.toThrow()
  })

  // Spec default false with "If true" semantics (dxfeed compat): dxfeed callers send JSON booleans.
  // A string type would reject them and make "false" truthy on the requireVolume 502 path.
  it.each([true, false])('accepts boolean requireVolume and isOvernight (%p)', (flag) => {
    const params = inputParameters.validateInput({
      base: 'AAPL',
      quote: 'USD',
      requireVolume: flag,
      isOvernight: flag,
    })

    expect(params.requireVolume).toBe(flag)
    expect(params.isOvernight).toBe(flag)
  })
})
