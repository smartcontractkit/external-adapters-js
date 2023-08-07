import { BigNumber } from 'ethers'
import { computeTickWithScore } from '../../src/endpoint/macro-score-api'

describe('computeTickWithScore', () => {
  const defaultTickSet = [
    BigNumber.from('440'),
    BigNumber.from('530'),
    BigNumber.from('620'),
    BigNumber.from('710'),
    BigNumber.from('800'),
  ]
  it('should return tick 1 when number is below first range', () => {
    const tick = computeTickWithScore(400, defaultTickSet)
    expect(tick).toEqual(1)
  })
  it('should return tick 2 when number is above first range', () => {
    const tick = computeTickWithScore(450, defaultTickSet)
    expect(tick).toEqual(2)
  })
  it('should return tick 2 when number is equal to first range', () => {
    const tick = computeTickWithScore(440, defaultTickSet)
    expect(tick).toEqual(2)
  })
})
