import { inputParameters } from '../../../src/endpoint/reserve'

/**
 * TEMPLATE: Reserve endpoint parameter validation
 */

const SAMPLE_PARAMS = {
  base: 'USDT',
  quote: 'USD',
}

describe('Reserve endpoint', () => {
  it('requires base and quote symbols', () => {
    const result = inputParameters.validate(SAMPLE_PARAMS)
    expect(result).toEqual(SAMPLE_PARAMS)

    expect(() => inputParameters.validate({ base: 'USDT' })).toThrow()
    expect(() => inputParameters.validate({ quote: 'USD' })).toThrow()
  })

  it('documents parameter types', () => {
    expect(inputParameters.definition.base.type).toBe('string')
    expect(inputParameters.definition.quote.type).toBe('string')
  })
})

