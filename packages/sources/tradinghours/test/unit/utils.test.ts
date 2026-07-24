import { getFinId, isMarket } from '../../src/transport/utils'

describe('getFinId', () => {
  describe('type: regular', () => {
    it('forex', () => {
      expect(getFinId('forex', 'regular')).toBe('US.CHNLNK.FX')
    })

    it('nyse', () => {
      expect(getFinId('nyse', 'regular')).toBe('US.NYSE')
    })
  })

  describe('type: 24/5', () => {
    it('forex - fallback to regular', () => {
      expect(getFinId('forex', '24/5')).toBe('US.CHNLNK.FX')
    })

    it('nyse', () => {
      expect(getFinId('nyse', '24/5')).toBe('US.CHNLNK.NYSE')
    })
  })
})

describe('isMarket', () => {
  it('valid markets', () => {
    expect(isMarket('forex')).toBe(true)
    expect(isMarket('nyse')).toBe(true)
    expect(isMarket('bme')).toBe(true)
  })

  it('invalid markets', () => {
    expect(isMarket('FOREX')).toBe(false)
    expect(isMarket('US:NYSE')).toBe(false)
    expect(isMarket('undefined')).toBe(false)
    expect(isMarket('toString')).toBe(false)
  })
})
