import { inputParameters } from '../../../src/endpoint/nav'

/**
 * TEMPLATE: NAV endpoint parameter validation
 */

const SAMPLE_PARAMS = {
  base: 'SPY',
  quote: 'USD',
}

describe('NAV endpoint', () => {
  it('requires base and quote symbols', () => {
    const result = inputParameters.validate(SAMPLE_PARAMS)
    expect(result).toEqual(SAMPLE_PARAMS)

    expect(() => inputParameters.validate({ base: 'SPY' })).toThrow()
    expect(() => inputParameters.validate({ quote: 'USD' })).toThrow()
  })

  it('enforces string parameter types', () => {
    expect(inputParameters.definition.base.type).toBe('string')
    expect(inputParameters.definition.quote.type).toBe('string')
  })
})
