import { getFinId } from '../../src/transport/utils'

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
