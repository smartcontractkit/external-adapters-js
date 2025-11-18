import { inputParameters } from '../../../src/endpoint/price'

/**
 * TEMPLATE: Price endpoint parameter validation
 *
 * Populate the sample params and extend the expectations for provider
 * specific overrides or custom fields.
 */

const SAMPLE_PARAMS = {
  base: 'ETH',
  quote: 'USD',
}

const SAMPLE_ALIAS_PARAMS = {
  from: 'BTC',
  to: 'USD',
}

describe('Price endpoint', () => {
  it('requires base and quote', () => {
    const result = inputParameters.validate(SAMPLE_PARAMS)
    expect(result).toEqual(SAMPLE_PARAMS)

    expect(() => inputParameters.validate({ base: 'ETH' })).toThrow()
    expect(() => inputParameters.validate({ quote: 'USD' })).toThrow()
  })

  it('maps aliases to canonical params', () => {
    const result = inputParameters.validate(SAMPLE_ALIAS_PARAMS)
    expect(result).toEqual({ base: 'BTC', quote: 'USD' })
  })

  it('documents available aliases', () => {
    expect(inputParameters.definition.base.aliases).toEqual(
      expect.arrayContaining(['from', 'coin', 'symbol', 'market']),
    )
    expect(inputParameters.definition.quote.aliases).toEqual(
      expect.arrayContaining(['to', 'convert']),
    )
  })
})

