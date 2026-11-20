import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { validateAum } from '../../src/transport/utils'

const ISIN = 'DE0000000001'

const statusOf = (fn: () => unknown): number | undefined => {
  try {
    fn()
    return undefined
  } catch (error) {
    return (error as AdapterError).statusCode
  }
}

describe('validateAum', () => {
  it.each([
    ['zero', 0],
    ['four decimal places', 7654.3219],
    ['the smallest four-decimal quantity', 0.0001],
    ['the largest exactly representable integer', Number.MAX_SAFE_INTEGER],
  ])('accepts %s unchanged', (_, quantity) => {
    expect(validateAum(quantity, ISIN)).toBe(quantity)
  })

  it.each([
    ['a negative quantity', -1],
    ['a small negative quantity', -0.0001],
    ['more than four decimal places', 7654.32199],
    ['more than four decimal places at the smallest scale', 0.00001],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['a string', '7654.3219'],
    ['null', null],
  ])('rejects %s with a 502', (_, quantity) => {
    expect(statusOf(() => validateAum(quantity as number, ISIN))).toBe(502)
  })
})
