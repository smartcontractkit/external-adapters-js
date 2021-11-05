import legos from '../../src'

describe('legos test', () => {
  it('has no unnacceptable characters', function () {
    for (const source of legos.sources) {
      const pattern = new RegExp(/[~`!#$%^&*+=\-[\]\\';,/{}|\\":<>?]/)
      expect(pattern.test(source)).toBe(false)
    }
  })
  it('doesnt begin with a digit', function () {
    for (const source of legos.sources) {
      const isDigit = source.charAt(0) >= '0' && source.charAt(0) <= '9'
      expect(isDigit).toBe(false)
    }
  })
  it('contains only uppercase letters', function () {
    for (const source of legos.sources) {
      expect(source.toUpperCase() === source).toBe(true)
    }
  })
})
