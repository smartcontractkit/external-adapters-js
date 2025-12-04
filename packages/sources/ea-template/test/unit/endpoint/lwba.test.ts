import { inputParameters } from '../../../src/endpoint/lwba'

/**
 * TEMPLATE: LWBA endpoint parameter validation
 */

const SAMPLE_PARAMS = {
  base: 'WBTC',
  quote: 'USD',
}

describe('LWBA endpoint', () => {
  it('requires base and quote symbols', () => {
    const result = inputParameters.validate(SAMPLE_PARAMS)
    expect(result).toEqual(SAMPLE_PARAMS)

    expect(() => inputParameters.validate({ base: 'WBTC' })).toThrow()
    expect(() => inputParameters.validate({ quote: 'USD' })).toThrow()
  })

  it('uses string parameter types', () => {
    expect(inputParameters.definition.base.type).toBe('string')
    expect(inputParameters.definition.quote.type).toBe('string')
  })
})

