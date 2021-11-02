import legos from '../../src'

describe('legos test', () => {
  it('has valid adapter names', function () {
    for (const source of legos.sources) {
      expect(source.includes('-')).toBe(false)
    }
  })
})
